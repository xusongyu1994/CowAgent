# encoding:utf-8
"""数据分析后端 Handler 的集成测试。

通过 mock web.py 的请求上下文（web.input/web.data/web.header/web.cookies）
来验证 AnalysisContextHandler / AnalysisTemplateApplyHandler
能正确解析用户身份、权限和模板指令，不依赖真实 HTTP 服务。
"""

import json

import pytest

import web

from channel.web import web_channel as wc


class FakeCtx:
    """模拟 web.ctx 以支持 web.input 等读取。"""

    def __init__(self, data=b"", cookies=None):
        self.data = data
        self.cookies = cookies or {}


@pytest.fixture(autouse=True)
def mock_web_context(monkeypatch):
    ctx = {"_data": b"", "_cookies": {}, "_env": {"HTTP_USER_AGENT": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"}}

    def fake_data():
        return ctx["_data"]

    def fake_input(*args, **kwargs):
        return web.storage(kwargs)

    def fake_header(*args, **kwargs):
        pass

    def fake_cookies():
        return ctx["_cookies"]

    def fake_setcookie(*args, **kwargs):
        ctx["_cookies"] = {args[0]: args[1]}

    monkeypatch.setattr(web, "data", fake_data)
    monkeypatch.setattr(web, "input", fake_input)
    monkeypatch.setattr(web, "header", fake_header)
    monkeypatch.setattr(web, "cookies", fake_cookies)
    monkeypatch.setattr(web, "setcookie", fake_setcookie)
    monkeypatch.setattr(web, "ctx", web.storage(env=ctx["_env"]))
    # 认证默认通过（无密码 / 视为管理员）
    monkeypatch.setattr(wc, "_require_auth", lambda: None)
    monkeypatch.setattr(wc, "_check_wecom_auth", lambda: (None, False, False))
    monkeypatch.setattr(wc, "_check_auth", lambda: True)
    monkeypatch.setattr(wc, "_get_current_kingdee_userid", lambda: "session_web_admin")
    return ctx


def _set_body(ctx, body_dict):
    ctx["_data"] = json.dumps(body_dict).encode("utf-8")


def test_context_handler_returns_templates(mock_web_context, monkeypatch):
    # 默认注册了 kingdee-analysis → agent_available=True
    monkeypatch.setattr(wc, "_analysis_agent_available", lambda: True)
    res = json.loads(wc.AnalysisContextHandler().GET())
    assert res["status"] == "success"
    assert res["userid"] == "session_web_admin"
    assert res["kingdee_allowed"] is True
    assert len(res["templates"]) == 6
    assert len(res["locked_templates"]) == 0
    assert res["agent_available"] is True


def test_apply_template_success(mock_web_context):
    _set_body(mock_web_context, {"template_id": "sales_daily"})
    res = json.loads(wc.AnalysisTemplateApplyHandler().POST())
    assert res["status"] == "success"
    assert res["template"]["name"] == "销售经营日报"
    assert "指标口径" in res["instruction"]


def test_apply_unknown_template_errors(mock_web_context):
    _set_body(mock_web_context, {"template_id": "not_exist"})
    res = json.loads(wc.AnalysisTemplateApplyHandler().POST())
    assert res["status"] == "error"


def test_apply_template_locked_by_permission(mock_web_context, monkeypatch):
    # 用户没有 SAL_SaleOrder 权限 → 模板锁定
    monkeypatch.setattr(
        "common.permission_checker.get_kingdee_form_access",
        lambda uid: {"AR_receivable"},
    )
    _set_body(mock_web_context, {"template_id": "sales_daily"})
    res = json.loads(wc.AnalysisTemplateApplyHandler().POST())
    assert res["status"] == "error"
    assert "权限" in res["message"]


def test_context_handler_wecom_user(mock_web_context, monkeypatch):
    """企微用户访问 → 返回真实 userid + 按表单权限过滤模板。"""
    monkeypatch.setattr(wc, "_check_wecom_auth", lambda: ("zhangsan", True, True))
    monkeypatch.setattr(wc, "_get_current_kingdee_userid", lambda: "zhangsan")
    monkeypatch.setattr(wc, "_analysis_agent_available", lambda: True)
    monkeypatch.setattr(
        "common.permission_checker.get_kingdee_form_access",
        lambda uid: {"SAL_SaleOrder", "AR_receivable"},
    )
    res = json.loads(wc.AnalysisContextHandler().GET())
    assert res["status"] == "success"
    assert res["userid"] == "zhangsan"
    # 只有 SAL_SaleOrder / AR_receivable 权限 → 客户销售(需 BD_Customer)、产品线(需 BD_MATERIAL)、出库(需 SAL_OUTSTOCK) 被锁定
    assert any(t["id"] == "sales_daily" for t in res["templates"])
    assert any(t["id"] == "ar_overdue" for t in res["templates"])
    locked_ids = {t["id"] for t in res["locked_templates"]}
    assert "customer_sales" in locked_ids
    assert "product_line" in locked_ids
    assert "outstock" in locked_ids


def test_analysis_agent_available_when_registered(monkeypatch):
    """kingdee-analysis 已注册 → available=True。"""
    from agent.registry import AgentRegistry, AgentProfile

    class FakeRegistry:
        def get(self, agent_id):
            if agent_id == "kingdee-analysis":
                return object()
            raise KeyError(agent_id)

    monkeypatch.setattr("agent.registry.get_agent_registry", lambda: FakeRegistry())
    assert wc._analysis_agent_available() is True


def test_analysis_agent_available_when_missing(monkeypatch):
    """kingdee-analysis 未注册 → available=False（前端/后端回退默认 agent）。"""
    class FakeRegistry:
        def get(self, agent_id):
            raise KeyError(agent_id)

    monkeypatch.setattr("agent.registry.get_agent_registry", lambda: FakeRegistry())
    assert wc._analysis_agent_available() is False


# ---------- AnalysisPageHandler 企微 UA 判断 ----------

def _assert_no_wecom_dup_value(res):
    """回归防护：企微配置标记整段替换，避免渲染出 "= false false;" 双值语法错误。"""
    # 提取 window.COW_WECOM_CONFIGURED = xxx; 片段，断言只有一个布尔值
    import re as _re
    m = _re.search(r"COW_WECOM_CONFIGURED\s*=\s*([^;]+);", res)
    assert m, "缺少 COW_WECOM_CONFIGURED 注入"
    val = m.group(1).strip()
    assert val in ("true", "false"), f"COW_WECOM_CONFIGURED 注入非法: {val!r}"


def test_page_renders_for_normal_browser_unauthenticated(mock_web_context, monkeypatch):
    """普通浏览器 + 未认证（企微已配置）→ 渲染 analysis.html，不返回"跳转中"。"""
    monkeypatch.setattr(wc, "conf", lambda: {"wecom_public_base": "http://office.landshr.com:9898"})
    monkeypatch.setattr(wc, "_check_auth", lambda: False)
    monkeypatch.setattr(wc, "_check_wecom_auth", lambda: (None, False, False))
    mock_web_context["_env"]["HTTP_USER_AGENT"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"
    res = wc.AnalysisPageHandler().GET()
    # 渲染了 analysis.html（含 app 根节点），而不是"跳转中"页面
    assert '<div id="app"' in res
    assert "正在跳转到企业微信认证" not in res
    _assert_no_wecom_dup_value(res)


def test_page_returns_jumping_for_wecom_browser_unauthenticated(mock_web_context, monkeypatch):
    """企微浏览器 + 未认证（企微已配置）→ 返回"跳转中"页面。"""
    monkeypatch.setattr(wc, "conf", lambda: {"wecom_public_base": "http://office.landshr.com:9898"})
    monkeypatch.setattr(wc, "_check_auth", lambda: False)
    monkeypatch.setattr(wc, "_check_wecom_auth", lambda: (None, False, False))
    mock_web_context["_env"]["HTTP_USER_AGENT"] = "wxwork/4.1.0 (iPhone; iOS 16.0; Scale/3.00)"
    res = wc.AnalysisPageHandler().GET()
    assert "正在跳转到企业微信认证" in res


def test_page_renders_for_authenticated(mock_web_context, monkeypatch):
    """已认证（企微配置）→ 直接渲染 analysis.html。"""
    monkeypatch.setattr(wc, "conf", lambda: {"wecom_public_base": "http://office.landshr.com:9898"})
    monkeypatch.setattr(wc, "_check_auth", lambda: True)
    mock_web_context["_env"]["HTTP_USER_AGENT"] = "Mozilla/5.0 Chrome/120.0"
    res = wc.AnalysisPageHandler().GET()
    assert '<div id="app"' in res
    assert "正在跳转到企业微信认证" not in res
    _assert_no_wecom_dup_value(res)


def test_page_renders_when_wecom_not_configured(mock_web_context, monkeypatch):
    """企微未配置（wecom_public_base 为空）→ 注入 false，仍无双值语法错误。"""
    monkeypatch.setattr(wc, "conf", lambda: {})
    monkeypatch.setattr(wc, "_check_auth", lambda: True)
    mock_web_context["_env"]["HTTP_USER_AGENT"] = "Mozilla/5.0 Chrome/120.0"
    res = wc.AnalysisPageHandler().GET()
    assert '<div id="app"' in res
    _assert_no_wecom_dup_value(res)
    # 注入应为 false
    import re as _re
    m = _re.search(r"COW_WECOM_CONFIGURED\s*=\s*([^;]+);", res)
    assert m.group(1).strip() == "false"
