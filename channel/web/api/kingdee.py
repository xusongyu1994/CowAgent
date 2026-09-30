"""金蝶（Kingdee）数据分析/看板 Web API + 企微 OAuth 免密登录 + /analysis 页面。

这些 handler 提取自重构前的 channel/web/web_channel.py，使上游把 web 拆分为
api/ 模块后，自定义业务功能仍然保留。共享底层工具从 channel.web.core._common
导入，避免与 WebChannel 形成循环依赖。
"""

import base64
import datetime
import hashlib
import hmac
import json
import os
import re
import time
import uuid

import web

from agent.registry import get_agent_registry
from common.log import logger
from config import conf

from channel.web.core._common import (
    _check_auth,
    _get_workspace_root,
    _raw_web_input,
    _require_auth,
)
from channel.web.core.channel import WebChannel

def _read_uploaded_file_bytes_limited(file_obj, max_bytes: int) -> bytes:
    """Read uploaded content and fail once it exceeds max_bytes."""
    if isinstance(file_obj, bytes):
        content = file_obj
    elif isinstance(file_obj, str):
        content = file_obj.encode("utf-8")
    elif hasattr(file_obj, "file") and hasattr(file_obj.file, "read"):
        content = file_obj.file.read(max_bytes + 1)
    elif hasattr(file_obj, "read"):
        content = file_obj.read(max_bytes + 1)
    elif hasattr(file_obj, "value"):
        content = file_obj.value
    else:
        raise ValueError("Unable to read uploaded file content")
    if isinstance(content, str):
        content = content.encode("utf-8")
    if not isinstance(content, bytes):
        raise TypeError(f"Unsupported uploaded content type: {type(content).__name__}")
    if len(content) > max_bytes:
        raise ValueError("file too large")
    return content

# ==================== WeCom OAuth Helpers ====================
_WECOM_OAUTH_STATES = {}   # state -> {target, created}
_WECOM_SESSION_EXPIRE = 86400  # 24 hours
_WECOM_AUTH_COOKIE = "cow_wecom_auth"


def _get_wecom_open_pages() -> dict:
    """获取企微用户可访问的页面白名单。
    
    Returns:
        dict of {view_id: label} 或空 dict。
    """
    pages = conf().get("wecom_open_pages", {})
    if isinstance(pages, list):
        return {p: p for p in pages}
    return pages if isinstance(pages, dict) else {}


def _get_wecom_corp_config() -> dict:
    """获取企微 OAuth 所需的配置。"""
    return {
        "corp_id": conf().get("wechatcom_corp_id", "") or "",
        "agent_id": conf().get("wechatcomapp_agent_id", "") or "",
        "secret": conf().get("wechatcomapp_secret", "") or "",
        "public_base": conf().get("wecom_public_base", "") or "",
    }


def _generate_wecom_state(target_page: str) -> str:
    """生成 OAuth state（防 CSRF）。"""
    state = uuid.uuid4().hex
    _WECOM_OAUTH_STATES[state] = {"target": target_page, "created": time.time()}
    _clean_stale_wecom_states()
    return state


def _validate_wecom_state(state: str):
    """校验并消费 OAuth state，返回 target page 或 None。"""
    data = _WECOM_OAUTH_STATES.pop(state, None)
    if not data:
        return None
    if time.time() - data["created"] > 300:  # 5 分钟过期
        return None
    return data["target"]


def _get_wecom_session_key() -> str:
    """获取企微会话签名的 HMAC 密钥，使用 wechatcomapp_secret 的 SHA256。"""
    secret = conf().get("wechatcomapp_secret", "") or ""
    return hashlib.sha256(secret.encode()).hexdigest()


def _check_wecom_auth():
    """检查当前请求是否有有效的企微会话（无状态 HMAC 令牌）。
    
    Returns:
        (userid, is_authenticated, kingdee_allowed)
    """
    token = web.cookies().get(_WECOM_AUTH_COOKIE, "")
    if not token or "." not in token:
        return None, False, False

    payload_str, sig = token.rsplit(".", 1)
    # 校验 HMAC 签名
    key = _get_wecom_session_key()
    expected = hmac.new(key.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None, False, False

    # 解码 payload
    try:
        padding = -len(payload_str) % 4
        padded = payload_str + ("=" * padding)
        decoded = base64.urlsafe_b64decode(padded)
        data = json.loads(decoded)
    except Exception:
        return None, False, False

    # 检查过期（24 小时）
    created = data.get("t", 0)
    if time.time() - created > _WECOM_SESSION_EXPIRE:
        return None, False, False

    return data.get("u", ""), True, bool(data.get("k", False))


def _create_wecom_session(userid: str, kingdee_allowed: bool = False) -> str:
    """创建无状态企微会话令牌（HMAC 签名，无需服务端存储）。

    Returns:
        cookie 值（payload.signature）
    """
    payload = base64.urlsafe_b64encode(json.dumps({
        "u": userid,
        "k": 1 if kingdee_allowed else 0,
        "t": int(time.time()),
    }).encode()).decode().rstrip("=")

    key = _get_wecom_session_key()
    sig = hmac.new(key.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def _clear_wecom_session():
    """清除当前企微会话（删除 Cookie，无状态令牌无需服务端清理）。"""
    web.setcookie(_WECOM_AUTH_COOKIE, "", expires=-1, path="/")





def _clean_stale_wecom_states():
    """清理过期的 OAuth state。"""
    now = time.time()
    stale = [k for k, v in _WECOM_OAUTH_STATES.items() if now - v["created"] > 300]
    for k in stale:
        _WECOM_OAUTH_STATES.pop(k, None)


def _wecom_get_userid_by_code(code: str):
    """通过 OAuth code 换取企微 UserID。
    
    Args:
        code: OAuth 授权码
    
    Returns:
        (userid, errmsg) 成功时 errmsg 为空，失败时 userid 为空
    """
    import requests as req
    cfg = _get_wecom_corp_config()
    corp_id = cfg.get("corp_id", "")
    secret = cfg.get("secret", "")
    if not corp_id or not secret:
        return "", "企微配置不完整"
    
    # 获取 access_token
    token_url = f"https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid={corp_id}&corpsecret={secret}"
    try:
        token_resp = req.get(token_url, timeout=10).json()
    except Exception as e:
        logger.error(f"[WecomOAuth] gettoken failed: {e}")
        return "", f"获取 access_token 失败: {e}"
    
    if token_resp.get("errcode", -1) != 0:
        return "", f"获取 access_token 错误: {token_resp.get('errmsg', 'unknown')}"
    
    access_token = token_resp.get("access_token", "")
    
    # 通过 code 获取 UserID
    user_url = f"https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token={access_token}&code={code}"
    try:
        user_resp = req.get(user_url, timeout=10).json()
    except Exception as e:
        logger.error(f"[WecomOAuth] getuserinfo failed: {e}")
        return "", f"获取用户信息失败: {e}"
    
    if user_resp.get("errcode", -1) != 0:
        return "", f"获取用户信息错误: {user_resp.get('errmsg', 'unknown')}"
    
    userid = user_resp.get("UserId", "")
    if not userid:
        return "", "未获取到 UserId"
    
    return userid, ""


def _wecom_error_page(title: str, message: str) -> str:
    """生成一个简单的错误页面。"""
    return (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        f"<title>{title}</title></head>"
        "<body style='font-family:-apple-system,Segoe UI,Roboto,sans-serif;"
        "max-width:520px;margin:64px auto;padding:0 20px;text-align:center;color:#1f2328'>"
        f"<h2>{title}</h2><p style='color:#57606a'>{message}</p></body></html>"
    )


def _js_redirect_page(url: str, title: str = "跳转中...") -> str:
    """返回客户端 JS 重定向页面，替代 302 重定向。

    window.location.replace 被浏览器视为从当前页面上下文发起的新导航，
    不会沿重定向链追溯到 HTTPS 来源，从而避免 PNA (RFC1918 Forbidden)。"""
    return (
        '<!doctype html><html><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f'<title>{title}</title></head><body>'
        f'<script>window.location.replace("{url}");</script>'
        f'<p>{title}</p></body></html>'
    )

# ==================== WeCom OAuth Handlers ====================
# ==================== WeCom OAuth Handlers ====================

class WecomOAuthStartHandler:
    """企微 OAuth 静默授权入口。
    
    企业微信自定义菜单 → 此 handler → 302 到企微 OAuth 页面 → 用户静默授权
    → 回调到 /auth/wecom/callback
    """
    def GET(self):
        params = web.input(target='kanban-conversion')
        target = params.target or 'kanban-conversion'
        
        # 检查是否已有有效会话
        userid, authed, kingdee_allowed = _check_wecom_auth()
        if authed:
            if kingdee_allowed:
                # 数据分析页面是独立页面 /analysis，其余 target 走 chat.html 视图
                if target == "analysis":
                    raise web.seeother('/analysis')
                raise web.seeother(f'/chat#{target}')
            else:
                web.header('Content-Type', 'text/html; charset=utf-8')
                return _wecom_error_page(
                    "权限不足",
                    "您没有金蝶查询权限，请联系管理员开通。"
                )
        
        cfg = _get_wecom_corp_config()
        corp_id = cfg.get("corp_id", "")
        if not corp_id:
            web.header('Content-Type', 'text/html; charset=utf-8')
            return _wecom_error_page("配置错误", "企业微信未配置（缺少 corp_id）")
        
        # redirect_uri 必须精确匹配企微应用的可信域名（含端口）
        public_base = cfg.get("public_base", "").rstrip("/")
        if not public_base:
            web.header('Content-Type', 'text/html; charset=utf-8')
            return _wecom_error_page(
                "配置错误",
                "缺少 wecom_public_base 配置，请在 config.json 中添加，"
                "例如：\"wecom_public_base\": \"http://office.landshr.com:9898\""
            )
        redirect_uri = f"{public_base}/auth/wecom/callback"

        state = _generate_wecom_state(target)

        import urllib.parse
        encoded_redirect = urllib.parse.quote(redirect_uri)
        
        oauth_url = (
            f"https://open.weixin.qq.com/connect/oauth2/authorize"
            f"?appid={corp_id}"
            f"&redirect_uri={encoded_redirect}"
            f"&response_type=code"
            f"&scope=snsapi_base"
            f"&state={state}"
            f"#wechat_redirect"
        )
        
        logger.info(f"[WecomOAuth] Redirecting user to OAuth, target={target}, state={state}")
        raise web.seeother(oauth_url)


class WecomOAuthCallbackHandler:
    """企微 OAuth 回调处理。
    
    企微 OAuth 授权后回调到此，换取 UserID、校验权限、设置会话 cookie。
    """
    def GET(self):
        web.header('Content-Type', 'text/html; charset=utf-8')
        params = web.input(code="", state="", error="", error_description="")
        
        if params.error:
            logger.warning(f"[WecomOAuth] OAuth error: {params.error} {params.error_description}")
            return _wecom_error_page("授权失败", f"{params.error}: {params.error_description or ''}")
        
        if not params.code or not params.state:
            return _wecom_error_page("参数缺失", "回调缺少 code 或 state 参数。")
        
        # 校验 state（防 CSRF）
        target = _validate_wecom_state(params.state)
        if target is None:
            return _wecom_error_page("会话过期", "授权请求已过期，请从企微菜单重新进入。")
        
        # 通过 code 换取 UserID
        userid, errmsg = _wecom_get_userid_by_code(params.code)
        if not userid:
            logger.warning(f"[WecomOAuth] Failed to get userid: {errmsg}")
            return _wecom_error_page("认证失败", errmsg)
        
        logger.info(f"[WecomOAuth] User authenticated: {userid}")
        
        # 检查金蝶权限
        from common.permission_checker import check_kingdee_permission, has_kingdee_form_access
        allowed, scope, msg = check_kingdee_permission(userid)
        kingdee_allowed = allowed and scope != ""
        
        if not kingdee_allowed:
            logger.warning(f"[WecomOAuth] User {userid} has no Kingdee permission")
            return _wecom_error_page(
                "权限不足",
                "您没有金蝶查询权限，请联系管理员开通。"
            )

        # 检查是否配置了至少一个金蝶表单（避免"启用但无表单"进入看板）
        form_access = has_kingdee_form_access(userid)
        if form_access is not None and len(form_access) == 0:
            logger.warning(f"[WecomOAuth] User {userid} has no Kingdee form access")
            return _wecom_error_page(
                "权限不足",
                "尚未为您配置金蝶表单权限，请联系管理员开通。"
            )
        
        # 创建会话
        session_id = _create_wecom_session(userid, kingdee_allowed=True)
        # secure 仅在 HTTPS 下启用，HTTP 下设为 False 否则浏览器拒绝保存 Cookie
        is_https = conf().get("wecom_public_base", "").startswith("https://")
        web.setcookie(_WECOM_AUTH_COOKIE, session_id,
                      expires=_WECOM_SESSION_EXPIRE,
                      path="/", httponly=True, samesite="Lax", secure=is_https)
        
        logger.info(f"[WecomOAuth] Session created for {userid}, redirecting to target={target}")
        # 客户端 JS 重定向替代 302，切断 PNA 追溯链
        # 数据分析页面是独立页面 /analysis，其余 target 走 chat.html 视图
        if target == "analysis":
            return _js_redirect_page('/analysis')
        return _js_redirect_page(f'/chat#{target}')


class WecomAuthCheckHandler:
    """前端轮询企微认证状态。
    
    返回当前是否有有效的企微会话及用户信息。
    """
    def GET(self):
        web.header('Content-Type', 'application/json; charset=utf-8')
        userid, authed, kingdee_allowed = _check_wecom_auth()
        result = {
            "status": "success",
            "wecom_user": authed,
            "wecom_open_pages": list(_get_wecom_open_pages().keys()),
        }
        if authed:
            result.update({
                "userid": userid,
                "kingdee_allowed": kingdee_allowed,
            })
        return json.dumps(result)


class WecomAuthLogoutHandler:
    """退出企微登录。"""
    def POST(self):
        web.header('Content-Type', 'application/json; charset=utf-8')
        _clear_wecom_session()
        return json.dumps({"status": "success"})


class AnalysisPageHandler:
    """金蝶数据分析页面（独立 analysis.html）。

    - 企微场景：未认证用户自动跳转 OAuth 免密登录（target=analysis）
    - 密码管理员：直接访问
    渲染 analysis.html 并注入缓存版本号。
    """

    def GET(self):
        # 企微菜单直连 OAuth code 处理（复用 ChatHandler 逻辑）
        params = web.input(code="", state="", target="")
        if params.code and not _check_wecom_auth()[1] and not _check_auth():
            userid, errmsg = _wecom_get_userid_by_code(params.code)
            if userid:
                from common.permission_checker import check_kingdee_permission, has_kingdee_form_access
                allowed, scope, msg = check_kingdee_permission(userid)
                kingdee_allowed = allowed and scope != ""
                form_access = has_kingdee_form_access(userid) if kingdee_allowed else None
                has_form = form_access is None or len(form_access) > 0
                if kingdee_allowed and has_form:
                    session_id = _create_wecom_session(userid, kingdee_allowed=True)
                    is_https = conf().get("wecom_public_base", "").startswith("https://")
                    web.setcookie(_WECOM_AUTH_COOKIE, session_id,
                                  expires=_WECOM_SESSION_EXPIRE,
                                  path="/", httponly=True, samesite="Lax", secure=is_https)
                    return _js_redirect_page('/analysis')
                return _wecom_error_page("权限不足", "您没有金蝶查询权限，请联系管理员开通。")

        # 企微场景：只有企微浏览器（UA 含 wxwork）且未认证时才跳 OAuth；
        # 普通浏览器（本地/桌面）未认证时渲染 analysis.html，由前端显示密码登录框。
        wecom_configured = bool(conf().get("wecom_public_base", ""))
        _, wecom_authed, _ = _check_wecom_auth()
        _ua = web.ctx.env.get('HTTP_USER_AGENT', '') or ''
        is_wecom_browser = ('wxwork' in _ua) or ('MicroMessenger' in _ua)

        if wecom_configured and is_wecom_browser and not wecom_authed and not _check_auth():
            web.header('Content-Type', 'text/html; charset=utf-8')
            return (
                '<!doctype html><html><head><meta charset="utf-8">'
                '<meta name="viewport" content="width=device-width,initial-scale=1">'
                '<title>跳转中...</title></head><body><script>'
                '(function(){var ua=navigator.userAgent||"";'
                'if(ua.indexOf("wxwork")!==-1||ua.indexOf("MicroMessenger")!==-1){'
                'window.location.replace("/auth/wecom/start?target=analysis");}})();'
                '</script><p>正在跳转到企业微信认证...</p></body></html>'
            )

        web.header('Cache-Control', 'no-cache, no-store, must-revalidate')
        web.header('Pragma', 'no-cache')
        # api/ 比 web 根目录低一层，analysis.html 在 channel/web/ 下
        file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'analysis.html')
        with open(file_path, 'r', encoding='utf-8') as f:
            html = f.read()
        cache_bust = str(int(time.time()))
        html = html.replace('assets/js/pages/analysis.js', f'assets/js/pages/analysis.js?v={cache_bust}')
        html = html.replace('assets/css/analysis.css', f'assets/css/analysis.css?v={cache_bust}')
        html = html.replace('{{CACHE_BUST}}', cache_bust)
        # 注入企微配置标记：整段替换（含模板默认 false），避免替换后出现 "= false false;" 双值语法错误。
        # 若模板未被替换（如直接静态打开），`/*{{WECOM_CONFIGURED}}*/ false` 中注释被忽略 → 值为 false，合法。
        html = html.replace(
            '/*{{WECOM_CONFIGURED}}*/ false',
            'true' if wecom_configured else 'false',
        )
        return html


# ── 金蝶查询会话级缓存 ──────────────────────────────────────────
# 减少同一会话中重复的 API 调用
_kingdee_cache = {}
_KINGDEE_CACHE_TTL = {
    "query_metadata": 30 * 60,  # 30 分钟（字段结构不变）
    "count_bill":      5 * 60,  # 5 分钟（数据量变化快）
}
def _kingdee_cache_get(cache_type: str, key: str):
    """从缓存中取金蝶查询结果，过期返回 None"""
    entry = _kingdee_cache.get((cache_type, key))
    if entry is None:
        return None
    if time.time() > entry["expires_at"]:
        del _kingdee_cache[(cache_type, key)]
        return None
    return entry["value"]


def _kingdee_cache_set(cache_type: str, key: str, value, ttl: int = None):
    """设置金蝶查询缓存"""
    if ttl is None:
        ttl = _KINGDEE_CACHE_TTL.get(cache_type, 5 * 60)
    _kingdee_cache[(cache_type, key)] = {
        "value": value,
        "expires_at": time.time() + ttl,
    }
    # 控制缓存大小，超过 200 条时清理过期条目
    if len(_kingdee_cache) > 200:
        now = time.time()
        expired = [k for k, v in _kingdee_cache.items() if v["expires_at"] <= now]
        for k in expired:
            del _kingdee_cache[k]


def _get_current_kingdee_userid() -> str:
    """
    获取当前请求的企微 userid，用于金蝶数据范围过滤。

    规则：
    - 若企微会话已认证 → 返回真实企微 userid
    - 否则（密码管理员 / 未认证）→ 返回 web 管理员标识（session_ 前缀），
      使其通过 `_is_admin_user` 检查而全权访问。
    """
    userid, authed, _ = _check_wecom_auth()
    if authed and userid:
        return userid
    # web 管理员（密码登录 / 未企微认证）→ 全权
    return "session_web_admin"


def _apply_kingdee_form_filter(form_id: str, filter_string: str):
    """
    对金蝶查询应用表单权限 + 业务员过滤。

    返回：
        (new_filter, error_message)
        - new_filter: 应使用的过滤条件
        - error_message: 若为 None 表示放行；否则为拒绝提示
    """
    from common.permission_checker import build_kingdee_form_filter
    userid = _get_current_kingdee_userid()
    new_fs = build_kingdee_form_filter(userid, form_id, filter_string)
    if new_fs is None:
        return None, "您没有访问该金蝶表单的权限"
    return new_fs, None


class KingdeeKanbanHandler:
    """金蝶云星空订单审批看板 — 按单据类型+状态分组返回看板数据。只读，不走Agent推理链路。"""

    def GET(self):
        _require_auth()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            params = web.input(form_id='SAL_SaleOrder', days='30',
                               start_date='', end_date='', search='')
            form_id = params.form_id.strip()
            try:
                days = max(1, min(int(params.days), 365))
            except (ValueError, TypeError):
                days = 30

            # 客户/供应商字段按表单映射：
            #   销售订单/报价单 → FCustId；销售出库单 → FCustomerID（无 FCustId）；采购 → FSupplierId
            # 修复：此前对 SAL_OUTSTOCK 用 FCustId.FName 会报"元数据字段不存在"，导致出库单看板不可查。
            from common.permission_checker import get_customer_field
            cust_field = get_customer_field(form_id)

            # 构建过滤条件
            filter_parts = []
            sd = params.start_date.strip()
            ed = params.end_date.strip()
            if sd:
                filter_parts.append(f"FDate >= '{sd[:10]}'")
            elif ed:
                # 仅结束日期: 从30天前到结束
                fallback = (datetime.datetime.now() - datetime.timedelta(days=days)).strftime('%Y-%m-%d')
                filter_parts.append(f"FDate >= '{fallback}'")
            else:
                start_date = (datetime.datetime.now() - datetime.timedelta(days=days)).strftime('%Y-%m-%d')
                filter_parts.append(f"FDate >= '{start_date}'")

            if ed:
                filter_parts.append(f"FDate <= '{ed[:10]}'")

            search_keyword = params.search.strip()
            if search_keyword:
                # 搜索单据编号/客户名称/供应商名称（根据单据类型选择对应字段）
                search_escaped = search_keyword.replace("'", "''")
                if form_id == 'PUR_PurchaseOrder':
                    filter_parts.append(
                        f"(FBillNo LIKE '%{search_escaped}%' "
                        f"OR FSupplierId.FName LIKE '%{search_escaped}%')"
                    )
                else:
                    filter_parts.append(
                        f"(FBillNo LIKE '%{search_escaped}%' "
                        f"OR {cust_field}.FName LIKE '%{search_escaped}%')"
                    )

            filter_string = " AND ".join(filter_parts)

            # 应用表单权限 + 业务员过滤
            filter_string, kd_err = _apply_kingdee_form_filter(form_id, filter_string)
            if kd_err:
                return json.dumps({"status": "error", "message": kd_err})

            # 按表单选择客户/供应商字段
            if form_id == 'PUR_PurchaseOrder':
                field_keys = "FBillNo,FDate,FCreateDate,FDocumentStatus,FSupplierId.FName,FCreatorId.FName,FAllAmount"
            else:
                field_keys = f"FBillNo,FDate,FCreateDate,FDocumentStatus,{cust_field}.FName,FCreatorId.FName,FAllAmount"

            from agent.tools.tool_manager import ToolManager
            tm = ToolManager()
            tool = tm._mcp_tool_instances.get("query_bill_json")
            if not tool:
                # MCP 可能还在加载中
                mcp_status = dict(tm._mcp_status)
                return json.dumps({
                    "status": "error",
                    "message": "金蝶MCP工具尚未就绪",
                    "mcp_status": mcp_status,
                })

            # 先 count 估算（带缓存）
            count_cache_key = f"{form_id}|{filter_string}"
            total_count = _kingdee_cache_get("count_bill", count_cache_key)
            if total_count is not None:
                logger.info(f"[KingdeeCache] count_bill HIT: {form_id} -> {total_count}")
            else:
                count_tool = tm._mcp_tool_instances.get("count_bill")
                if count_tool:
                    try:
                        count_result = count_tool.execute({"form_id": form_id, "filter_string": filter_string})
                        if count_result.status == "success" and count_result.result:
                            data = count_result.result
                            if isinstance(data, dict) and "estimated_rows" in data:
                                total_count = int(data["estimated_rows"])
                            elif isinstance(data, (int, float)):
                                total_count = int(data)
                        if total_count is not None:
                            _kingdee_cache_set("count_bill", count_cache_key, total_count)
                    except Exception:
                        pass

            top_count = min(total_count if total_count and total_count < 2000 else 2000, 2000)
            result = tool.execute({
                "form_id": form_id,
                "field_keys": field_keys,
                "filter_string": filter_string,
                "top_count": top_count,
            })

            if result.status != "success" or not result.result:
                return json.dumps({"status": "error", "message": "查询金蝶数据失败"})

            raw = result.result

            # MCP 返回可能是 JSON 字符串或已解析的 dict
            if isinstance(raw, str):
                try:
                    raw = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    pass

            rows = raw
            if isinstance(rows, dict):
                rows = rows.get("rows", rows.get("data", rows.get("result", [])))
                if isinstance(rows, dict):
                    rows = [rows]
            if not isinstance(rows, list):
                rows = [rows] if rows else []

            # 状态码 → 看板列元数据
            STATUS_COLUMNS = {
                "Z": {"title": "kanban_col_draft", "cls": "draft"},
                "A": {"title": "kanban_col_pending", "cls": "pending"},
                "B": {"title": "kanban_col_review", "cls": "review"},
                "C": {"title": "kanban_col_approved", "cls": "approved"},
                "D": {"title": "kanban_col_rejected", "cls": "rejected"},
            }

            # 按 FDocumentStatus 分组
            grouped = {}
            for col_key in STATUS_COLUMNS:
                grouped[col_key] = []

            for row in rows:
                if isinstance(row, dict):
                    status = row.get("FDocumentStatus", "").strip().upper()
                    if status not in grouped:
                        status = "Z"  # 未知状态归入草稿
                    amount = row.get("FAllAmount", 0)
                    try:
                        amount = float(amount) if amount else 0
                    except (ValueError, TypeError):
                        amount = 0
                    card = {
                        "bill_no": row.get("FBillNo", ""),
                        "date": row.get("FDate", ""),
                        "create_date": row.get("FCreateDate", ""),
                        "customer": row.get(f"{cust_field}.FName") or row.get("FSupplierId.FName") or "",
                        "creator": row.get("FCreatorId.FName", ""),
                        "amount": amount,
                        "status": status,
                    }
                    grouped[status].append(card)

            columns = []
            for key, meta in STATUS_COLUMNS.items():
                cards = grouped.get(key, [])
                columns.append({
                    "id": "col-" + key,
                    "title": meta["title"],
                    "status": key,
                    "cls": meta["cls"],
                    "count": len(cards),
                    "cards": cards,
                    "total_amount": round(sum(c["amount"] for c in cards), 2),
                })

            return json.dumps({
                "status": "success",
                "form_id": form_id,
                "days": days,
                "start_date": sd or None,
                "end_date": ed or None,
                "search": search_keyword or None,
                "total_count": total_count or len(rows),
                "columns": columns,
            }, ensure_ascii=False)
        except Exception as e:
            logger.exception(f"[KingdeeKanbanHandler] error: {e}")
            return json.dumps({"status": "error", "message": str(e)})


class KingdeeBillDetailHandler:
    """金蝶单据详情 — 只读，调用 view_bill 获取完整详情"""
    def GET(self):
        _require_auth()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            params = web.input(form_id='', number='')
            form_id = params.form_id.strip()
            number = params.number.strip()
            if not form_id or not number:
                return json.dumps({"status": "error", "message": "form_id 和 number 为必填"})

            from agent.tools.tool_manager import ToolManager
            tm = ToolManager()
            tool = tm._mcp_tool_instances.get("view_bill")
            if not tool:
                return json.dumps({"status": "error", "message": "金蝶MCP工具 view_bill 尚未就绪"})

            # 表单权限校验（详情是单条记录，不追加业务员过滤）
            _, kd_err = _apply_kingdee_form_filter(form_id, "1=1")
            if kd_err:
                return json.dumps({"status": "error", "message": kd_err})

            result = tool.execute({"form_id": form_id, "number": number})
            if result.status != "success":
                return json.dumps({"status": "error", "message": "查看单据详情失败"})

            bill_data = result.result
            if isinstance(bill_data, str):
                try:
                    bill_data = json.loads(bill_data)
                except (json.JSONDecodeError, TypeError):
                    pass

            # view_bill 返回 Kingdee 标准包装: {"Result": {"ResponseStatus": {...}, "Result": {...实际数据...}}}
            # 也可能直接返回实际数据，需要兼容
            if isinstance(bill_data, dict):
                if bill_data.get("status") == "error":
                    return json.dumps({"status": "error", "message": bill_data.get("message", "查看单据详情失败")})
                # 解包第一层 Result
                inner = bill_data.get("Result", bill_data)
                if isinstance(inner, dict):
                    # 检查是否有 ResponseStatus
                    resp_status = inner.get("ResponseStatus", {})
                    if isinstance(resp_status, dict) and resp_status.get("IsSuccess") is False:
                        return json.dumps({"status": "error", "message": resp_status.get("Errors", "查看单据详情失败")})
                    # 解包第二层 Result
                    if "Result" in inner:
                        bill_data = inner["Result"]
                    else:
                        bill_data = inner

            # ── debug: 检查 MaterialId 中是否包含 FSpecification ──
            try:
                if isinstance(bill_data, dict):
                    for _dk, _dv in bill_data.items():
                        if isinstance(_dv, list) and len(_dv) > 0:
                            _mat = _dv[0].get("MaterialId") or _dv[0].get("FMaterialId") or {}
                            if isinstance(_mat, dict):
                                logger.info(f"[KingdeeBillDetailHandler] MaterialId keys: {list(_mat.keys())}, has FSpecification: {'FSpecification' in _mat}")
            except Exception:
                pass

            # ── 规格型号补充：view_bill 不返回 FSpecification，用 query_bill_json 补查 ──
            try:
                qbj_tool = tm._mcp_tool_instances.get("query_bill_json")
                if qbj_tool and isinstance(bill_data, dict):
                    qbj_result = qbj_tool.execute({
                        "form_id": form_id,
                        "field_keys": "FBillNo,FMaterialId.FNumber,FMaterialId.FSpecification,FMaterialId.FName",
                        "filter_string": f"FBillNo = '{number}'",
                        "top_count": 500,
                    })
                    if qbj_result.status == "success" and qbj_result.result:
                        qbj_raw = qbj_result.result
                        if isinstance(qbj_raw, str):
                            qbj_raw = json.loads(qbj_raw)
                        qbj_rows = qbj_raw
                        if isinstance(qbj_rows, dict):
                            qbj_rows = qbj_rows.get("rows", qbj_rows.get("data", qbj_rows.get("result", [])))
                        if isinstance(qbj_rows, list):
                            # 构建 (物料编码 → 规格型号) 映射
                            spec_map = {}
                            for qr in qbj_rows:
                                if isinstance(qr, dict):
                                    fmatnum = qr.get("FMaterialId.FNumber") or ""
                                    fspec = qr.get("FMaterialId.FSpecification") or ""
                                    if fmatnum:
                                        spec_map[fmatnum.strip()] = str(fspec).strip()
                            # 遍历 bill_data 中所有实体行，注入 FSpecification 平铺字段
                            if spec_map:
                                for _key, _val in bill_data.items():
                                    if isinstance(_val, list):
                                        for _row in _val:
                                            if isinstance(_row, dict):
                                                mat_obj = _row.get("MaterialId") or _row.get("FMaterialId") or {}
                                                mat_num = ""
                                                if isinstance(mat_obj, dict):
                                                    mat_num = str(mat_obj.get("FNumber") or mat_obj.get("Number") or "")
                                                elif isinstance(mat_obj, str):
                                                    mat_num = mat_obj
                                                if not mat_num:
                                                    mat_num = str(_row.get("MaterialId_Id") or _row.get("FMaterialId_Id") or "")
                                                # 用物料编码查规格
                                                if mat_num in spec_map:
                                                    _row["FSpecification"] = spec_map[mat_num]
            except Exception as e:
                logger.warning(f"[KingdeeBillDetailHandler] 补充规格型号失败: {e}")

            return json.dumps({
                "status": "success",
                "form_id": form_id,
                "bill": bill_data,
            }, ensure_ascii=False)
        except Exception as e:
            logger.exception(f"[KingdeeBillDetailHandler] error: {e}")
            return json.dumps({"status": "error", "message": str(e)})


class KingdeeConversionStatsHandler:
    """金蝶报价单→销售订单 & 样品单→销售订单 转换统计。
    只读，不走Agent推理链路。根据业务字段匹配（客户+物料+规格+含税单价+日期先后）计算转化率。
    """
    # 缓存前缀
    _METADATA_CACHE_KEY_QUOTATION = "meta_SAL_QUOTATION"
    _METADATA_CACHE_KEY_SALEORDER = "meta_SAL_SaleOrder"

    def GET(self):
        _require_auth()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            params = web.input(days='30', start_date='', end_date='', search='', cust_field='', export='', export_mode='summary')
            try:
                days = max(1, min(int(params.days), 365))
            except (ValueError, TypeError):
                days = 30

            # 构建日期过滤
            filter_parts = []
            sd = params.start_date.strip()
            ed = params.end_date.strip()
            if sd:
                filter_parts.append(f"FDate >= '{sd[:10]}'")
            elif ed:
                fallback = (datetime.datetime.now() - datetime.timedelta(days=days)).strftime('%Y-%m-%d')
                filter_parts.append(f"FDate >= '{fallback}'")
            else:
                start_date = (datetime.datetime.now() - datetime.timedelta(days=days)).strftime('%Y-%m-%d')
                filter_parts.append(f"FDate >= '{start_date}'")

            if ed:
                filter_parts.append(f"FDate <= '{ed[:10]}'")

            search_keyword = params.search.strip()
            search_escaped = search_keyword.replace("'", "''") if search_keyword else ""

            filter_string_so = " AND ".join(filter_parts)
            filter_string_qt = " AND ".join(filter_parts)

            # 应用表单权限 + 业务员过滤（转化统计同时查销售订单与报价单）
            filter_string_so, kd_err = _apply_kingdee_form_filter("SAL_SaleOrder", filter_string_so)
            if kd_err:
                return json.dumps({"status": "error", "message": kd_err})
            filter_string_qt, kd_err = _apply_kingdee_form_filter("SAL_QUOTATION", filter_string_qt)
            if kd_err:
                return json.dumps({"status": "error", "message": kd_err})

            # Step 1: 元数据探索 — 发现字段名
            from agent.tools.tool_manager import ToolManager
            tm = ToolManager()

            # 优先使用 URL 参数手动指定客户订单号字段
            cust_field_param = params.cust_field.strip()
            if cust_field_param:
                cust_order_no_field = cust_field_param
                logger.info(f"[KingdeeConversionStats] 使用手动指定客户订单号字段: {cust_order_no_field}")
            else:
                cust_order_no_field = self._discover_cust_order_no_field(tm)

            quotation_spec_field, quotation_cust_field = self._discover_quotation_fields(tm)

            # Step 2: 并行查询
            so_tool = tm._mcp_tool_instances.get("query_bill_json")
            if not so_tool:
                return json.dumps({"status": "error", "message": "金蝶MCP工具尚未就绪"})

            # 查询销售订单（行级字段）
            so_field_keys = (
                "FBillNo,FDate,FCustId.FName,"
                "FMaterialId.FNumber,FMaterialId.FSpecification,FMaterialId.FName,"
                "FTaxPrice,FAllAmount,FQty,FUnitId.FName,"
                "FDocumentStatus,FSalerId.FName"
            )
            if cust_order_no_field:
                so_field_keys += "," + cust_order_no_field

            # 查询报价单（行级字段）
            qt_field_keys = (
                "FBillNo,FDate," + quotation_cust_field + ","
                "FMaterialId.FNumber," + quotation_spec_field + ",FMaterialId.FName,"
                "FTaxPrice,FAllAmount,FQty,FUnitId.FName,"
                "FDocumentStatus"
            )

            top_count = 2000
            logger.info(f"[KingdeeConversionStats] 正在查询 SAL_SaleOrder fields=[{so_field_keys}] filter=[{filter_string_so}]")
            logger.info(f"[KingdeeConversionStats] 正在查询 SAL_QUOTATION fields=[{qt_field_keys}] filter=[{filter_string_qt}]")

            so_result = so_tool.execute({
                "form_id": "SAL_SaleOrder",
                "field_keys": so_field_keys,
                "filter_string": filter_string_so,
                "top_count": top_count,
            })

            qt_result = so_tool.execute({
                "form_id": "SAL_QUOTATION",
                "field_keys": qt_field_keys,
                "filter_string": filter_string_qt,
                "top_count": top_count,
            })

            so_rows = self._normalize_rows(so_result)
            qt_rows = self._normalize_rows(qt_result)

            logger.info(f"[KingdeeConversionStats] 销售订单行数={len(so_rows)}, 报价单行数={len(qt_rows)}")

            # Step 3: 交叉匹配分析
            result = self._analyze(so_rows, qt_rows, cust_order_no_field, search_keyword)

            # 加入元数据信息
            result["meta"] = {
                "cust_order_no_field": cust_order_no_field or "未发现",
                "quotation_spec_field": quotation_spec_field,
                "quotation_cust_field": quotation_cust_field,
            }
            result["status"] = "success"

            # 服务端 Excel 导出（供企微内置浏览器使用）
            if params.export == 'excel':
                return self._export_as_excel(result, params.export_mode)

            return json.dumps(result, ensure_ascii=False, default=str)

        except Exception as e:
            logger.exception(f"[KingdeeConversionStatsHandler] error: {e}")
            return json.dumps({"status": "error", "message": str(e)})

    # ─── 辅助方法 ────────────────────────────────────────────────

    def _discover_cust_order_no_field(self, tm):
        """在 SAL_SaleOrder 的元数据中搜索'客户订单号'等自定义字段"""
        metadata_tool = tm._mcp_tool_instances.get("query_metadata")
        if not metadata_tool:
            logger.info("[KingdeeConversionStats] query_metadata 不可用，跳过元数据探索")
            return None
        cache_key = self._METADATA_CACHE_KEY_SALEORDER
        cached = _kingdee_cache_get("query_metadata", cache_key)
        if cached:
            found = self._search_cust_field_in_meta(cached)
            if found:
                return found
        try:
            meta_result = metadata_tool.execute({"form_id": "SAL_SaleOrder"})
            if meta_result.status == "success" and meta_result.result:
                meta_data = meta_result.result
                if isinstance(meta_data, str):
                    meta_data = json.loads(meta_data)
                _kingdee_cache_set("query_metadata", cache_key, meta_data)
                found = self._search_cust_field_in_meta(meta_data)
                if found:
                    return found
        except Exception as e:
            logger.warning(f"[KingdeeConversionStats] query_metadata 失败: {e}")
        # 最终兜底：使用已知的客户订单号字段名
        logger.info(f"[KingdeeConversionStats] 使用已知字段名: F_APZV_Text_l4m")
        return "F_APZV_Text_l4m"

    def _search_cust_field_in_meta(self, meta_data):
        """在元数据中查找包含'订单号'、'客户订单'的自定义字段"""
        if not isinstance(meta_data, dict):
            return None
        # 尝试多种路径获取字段列表
        fields = []
        if "fields" in meta_data:
            fields = meta_data["fields"]
        elif "Field" in meta_data:
            fields = meta_data["Field"]
        elif isinstance(meta_data, dict):
            # 递归查找 field 相关键
            for v in meta_data.values():
                if isinstance(v, list):
                    fields = v
                    break
        if not isinstance(fields, list):
            return None
        keywords = ["客户订单", "订单号", "CustOrder", "Cust_Order", "客户单号"]
        for f in fields:
            if not isinstance(f, dict):
                continue
            fname = str(f.get("name", "") or f.get("Name", "") or "")
            flabel = str(f.get("label", "") or f.get("Label", "") or "")
            for kw in keywords:
                if kw in fname or kw in flabel:
                    field_id = f.get("id", "") or f.get("Id", "") or fname
                    logger.info(f"[KingdeeConversionStats] 发现客户订单号字段: {field_id} (label={flabel})")
                    return field_id
        # 兜底: 常用自定义字段名
        fallbacks = ["F_JR_KHDDH", "FCustOrderNo", "F_XXXX_CustOrderNo", "FCustBillNo",
                     "F_APZV_Text_l4m"]
        for fb in fallbacks:
            # 检查是否在字段列表中
            for f in fields:
                fid = f.get("id", "") or f.get("Id", "") or f.get("name", "") or ""
                if fid == fb:
                    logger.info(f"[KingdeeConversionStats] 发现客户订单号字段(兜底): {fb}")
                    return fb
        # 未找到任何匹配字段，输出日志便于排查
        logger.info(f"[KingdeeConversionStats] SAL_SaleOrder 元数据字段列表: "
                    f"{[{'name': f.get('name',''), 'label': f.get('label',''), 'id': f.get('id','')} for f in fields if isinstance(f, dict)]}")
        return None

    def _discover_quotation_fields(self, tm):
        """探索 SAL_QUOTATION 的规格型号字段名和客户字段名"""
        metadata_tool = tm._mcp_tool_instances.get("query_metadata")
        spec_field = "FMaterialId.FSpecification"  # 默认
        cust_field = "FCustId.FName"               # 默认
        if not metadata_tool:
            logger.info("[KingdeeConversionStats] query_metadata 不可用，用默认字段名")
            return spec_field, cust_field
        cache_key = self._METADATA_CACHE_KEY_QUOTATION
        cached = _kingdee_cache_get("query_metadata", cache_key)
        if cached:
            spec_field = self._find_spec_field_in_meta(cached) or spec_field
            cust_field = self._find_cust_field_in_meta(cached) or cust_field
            return spec_field, cust_field
        try:
            meta_result = metadata_tool.execute({"form_id": "SAL_QUOTATION"})
            if meta_result.status == "success" and meta_result.result:
                meta_data = meta_result.result
                if isinstance(meta_data, str):
                    meta_data = json.loads(meta_data)
                _kingdee_cache_set("query_metadata", cache_key, meta_data)
                spec_field = self._find_spec_field_in_meta(meta_data) or spec_field
                cust_field = self._find_cust_field_in_meta(meta_data) or cust_field
        except Exception as e:
            logger.warning(f"[KingdeeConversionStats] query_metadata(SAL_QUOTATION) 失败: {e}")
        return spec_field, cust_field

    def _find_spec_field_in_meta(self, meta_data):
        """在报价单元数据中查找规格型号字段"""
        fields = self._extract_fields(meta_data)
        if not fields:
            return None
        spec_keywords = ["规格", "型号", "Spec", "specification", "Model"]
        # 优先 FMaterialModel
        for f in fields:
            fid = str(f.get("id", "") or f.get("Id", "") or f.get("name", "") or "")
            if fid == "FMaterialModel":
                return "FMaterialModel"
        for f in fields:
            fname = str(f.get("name", "") or f.get("Name", "") or "")
            flabel = str(f.get("label", "") or f.get("Label", "") or "")
            for kw in spec_keywords:
                if kw in fname or kw in flabel:
                    fid = f.get("id", "") or f.get("Id", "") or fname
                    if fid.startswith("F"):
                        return fid
        return None

    def _find_cust_field_in_meta(self, meta_data):
        """在报价单元数据中查找客户字段"""
        fields = self._extract_fields(meta_data)
        if not fields:
            return None
        cust_keywords = ["客户", "Cust", "customer"]
        for f in fields:
            fname = str(f.get("name", "") or f.get("Name", "") or "")
            flabel = str(f.get("label", "") or f.get("Label", "") or "")
            for kw in cust_keywords:
                if kw in fname or kw in flabel:
                    # 优先选择 Id 引用字段
                    if ".FName" in fname or ".FNumber" in fname:
                        return fname
                    if fname.startswith("F"):
                        # 可能是 FCustId，加上 .FName
                        if "Id" in fname or "Cust" in fname:
                            return fname + ".FName"
                        return fname
        return "FCustId.FName"

    def _extract_fields(self, meta_data):
        """从元数据中提取字段列表"""
        if not isinstance(meta_data, dict):
            return []
        if "fields" in meta_data:
            return meta_data["fields"]
        if "Field" in meta_data:
            return meta_data["Field"]
        for v in meta_data.values():
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict) and "name" in v[0]:
                return v
        return []

    def _normalize_rows(self, result):
        """统一处理 MCP 返回的行数据"""
        if result.status != "success" or not result.result:
            return []
        raw = result.result
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                pass
        rows = raw
        if isinstance(rows, dict):
            rows = rows.get("rows", rows.get("data", rows.get("result", [])))
            if isinstance(rows, dict):
                rows = [rows]
        if not isinstance(rows, list):
            rows = [rows] if rows else []
        return rows

    def _get_str(self, row, key, default=""):
        """安全获取字典中的字符串值"""
        val = row.get(key) if isinstance(row, dict) else None
        if val is None:
            return default
        return str(val).strip()

    def _get_float(self, row, key, default=0.0):
        """安全获取字典中的浮点值"""
        val = row.get(key) if isinstance(row, dict) else None
        if val is None:
            return default
        try:
            return float(val)
        except (ValueError, TypeError):
            return default

    def _analyze(self, so_rows, qt_rows, cust_order_no_field, search_keyword):
        """核心分析：交叉匹配报价单↔销售订单 和 样品单↔正式订单"""

        # ── 根据搜索关键词预过滤数据 ──
        if search_keyword:
            so_rows = [r for r in so_rows if search_keyword in self._get_str(r, "FCustId.FName")]
            qt_rows = [r for r in qt_rows if search_keyword in self._get_str(r, "FCustId.FName")]

        # ── 准备报价单行索引 ──
        # 按 (客户, 物料编码, 规格型号, 含税单价) 分组，便于快速查找
        quotation_index = {}  # key: (cust, mat, spec, price) → list of rows
        for qr in qt_rows:
            cust = self._get_str(qr, "FCustId.FName")
            mat = self._get_str(qr, "FMaterialId.FNumber")
            spec = self._get_str(qr, "FMaterialId.FSpecification", self._get_str(qr, "FMaterialModel"))
            price = self._get_float(qr, "FTaxPrice")
            q_date = self._get_str(qr, "FDate")
            key = (cust, mat, spec, round(price, 2))
            if key not in quotation_index:
                quotation_index[key] = []
            quotation_index[key].append({"row": qr, "date": q_date, "amount": self._get_float(qr, "FAllAmount")})

        # ── 构建客户级报价单统计 ──
        qt_customer_bills = {}  # customer → set of bill_nos (total quotations per customer)
        qt_customer_last_date = {}  # customer → latest quotation date
        for qr in qt_rows:
            cust = self._get_str(qr, "FCustId.FName")
            q_bill = self._get_str(qr, "FBillNo")
            q_date = self._get_str(qr, "FDate")
            if cust not in qt_customer_bills:
                qt_customer_bills[cust] = set()
                qt_customer_last_date[cust] = q_date
            qt_customer_bills[cust].add(q_bill)
            if q_date > qt_customer_last_date[cust]:
                qt_customer_last_date[cust] = q_date

        # ── 分析报价单转化情况 ──
        # 已转化的报价单单号集合（去重）
        converted_quotation_bill_nos = set()
        # 报价单→销售订单对列表（用于详情展示）
        quotation_pairs = []
        seen_qt_pairs = set()  # (qt_bill, so_bill) 去重
        qt_customer_converted = {}  # customer → set of converted bill_nos
        # 匹配上的销售订单行数
        matched_so_from_quotation = 0
        # 来源报价单的销售订单金额汇总
        from_quotation_amount = 0.0
        # 匹配上的销售订单号集合
        matched_so_bill_nos = set()
        matched_so_amount_by_bill = {}
        # 已从报价单转化的行对应的报价单单号
        quotation_with_date = {}  # bill_no → date 记录用于去重

        for sor in so_rows:
            so_date = self._get_str(sor, "FDate")
            cust = self._get_str(sor, "FCustId.FName")
            mat = self._get_str(sor, "FMaterialId.FNumber")
            spec = self._get_str(sor, "FMaterialId.FSpecification")
            price = self._get_float(sor, "FTaxPrice")
            so_bill_no = self._get_str(sor, "FBillNo")
            so_amount = self._get_float(sor, "FAllAmount")

            if search_keyword and search_keyword not in cust:
                continue

            key = (cust, mat, spec, round(price, 2))
            if key in quotation_index:
                # 找到 matching quotation — 检查日期，需要 SO 日期 > 报价单日期
                for q_entry in quotation_index[key]:
                    q_date = q_entry["date"]
                    if q_date < so_date:  # 报价单日期早于销售订单日期
                        q_bill_no = self._get_str(q_entry["row"], "FBillNo")
                        # 记录报价单和销售订单的关联
                        if q_bill_no not in quotation_with_date or quotation_with_date[q_bill_no] <= q_date:
                            quotation_with_date[q_bill_no] = q_date
                        converted_quotation_bill_nos.add(q_bill_no)
                        matched_so_from_quotation += 1
                        matched_so_bill_nos.add(so_bill_no)
                        if so_bill_no not in matched_so_amount_by_bill:
                            matched_so_amount_by_bill[so_bill_no] = 0.0
                        matched_so_amount_by_bill[so_bill_no] += so_amount
                        # 记录报价单→销售订单配对（去重）
                        pair_key = (q_bill_no, so_bill_no)
                        if pair_key not in seen_qt_pairs:
                            seen_qt_pairs.add(pair_key)
                            quotation_pairs.append({
                                "qt_bill": q_bill_no, "qt_date": q_date,
                                "qt_status": self._get_str(q_entry["row"], "FDocumentStatus"),
                                "so_bill": so_bill_no, "so_date": so_date,
                                "so_status": self._get_str(sor, "FDocumentStatus"),
                                "so_saler": self._get_str(sor, "FSalerId.FName"),
                                "amount": so_amount, "customer": cust,
                                "material": mat, "spec": spec,
                                "mat_name": self._get_str(sor, "FMaterialId.FName"),
                                "qty": self._get_float(sor, "FQty"),
                                "unit": self._get_str(sor, "FUnitId.FName"),
                                "price": price,
                            })
                            # 记录客户级已转化
                            if cust not in qt_customer_converted:
                                qt_customer_converted[cust] = set()
                            qt_customer_converted[cust].add(q_bill_no)
                        break  # 一行 SO 只匹配一个报价单行

        from_quotation_amount = sum(matched_so_amount_by_bill.values())

        # ── 分析样品单转化情况 ──
        # 样品单行（客户订单号含"样品"/"样品单"）
        sample_rows = []
        normal_rows = []
        cust_order_no_field_name = cust_order_no_field or "F_JR_KHDDH"

        for sor in so_rows:
            if not cust_order_no_field_name:
                # 无法识别样品单
                normal_rows.append(sor)
                continue
            cust_order_val = self._get_str(sor, cust_order_no_field_name)
            if "样品" in cust_order_val or "样品单" in cust_order_val:
                sample_rows.append(sor)
            else:
                normal_rows.append(sor)

        # 构建客户级样品单统计
        sample_customer_bills = {}  # customer → set of bill_nos
        sample_customer_last_date = {}  # customer → latest sample date
        for sr in sample_rows:
            cust = self._get_str(sr, "FCustId.FName")
            s_bill = self._get_str(sr, "FBillNo")
            s_date = self._get_str(sr, "FDate")
            if cust not in sample_customer_bills:
                sample_customer_bills[cust] = set()
                sample_customer_last_date[cust] = s_date
            sample_customer_bills[cust].add(s_bill)
            if s_date > sample_customer_last_date[cust]:
                sample_customer_last_date[cust] = s_date

        # 建立正式订单索引 (客户, 物料, 规格) → list of rows
        normal_index = {}
        for nor in normal_rows:
            cust = self._get_str(nor, "FCustId.FName")
            mat = self._get_str(nor, "FMaterialId.FNumber")
            spec = self._get_str(nor, "FMaterialId.FSpecification")
            key = (cust, mat, spec)
            if key not in normal_index:
                normal_index[key] = []
            normal_index[key].append({
                "date": self._get_str(nor, "FDate"),
                "bill_no": self._get_str(nor, "FBillNo"),
                "amount": self._get_float(nor, "FAllAmount"),
                "mat_name": self._get_str(nor, "FMaterialId.FName"),
                "qty": self._get_float(nor, "FQty"),
                "unit": self._get_str(nor, "FUnitId.FName"),
                "price": self._get_float(nor, "FTaxPrice"),
                "status": self._get_str(nor, "FDocumentStatus"),
                "saler": self._get_str(nor, "FSalerId.FName"),
            })

        converted_sample_bill_nos = set()
        matched_so_from_sample = 0
        from_sample_amount = 0.0
        matched_sample_bill_nos = set()
        matched_sample_amount_by_bill = {}
        # 样品单→正式订单对列表（用于详情展示）
        sample_pairs = []
        seen_sample_pairs = set()  # (sample_bill, normal_bill) 去重
        sample_customer_converted = {}  # customer → set of converted bill_nos

        for sr in sample_rows:
            s_date = self._get_str(sr, "FDate")
            cust = self._get_str(sr, "FCustId.FName")
            mat = self._get_str(sr, "FMaterialId.FNumber")
            spec = self._get_str(sr, "FMaterialId.FSpecification")
            s_bill_no = self._get_str(sr, "FBillNo")

            key = (cust, mat, spec)
            if key in normal_index:
                for n_entry in normal_index[key]:
                    if n_entry["date"] > s_date:  # 正式订单日期晚于样品单
                        converted_sample_bill_nos.add(s_bill_no)
                        matched_so_from_sample += 1
                        matched_sample_bill_nos.add(n_entry["bill_no"])
                        if n_entry["bill_no"] not in matched_sample_amount_by_bill:
                            matched_sample_amount_by_bill[n_entry["bill_no"]] = 0.0
                        matched_sample_amount_by_bill[n_entry["bill_no"]] += n_entry["amount"]
                        # 记录样品单→正式订单配对（去重）
                        spair_key = (s_bill_no, n_entry["bill_no"])
                        if spair_key not in seen_sample_pairs:
                            seen_sample_pairs.add(spair_key)
                            sample_pairs.append({
                                "sample_bill": s_bill_no, "sample_date": s_date,
                                "sample_status": self._get_str(sr, "FDocumentStatus"),
                                "normal_bill": n_entry["bill_no"], "normal_date": n_entry["date"],
                                "normal_status": n_entry["status"],
                                "normal_saler": n_entry["saler"],
                                "amount": n_entry["amount"], "customer": cust,
                                "material": mat, "spec": spec,
                                "mat_name": n_entry["mat_name"],
                                "qty": n_entry["qty"],
                                "unit": n_entry["unit"],
                                "price": n_entry["price"],
                            })
                            # 记录客户级已转化
                            if cust not in sample_customer_converted:
                                sample_customer_converted[cust] = set()
                            sample_customer_converted[cust].add(s_bill_no)
                        break

        from_sample_amount = sum(matched_sample_amount_by_bill.values())

        # ── 计算统计结果 ──
        total_so = len(set(
            self._get_str(sor, "FBillNo") for sor in so_rows
        ))
        total_quotation = len(set(
            self._get_str(qr, "FBillNo") for qr in qt_rows
        ))
        total_samples = len(set(
            self._get_str(sr, "FBillNo") for sr in sample_rows
        ))
        total_normal = total_so - total_samples

        # 报价单视角
        quotation_conversion_rate = 0.0
        if total_quotation > 0:
            quotation_conversion_rate = round(len(converted_quotation_bill_nos) / total_quotation * 100, 1)

        # 销售订单视角 — 报价单来源
        from_quotation_rate = 0.0
        if total_so > 0:
            from_quotation_rate = round(len(matched_so_bill_nos) / total_so * 100, 1)

        # 样品单视角
        sample_conversion_rate = 0.0
        if total_samples > 0:
            sample_conversion_rate = round(len(converted_sample_bill_nos) / total_samples * 100, 1)

        # 销售订单视角 — 样品单来源
        sample_rate = 0.0
        if total_so > 0:
            sample_rate = round(total_samples / total_so * 100, 1)

        result = {
            "quotation": {
                "so_perspective": {
                    "total_so": total_so,
                    "from_quotation_so": len(matched_so_bill_nos),
                    "from_quotation_amount": round(from_quotation_amount, 2),
                    "from_quotation_rate": f"{from_quotation_rate}%",
                },
                "quotation_perspective": {
                    "total_quotations": total_quotation,
                    "converted_quotations": len(converted_quotation_bill_nos),
                    "conversion_rate": f"{quotation_conversion_rate}%",
                    "converted_amount": round(from_quotation_amount, 2),
                },
            },
            "sample": {
                "so_perspective": {
                    "total_so": total_so,
                    "sample_so": total_samples,
                    "sample_amount": 0,  # 样品单金额无法在此统计
                    "sample_rate": f"{sample_rate}%",
                },
                "sample_perspective": {
                    "total_samples": total_samples,
                    "converted_samples": len(converted_sample_bill_nos),
                    "conversion_rate": f"{sample_conversion_rate}%",
                },
            },
        }

        # 计算样品单总金额
        sample_total_amount = 0.0
        for sr in sample_rows:
            sample_total_amount += self._get_float(sr, "FAllAmount")
        result["sample"]["so_perspective"]["sample_amount"] = round(sample_total_amount, 2)
        result["sample"]["sample_perspective"]["converted_amount"] = round(from_sample_amount, 2)

        # ── 构建客户级转化汇总 ──
        customer_summary = []
        # 报价单按客户汇总
        for cust, bills in qt_customer_bills.items():
            total = len(bills)
            converted = len(qt_customer_converted.get(cust, set()))
            rate = round(converted / total * 100, 1) if total > 0 else 0.0
            if converted > 0 or total > 0:
                customer_summary.append({
                    "customer": cust, "type": "quotation",
                    "total": total, "converted": converted,
                    "rate": f"{rate}%",
                    "last_date": qt_customer_last_date.get(cust, ""),
                })
        # 样品单按客户汇总
        for cust, bills in sample_customer_bills.items():
            total = len(bills)
            converted = len(sample_customer_converted.get(cust, set()))
            rate = round(converted / total * 100, 1) if total > 0 else 0.0
            if converted > 0 or total > 0:
                customer_summary.append({
                    "customer": cust, "type": "sample",
                    "total": total, "converted": converted,
                    "rate": f"{rate}%",
                    "last_date": sample_customer_last_date.get(cust, ""),
                })
        # ── 预计算客户转化深度分析（高转化/待跟进）──
        customer_analysis = {"quotation": {"high": [], "low": []}, "sample": {"high": [], "low": []}}
        for cust, bills in qt_customer_bills.items():
            total = len(bills)
            converted = len(qt_customer_converted.get(cust, set()))
            rate = round(converted / total * 100, 1) if total > 0 else 0.0
            last = qt_customer_last_date.get(cust, "")
            # 高转化：至少有过1次转化
            if converted > 0:
                customer_analysis["quotation"]["high"].append({
                    "customer": cust, "type": "quotation",
                    "total": total, "converted": converted,
                    "rate": f"{rate}%", "last_date": last,
                })
            # 待跟进：0转化（所有未转化客户都需要跟进）
            if converted == 0:
                customer_analysis["quotation"]["low"].append({
                    "customer": cust, "type": "quotation",
                    "total": total, "converted": converted,
                    "rate": f"{rate}%", "last_date": last,
                })
        # 按转化率降序排列高转化客户
        customer_analysis["quotation"]["high"].sort(key=lambda x: (float(x["rate"].rstrip("%")), x["total"]), reverse=True)
        # 按报价次数降序排列待跟进客户
        customer_analysis["quotation"]["low"].sort(key=lambda x: x["total"], reverse=True)

        for cust, bills in sample_customer_bills.items():
            total = len(bills)
            converted = len(sample_customer_converted.get(cust, set()))
            rate = round(converted / total * 100, 1) if total > 0 else 0.0
            last = sample_customer_last_date.get(cust, "")
            # 高转化：至少有过1次转化
            if converted > 0:
                customer_analysis["sample"]["high"].append({
                    "customer": cust, "type": "sample",
                    "total": total, "converted": converted,
                    "rate": f"{rate}%", "last_date": last,
                })
            # 待跟进：0转化（所有未转化客户都需要跟进）
            if converted == 0:
                customer_analysis["sample"]["low"].append({
                    "customer": cust, "type": "sample",
                    "total": total, "converted": converted,
                    "rate": f"{rate}%", "last_date": last,
                })
        customer_analysis["sample"]["high"].sort(key=lambda x: (float(x["rate"].rstrip("%")), x["total"]), reverse=True)
        customer_analysis["sample"]["low"].sort(key=lambda x: x["total"], reverse=True)

        # ── 构建客户单据明细（用于导出）──
        # 报价单：先按单号汇总
        qt_bill_map = {}
        for qr in qt_rows:
            bn = self._get_str(qr, "FBillNo")
            if bn not in qt_bill_map:
                qt_bill_map[bn] = {"date": "", "amount": 0.0, "customer": ""}
            if not qt_bill_map[bn]["date"]:
                qt_bill_map[bn]["date"] = self._get_str(qr, "FDate")
            if not qt_bill_map[bn]["customer"]:
                qt_bill_map[bn]["customer"] = self._get_str(qr, "FCustId.FName")
            qt_bill_map[bn]["amount"] += self._get_float(qr, "FAllAmount")

        # 样品单：按单号汇总
        sample_bill_map = {}
        for sr in sample_rows:
            bn = self._get_str(sr, "FBillNo")
            if bn not in sample_bill_map:
                sample_bill_map[bn] = {"date": "", "amount": 0.0, "customer": ""}
            if not sample_bill_map[bn]["date"]:
                sample_bill_map[bn]["date"] = self._get_str(sr, "FDate")
            if not sample_bill_map[bn]["customer"]:
                sample_bill_map[bn]["customer"] = self._get_str(sr, "FCustId.FName")
            sample_bill_map[bn]["amount"] += self._get_float(sr, "FAllAmount")

        # 构建客户单据明细列表
        customer_bills_detail = []
        for bn, info in qt_bill_map.items():
            customer_bills_detail.append({
                "customer": info["customer"],
                "type": "quotation",
                "bill_no": bn,
                "date": info["date"],
                "amount": round(info["amount"], 2),
                "converted": bn in converted_quotation_bill_nos,
            })
        for bn, info in sample_bill_map.items():
            customer_bills_detail.append({
                "customer": info["customer"],
                "type": "sample",
                "bill_no": bn,
                "date": info["date"],
                "amount": round(info["amount"], 2),
                "converted": bn in converted_sample_bill_nos,
            })

        result["detail"] = {
            "quotation_pairs": quotation_pairs,
            "sample_pairs": sample_pairs,
            "customer_summary": customer_summary,
            "customer_bills_detail": customer_bills_detail,
            "customer_analysis": customer_analysis,
        }

        logger.info(f"[KingdeeConversionStats] 分析完成: "
                     f"报价单转化率={quotation_conversion_rate}%, "
                     f"样品单转化率={sample_conversion_rate}%")
        return result

    # ─── 服务端 Excel 导出（供企微内置浏览器 / window.open 调用）───

    def _export_as_excel(self, result, export_mode):
        """根据 _analyze 返回的 result 数据生成 .xlsx 文件并返回下载响应。"""
        from io import BytesIO
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from urllib.parse import quote

        wb = openpyxl.Workbook()

        # 样式
        header_font = Font(bold=True, size=11, color="FFFFFF")
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
        thin_border = Border(
            left=Side(style='thin'), right=Side(style='thin'),
            top=Side(style='thin'), bottom=Side(style='thin'),
        )

        detail = result.get("detail", {}) or {}
        q_pairs = detail.get("quotation_pairs", []) or []
        s_pairs = detail.get("sample_pairs", []) or []
        cust_summary = detail.get("customer_summary", []) or []
        cust_bills_detail = detail.get("customer_bills_detail", []) or []
        cust_analysis = detail.get("customer_analysis", {}) or {}

        def _write_header(ws, headers):
            for col_idx, h in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col_idx, value=h)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = header_align
                cell.border = thin_border

        def _write_row(ws, row_idx, data):
            for col_idx, val in enumerate(data, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=val)
                cell.border = thin_border

        # ── 模式 pairs：报价单对照 + 样品单对照 ──
        if export_mode == "pairs":
            has_q = len(q_pairs) > 0
            has_s = len(s_pairs) > 0

            if has_q:
                ws1 = wb.active
                ws1.title = "报价单→销售订单对照"
                headers1 = [
                    "报价单号", "报价日期", "报价单状态", "销售订单号", "订单日期", "订单状态",
                    "销售员", "价税合计(¥)", "客户", "物料编码", "物料名称", "规格型号",
                    "数量", "单位", "含税单价",
                ]
                _write_header(ws1, headers1)
                for i, p in enumerate(q_pairs, 2):
                    _write_row(ws1, i, [
                        p.get("qt_bill", ""), p.get("qt_date", ""), p.get("qt_status", ""),
                        p.get("so_bill", ""), p.get("so_date", ""), p.get("so_status", ""),
                        p.get("so_saler", ""), p.get("amount", 0), p.get("customer", ""),
                        p.get("material", ""), p.get("mat_name", ""), p.get("spec", ""),
                        p.get("qty", 0), p.get("unit", ""), p.get("price", 0),
                    ])

            if has_s:
                ws2 = wb.create_sheet("样品单→正式订单对照")
                headers2 = [
                    "样品单号", "样品日期", "样品单状态", "正式订单号", "订单日期", "订单状态",
                    "销售员", "价税合计(¥)", "客户", "物料编码", "物料名称", "规格型号",
                    "数量", "单位", "含税单价",
                ]
                _write_header(ws2, headers2)
                for i, p in enumerate(s_pairs, 2):
                    _write_row(ws2, i, [
                        p.get("sample_bill", ""), p.get("sample_date", ""), p.get("sample_status", ""),
                        p.get("normal_bill", ""), p.get("normal_date", ""), p.get("normal_status", ""),
                        p.get("normal_saler", ""), p.get("amount", 0), p.get("customer", ""),
                        p.get("material", ""), p.get("mat_name", ""), p.get("spec", ""),
                        p.get("qty", 0), p.get("unit", ""), p.get("price", 0),
                    ])

            if not has_q and not has_s:
                ws = wb.active
                ws.title = "空数据"
                ws.cell(row=1, column=1, value="暂无导出数据")

        # ── 模式 summary：客户转化汇总 + 客户单据明细 ──
        elif export_mode == "summary":
            # Sheet 1: 客户转化汇总
            ws1 = wb.active
            ws1.title = "客户转化汇总"
            headers1 = ["客户", "类型", "总单据数", "已转化", "转化率"]
            _write_header(ws1, headers1)
            for i, c in enumerate(cust_summary, 2):
                type_label = "报价单" if c.get("type") == "quotation" else "样品单"
                _write_row(ws1, i, [
                    c.get("customer", ""), type_label,
                    c.get("total", 0), c.get("converted", 0), c.get("rate", "0%"),
                ])

            # Sheet 2: 客户单据明细
            if cust_bills_detail:
                ws2 = wb.create_sheet("客户单据明细")
                headers2 = ["客户", "类型", "单据号", "日期", "价税合计(¥)", "转化状态"]
                _write_header(ws2, headers2)
                for i, b in enumerate(cust_bills_detail, 2):
                    type_label = "报价单" if b.get("type") == "quotation" else "样品单"
                    conv_label = "已转化" if b.get("converted") else "未转化"
                    _write_row(ws2, i, [
                        b.get("customer", ""), type_label,
                        b.get("bill_no", ""), b.get("date", ""),
                        b.get("amount", 0), conv_label,
                    ])

        # ── 模式 analysis：客户转化深度分析 ──
        elif export_mode == "analysis":
            # Sheet 1: 报价单客户分析
            ws1 = wb.active
            ws1.title = "报价单客户分析"
            headers1 = ["客户", "类型", "报价次数", "已转化", "转化率", "最近报价", "分析标签"]
            _write_header(ws1, headers1)
            row_idx = 2
            qt_high = cust_analysis.get("quotation", {}).get("high", []) or []
            qt_low = cust_analysis.get("quotation", {}).get("low", []) or []
            for c in qt_high:
                _write_row(ws1, row_idx, [
                    c.get("customer", ""), "报价单",
                    c.get("total", 0), c.get("converted", 0),
                    c.get("rate", "0%"), c.get("last_date", ""), "高转化",
                ])
                row_idx += 1
            for c in qt_low:
                _write_row(ws1, row_idx, [
                    c.get("customer", ""), "报价单",
                    c.get("total", 0), c.get("converted", 0),
                    c.get("rate", "0%"), c.get("last_date", ""), "待跟进",
                ])
                row_idx += 1

            # Sheet 2: 样品单客户分析
            ws2 = wb.create_sheet("样品单客户分析")
            headers2 = ["客户", "类型", "样品次数", "已转化", "转化率", "最近样品日期", "分析标签"]
            _write_header(ws2, headers2)
            row_idx = 2
            sp_high = cust_analysis.get("sample", {}).get("high", []) or []
            sp_low = cust_analysis.get("sample", {}).get("low", []) or []
            for c in sp_high:
                _write_row(ws2, row_idx, [
                    c.get("customer", ""), "样品单",
                    c.get("total", 0), c.get("converted", 0),
                    c.get("rate", "0%"), c.get("last_date", ""), "高转化",
                ])
                row_idx += 1
            for c in sp_low:
                _write_row(ws2, row_idx, [
                    c.get("customer", ""), "样品单",
                    c.get("total", 0), c.get("converted", 0),
                    c.get("rate", "0%"), c.get("last_date", ""), "待跟进",
                ])
                row_idx += 1

            # Sheet 3: 待跟进客户汇总（方便销售分派任务）
            all_low = []
            for c in qt_low:
                all_low.append({**c, "type_label": "报价单"})
            for c in sp_low:
                all_low.append({**c, "type_label": "样品单"})
            if all_low:
                ws3 = wb.create_sheet("待跟进客户汇总")
                headers3 = ["客户", "类型", "次数", "最近日期", "分析标签"]
                _write_header(ws3, headers3)
                for i, c in enumerate(all_low, 2):
                    _write_row(ws3, i, [
                        c.get("customer", ""), c.get("type_label", ""),
                        c.get("total", 0), c.get("last_date", ""), "待跟进",
                    ])

        # ── 输出文件 ──
        output = BytesIO()
        wb.save(output)
        output.seek(0)

        export_label = {"pairs": "单据对照", "summary": "客户汇总", "analysis": "客户分析"}
        file_name = "转化分析_{}_{}.xlsx".format(
            export_label.get(export_mode, "客户汇总"),
            datetime.datetime.now().strftime("%Y-%m-%d"),
        )
        web.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        web.header('Content-Disposition', "attachment; filename*=UTF-8''{}".format(quote(file_name)))
        return output.getvalue()


class KingdeeConversionCustomerBillsHandler:
    """按客户查询单据列表（报价单或样品单），前端根据 pairs 判断转化状态。
    只读，不走Agent推理链路。
    """
    def GET(self):
        _require_auth()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            params = web.input(customer='', type='quotation', start_date='', end_date='', search='')
            customer = params.customer.strip()
            bill_type = params.type.strip()

            if not customer:
                return json.dumps({"status": "error", "message": "缺少客户名称"})

            from agent.tools.tool_manager import ToolManager
            tm = ToolManager()
            so_tool = tm._mcp_tool_instances.get("query_bill_json")
            if not so_tool:
                return json.dumps({"status": "error", "message": "金蝶MCP工具尚未就绪"})

            form_id = "SAL_QUOTATION" if bill_type == "quotation" else "SAL_SaleOrder"

            # 构建过滤条件
            filter_parts = []
            escaped_customer = customer.replace("'", "''")
            filter_parts.append(f"FCustId.FName = '{escaped_customer}'")

            sd = params.start_date.strip()
            ed = params.end_date.strip()
            if sd:
                filter_parts.append(f"FDate >= '{sd[:10]}'")
            if ed:
                filter_parts.append(f"FDate <= '{ed[:10]}'")

            # 样品单：需要按客户订单号字段过滤 "样品"
            if bill_type == "sample":
                # 使用已知的客户订单号字段（同 KingdeeConversionStatsHandler 的兜底值）
                cust_field = "F_APZV_Text_l4m"
                filter_parts.append(f"{cust_field} LIKE '%样品%'")

            filter_string = " AND ".join(filter_parts)

            # 应用表单权限 + 业务员过滤
            filter_string, kd_err = _apply_kingdee_form_filter(form_id, filter_string)
            if kd_err:
                return json.dumps({"status": "error", "message": kd_err})

            field_keys = "FBillNo,FDate,FCustId.FName,FMaterialId.FNumber,FMaterialId.FSpecification,FTaxPrice,FAllAmount"
            top_count = 500

            result = so_tool.execute({
                "form_id": form_id,
                "field_keys": field_keys,
                "filter_string": filter_string,
                "top_count": top_count,
            })

            rows = self._normalize_rows(result)

            # 按单号汇总（单行级数据 → 单据级）
            bills_dict = {}
            for row in rows:
                bill_no = self._get_str(row, "FBillNo")
                if bill_no not in bills_dict:
                    bills_dict[bill_no] = {
                        "bill_no": bill_no,
                        "date": self._get_str(row, "FDate"),
                        "customer": self._get_str(row, "FCustId.FName"),
                        "amount": 0.0,
                    }
                bills_dict[bill_no]["amount"] += self._get_float(row, "FAllAmount")

            bills = sorted(bills_dict.values(), key=lambda x: x.get("date", ""), reverse=True)

            return json.dumps({
                "status": "success",
                "bills": bills,
            }, ensure_ascii=False, default=str)

        except Exception as e:
            logger.exception(f"[KingdeeConversionCustomerBillsHandler] error: {e}")
            return json.dumps({"status": "error", "message": str(e)})

    # ─── 辅助方法（与 KingdeeConversionStatsHandler 相同） ───

    def _normalize_rows(self, result):
        if result.status != "success" or not result.result:
            return []
        raw = result.result
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                pass
        rows = raw
        if isinstance(rows, dict):
            rows = rows.get("rows", rows.get("data", rows.get("result", [])))
            if isinstance(rows, dict):
                rows = [rows]
        if not isinstance(rows, list):
            rows = [rows] if rows else []
        return rows

    def _get_str(self, row, key, default=""):
        val = row.get(key) if isinstance(row, dict) else None
        if val is None:
            return default
        return str(val).strip()

    def _get_float(self, row, key, default=0.0):
        val = row.get(key) if isinstance(row, dict) else None
        if val is None:
            return default
        try:
            return float(val)
        except (ValueError, TypeError):
            return default


class KingdeeArOverdueHandler:
    """金蝶应收单逾期统计（立账类型=财务应收）。
    查询 AR_receivable 表（立账类型为"财务应收"），按到期日计算逾期天数，
    按标准分段（未逾期/1-30/31-60/61-90/90天+）聚合统计。
    只读，不走Agent推理链路。
    """
    def GET(self):
        _require_auth()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            params = web.input(days='365', start_date='', end_date='', search='', export='', export_mode='detail')
            try:
                days = max(1, min(int(params.days), 730))
            except (ValueError, TypeError):
                days = 365

            from agent.tools.tool_manager import ToolManager
            tm = ToolManager()
            so_tool = tm._mcp_tool_instances.get("query_bill_json")
            all_tool = tm._mcp_tool_instances.get("query_bill_all")
            if not so_tool or not all_tool:
                return json.dumps({"status": "error", "message": "金蝶MCP工具尚未就绪"})

            # 表单权限校验（AR_receivable 为非销售类，仅校验表单权限）
            _, kd_err = _apply_kingdee_form_filter("AR_receivable", "1=1")
            if kd_err:
                return json.dumps({"status": "error", "message": kd_err})

            # Step 1: 元数据探索 → 发现字段 (14个)
            (due_field, material_field, spec_field, settle_field, unsettle_field,
             cust_field, amount_field, billno_field, date_field, bill_type_field, entity_field,
             saler_field, status_field, open_amount_field) = \
                self._discover_ar_fields(tm)

            # Step 1b: 探查查询 — 不加过滤条件，看AR_receivable是否有数据
            try:
                probe_result = so_tool.execute({
                    "form_id": "AR_receivable",
                    "field_keys": "FBillNo,FDate",
                    "filter_string": "",
                    "top_count": 10,
                })
                probe_json = json.loads(probe_result.result) if isinstance(probe_result.result, str) else probe_result.result
                probe_rows = self._normalize_rows(probe_result)
                logger.info(f"[KingdeeArOverdue] 探查查询(无过滤) 行数={len(probe_rows)}, "
                            f"数据摘要={json.dumps(probe_json, ensure_ascii=False)[:600]}")
            except Exception as e:
                logger.warning(f"[KingdeeArOverdue] 探查查询失败: {e}")

            # Step 2: 构建过滤条件
            filter_parts = []
            # 立账类型=3（财务应收），仅在字段名不含点号时使用SQL过滤（点号字段走Python端兼容）
            if bill_type_field and '.' not in bill_type_field:
                filter_parts.append(f"{bill_type_field} = '3'")

            sd = params.start_date.strip()
            ed = params.end_date.strip()
            if sd:
                filter_parts.append(f"{date_field} >= '{sd[:10]}'")
            if ed:
                filter_parts.append(f"{date_field} <= '{ed[:10]}'")

            filter_string = " AND ".join(filter_parts) if filter_parts else "1=1"

            # 只查询表头字段（表体字段由 API 自动嵌套返回，不应在 field_keys 中显式请求实体名）
            header_fields = [billno_field, date_field, due_field, cust_field, bill_type_field,
                             settle_field, unsettle_field, amount_field, saler_field,
                             status_field, open_amount_field]
            all_fields = list(dict.fromkeys(f for f in header_fields if f))
            # 过滤掉点号字段（query_bill_json 对某些表单不支持点号字段）
            simple_fields = [f for f in all_fields if '.' not in f]
            complex_fields = [f for f in all_fields if '.' in f]
            # 如果客户字段是 ID 而非名称，额外查询客户名称字段（动态派生）
            cust_name_field = ""
            if cust_field and '.' not in cust_field:
                cust_name_field = cust_field + ".FName"
                if cust_name_field not in complex_fields:
                    complex_fields.append(cust_name_field)

            search_keyword = params.search.strip()
            if search_keyword:
                search_escaped = search_keyword.replace("'", "''")
                search_field = cust_name_field if cust_name_field and cust_field else cust_field
                filter_parts.append(
                    f"({billno_field} LIKE '%{search_escaped}%' "
                    f"OR {search_field} LIKE '%{search_escaped}%')"
                )
                filter_string = " AND ".join(filter_parts)
            field_keys = ",".join(simple_fields)
            logger.info(f"[KingdeeArOverdue] 简单字段=[{','.join(simple_fields)}] "
                        f"点号字段=[{','.join(complex_fields)}]")
            top_count = 2000

            logger.info(f"[KingdeeArOverdue] 查询 AR_receivable fields=[{field_keys}] filter=[{filter_string}]")

            result = all_tool.execute({
                "form_id": "AR_receivable",
                "field_keys": field_keys,
                "filter_string": filter_string,
            })

            rows = self._normalize_rows(result)
            logger.info(f"[KingdeeArOverdue] 原始行数={len(rows)}")

            # Fix 4: 主查询返回0行时，尝试用最简字段重试（字段列表中有无效字段会导致金蝶 API 返回0行）
            if len(rows) == 0 and simple_fields and len(simple_fields) > 2:
                logger.warning(f"[KingdeeArOverdue] 主查询返回0行，尝试修剪到最简字段重试")
                retry_fields = [billno_field, date_field]
                retry_keys = ",".join(retry_fields)
                try:
                    retry_result = so_tool.execute({
                        "form_id": "AR_receivable",
                        "field_keys": retry_keys,
                        "filter_string": filter_string,
                        "top_count": top_count,
                    })
                    retry_rows = self._normalize_rows(retry_result)
                    logger.info(f"[KingdeeArOverdue] 重试行数={len(retry_rows)}")
                    if retry_rows and len(retry_rows) > 0:
                        rows = retry_rows
                        simple_fields = [f for f in retry_fields if '.' not in f]
                        complex_fields = [f for f in retry_fields if '.' in f]
                        field_keys = retry_keys
                except Exception as e:
                    logger.warning(f"[KingdeeArOverdue] 重试失败: {e}")

            # 补查：尝试单独查询点号字段并通过 FBillNo 合并
            if complex_fields:
                try:
                    extra_keys = "FBillNo," + ",".join(complex_fields)
                    extra_result = all_tool.execute({
                        "form_id": "AR_receivable",
                        "field_keys": extra_keys,
                        "filter_string": filter_string,
                    })
                    extra_rows = self._normalize_rows(extra_result)
                    logger.info(f"[KingdeeArOverdue] 点号字段补查 行数={len(extra_rows)}")
                    if extra_rows and len(extra_rows) > 0:
                        extra_map = {}
                        for er in extra_rows:
                            if isinstance(er, dict):
                                bn = str(er.get("FBillNo", "")).strip()
                                if bn:
                                    extra_map[bn] = er
                        merged = 0
                        for r in rows:
                            if isinstance(r, dict):
                                bn = str(r.get("FBillNo", "")).strip()
                                if bn in extra_map:
                                    for ek in complex_fields:
                                        if ek in extra_map[bn]:
                                            r[ek] = extra_map[bn][ek]
                                            merged += 1
                        logger.info(f"[KingdeeArOverdue] 点号字段合并: 覆盖{merged}个值")
                except Exception as e:
                    logger.warning(f"[KingdeeArOverdue] 点号字段补查失败: {e}")

            # Step 2b: 展开表体实体行（如果实体字段嵌套）
            rows = self._expand_entity_rows(rows, entity_field)
            logger.info(f"[KingdeeArOverdue] 展开后行数={len(rows)}")

            # 诊断：打印第一行原始数据，确认 API 返回的字段格式
            if rows and len(rows) > 0:
                sample_row = rows[0] if isinstance(rows[0], dict) else {}
                logger.info(f"[KingdeeArOverdue] 第一行字段keys({len(sample_row)}个)={list(sample_row.keys())[:20]}..."
                            f" cust_field({cust_field!r})={sample_row.get(cust_field,'N/A')!r}, "
                            f"cust_name({cust_name_field!r})={sample_row.get(cust_name_field,'N/A')!r}, "
                            f"material({material_field!r})={sample_row.get(material_field,'N/A')!r}, "
                            f"spec({spec_field!r})={sample_row.get(spec_field,'N/A')!r}, "
                            f"settle({settle_field!r})={sample_row.get(settle_field,'N/A')!r}, "
                            f"unsettle({unsettle_field!r})={sample_row.get(unsettle_field,'N/A')!r}, "
                            f"amount({amount_field!r})={sample_row.get(amount_field,'N/A')!r}, "
                            f"FENDDATE={sample_row.get('FENDDATE','N/A')!r}, "
                            f"FSETACCOUNTTYPE={sample_row.get('FSETACCOUNTTYPE','N/A')!r}, "
                            f"open_amount_field({open_amount_field!r})={sample_row.get(open_amount_field,'N/A')!r}, "
                            f"status_field({status_field!r})={sample_row.get(status_field,'N/A')!r}, "
                            f"open_amount({open_amount_field})_raw={sample_row.get(open_amount_field,'N/A')!r}")

            # Step 2c: 立账类型已在 SQL 端过滤(3=财务应收)，字段带点号时回退到 Python 端兼容过滤
            if bill_type_field and '.' in bill_type_field:
                before = len(rows)
                rows = [r for r in rows if '财务应收' in self._get_str(r, bill_type_field)]
                logger.info(f"[KingdeeArOverdue] 立账类型Python回退过滤: {before}→{len(rows)}")

            # Step 3: 逾期计算
            now = datetime.datetime.now()
            today = now.date()

            # 从原始行中提取单据数据（保留行明细）
            bills = []
            seen_billnos = set()
            for row in rows:
                bn = self._get_str(row, billno_field)
                if not bn:
                    continue
                bill_date_str = self._get_str(row, date_field)
                due_str = self._get_str(row, due_field)
                # 优先用客户名称字段，没有则用客户ID字段
                customer = self._get_str(row, cust_name_field) if cust_name_field else ""
                if not customer:
                    customer = self._get_str(row, cust_field)
                settle = self._get_float(row, settle_field) if settle_field else 0
                unsettle = self._get_float(row, unsettle_field) if unsettle_field else None
                if unsettle is None:
                    # unsettle_field 为空（AR_receivable 无"未结算金额"），用 settle 算出金额
                    amt = self._get_float(row, amount_field) if amount_field else 0
                    unsettle = max(0, amt - settle)
                else:
                    amt = settle + unsettle
                # 如果 settle/unsettle 字段不可用（组织ID/不存在的字段），回退到 amount_field
                if amt <= 0 and amount_field:
                    amt = self._get_float(row, amount_field)
                    if amt > 0:
                        unsettle = amt  # 未结清金额=全部金额
                        settle = 0

                # 收款核销状态过滤：只显示未完全核销的单据
                writtenoff_status = self._get_str(row, status_field) if status_field else ""
                if writtenoff_status and writtenoff_status.strip() == 'C':  # C=完全核销，排除
                    continue

                # 已开票核销金额
                open_amount = self._get_float(row, open_amount_field) if open_amount_field else 0

                material = self._get_str(row, material_field) if material_field else ""
                specification = self._get_str(row, spec_field) if spec_field else ""
                # 销售员字段提取
                saler = self._get_str(row, saler_field) if saler_field else ""
                if not saler:
                    saler = "未分配"

                if amt <= 0:
                    continue
                if not due_str or len(due_str) < 10:
                    continue
                try:
                    due_date = datetime.datetime.strptime(due_str[:10], "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    continue

                overdue_days = (today - due_date).days

                bills.append({
                    "_bill_no": bn,
                    "_date": bill_date_str,
                    "_due_date": due_date,
                    "_due_str": due_str[:10],
                    "_customer": customer,
                    "_amount": amt,
                    "_settle": settle,
                    "_unsettle": unsettle,
                    "_open_amount": open_amount,
                    "_overdue_days": overdue_days,
                    "_material": material,
                    "_specification": specification,
                    "_saler": saler,
                })
                seen_billnos.add(bn)

            logger.info(f"[KingdeeArOverdue] 有效数据行数={len(bills)}, 单据数={len(seen_billnos)}")

            if not bills:
                return json.dumps({
                    "status": "success",
                    "message": "未找到符合条件的应收单（财务应收）数据",
                    "kpi": self._empty_kpi(),
                    "aging": [],
                    "customer_ranking": [],
                    "detail_rows": [],
                    "saler_summary": [],
                }, ensure_ascii=False, default=str)

            # Step 4: 聚合统计
            result_data = self._calculate_overdue(bills, search_keyword)

            result_data["meta"] = {
                "due_date_field": due_field,
                "material_field": material_field,
                "spec_field": spec_field,
                "settle_field": settle_field,
                "unsettle_field": unsettle_field,
                "cust_field": cust_field,
                "amount_field": amount_field,
                "billno_field": billno_field,
                "date_field": date_field,
                "bill_type_field": bill_type_field,
                "saler_field": saler_field,
                "data_count": len(bills),
                "total_db_count": len(rows),
            }
            result_data["status"] = "success"

            # 服务端 Excel 导出
            if params.export == 'excel':
                return self._export_as_excel(result_data, params.export_mode)

            return json.dumps(result_data, ensure_ascii=False, default=str)

        except Exception as e:
            logger.exception(f"[KingdeeArOverdueHandler] error: {e}")
            return json.dumps({"status": "error", "message": str(e)})

    # ─── 辅助方法 ────────────────────────────────────────────────

    def _empty_kpi(self):
        return {
            "total_count": 0,
            "overdue_amount": 0, "overdue_count": 0,
            "overdue_rate": 0, "avg_overdue_days": 0,
            "due_soon_amount": 0, "due_soon_count": 0,
            "open_amount": 0,
            "settle_rate": 0,
            "saler_count": 0,
            "total_gap": 0,
        }

    def _score_match(self, fid, flabel, keywords):
        """对字段匹配打分：fid(金蝶字段名)匹配更准确，flabel(中文名)匹配较准确，分值=匹配关键字长度或1"""
        if not fid or not keywords:
            return 0
        fid_upper = fid.upper()
        best = 0
        for kw in keywords:
            kw_upper = kw.upper()
            if len(kw_upper) > 1 and kw_upper in fid_upper:
                score = len(kw_upper)
                # 精确大小写匹配加分，避免 FAllAmountFor(价税合计) 与 FALLAMOUNTFOR(开票核销金额) 混淆
                if len(kw) > 1 and kw in fid:
                    score += 1
                best = max(best, score)
        if best > 0:
            return best
        # 在中文标签中匹配（模糊），固定分值
        for kw in keywords:
            if kw in flabel:
                return 1
        return 0

    def _discover_ar_fields(self, tm):
        """探索 AR_receivable 元数据，发现所有需要字段。失败时用兜底值。"""
        # 先全部初始化为空字符串，由元数据匹配填充；匹配不到的再用兜底值
        due_field = ""
        material_field = ""
        spec_field = ""
        settle_field = ""
        unsettle_field = ""
        cust_field = ""
        amount_field = ""
        billno_field = "FBillNo"      # 已知确定的字段直接初始化
        date_field = "FDate"          # 已知确定的字段直接初始化
        bill_type_field = ""
        entity_field = "AR_ReceivableEntry"  # 已知确定的实体名
        saler_field = ""
        status_field = ""
        open_amount_field = ""

        # 兜底值（仅在元数据解析失败或无匹配时使用）
        # 注意：字段名必须与金蝶元数据一致（2026-08-27 实测确认）
        #   - 应收单业务员字段是 FSALEERID（不是 FSalerId）
        #   - 应收单"已收/结算金额"用 FRECEIVEAMOUNT（实收金额），FRECTOTALAMOUNTFOR 不存在
        fallback_defaults = {
            "due": "FENDDATE_H",
            "material": "FMaterialId.FName",
            "spec": "FMaterialId.FSpecification",
            "settle": "FRECEIVEAMOUNT",
            "unsettle": "",  # AR_receivable 无"未结算金额"字段，由 amt - settle 计算
            "cust": "FCUSTOMERID.FName",
            "amount": "FAllAmountFor",
            "bill_type": "FBillTypeId.FName",
            "saler": "FSALEERID.FName",
            "status": "FWRITTENOFFSTATUS",
            "open_amount": "FALLAMOUNTFOR",
        }

        metadata_tool = tm._mcp_tool_instances.get("query_metadata")
        if not metadata_tool:
            logger.info("[KingdeeArOverdue] query_metadata 不可用，使用兜底字段")
            due_field = "FENDDATE_H"
            material_field = "FMaterialId.FName"
            spec_field = "FMaterialId.FSpecification"
            settle_field = "FRECEIVEAMOUNT"
            unsettle_field = ""
            cust_field = "FCUSTOMERID.FName"
            amount_field = "FAllAmountFor"
            bill_type_field = "FBillTypeId.FName"
            saler_field = "FSALEERID.FName"
            status_field = "FWRITTENOFFSTATUS"
            open_amount_field = fallback_defaults.get("open_amount", "")
            return (due_field, material_field, spec_field, settle_field, unsettle_field,
                    cust_field, amount_field, billno_field, date_field, bill_type_field, entity_field,
                    saler_field, status_field, open_amount_field)

        cache_key = "meta_AR_receivable"
        cached = _kingdee_cache_get("query_metadata", cache_key)
        if cached:
            meta_data = cached
        else:
            try:
                meta_result = metadata_tool.execute({"form_id": "AR_receivable"})
                if meta_result.status == "success" and meta_result.result:
                    meta_data = meta_result.result
                    if isinstance(meta_data, str):
                        meta_data = json.loads(meta_data)
                    _kingdee_cache_set("query_metadata", cache_key, meta_data)
                else:
                    # metadata 失败，应用兜底
                    due_field = fallback_defaults.get("due", "")
                    material_field = fallback_defaults.get("material", "")
                    spec_field = fallback_defaults.get("spec", "")
                    settle_field = fallback_defaults.get("settle", "")
                    unsettle_field = fallback_defaults.get("unsettle", "")
                    cust_field = fallback_defaults.get("cust", "")
                    amount_field = fallback_defaults.get("amount", "")
                    bill_type_field = fallback_defaults.get("bill_type", "")
                    saler_field = fallback_defaults.get("saler", "")
                    status_field = fallback_defaults.get("status", "")
                    open_amount_field = fallback_defaults.get("open_amount", "")
                    return (due_field, material_field, spec_field, settle_field, unsettle_field,
                            cust_field, amount_field, billno_field, date_field, bill_type_field, entity_field,
                            saler_field, status_field, open_amount_field)
            except Exception as e:
                logger.warning(f"[KingdeeArOverdue] query_metadata 失败: {e}")
                due_field = fallback_defaults.get("due", "")
                material_field = fallback_defaults.get("material", "")
                spec_field = fallback_defaults.get("spec", "")
                settle_field = fallback_defaults.get("settle", "")
                unsettle_field = fallback_defaults.get("unsettle", "")
                cust_field = fallback_defaults.get("cust", "")
                amount_field = fallback_defaults.get("amount", "")
                bill_type_field = fallback_defaults.get("bill_type", "")
                saler_field = fallback_defaults.get("saler", "")
                status_field = fallback_defaults.get("status", "")
                open_amount_field = fallback_defaults.get("open_amount", "")
                return (due_field, material_field, spec_field, settle_field, unsettle_field,
                        cust_field, amount_field, billno_field, date_field, bill_type_field, entity_field,
                        saler_field, status_field, open_amount_field)

        # 诊断：打印元数据顶层结构
        if isinstance(meta_data, dict):
            logger.info(f"[KingdeeArOverdue] 元数据顶层keys={list(meta_data.keys())}, "
                        f"fields_key_exists={'fields' in meta_data}, "
                        f"Field_key_exists={'Field' in meta_data}")

        # 搜索字段
        due_keywords = ["到期", "EndDate", "Hope", "期限", "到期日"]
        material_keywords = ["物料", "Material", "产品", "商品", "货品"]
        spec_keywords = ["规格", "Spec", "型号", "Model"]
        settle_keywords = ["结算", "Settle", "已结", "收款", "received", "HadPayAmount"]
        unsettle_keywords = ["未结", "未结算", "NoSettle", "UnSettle", "Remain", "Left", "未收"]
        cust_keywords = ["客户", "Cust", "ContactUnit", "往来单位"]
        amount_keywords = ["金额", "Amount", "价税", "AllAmount", "Total"]
        date_keywords = ["日期", "Date", "单据日期"]
        bill_type_keywords = ["SETACCOUNT", "立账类型", "立账", "单据类型", "BillType"]
        saler_keywords = ["业务员", "销售员", "Saler", "SalesMan", "销售人员", "SalerId"]
        status_keywords = ["核销", "WriteOff", "WrittenOff", "核销状态", "WRITTENOFF"]
        open_amount_keywords = ["OpenAmount", "开票核销金额"]

        # 解包金蝶标准 Result 包装
        if isinstance(meta_data, dict) and "Result" in meta_data:
            inner = meta_data["Result"]
            if isinstance(inner, dict):
                if "Result" in inner:
                    inner = inner["Result"]
                elif "ResponseStatus" in inner:
                    inner = {k: v for k, v in inner.items() if k != "ResponseStatus"}
                meta_data = inner

            # 继续解包 NeedReturnData（AR_receivable 元数据嵌套在 Result > NeedReturnData 中）
            if isinstance(meta_data, dict) and "NeedReturnData" in meta_data:
                meta_data = meta_data["NeedReturnData"]
                logger.info(f"[KingdeeArOverdue] 解包 NeedReturnData 后 keys={list(meta_data.keys())}")
                # 探查 Entrys 结构
                if "Entrys" in meta_data:
                    entrys = meta_data["Entrys"]
                    if isinstance(entrys, list) and len(entrys) > 0:
                        entry0 = entrys[0] if isinstance(entrys[0], dict) else {}
                        logger.info(f"[KingdeeArOverdue] Entrys[0] type={type(entrys[0]).__name__}, keys={list(entry0.keys())}")
                        # 打印关键子字段
                        for ek in entry0.keys():
                            ev = entry0[ek]
                            if isinstance(ev, list) and len(ev) > 0:
                                logger.info(f"[KingdeeArOverdue]   Entrys[0].{ek} 是列表, len={len(ev)}, 元素类型={type(ev[0]).__name__}")
                                if isinstance(ev[0], dict):
                                    logger.info(f"[KingdeeArOverdue]   Entrys[0].{ek}[0] keys={list(ev[0].keys())[:20]}")
                    else:
                        logger.info(f"[KingdeeArOverdue] Entrys 非预期结构: type={type(entrys)}, entrys={entrys}")

        # 诊断打印前3个字段的 FieldName/PropertyName 实际值
        if "Entrys" in meta_data:
            entrys = meta_data["Entrys"]
            if isinstance(entrys, list) and len(entrys) > 0 and isinstance(entrys[0], dict):
                fields_list = entrys[0].get("Fields", [])
                if isinstance(fields_list, list):
                    for idx, f_item in enumerate(fields_list[:5]):
                        if isinstance(f_item, dict):
                            raw_name = f_item.get("FieldName", "N/A")
                            raw_prop = f_item.get("PropertyName", "N/A")
                            raw_key = f_item.get("Key", "N/A")
                            logger.info(f"[KingdeeArOverdue]   Fields[{idx}] FieldName={raw_name!r} PropertyName={raw_prop!r} Key={raw_key!r}")

        # 重新诊断元数据解包后的结构
        if isinstance(meta_data, dict):
            logger.info(f"[KingdeeArOverdue] 解包后元数据keys={list(meta_data.keys())}, "
                        f"fields_key_exists={'fields' in meta_data}, "
                        f"Field_key_exists={'Field' in meta_data}")

        # 查找表体实体名
        entities = meta_data.get("SubHeadEntity", meta_data.get("SubEntity", meta_data.get("Entity", [])))
        if isinstance(entities, list):
            for ent in entities:
                eid = str(ent.get("id", "") or ent.get("Id", "") or ent.get("name", "") or "")
                if "ENTRY" in eid.upper() or "RECEIVEBILL" in eid.upper() or "RECEIVABLE" in eid.upper():
                    entity_field = eid
                    break

        fields = self._extract_fields(meta_data)
        if not isinstance(fields, list):
            # _extract_fields 失败，应用兜底
            due_field = fallback_defaults.get("due", "")
            material_field = fallback_defaults.get("material", "")
            spec_field = fallback_defaults.get("spec", "")
            settle_field = fallback_defaults.get("settle", "")
            unsettle_field = fallback_defaults.get("unsettle", "")
            cust_field = fallback_defaults.get("cust", "")
            amount_field = fallback_defaults.get("amount", "")
            bill_type_field = fallback_defaults.get("bill_type", "")
            saler_field = fallback_defaults.get("saler", "")
            status_field = fallback_defaults.get("status", "")
            open_amount_field = fallback_defaults.get("open_amount", "")
            return (due_field, material_field, spec_field, settle_field, unsettle_field,
                    cust_field, amount_field, billno_field, date_field, bill_type_field, entity_field,
                    saler_field, status_field, open_amount_field)

        field_ids = []
        for f in fields:
            # Fields 列表中：FieldName="FBillNo", Name=[{Key:2052,Value:"单据编号"}]
            # 优先取 FieldName/PropertyName（真正的金蝶字段标识），Name 是多语言结构
            fid = str(f.get("FieldName", "") or f.get("PropertyName", "") or f.get("fieldName", "")
                      or f.get("id", "") or f.get("Id", "") or f.get("name", "")
                      or f.get("Name", "") or "")
            flabel = str(f.get("label", "") or f.get("Label", "") or f.get("Name", "")
                         or f.get("name", "") or "")
            field_ids.append({"id": fid, "label": flabel})

        discovered_ids = {fi["id"] for fi in field_ids if fi["id"]}

        # 评分匹配：遍历所有字段，为每个类别选出分值最高的字段
        field_results = {
            "due": {"score": 0, "value": ""},
            "material": {"score": 0, "value": ""},
            "spec": {"score": 0, "value": ""},
            "settle": {"score": 0, "value": ""},
            "unsettle": {"score": 0, "value": ""},
            "cust": {"score": 0, "value": ""},
            "amount": {"score": 0, "value": ""},
            "date": {"score": 0, "value": ""},
            "bill_type": {"score": 0, "value": ""},
            "saler": {"score": 0, "value": ""},
            "status": {"score": 0, "value": ""},
            "open_amount": {"score": 0, "value": ""},
        }
        kw_map = {
            "due": due_keywords, "material": material_keywords, "spec": spec_keywords,
            "settle": settle_keywords, "unsettle": unsettle_keywords, "cust": cust_keywords,
            "amount": amount_keywords, "date": date_keywords, "bill_type": bill_type_keywords,
            "saler": saler_keywords, "status": status_keywords, "open_amount": open_amount_keywords,
        }
        for fi in field_ids:
            fid = fi["id"]
            flabel = fi["label"]
            if not fid:
                continue
            for key, keywords in kw_map.items():
                # open_amount 类别跳过名称含 STATUS/QTY 的字段，避免匹配状态/数量字段
                if key == "open_amount" and ("STATUS" in fid.upper() or "QTY" in fid.upper()):
                    continue
                # settle 类别跳过含 ORGID 的字段（组织ID字段，不是金额字段）
                if key == "settle" and "ORGID" in fid.upper():
                    continue
                score = self._score_match(fid, flabel, keywords)
                if score > field_results[key]["score"]:
                    field_results[key]["score"] = score
                    field_results[key]["value"] = fid

        due_field = field_results["due"]["value"]
        material_field = field_results["material"]["value"]
        spec_field = field_results["spec"]["value"]
        settle_field = field_results["settle"]["value"]
        unsettle_field = field_results["unsettle"]["value"]
        cust_field = field_results["cust"]["value"]
        amount_field = field_results["amount"]["value"]
        date_field = field_results["date"]["value"]
        bill_type_field = field_results["bill_type"]["value"]
        saler_field = field_results["saler"]["value"]
        status_field = field_results["status"]["value"]
        open_amount_field = field_results["open_amount"]["value"]

        # 诊断：匹配到的 open_amount、status 字段详情
        logger.info(f"[KingdeeArOverdue] open_amount 关键字匹配结果: score={field_results['open_amount']['score']}, "
                     f"value={field_results['open_amount']['value']!r}")
        logger.info(f"[KingdeeArOverdue] status 关键字匹配结果: score={field_results['status']['score']}, "
                     f"value={field_results['status']['value']!r}")
        logger.info(f"[KingdeeArOverdue] discovered_ids (前40个)={list(discovered_ids)[:40]}")
        logger.info(f"[KingdeeArOverdue] FALLAMOUNTFOR 是否在 discovered_ids 中: {'FALLAMOUNTFOR' in discovered_ids}")
        logger.info(f"[KingdeeArOverdue] 所有包含 'OPEN' 的字段: {[f for f in discovered_ids if 'OPEN' in f.upper()]}")
        logger.info(f"[KingdeeArOverdue] 所有包含 'AMOUNT' 或 'AMT' 的字段: {[f for f in discovered_ids if 'AMOUNT' in f.upper() or 'AMT' in f.upper()]}")

        # === 补充实体引用字段的子属性路径 ===
        # 元数据 FieldName 返回基础名（如 FMaterialId），但实体展开后的键名是 FMaterialId.FName
        # 后处理：将无点号的实体引用字段转换为带子属性的路径
        if material_field and '.' not in material_field:
            material_field = material_field + ".FName"
            logger.info(f"[KingdeeArOverdue] material 字段补充后缀: {material_field}")
        if spec_field and '.' not in spec_field:
            # 规格字段从物料字段的基对象派生
            base = material_field.rsplit('.', 1)[0] if '.' in material_field else (material_field or "FMaterialId")
            spec_field = base + ".FSpecification"
            logger.info(f"[KingdeeArOverdue] spec 字段从物料基({base})补充后缀: {spec_field}")

        # 补充销售员字段的子属性路径
        if saler_field and '.' not in saler_field:
            saler_field = saler_field + ".FName"
            logger.info(f"[KingdeeArOverdue] saler 字段补充后缀: {saler_field}")

        # 对未从元数据匹配到的字段，应用兜底值
        if not due_field:
            due_field = fallback_defaults.get("due", "")
            logger.info(f"[KingdeeArOverdue] due 未从元数据匹配到，使用兜底: {due_field}")
        if not material_field:
            material_field = fallback_defaults.get("material", "")
        if not spec_field:
            spec_field = fallback_defaults.get("spec", "")
        if not settle_field:
            settle_field = fallback_defaults.get("settle", "")
            logger.info(f"[KingdeeArOverdue] settle 未从元数据匹配到，使用兜底: {settle_field}")
        if not unsettle_field:
            unsettle_field = fallback_defaults.get("unsettle", "")
            logger.info(f"[KingdeeArOverdue] unsettle 未从元数据匹配到，使用兜底: {unsettle_field}")
        if not cust_field:
            cust_field = fallback_defaults.get("cust", "")
            logger.info(f"[KingdeeArOverdue] cust 未从元数据匹配到，使用兜底: {cust_field}")
        if not amount_field:
            amount_field = fallback_defaults.get("amount", "")
            logger.info(f"[KingdeeArOverdue] amount 未从元数据匹配到，使用兜底: {amount_field}")
        if not bill_type_field:
            bill_type_field = fallback_defaults.get("bill_type", "")
            logger.info(f"[KingdeeArOverdue] bill_type 未从元数据匹配到，使用兜底: {bill_type_field}")
        if not saler_field:
            saler_field = fallback_defaults.get("saler", "")
            logger.info(f"[KingdeeArOverdue] saler 未从元数据匹配到，使用兜底: {saler_field}")
        if not status_field:
            status_field = fallback_defaults.get("status", "")
            logger.info(f"[KingdeeArOverdue] status 未从元数据匹配到，使用兜底: {status_field}")
        if not open_amount_field:
            open_amount_field = fallback_defaults.get("open_amount", "")
            logger.info(f"[KingdeeArOverdue] open_amount 未从元数据匹配到，使用兜底: {open_amount_field}")

        # 验证：使用兜底的字段如果在元数据中不存在，清空（否则金蝶API因字段无效返回空）
        check_fallbacks = {
            "settle": settle_field, "unsettle": unsettle_field,
            "due": due_field, "amount": amount_field,
            "cust": cust_field, "bill_type": bill_type_field,
            "material": material_field, "spec": spec_field,
            "saler": saler_field, "status": status_field,
            "open_amount": open_amount_field,
        }
        for name, val in check_fallbacks.items():
            # 只检查金蝶字段名（以F开头的），非 F 开头的如实体名等跳过
            if not val or not val.startswith("F") or '.' in val or val in discovered_ids:
                continue
            logger.info(f"[KingdeeArOverdue] 清除不存在的元数据字段 {name}={val}")
            if name == "due":
                due_field = ""
            elif name == "material":
                material_field = ""
            elif name == "spec":
                spec_field = ""
            elif name == "settle":
                settle_field = ""
            elif name == "unsettle":
                unsettle_field = ""
            elif name == "cust":
                cust_field = ""
            elif name == "amount":
                amount_field = ""
            elif name == "bill_type":
                bill_type_field = ""
            elif name == "saler":
                saler_field = ""
            elif name == "status":
                status_field = ""
            elif name == "open_amount":
                open_amount_field = ""

        # 诊断日志：打印所有发现的字段
        logger.info(f"[KingdeeArOverdue] AR_receivable 全部字段列表({len(field_ids)}个): "
                     f"{json.dumps(field_ids, ensure_ascii=False)}")
        logger.info(f"[KingdeeArOverdue] 字段发现结果: due={due_field}, material={material_field}, "
                     f"spec={spec_field}, settle={settle_field}, unsettle={unsettle_field}, "
                     f"cust={cust_field}, amount={amount_field}, date={date_field}, "
                     f"bill_type={bill_type_field}, saler={saler_field}, status={status_field}, "
                     f"open_amount={open_amount_field}, entity={entity_field}")
        return (due_field, material_field, spec_field, settle_field, unsettle_field,
                cust_field, amount_field, billno_field, date_field, bill_type_field, entity_field,
                saler_field, status_field, open_amount_field)

    def _expand_entity_rows(self, rows, entity_field):
        """展开表体实体嵌套数据。如果某字段值是列表（表体实体），展开成多行。"""
        expanded = []
        for row in rows:
            if not isinstance(row, dict):
                expanded.append(row)
                continue
            # 查找实体数据
            entity_items = None
            if entity_field:
                val = row.get(entity_field)
                if isinstance(val, list):
                    entity_items = val
            if not entity_items:
                # 尝试找任何列表值字段作为实体
                for k, v in row.items():
                    if isinstance(v, list) and len(v) > 0:
                        entity_items = v
                        break
            if entity_items:
                # 表头字段（非列表值的字段）
                header = {k: v for k, v in row.items() if not isinstance(v, list)}
                for entity_item in entity_items:
                    if isinstance(entity_item, dict):
                        new_row = dict(header)
                        # 扁平化嵌套对象（如 FMaterialId: {FName: "A"} → FMaterialId.FName: "A"）
                        for ek, ev in entity_item.items():
                            if isinstance(ev, dict):
                                for sub_k, sub_v in ev.items():
                                    new_row[f"{ek}.{sub_k}"] = sub_v
                            else:
                                new_row[ek] = ev
                        expanded.append(new_row)
            else:
                expanded.append(row)
        return expanded

    def _get_risk_stage(self, overdue_days):
        """按逾期天数映射风险阶段"""
        if overdue_days <= 0:
            return "预警"
        elif overdue_days <= 30:
            return "早期"
        elif overdue_days <= 60:
            return "中期"
        elif overdue_days <= 90:
            return "重度"
        elif overdue_days <= 180:
            return "危险"
        else:
            return "坏账"

    def _calculate_overdue(self, bills, search_keyword):
        """核心统计分析。
        bills 是已预处理的字典列表（含 _amount, _unsettle, _due_date, _saler 等键）。
        """
        today = datetime.datetime.now().date()
        total_amount = 0.0
        total_count = 0
        total_settle = 0.0
        total_open_amount = 0.0
        overdue_count = 0
        overdue_days_list = []

        # 账龄分段（4段，仅统计逾期单据）
        aging_buckets = {
            "轻度": {"amount": 0.0, "count": 0, "range": "0-30天", "risk_desc": "正常催收"},
            "中度": {"amount": 0.0, "count": 0, "range": "31-90天", "risk_desc": "密切关注"},
            "危险": {"amount": 0.0, "count": 0, "range": "91-180天", "risk_desc": "重点跟进"},
            "可能坏账": {"amount": 0.0, "count": 0, "range": ">180天", "risk_desc": "法务介入"},
        }

        # 跟进阶段汇总（6阶段，全部单据）
        risk_stage_map = {
            "预警": {"count": 0, "amount": 0.0},
            "早期": {"count": 0, "amount": 0.0},
            "中期": {"count": 0, "amount": 0.0},
            "重度": {"count": 0, "amount": 0.0},
            "危险": {"count": 0, "amount": 0.0},
            "坏账": {"count": 0, "amount": 0.0},
        }

        # 业务员汇总
        saler_map = {}  # saler → {count, amount, settle, open_amount, days_list}
        distinct_salers = set()

        # 客户排行
        customer_map = {}  # customer → {amount, count, max_days, days_list}

        # 明细行
        detail_rows = []

        for b in bills:
            due_date = b.get("_due_date")
            overdue_days = b.get("_overdue_days", 0)
            amt = b.get("_amount", 0) or 0
            unsettle = b.get("_unsettle", 0) or 0  # 未结算金额
            settle = b.get("_settle", 0) or 0
            open_amount = b.get("_open_amount", 0) or 0  # 已开票核销金额
            customer = b.get("_customer", "")
            bill_no = b.get("_bill_no", "")
            bill_date = b.get("_date", "")
            due_str = b.get("_due_str", "")
            saler = b.get("_saler", "未分配")

            if search_keyword and search_keyword not in customer and search_keyword not in bill_no:
                continue

            total_amount += amt
            total_settle += settle
            total_open_amount += open_amount
            total_count += 1

            if saler:
                distinct_salers.add(saler)

            risk_stage = self._get_risk_stage(overdue_days)

            # 用已开票核销金额作为账龄基数
            aging_amt = open_amount if open_amount > 0 else 0

            # 跟进阶段汇总（全部单据，6阶段）
            if risk_stage in risk_stage_map:
                risk_stage_map[risk_stage]["count"] += 1
                risk_stage_map[risk_stage]["amount"] += aging_amt

            # 账龄分段（4段，仅逾期天数>0的单据）
            if overdue_days > 0:
                overdue_count += 1
                overdue_days_list.append(overdue_days)
                if overdue_days <= 30:
                    aging_buckets["轻度"]["amount"] += aging_amt
                    aging_buckets["轻度"]["count"] += 1
                elif overdue_days <= 90:
                    aging_buckets["中度"]["amount"] += aging_amt
                    aging_buckets["中度"]["count"] += 1
                elif overdue_days <= 180:
                    aging_buckets["危险"]["amount"] += aging_amt
                    aging_buckets["危险"]["count"] += 1
                else:
                    aging_buckets["可能坏账"]["amount"] += aging_amt
                    aging_buckets["可能坏账"]["count"] += 1

                # 客户排行（仅逾期单据）
                if customer not in customer_map:
                    customer_map[customer] = {
                        "overdue_amount": 0.0, "overdue_count": 0,
                        "max_days": 0, "avg_days": 0, "days_list": [],
                    }
                customer_map[customer]["overdue_amount"] += aging_amt
                customer_map[customer]["overdue_count"] += 1
                if overdue_days > customer_map[customer]["max_days"]:
                    customer_map[customer]["max_days"] = overdue_days
                customer_map[customer]["days_list"].append(overdue_days)

            # 业务员汇总
            if saler not in saler_map:
                saler_map[saler] = {"count": 0, "amount": 0.0, "settle": 0.0,
                                    "open_amount": 0.0, "days_list": []}
            saler_map[saler]["count"] += 1
            saler_map[saler]["amount"] += amt
            saler_map[saler]["settle"] += settle
            saler_map[saler]["open_amount"] += open_amount
            if overdue_days > 0:
                saler_map[saler]["days_list"].append(overdue_days)

            # 明细行（10列，移除物料、规格、已结算、状态）
            detail_rows.append({
                "bill_no": bill_no,
                "customer": customer,
                "saler": saler,
                "date": bill_date,
                "due_date": due_str,
                "amount": round(amt, 2),
                "open_amount": round(open_amount, 2),
                "settle": round(settle, 2),
                "overdue_days": overdue_days,
                "risk_stage": risk_stage,
            })

        # 计算 KPI（5项，移除资金缺口等）
        settle_rate = round(total_settle / total_amount * 100, 1) if total_amount > 0 else 0
        saler_count = len(distinct_salers)

        # 账龄分布 → 列表（仅逾期单据，4段）
        aging_total_amount = sum(v["amount"] for v in aging_buckets.values())
        aging_list = []
        aging_order = ["轻度", "中度", "危险", "可能坏账"]
        for bucket_name in aging_order:
            data = aging_buckets[bucket_name]
            pct = round(data["amount"] / aging_total_amount * 100, 1) if aging_total_amount > 0 else 0
            aging_list.append({
                "bucket": bucket_name,
                "range": data["range"],
                "amount": round(data["amount"], 2),
                "count": data["count"],
                "pct": pct,
                "risk_desc": data["risk_desc"],
            })

        # 跟进阶段汇总 → 列表（6阶段，全部单据）
        risk_stage_summary = []
        stage_order = ["预警", "早期", "中期", "重度", "危险", "坏账"]
        for stage in stage_order:
            data = risk_stage_map[stage]
            risk_stage_summary.append({
                "stage": stage,
                "count": data["count"],
                "amount": round(data["amount"], 2),
            })

        # 业务员汇总
        total_gap = 0.0
        saler_summary = []
        for saler, data in saler_map.items():
            rate = round(data["settle"] / data["amount"] * 100, 1) if data["amount"] > 0 else 0
            # 资金缺口 = 应回款金额 × (0.75 - 回款达成率)
            gap = max(0, (0.75 - rate / 100) * data["amount"])
            total_gap += gap
            avg_d = round(sum(data["days_list"]) / len(data["days_list"]), 1) if data["days_list"] else 0
            max_d = max(data["days_list"]) if data["days_list"] else 0
            saler_summary.append({
                "saler": saler,
                "count": data["count"],
                "amount": round(data["amount"], 2),
                "settle": round(data["settle"], 2),
                "open_amount": round(data["open_amount"], 2),
                "rate": rate,
                "avg_days": avg_d,
                "max_days": max_d,
                "gap": round(gap, 2),
            })
        # 按已开票核销金额降序
        saler_summary.sort(key=lambda x: x["open_amount"], reverse=True)

        # 业务员汇总底部额外2行
        total_saler_amount = sum(s["amount"] for s in saler_summary)
        total_gap_rate = round(total_gap / total_saler_amount, 4) if total_saler_amount > 0 else 0
        saler_total = {
            "total_gap_rate": total_gap_rate,
            "total_gap": round(total_gap, 2),
        }

        # 客户排行
        customer_ranking = []
        for cust, data in customer_map.items():
            avg_d = round(sum(data["days_list"]) / len(data["days_list"]), 1) if data["days_list"] else 0
            customer_ranking.append({
                "customer": cust,
                "overdue_amount": round(data["overdue_amount"], 2),
                "overdue_count": data["overdue_count"],
                "max_days": data["max_days"],
                "avg_days": avg_d,
            })
        customer_ranking.sort(key=lambda x: x["overdue_amount"], reverse=True)
        customer_ranking = customer_ranking[:20]

        # 明细排序：按逾期天数降序
        detail_rows.sort(key=lambda x: x["overdue_days"], reverse=True)

        # 标记是否有更多数据
        has_more = len(bills) >= 2000

        return {
            "kpi": {
                "total_count": total_count,
                "open_amount": round(total_open_amount, 2),
                "settle_rate": settle_rate,
                "overdue_count": overdue_count,
                "saler_count": saler_count,
            },
            "aging": aging_list,
            "risk_stage_summary": risk_stage_summary,
            "customer_ranking": customer_ranking,
            "detail_rows": detail_rows,
            "saler_summary": saler_summary,
            "saler_total": saler_total,
            "has_more": has_more,
        }

    def _extract_fields(self, meta_data):
        """从元数据中提取字段列表"""
        if not isinstance(meta_data, dict):
            return []
        if "fields" in meta_data:
            return meta_data["fields"]
        if "Field" in meta_data:
            return meta_data["Field"]
        for v in meta_data.values():
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict) and "name" in v[0]:
                return v
        # 尝试从 Entrys 结构中提取字段（AR_receivable 元数据字段在 Entrys[i].Fields 中）
        if "Entrys" in meta_data:
            entrys = meta_data["Entrys"]
            if isinstance(entrys, list):
                for entry in entrys:
                    if isinstance(entry, dict):
                        for field_key in ["Fields", "EntryFields", "Field", "fields"]:
                            if field_key in entry and isinstance(entry[field_key], list):
                                if len(entry[field_key]) > 0:
                                    return entry[field_key]
        return []

    def _normalize_rows(self, result):
        if result.status != "success" or not result.result:
            return []
        raw = result.result
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                pass
        rows = raw
        if isinstance(rows, dict):
            rows = rows.get("rows", rows.get("data", rows.get("result", [])))
            if isinstance(rows, dict):
                rows = [rows]
        if not isinstance(rows, list):
            rows = [rows] if rows else []
        return rows

    def _get_str(self, row, key, default=""):
        val = row.get(key) if isinstance(row, dict) else None
        if val is None:
            return default
        return str(val).strip()

    def _get_float(self, row, key, default=0.0):
        val = row.get(key) if isinstance(row, dict) else None
        if val is None:
            return default
        try:
            return float(val)
        except (ValueError, TypeError):
            return default

    # ─── 服务端 Excel 导出（供企微内置浏览器使用）───

    def _export_as_excel(self, data, export_mode):
        from io import BytesIO
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from urllib.parse import quote

        wb = openpyxl.Workbook()

        header_font = Font(bold=True, size=11, color="FFFFFF")
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
        thin_border = Border(
            left=Side(style='thin'), right=Side(style='thin'),
            top=Side(style='thin'), bottom=Side(style='thin'),
        )

        def _write_header(ws, headers):
            for col_idx, h in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col_idx, value=h)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = header_align
                cell.border = thin_border

        def _write_row(ws, row_idx, data_row):
            for col_idx, val in enumerate(data_row, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=val)
                cell.border = thin_border

        kpi = data.get("kpi", {})
        aging = data.get("aging", [])
        cust_rank = data.get("customer_ranking", [])
        detail = data.get("detail_rows", [])
        saler_summary = data.get("saler_summary", [])
        saler_total = data.get("saler_total", {})
        risk_stage_summary = data.get("risk_stage_summary", [])

        if export_mode == "detail":
            # Sheet 1: 逾期明细（9列）
            ws1 = wb.active
            ws1.title = "逾期明细"
            headers1 = ["单据编号", "单据日期", "到期日", "客户", "业务员",
                        "价税合计(¥)", "已开票核销金额(¥)", "逾期天数", "风险阶段"]
            _write_header(ws1, headers1)
            for i, r in enumerate(detail, 2):
                _write_row(ws1, i, [
                    r.get("bill_no", ""), r.get("date", ""), r.get("due_date", ""),
                    r.get("customer", ""), r.get("saler", ""),
                    r.get("amount", 0), r.get("open_amount", 0),
                    r.get("overdue_days", 0), r.get("risk_stage", ""),
                ])

            # Sheet 2: 业务员回款汇总（9列 + 底部2行）
            if saler_summary:
                ws_saler = wb.create_sheet("业务员回款汇总")
                headers_saler = ["业务员", "笔数", "应回款金额(¥)", "已结算金额(¥)", "已开票核销金额(¥)",
                                 "回款达成率(%)", "平均逾期天数", "最大逾期天数", "资金缺口(¥)"]
                _write_header(ws_saler, headers_saler)
                for i, s in enumerate(saler_summary, 2):
                    _write_row(ws_saler, i, [
                        s.get("saler", ""), s.get("count", 0),
                        s.get("amount", 0), s.get("settle", 0), s.get("open_amount", 0),
                        s.get("rate", 0), s.get("avg_days", 0), s.get("max_days", 0),
                        s.get("gap", 0),
                    ])
                # 底部额外汇总行
                total_row_idx = len(saler_summary) + 2
                ws_saler.cell(row=total_row_idx, column=1, value="整体缺口率").border = thin_border
                ws_saler.cell(row=total_row_idx, column=2, value=saler_total.get("total_gap_rate", 0)).border = thin_border
                ws_saler.cell(row=total_row_idx + 1, column=1, value="总资金缺口").border = thin_border
                ws_saler.cell(row=total_row_idx + 1, column=2, value=saler_total.get("total_gap", 0)).border = thin_border

            # Sheet 3: 客户逾期汇总
            if cust_rank:
                ws2 = wb.create_sheet("客户逾期汇总")
                headers2 = ["客户", "逾期金额(¥)", "逾期笔数", "最长逾期天数", "平均逾期天数"]
                _write_header(ws2, headers2)
                for i, c in enumerate(cust_rank, 2):
                    _write_row(ws2, i, [
                        c.get("customer", ""), c.get("overdue_amount", 0),
                        c.get("overdue_count", 0), c.get("max_days", 0),
                        c.get("avg_days", 0),
                    ])

            # Sheet 4: KPI 概览（5项）
            ws3 = wb.create_sheet("KPI概览")
            ws3.cell(row=1, column=1, value="指标").font = header_font
            ws3.cell(row=1, column=1).fill = header_fill
            ws3.cell(row=1, column=2, value="值").font = header_font
            ws3.cell(row=1, column=2).fill = header_fill
            overview = [
                ("已开票核销金额(¥)", kpi.get("open_amount", 0)),
                ("回款达成率(%)", kpi.get("settle_rate", 0)),
                ("逾期笔数", kpi.get("overdue_count", 0)),
                ("涉及业务员数", kpi.get("saler_count", 0)),
                ("总单据数", kpi.get("total_count", 0)),
            ]
            for i, (k, v) in enumerate(overview, 2):
                ws3.cell(row=i, column=1, value=k).border = thin_border
                ws3.cell(row=i, column=2, value=v).border = thin_border

            # Sheet 5: 账龄分布（4段）
            if aging:
                ws_aging = wb.create_sheet("账龄分布")
                _write_header(ws_aging, ["程度", "区间", "笔数", "金额(¥)", "占比(%)", "风险说明"])
                for i, a in enumerate(aging, 2):
                    _write_row(ws_aging, i, [
                        a.get("bucket", ""), a.get("range", ""), a.get("count", 0),
                        a.get("amount", 0), a.get("pct", 0), a.get("risk_desc", ""),
                    ])

            # Sheet 6: 跟进阶段汇总
            if risk_stage_summary:
                ws_stage = wb.create_sheet("跟进阶段汇总")
                _write_header(ws_stage, ["风险阶段", "笔数", "金额(¥)"])
                for i, s in enumerate(risk_stage_summary, 2):
                    _write_row(ws_stage, i, [
                        s.get("stage", ""), s.get("count", 0), s.get("amount", 0),
                    ])

        elif export_mode == "summary":
            ws = wb.active
            ws.title = "客户逾期汇总"
            headers = ["客户", "逾期金额(¥)", "逾期笔数", "最长逾期天数", "平均逾期天数"]
            _write_header(ws, headers)
            for i, c in enumerate(cust_rank, 2):
                _write_row(ws, i, [
                    c.get("customer", ""), c.get("overdue_amount", 0),
                    c.get("overdue_count", 0), c.get("max_days", 0),
                    c.get("avg_days", 0),
                ])

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        file_name = "逾期统计_{}.xlsx".format(
            datetime.datetime.now().strftime("%Y-%m-%d"),
        )
        web.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        web.header('Content-Disposition', "attachment; filename*=UTF-8''{}".format(quote(file_name)))
        return output.getvalue()


# =========================================================================
# 金蝶数据分析页面 · 后端 Handler
# 说明：
#   - 模板/固定报表：提供模板配置与看板指令（不直接聚合数据）
#   - 对话：AnalysisChatHandler 通过 override_user_id 注入真实企微 userid，
#     使金蝶权限按企微用户生效（复用 WebChannel.post_message 链路）
# =========================================================================

# 内置数据分析模板（v1.0 · 5 个）
# required_forms: 模板依赖的金蝶表单，用户缺任一表单则模板锁定
ANALYSIS_TEMPLATES = [
    {
        "id": "sales_daily",
        "name": "销售经营日报",
        "icon": "📈",
        "description": "销售额 KPI、销售趋势、客户排行、部门占比",
        "required_forms": ["SAL_SaleOrder"],
        "metric_definition": "销售金额 = 已审核订单(SAL_SaleOrder, 状态C)含税合计",
    },
    {
        "id": "product_line",
        "name": "产品线销售分析",
        "icon": "🏭",
        "description": "各产品线销售额 KPI、销售趋势、产品线占比、产品排行",
        "required_forms": ["SAL_SaleOrder", "BD_MATERIAL"],
        "metric_definition": "销售金额 = 已审核订单含税合计；产品线 = 物料档案分类",
    },
    {
        "id": "customer_sales",
        "name": "客户销售分析",
        "icon": "🏆",
        "description": "Top客户、客户分布、转化率、复购率、流失预警",
        "required_forms": ["SAL_SaleOrder", "BD_Customer"],
        "metric_definition": "销售金额 = 已审核订单含税合计；按客户维度聚合",
    },
    {
        "id": "ar_overdue",
        "name": "应收账款分析",
        "icon": "💰",
        "description": "逾期金额 KPI、账龄分布、逾期客户排行、到期预警",
        "required_forms": ["AR_receivable"],
        "metric_definition": "逾期金额 = AR_receivable 财务应收超期未结金额",
    },
    {
        "id": "outstock",
        "name": "出库数据分析",
        "icon": "📦",
        "description": "出库量 KPI、出库趋势、出库品类分布、出库区域排行",
        "required_forms": ["SAL_OUTSTOCK"],
        "metric_definition": "出库量 = 销售出库单(SAL_OUTSTOCK)已审核出库数量",
    },
    {
        "id": "conversion",
        "name": "样品单/报价单分析",
        "icon": "🔁",
        "description": "样品单/报价单→销售订单转化统计、按客户转化率、转化金额",
        "required_forms": ["SAL_SaleOrder", "SAL_QUOTATION"],
        "metric_definition": "样品单/报价单转化率 = 已转化为销售订单的单据数 / 样品单+报价单总数；转化金额 = 由样品/报价转化的销售订单含税金额（参考看板'转化统计'逻辑：按客户+物料+规格+含税单价+日期先后匹配）",
    },
]



def _analysis_template_brief(t):
    """返回模板对外展示的最小字段（不泄露内部口径细节）。"""
    return {
        "id": t["id"],
        "name": t["name"],
        "icon": t["icon"],
        "description": t["description"],
        "required_forms": t["required_forms"],
        "metric_definition": t["metric_definition"],
    }


def _user_has_forms(userid: str, form_ids) -> bool:
    """判断用户是否拥有 form_ids 中所有表单权限（管理员/未启用权限时视为全权）。

    表单权限集合的 key 保留原始大小写（如 SAL_SaleOrder），因此用大小写不敏感比较。
    """
    from common.permission_checker import get_kingdee_form_access
    form_access = get_kingdee_form_access(userid)
    if form_access is None:
        # 不限（权限未启用 / 管理员 / 超级账户）
        return True
    access_lower = {f.lower() for f in form_access}
    for fid in form_ids:
        if fid.lower() not in access_lower:
            return False
    return True


def _analysis_agent_available() -> bool:
    """检测是否注册了专用 kingdee-analysis 智能体。

    未注册时前端回退默认 agent（功能仍可用，只是没有金蝶专用人设）。
    """
    try:
        from agent.registry import get_agent_registry
        get_agent_registry().get("kingdee-analysis")
        return True
    except Exception:
        return False


def _current_analysis_user():
    """解析当前请求的企微 userid 与金蝶权限。
    返回 (userid, authed, scope, kingdee_allowed)。
    """
    from common.permission_checker import (
        check_kingdee_permission,
        get_kingdee_scope,
        is_permissions_enabled,
    )
    userid, authed, _ = _check_wecom_auth()
    if authed and userid:
        allowed, scope, _ = check_kingdee_permission(userid)
        if not allowed:
            return userid, True, "none", False
        return userid, True, get_kingdee_scope(userid), True
    # 密码管理员 / 未认证 → 全权
    return "session_web_admin", False, "all", True


def _analysis_session_owner(session_id: str, userid: str) -> bool:
    """校验 session_id 是否属于当前请求用户（会话按用户命名空间隔离）。

    会话 id 格式：analysis_{userid}_{时间戳}（时间戳为纯数字）。
    - 企微用户与管理员的 userid 不同 → 会话天然隔离；
    - 仅靠 ``startswith`` 不够：userid 若含下划线（如 ``li_na``），``analysis_li_``
      会让 user ``li`` 误匹配他人的 ``analysis_li_na_…``。因此要求前缀之后剩余段
      **必须为纯数字**，杜绝前缀碰撞（前端始终生成 ``analysis_{userid}_{Date.now()}``）。
    """
    if not session_id or not userid:
        return False
    prefix = f"analysis_{userid}_"
    if not session_id.startswith(prefix):
        return False
    return session_id[len(prefix):].isdigit()


def _analysis_history_store():
    """数据分析会话历史读取库：与 AnalysisChatHandler 写入库保持一致。

    AnalysisChatHandler 经 post_message 在专用 kingdee-analysis 智能体上运行，
    会话消息持久化到该 agent workspace 的 ConversationStore；未注册专用 agent
    时回退默认 agent（默认 store）。历史恢复必须读同一 store，否则读不到。
    """
    from agent.memory.conversation_store import get_conversation_store
    if _analysis_agent_available():
        try:
            from agent.registry import get_agent_registry
            profile = get_agent_registry().get("kingdee-analysis")
            return get_conversation_store(profile.workspace)
        except Exception as e:
            logger.warning(f"[Analysis] resolve kingdee-analysis store failed, fallback default: {e}")
    return get_conversation_store()


class AnalysisContextHandler:
    """数据分析页 · 初始化上下文：返回当前用户身份、金蝶权限、可用模板。"""

    def GET(self):
        _require_auth()
        web.header('Content-Type', 'application/json; charset=utf-8')
        userid, authed, scope, kingdee_allowed = _current_analysis_user()
        available = [
            _analysis_template_brief(t)
            for t in ANALYSIS_TEMPLATES
            if _user_has_forms(userid, t["required_forms"])
        ]
        locked = [
            {"id": t["id"], "name": t["name"], "icon": t["icon"],
             "required_forms": t["required_forms"]}
            for t in ANALYSIS_TEMPLATES
            if not _user_has_forms(userid, t["required_forms"])
        ]
        return json.dumps({
            "status": "success",
            "userid": userid,
            "wecom_authenticated": authed,
            "kingdee_allowed": kingdee_allowed,
            "scope": scope,
            "templates": available,
            "locked_templates": locked,
            # 是否注册了专用 kingdee-analysis 智能体；未注册时前端回退默认 agent（功能仍可用）
            "agent_available": _analysis_agent_available(),
        }, ensure_ascii=False)


class AnalysisTemplateApplyHandler:
    """数据分析页 · 应用模板：返回模板看板指令（由前端作为系统级引导注入 Agent）。

    不直接聚合数据 —— 看板由专用 kingdee-analysis Agent 统一生成。
    """

    def POST(self):
        _require_auth()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            data = web.data()
            json_data = json.loads(data) if data else {}
            template_id = (json_data.get("template_id") or "").strip()
            userid = _get_current_kingdee_userid()
            template = next((t for t in ANALYSIS_TEMPLATES if t["id"] == template_id), None)
            if not template:
                return json.dumps({"status": "error", "message": "模板不存在"})
            if not _user_has_forms(userid, template["required_forms"]):
                return json.dumps({"status": "error", "message": "您没有该模板所需的表单权限"})
            return json.dumps({
                "status": "success",
                "template": _analysis_template_brief(template),
                # 看板指令：作为系统引导注入 agent，对话区不直接展示
                "instruction": (
                    f"请基于金蝶数据生成「{template['name']}」分析看板。"
                    f"指标口径：{template['metric_definition']}。"
                    f"按模板生成：KPI 指标卡、趋势图、排行图、占比图等。"
                    f"每个图表的数据点除主维度/主数值外，尽量附带该维度的主要伴随指标"
                    f"（如订单数、数量、占比、环比；量化指标用数值、占比/环比用带%字符串）；"
                    f"每张图可注明 dimensionLabel（维度名）与分析口径 analysis_meta。"
                    f"排行类默认返回前 10~20 名，便于前端切换显示数量。"
                    f"生成后主动给出 2~3 条下一步分析建议。"
                ),
            }, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[Analysis] apply template error: {e}")
            return json.dumps({"status": "error", "message": str(e)})


class AnalysisChatHandler:
    """数据分析页 · 专用对话端点（关键权限修正）。

    复用 WebChannel.post_message 链路，但通过 override_user_id 传入真实企微
    userid，使 msg.from_user_id = 企微 userid（而非 session_id），从而让
    agent_stream.py:1721 的金蝶权限拦截按企微用户生效。
    """

    def POST(self):
        _require_auth()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            # 注意：不要在此处调用 web.data()（会消耗请求体），
            # post_message 内部会读取 web.data() 解析 message/agent_id/session_id。
            userid, authed, _, kingdee_allowed = _current_analysis_user()
            if not kingdee_allowed:
                return json.dumps({"status": "error", "message": "您没有金蝶查询权限，请联系管理员开通"})

            # 复用 post_message，override_user_id = 真实企微 userid（或 web_admin 全权）。
            # override_agent_id：若专用 kingdee-analysis 未注册，则回退默认 agent，
            # 保证功能开箱即用（后续配置专用 agent 后自动升级为专用人设）。
            override_agent_id = None
            if _analysis_agent_available():
                override_agent_id = "kingdee-analysis"
            result = WebChannel().post_message(
                override_user_id=userid,
                override_agent_id=override_agent_id,
            )
            # post_message 已返回 json 字符串，直接透传
            if isinstance(result, str):
                return result
            return json.dumps(result, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[Analysis] chat error: {e}")
            return json.dumps({"status": "error", "message": str(e)})


class AnalysisHistoryHandler:
    """数据分析页 · 历史会话恢复（复用 ConversationStore 分页返回）。

    权限加固：session_id 已按用户命名空间隔离（analysis_{userid}_），读取前必须
    校验归属——仅允许当前请求用户读取自己前缀的会话，阻断构造他人 session_id
    越权读取历史/看板数据的请求。
    """

    def GET(self):
        _require_auth()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            params = web.input(session_id='', page='1', page_size='20')
            session_id = params.session_id.strip()
            if not session_id:
                return json.dumps({"status": "error", "message": "缺少 session_id"})
            # 归属校验：session_id 必须携带当前请求用户的命名空间前缀
            userid, _authed, _scope, _allowed = _current_analysis_user()
            if not _analysis_session_owner(session_id, userid):
                logger.warning(
                    f"[Analysis] 历史归属校验拒绝: session={session_id!r} user={userid!r}"
                )
                return json.dumps({"status": "error", "message": "无权访问该会话"}, ensure_ascii=False)
            try:
                page = max(1, int(params.page))
            except (ValueError, TypeError):
                page = 1
            try:
                page_size = max(1, min(int(params.page_size), 50))
            except (ValueError, TypeError):
                page_size = 20
            store = _analysis_history_store()
            history = store.load_history_page(session_id, page, page_size)
            return json.dumps({"status": "success", "history": history}, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[Analysis] history error: {e}")
            return json.dumps({"status": "error", "message": str(e)})



class ProjectAnalyzeHandler:
    """接收 Excel 项目文件，解析并分析项目进度。"""
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    def POST(self):
        _require_auth()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            import openpyxl

            params = _raw_web_input()
            file_obj = params.get("file")
            if file_obj is None or not getattr(file_obj, 'filename', ''):
                return json.dumps({"status": "error", "message": "未上传文件"})

            content = _read_uploaded_file_bytes_limited(file_obj, self.MAX_FILE_SIZE)
            if len(content) > self.MAX_FILE_SIZE:
                return json.dumps({"status": "error", "message": "文件大小不能超过 10MB"})

            workspace_root = _get_workspace_root()
            tmp_dir = os.path.join(workspace_root, "tmp")
            os.makedirs(tmp_dir, exist_ok=True)

            filename = getattr(file_obj, "filename", "") or getattr(file_obj, "name", "") or "project.xlsx"
            tmp_path = os.path.join(tmp_dir, "project_upload_" + str(int(time.time())) + "_" + filename)
            with open(tmp_path, "wb") as f:
                f.write(content)

            wb = openpyxl.load_workbook(tmp_path, read_only=True, data_only=True)
            ws = wb.active
            if ws is None:
                wb.close()
                os.remove(tmp_path)
                return json.dumps({"status": "error", "message": "无法读取工作表"})

            rows_iter = ws.iter_rows(values_only=True)
            # 跳过标题行和空行，寻找真正的表头行（支持多级表头合并）
            header_rows = []
            for row in rows_iter:
                processed = [str(h).strip() if h is not None else "" for h in row]
                non_empty = sum(1 for c in processed if c)
                # 跳过标题行（仅少数非空单元格，如标题+说明）和全空行
                if non_empty <= 2:
                    continue
                header_rows.append(processed)
                if len(header_rows) >= 2:
                    break

            # 合并多级表头：子行有值则覆盖父行
            headers = []
            if len(header_rows) >= 2:
                headers = header_rows[0][:]
                for i in range(len(headers)):
                    if i < len(header_rows[1]) and header_rows[1][i]:
                        headers[i] = header_rows[1][i]
            elif len(header_rows) == 1:
                headers = header_rows[0]

            if not headers:
                wb.close()
                os.remove(tmp_path)
                return json.dumps({"status": "error", "message": "Excel 文件为空或表头缺失"})

            col_mapping = self._detect_columns(headers)

            data_rows = []
            for row in rows_iter:
                data_row = []
                for i, cell in enumerate(row):
                    if cell is not None:
                        if isinstance(cell, datetime.datetime):
                            data_row.append(cell.strftime("%Y-%m-%d"))
                        elif isinstance(cell, datetime.date):
                            data_row.append(cell.strftime("%Y-%m-%d"))
                        else:
                            data_row.append(str(cell))
                    else:
                        data_row.append("")
                data_rows.append(data_row)

            wb.close()
            try:
                os.remove(tmp_path)
            except Exception:
                pass

            name_col = col_mapping.get("name_column")
            date_col = col_mapping.get("date_column")
            prog_col = col_mapping.get("progress_column")
            resp_col = col_mapping.get("responsible_column")

            # 检测额外有用列（城市、行业、评级、项目节点、半年度目标、本月目标、行动计划）
            extra_cols = {}
            extra_keywords = {
                "city": ["所在城市", "城市", "地区"],
                "industry": ["行业", "属性"],
                "rating": ["评级", "客户评级", "客户等级"],
                "milestone": ["项目节点", "节点"],
                "halfyear_goal": ["半年度开发目标"],
                "monthly_goal": ["本月开发目标", "本月目标"],
                "action_plan": ["行动计划", "本月行动"],
            }
            for key, keywords in extra_keywords.items():
                for i, h in enumerate(headers):
                    if any(kw.lower() in h.lower().strip() for kw in keywords):
                        extra_cols[key] = i
                        break

            def _get_extra(row, key):
                idx = extra_cols.get(key)
                return row[idx] if idx is not None and idx < len(row) else ""

            stalled = []
            now = datetime.datetime.now()
            stats = {
                "total": len(data_rows),
                "stalled": 0,
                "healthy_rate": 100,
                "no_date_column": date_col is None,
                "no_progress_column": prog_col is None,
                "no_name_column": name_col is None,
            }

            import re as _re

            _DATE_FORMATS = [
                "%Y-%m-%d", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S", "%Y/%m/%d %H:%M:%S",
                "%Y.%m.%d", "%Y年%m月%d日", "%m/%d/%Y", "%d/%m/%Y",
            ]

            def _parse_date(val):
                s = str(val).strip()
                # 1) 标准日期格式
                for fmt in _DATE_FORMATS:
                    try:
                        return datetime.datetime.strptime(s, fmt)
                    except ValueError:
                        pass

                # 2) "M.dd" 格式（例如 "3.16" = 3月16日）
                try:
                    parts = s.split(".")
                    if len(parts) == 2:
                        month, day = int(parts[0]), int(parts[1])
                        if 1 <= month <= 12 and 1 <= day <= 31:
                            return datetime.datetime(now.year, month, day)
                except (ValueError, IndexError):
                    pass

                # 3) Excel 日期序列号（例如 "46152"）
                try:
                    serial = float(s)
                    if 40000 < serial < 200000:
                        return datetime.datetime(1899, 12, 30) + datetime.timedelta(days=serial)
                except (ValueError, TypeError):
                    pass

                # 4) 中文日期格式 "X月X号"（例如 "5月18号"、"3月16号"）
                m = _re.match(r"(\d+)月(\d+)号?", s)
                if m:
                    month, day = int(m.group(1)), int(m.group(2))
                    if 1 <= month <= 12 and 1 <= day <= 31:
                        return datetime.datetime(now.year, month, day)

                # 5) 仅月份 "X月"（例如 "2月"、"3月"，默认当月1号）
                m = _re.match(r"(\d+)月", s)
                if m:
                    month = int(m.group(1))
                    if 1 <= month <= 12:
                        return datetime.datetime(now.year, month, 1)

                return None

            for row in data_rows:
                if date_col is not None and prog_col is not None:
                    date_val = row[date_col] if date_col < len(row) else ""
                    prog_val = row[prog_col] if prog_col < len(row) else "0"
                    if date_val:
                        dt = _parse_date(date_val)
                        if dt:
                            days_diff = (now - dt).days
                            if days_diff > 30 and not self._is_complete(prog_val):
                                stats["stalled"] += 1
                                stalled.append({
                                    "name": row[name_col] if name_col is not None and name_col < len(row) else "",
                                    "owner": row[resp_col] if resp_col is not None and resp_col < len(row) else "",
                                    "days": days_diff,
                                    "progress": prog_val,
                                    "city": _get_extra(row, "city"),
                                    "industry": _get_extra(row, "industry"),
                                    "rating": _get_extra(row, "rating"),
                                    "milestone": _get_extra(row, "milestone"),
                                    "halfyear_goal": _get_extra(row, "halfyear_goal"),
                                    "monthly_goal": _get_extra(row, "monthly_goal"),
                                    "action_plan": _get_extra(row, "action_plan"),
                                })
                elif date_col is not None and prog_col is None:
                    date_val = row[date_col] if date_col < len(row) else ""
                    if date_val:
                        dt = _parse_date(date_val)
                        if dt:
                            days_diff = (now - dt).days
                            if days_diff > 30:
                                stats["stalled"] += 1
                                stalled.append({
                                    "name": row[name_col] if name_col is not None and name_col < len(row) else "",
                                    "owner": row[resp_col] if resp_col is not None and resp_col < len(row) else "",
                                    "days": days_diff,
                                    "progress": None,
                                    "city": _get_extra(row, "city"),
                                    "industry": _get_extra(row, "industry"),
                                    "rating": _get_extra(row, "rating"),
                                    "milestone": _get_extra(row, "milestone"),
                                    "halfyear_goal": _get_extra(row, "halfyear_goal"),
                                    "monthly_goal": _get_extra(row, "monthly_goal"),
                                    "action_plan": _get_extra(row, "action_plan"),
                                })

            if prog_col is not None and not stats["no_progress_column"]:
                total = max(len(data_rows), 1)
                stalled_count = stats["stalled"]
                healthy_count = total - stalled_count
                stats["healthy_rate"] = round(healthy_count / total * 100)

            logger.info(
                f"[ProjectAnalyzeHandler] 解析完成: {stats['total']} 行, "
                f"停滞 {stats['stalled']}, 健康率 {stats['healthy_rate']}%"
            )

            return json.dumps({
                "status": "success",
                "columns": headers,
                "rows": data_rows,
                "stalled": stalled,
                "stats": stats,
                "column_mapping": col_mapping,
            }, ensure_ascii=False)

        except ImportError:
            return json.dumps({"status": "error", "message": "缺少 openpyxl 依赖，请安装: pip install openpyxl"})
        except Exception as e:
            logger.exception(f"[ProjectAnalyzeHandler] {e}")
            return json.dumps({"status": "error", "message": str(e)})

    def _detect_columns(self, headers):
        """自动识别各列含义，返回列索引映射。"""
        mapping = {}
        patterns = {
            "name_column": ["项目名称", "项目", "名称", "project", "项目名", "工程名称", "工程"],
            "progress_column": ["进度", "完成率", "完成度", "progress", "完成比例", "百分比", "完成%"],
            "responsible_column": ["负责人", "责任人", "所有者", "owner", "assignee", "经办人", "项目经理", "执行人"],
            "date_column": ["更新时间", "更新日期", "最后更新", "date", "time", "update", "日期", "创建日期", "创建时间", "完成日期", "填写时间"],
            "status_column": ["状态", "阶段", "status", "state", "当前状态", "项目状态", "阶段状态"],
        }

        for idx, header in enumerate(headers):
            h_lower = header.lower().strip()
            for col_type, keywords in patterns.items():
                if col_type in mapping:
                    continue
                for kw in keywords:
                    if kw.lower() in h_lower:
                        mapping[col_type] = idx
                        break

        return mapping

    @staticmethod
    def _is_complete(prog_val):
        """判断进度值是否表示已完成。"""
        try:
            prog_str = str(prog_val).strip().replace("%", "")
            prog_float = float(prog_str)
            return prog_float >= 100
        except (ValueError, TypeError):
            return False
