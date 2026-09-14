# encoding:utf-8
"""金蝶数据分析后端辅助函数测试（不依赖 web.py 请求上下文的纯逻辑）。"""

import pytest

from channel.web import web_channel as wc


# ---------- 模板数据 ----------

def test_six_builtin_templates():
    ids = {t["id"] for t in wc.ANALYSIS_TEMPLATES}
    assert ids == {"sales_daily", "product_line", "customer_sales", "ar_overdue", "outstock", "conversion"}


def test_each_template_has_required_forms():
    for t in wc.ANALYSIS_TEMPLATES:
        assert t["required_forms"], f"{t['id']} 缺少 required_forms"


def test_template_brief_exposes_public_fields():
    brief = wc._analysis_template_brief(wc.ANALYSIS_TEMPLATES[0])
    assert set(brief.keys()) == {"id", "name", "icon", "description", "required_forms", "metric_definition"}


# ---------- 用户表单权限判断 ----------

def test_user_has_all_forms_when_access_none(monkeypatch):
    """权限未启用/管理员时 get_kingdee_form_access 返回 None → 视为全权。"""
    monkeypatch.setattr("common.permission_checker.get_kingdee_form_access", lambda uid: None)
    assert wc._user_has_forms("anyone", ["SAL_SaleOrder"]) is True


def test_user_lacks_form_when_not_in_access_set(monkeypatch):
    monkeypatch.setattr(
        "common.permission_checker.get_kingdee_form_access",
        lambda uid: {"SAL_SaleOrder"},
    )
    assert wc._user_has_forms("u1", ["SAL_SaleOrder", "BD_Customer"]) is False
    assert wc._user_has_forms("u1", ["SAL_SaleOrder"]) is True


# ---------- 当前用户解析 ----------

def test_current_user_wecom_authenticated(monkeypatch):
    """企微用户且有权限 → 返回真实 userid + scope。"""
    monkeypatch.setattr("channel.web.web_channel._check_wecom_auth", lambda: ("zhangsan", True, True))
    monkeypatch.setattr("common.permission_checker.check_kingdee_permission", lambda uid: (True, "self", ""))
    monkeypatch.setattr("common.permission_checker.get_kingdee_scope", lambda uid: "self")
    userid, authed, scope, allowed = wc._current_analysis_user()
    assert userid == "zhangsan"
    assert authed is True
    assert scope == "self"
    assert allowed is True


def test_current_user_wecom_denied(monkeypatch):
    """企微用户无权限 → allowed=False。"""
    monkeypatch.setattr("channel.web.web_channel._check_wecom_auth", lambda: ("lisi", True, False))
    monkeypatch.setattr("common.permission_checker.check_kingdee_permission", lambda uid: (False, "", "无权限"))
    userid, authed, scope, allowed = wc._current_analysis_user()
    assert allowed is False
    assert scope == "none"


def test_current_user_admin_fallback(monkeypatch):
    """密码管理员（无企微）→ 全权 web_admin。"""
    monkeypatch.setattr("channel.web.web_channel._check_wecom_auth", lambda: (None, False, False))
    userid, authed, scope, allowed = wc._current_analysis_user()
    assert userid == "session_web_admin"
    assert authed is False
    assert scope == "all"
    assert allowed is True


# ---------- 会话归属校验（历史隔离加固） ----------

def test_session_owner_matches_own_namespace():
    """自己前缀的 session_id → 允许。"""
    assert wc._analysis_session_owner("analysis_zhangsan_1690000000000", "zhangsan") is True


def test_session_owner_rejects_other_user_prefix():
    """他人前缀的 session_id → 拒绝（越权读取历史被拦截）。"""
    assert wc._analysis_session_owner("analysis_zhangsan_1690000000000", "lisi") is False


def test_session_owner_rejects_admin_prefix_for_wecom_user():
    """企微用户请求管理员前缀 session → 拒绝（session_ 前缀不被其匹配）。"""
    assert wc._analysis_session_owner("analysis_session_web_admin_1690000000000", "zhangsan") is False


def test_session_owner_admin_prefix_ok():
    """管理员（session_web_admin）可读自己前缀 session。"""
    assert wc._analysis_session_owner("analysis_session_web_admin_1690000000000", "session_web_admin") is True


def test_session_owner_rejects_legacy_format():
    """旧格式（analysis_时间戳，无用户命名空间）一律拒绝——与前端弃用逻辑一致。"""
    assert wc._analysis_session_owner("analysis_1690000000000", "zhangsan") is False


def test_session_owner_rejects_underscore_prefix_collision():
    """userid 含下划线时前缀碰撞防护：li 不能通过 analysis_li_ 前缀读到 li_na 的会话。"""
    # li_na 自己的会话（剩余段含下划线部分已被 userid 占用，尾段是纯数字）
    assert wc._analysis_session_owner("analysis_li_na_1690000000000", "li_na") is True
    # user li 用 analysis_li_ 前缀匹配 analysis_li_na_... → 剩余段 "na_1690000000000" 非纯数字 → 拒绝
    assert wc._analysis_session_owner("analysis_li_na_1690000000000", "li") is False
    # user li 自己合法前缀 → 放行
    assert wc._analysis_session_owner("analysis_li_1690000000000", "li") is True


def test_session_owner_rejects_trailing_non_digit():
    """伪造前缀但尾部非纯数字 → 拒绝（防止借助 extra 段构造碰撞）。"""
    assert wc._analysis_session_owner("analysis_zhangsan_1690000000000_evil", "zhangsan") is False


def test_session_owner_rejects_empty():
    assert wc._analysis_session_owner("", "zhangsan") is False
    assert wc._analysis_session_owner(None, "zhangsan") is False
