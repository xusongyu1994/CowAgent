#!/usr/bin/env python3
# -*- coding=utf-8 -*-
"""
权限检查模块

用于在消息处理时检查用户是否有权访问知识库或使用金蝶。
"""

import json
import logging
import os
import re
from typing import Dict, List, Optional, Set

from common.utils import expand_path

logger = logging.getLogger(__name__)

# Web 管理员的 session ID 前缀
WEB_ADMIN_SESSION_PREFIX = 'session_'

# =====================================================================
# 金蝶表单目录与角色（后端维护，前端只读展示）
# =====================================================================

# 全部可授权的金蝶表单（form_id -> 中文名）
# 基于对金蝶 MCP 的全量实测（2026-08-26，47 个候选表单）确定。
# - 有数据：SAL_SaleOrder / SAL_OUTSTOCK / SAL_QUOTATION / SAL_RETURNSTOCK / STK_Inventory /
#   AR_receivable / BD_Customer / BD_MATERIAL / BD_Supplier / BD_Department / BD_Unit
# - 无数据但表单有效：SAL_DELIVERYNOTICE / SAL_AvailableQuery / SVM_InquiryBill /
#   SVM_QuoteBill / SVM_ComparePrice
# - 无权限但为真实业务表单（集成账号金蝶侧暂无权限）：PUR_PurchaseOrder / PUR_Requisition /
#   STK_InStock / AP_PAYBILL
KINGDEE_FORM_CATALOG: Dict[str, str] = {
    'SAL_SaleOrder': '销售订单',
    'SAL_OUTSTOCK': '销售出库单',
    'SAL_QUOTATION': '报价单',
    'SAL_RETURNSTOCK': '销售退货单',
    'SAL_DELIVERYNOTICE': '发货通知单',
    'SAL_AvailableQuery': '可发量查询',
    'SVM_InquiryBill': '采购询价单',
    'SVM_QuoteBill': '供应商报价单',
    'SVM_ComparePrice': '比价单',
    'PUR_PurchaseOrder': '采购订单',
    'PUR_Requisition': '采购申请单',
    'STK_InStock': '采购入库单',
    'STK_Inventory': '库存查询',
    'AR_receivable': '应收账款',
    'AP_PAYBILL': '付款单',
    'BD_Customer': '客户档案',
    'BD_Supplier': '供应商档案',
    'BD_MATERIAL': '物料档案',
    'BD_Department': '部门',
    'BD_Unit': '计量单位',
}

# 预置角色 -> 默认表单集
DEFAULT_FORM_ROLES: Dict[str, List[str]] = {
    'sales': ['SAL_SaleOrder', 'SAL_QUOTATION', 'SAL_OUTSTOCK', 'SAL_RETURNSTOCK',
              'SAL_DELIVERYNOTICE', 'BD_Customer'],
    'business': ['PUR_PurchaseOrder', 'PUR_Requisition', 'STK_InStock',
                 'SVM_InquiryBill', 'SVM_QuoteBill', 'SVM_ComparePrice',
                 'BD_Supplier', 'BD_Customer'],
    'finance': ['AR_receivable', 'AP_PAYBILL', 'PUR_PurchaseOrder', 'BD_Supplier'],
    'rd': ['BD_MATERIAL', 'STK_Inventory', 'SAL_OUTSTOCK', 'BD_Department', 'BD_Unit'],
}

ROLE_NAMES: Dict[str, str] = {
    'sales': '销售',
    'business': '商务',
    'finance': '财务',
    'rd': '研发/质检',
}

# 需要按业务员（FSalerId）过滤的销售类表单
SALE_SCOPED_FORMS: Set[str] = {'SAL_SaleOrder', 'SAL_QUOTATION', 'SAL_OUTSTOCK', 'SAL_RETURNSTOCK'}

# 有业务员字段但归非销售类的表单（用于核实/说明）
SALER_FIELD_FORMS: Set[str] = {'AR_receivable'}

# 各销售类表单的「业务员」字段名（通过金蝶元数据实测确定，2026-08-27 / 2026-09-02 复核）
# 注意：不同单据的业务员字段名不同，不能统一用 FSalerId。
SALER_FIELD_BY_FORM: Dict[str, str] = {
    'SAL_SaleOrder': 'FSalerId',          # 销售订单
    'SAL_QUOTATION': 'FSalerId',          # 报价单
    'SAL_OUTSTOCK': 'FSalesManID',        # 销售出库单（无 FSalerId）
    'SAL_RETURNSTOCK': 'FSalesManId',     # 销售退货单（无 FSalerId）
}

# 各表单的「客户/往来单位」字段名（金蝶元数据实测，2026-09-02）
# 注意：销售订单/报价单用 FCustId，销售出库单用 FCustomerID（无 FCustId），不可跨表单复用。
CUSTOMER_FIELD_BY_FORM: Dict[str, str] = {
    'SAL_SaleOrder': 'FCustId',       # 销售订单
    'SAL_QUOTATION': 'FCustId',       # 报价单
    'SAL_OUTSTOCK': 'FCustomerID',    # 销售出库单（无 FCustId）
}


def get_customer_field(form_id: str) -> str:
    """
    返回表单的「客户/往来单位」字段名（大小写不敏感匹配，金蝶 BOS 字段名大小写不敏感）。

    规则：
    - 已知销售表单按 CUSTOMER_FIELD_BY_FORM 映射；
    - 采购类表单默认 FSupplierId（供应商）；
    - 其余默认 FCustId。
    """
    norm = _norm_form_id(form_id)
    for fid, field in CUSTOMER_FIELD_BY_FORM.items():
        if _norm_form_id(fid) == norm:
            return field
    if norm.startswith('PUR_') or norm in ('SVM_QuoteBill', 'SVM_InquiryBill'):
        return 'FSupplierId'
    return 'FCustId'


def is_sale_scoped_form(form_id: str) -> bool:
    """判断 form_id 是否为需要按业务员/数据范围过滤的销售类表单。"""
    return _norm_form_id(form_id) in {_norm_form_id(f) for f in SALE_SCOPED_FORMS}


# form_id 大小写归一化（金蝶 BOS 大小写不敏感）：统一转大写用于比较
def _norm_form_id(form_id: str) -> str:
    return (form_id or '').strip().upper()

# 企微姓名昵称后缀剥离：去掉末尾的 `-英文` / `～英文` / ` 英文`
_NICKNAME_RE = re.compile(r'[-～~ 　].*$')


def _strip_nickname(name: str) -> str:
    """
    剥离企微姓名中的英文昵称后缀，返回纯中文名（用于匹配金蝶业务员 FName）。

    例：
      '龙超富-Dragon'       -> '龙超富'
      '张小攀～Mark'        -> '张小攀'
      '张双团- Frosty'      -> '张双团'
      '唐亚梅 Xijin'        -> '唐亚梅'
      '郭金博-Bi l l'       -> '郭金博'
      '左强-Zack-揽盛运营'  -> '左强'
      '孙建伟William'       -> '孙建伟'   （无分隔符拼接，截取中文段）
      '乐金辉'              -> '乐金辉'
    """
    if not name:
        return name
    # 先去掉 `-英文` / `～英文` / ` 英文` 后缀（含后续中文昵称段，取最左中文名）
    stripped = _NICKNAME_RE.sub('', name).strip()
    if stripped and stripped != name:
        return stripped
    # 无分隔符直接拼接（如 `孙建伟William`）：截取开头的连续中文段；
    # 纯中文名（`乐金辉`）此时也走这里，返回其本身。
    m = re.match(r'^[\u4e00-\u9fff]+', name.strip())
    if m:
        return m.group(0)
    # 保底：提取任意连续中文段；仍无（纯英文昵称）则原样返回
    m2 = re.search(r'[\u4e00-\u9fff]+', name)
    return m2.group(0) if m2 else name


def _is_admin_user(userid: str) -> bool:
    """
    判断用户是否为 web 管理员（session_ 开头的用户）。
    web 管理员拥有所有权限。
    """
    return userid.startswith(WEB_ADMIN_SESSION_PREFIX)


def _get_config_path() -> str:
    """Get permission config file path."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    tmp_dir = os.path.join(project_root, "tmp")
    return os.path.join(tmp_dir, "permission_config.json")


def _load_config() -> Dict:
    """Load permission config from file.

    fail-closed：配置文件存在但解析失败（半截写入/损坏）时返回哨兵
    {'_config_error': True}，由 is_permissions_enabled 视为"已启用"，
    使后续检查按"无任何授权"拒绝，避免误回退成"权限关闭全放行"导致越权。
    """
    config_path = _get_config_path()
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"[PermissionChecker] 权限配置文件解析失败(fail-closed): {e}")
            return {'_config_error': True}
    return {}


def is_permissions_enabled() -> bool:
    """
    检查权限管理是否启用。
    由 UI 开关直接控制，读取 permission_config.json 中的 enabled 字段。

    配置文件损坏（_config_error 哨兵）时视为已启用（fail-closed），
    所有调用方随后将按"无授权"拒绝，保证故障不回退成全放行。

    Returns:
        bool: 如果启用返回True，否则返回False（默认关闭）
    """
    config = _load_config()
    if config.get('_config_error'):
        return True
    return config.get('enabled', False)


def check_knowledge_permission(userid: str, folder: str = None) -> tuple[bool, str]:
    """
    检查用户是否有权访问知识库。
    
    Args:
        userid: 用户ID
        folder: 知识库文件夹名称（可选，如果为None则检查是否有任何知识库访问权限）
    
    Returns:
        (allowed, message): 是否允许访问，以及提示消息
    """
    # 如果权限管理未启用，默认允许访问
    if not is_permissions_enabled():
        return True, ""

    # web 管理员（session_ 开头的用户）拥有所有权限
    if _is_admin_user(userid):
        return True, ""

    config = _load_config()
    folder_permissions = config.get('folder_permissions', {})
    
    if not folder_permissions:
        # 权限已启用但未配置任何文件夹权限，所有用户均无权限
        return False, "您没有访问知识库的权限"
    
    if folder:
        # 检查特定文件夹的权限
        allowed_users = folder_permissions.get(folder, [])
        if userid in allowed_users:
            return True, ""
        else:
            return False, f"您没有权限访问知识库文件夹「{folder}」"
    else:
        # 检查是否有任何文件夹的访问权限
        for allowed_users in folder_permissions.values():
            if userid in allowed_users:
                return True, ""
        
        return False, "您没有访问知识库的权限"


def _get_kingdee_permissions(config: Dict) -> Dict:
    """从配置中取出 kingdee_permissions 节点（自动补默认结构）。"""
    kp = config.get('kingdee_permissions', {}) or {}
    if not isinstance(kp, dict):
        kp = {}
    kp.setdefault('super_admins', [])
    kp.setdefault('form_roles', DEFAULT_FORM_ROLES)
    kp.setdefault('sale_scoped_forms', sorted(SALE_SCOPED_FORMS))
    kp.setdefault('user_permissions', {})
    return kp


def _is_super_admin(userid: str, config: Dict) -> bool:
    """判断 userid 是否为超级账户（super_admins 名单）。"""
    kp = _get_kingdee_permissions(config)
    return userid in (kp.get('super_admins') or [])


def _effective_forms(user_perm: Dict, kp: Dict) -> Set[str]:
    """
    计算用户的「有效表单」集合 = 角色默认集 + extra_forms - removed_forms。
    返回元素统一为大写（form_id 大小写不敏感，金蝶 BOS 大小写均可）。
    """
    role = user_perm.get('role') or ''
    form_roles = kp.get('form_roles') or DEFAULT_FORM_ROLES
    base = {_norm_form_id(f) for f in (form_roles.get(role, []) if role else [])}
    extra = {_norm_form_id(f) for f in (user_perm.get('extra_forms') or [])}
    removed = {_norm_form_id(f) for f in (user_perm.get('removed_forms') or [])}
    return (base | extra) - removed


def get_kingdee_form_access(userid: str) -> Optional[Set[str]]:
    """
    返回用户可访问的 form_id 集合。

    - 权限管理未启用 / 管理员 / 超级账户 → 返回 None（表示不限制）
    - 否则 → 返回「有效表单」集合（可能为空，表示无任何表单权限）
    """
    if not is_permissions_enabled():
        return None
    if _is_admin_user(userid):
        return None

    config = _load_config()
    kp = _get_kingdee_permissions(config)
    if _is_super_admin(userid, config):
        return None

    user_permissions = kp.get('user_permissions', {})
    user_perm = user_permissions.get(userid) or {}
    if not user_perm.get('enabled'):
        # 未启用 -> 无权（返回空集合）
        return set()
    return _effective_forms(user_perm, kp)


def has_kingdee_form_access(userid: str) -> Optional[Set[str]]:
    """
    登录入口用的便捷判断（等价于 get_kingdee_form_access）。

    Returns:
        None: 不限（管理员 / 超级账户 / 权限未启用）
        set: 用户的授权表单集合（可为空，空表示无表单权限）
    """
    return get_kingdee_form_access(userid)


def get_kingdee_scope(userid: str) -> str:
    """
    返回用户的金蝶数据范围 scope。

    - 权限未启用 / 管理员 / 超级账户 → 'all'
    - 否则读取 user_perm.scope，默认 'all'
    """
    if not is_permissions_enabled():
        return 'all'
    if _is_admin_user(userid):
        return 'all'

    config = _load_config()
    kp = _get_kingdee_permissions(config)
    if _is_super_admin(userid, config):
        return 'all'

    user_permissions = kp.get('user_permissions', {})
    user_perm = user_permissions.get(userid) or {}
    return user_perm.get('scope', 'all') or 'all'


def get_user_subordinates(userid: str, config: Dict = None) -> List[str]:
    """
    递归返回用户的所有下属 userid（直接 + 间接），基于手工维护的
    `direct_subordinates` 字段（存于 config.user_permissions）。

    Args:
        userid: 用户ID
        config: 可选，传入配置避免重复加载

    Returns:
        所有层级下属的 userid 列表（不含自己）
    """
    if config is None:
        config = _load_config()
    kp = _get_kingdee_permissions(config)
    user_permissions = kp.get('user_permissions', {})

    result: List[str] = []
    seen: Set[str] = set()
    stack = [userid]
    while stack:
        current = stack.pop()
        perm = user_permissions.get(current) or {}
        direct = perm.get('direct_subordinates') or []
        for sub in direct:
            if sub not in seen:
                seen.add(sub)
                result.append(sub)
                stack.append(sub)
    return result


def _saler_condition(userid: str, form_id: str, scope: str, config: Dict) -> Optional[str]:
    """
    构造金蝶业务员过滤条件（<业务员字段>.FName IN (...)）。

    不同销售类表单的业务员字段名不同（实测确认）：
      - SAL_SaleOrder / SAL_QUOTATION → FSalerId
      - SAL_OUTSTOCK → FSalesManID
      - SAL_RETURNSTOCK → FSalesManId

    仅当 scope 为 self / self_and_subordinates 时返回条件字符串。
    返回 None 表示「不需要业务员过滤」。
    """
    if scope not in ('self', 'self_and_subordinates'):
        return None

    # 根据表单选择正确的业务员字段名（默认 FSalerId）
    norm_fid = _norm_form_id(form_id)
    saler_field = None
    for fid, field in SALER_FIELD_BY_FORM.items():
        if _norm_form_id(fid) == norm_fid:
            saler_field = field
            break
    if not saler_field:
        saler_field = 'FSalerId'

    # 收集本人及下属的中文名
    names: Set[str] = set()

    # 本人中文名（从 users 节读取，剥离昵称）
    users = config.get('users', {}) or {}
    user_info = users.get(userid) or {}
    self_name = _strip_nickname(user_info.get('name') or '')
    if self_name:
        names.add(self_name)

    # 下属中文名
    if scope == 'self_and_subordinates':
        for sub_uid in get_user_subordinates(userid, config):
            sub_info = users.get(sub_uid) or {}
            sub_name = _strip_nickname(sub_info.get('name') or '')
            if sub_name:
                names.add(sub_name)

    if not names:
        # 无法匹配任何姓名：确保查不到数据，而非放行
        return "1=1 AND 1=0"

    quoted = "','".join(sorted(names))
    return f"{saler_field}.FName IN ('{quoted}')"


def build_kingdee_form_filter(userid: str, form_id: str, filter_string: str) -> Optional[str]:
    """
    统一金蝶过滤入口（Web handler 与 Agent 拦截点共用）。

    Args:
        userid: 当前企微用户 id
        form_id: 金蝶表单 id（如 SAL_SaleOrder）
        filter_string: 已有的过滤条件（可为空字符串）

    Returns:
        str:  追加业务员过滤后的 filter_string（应被使用）
        None: 用户对该表单无权限，应拒绝查询
    """
    # 归一化 form_id（大小写不敏感，金蝶 BOS 大小写均可）
    norm_fid = _norm_form_id(form_id)

    # 获取用户表单权限（None = 不限：权限未启用 / 管理员 / 超级账户）
    form_access = get_kingdee_form_access(userid)
    # 对已配置权限的普通用户：必须拥有该表单权限（含清单内/清单外表单），否则拒绝。
    # 这样可防止用户通过查询未列出的表单绕过权限控制。
    if form_access is not None and norm_fid not in form_access:
        return None

    # 有表单权限后，若为销售类表单且 scope 非 all，追加业务员过滤
    scope = get_kingdee_scope(userid)
    if scope != 'all' and norm_fid in {_norm_form_id(f) for f in SALE_SCOPED_FORMS}:
        config = _load_config()
        cond = _saler_condition(userid, form_id, scope, config)
        if cond:
            parts = [p for p in [filter_string, cond] if p]
            return " AND ".join(parts)

    return filter_string if filter_string else "1=1"


def get_kingdee_permission_brief(userid: str) -> Optional[Dict]:
    """
    返回用于 Agent 提示（user_identity）的金蝶权限摘要，消除模型对"有无权限"的凭空猜测。

    Returns:
        None：权限管理未启用（金蝶查询不限制，不注入权限描述）
        dict：{enabled, unrestricted, form_names, scope_label}
            - enabled=True 时：
                unrestricted=True  表示不限制（管理员 / 超级账户），form_names=[]
                unrestricted=False 表示表单受限，form_names=可查表单中文名列表
            - enabled=False 时：无金蝶权限
    """
    if not is_permissions_enabled():
        return None

    if _is_admin_user(userid):
        return {
            'enabled': True, 'unrestricted': True,
            'form_names': [], 'scope_label': '全部数据（管理员）',
        }

    config = _load_config()
    kp = _get_kingdee_permissions(config)
    if _is_super_admin(userid, config):
        return {
            'enabled': True, 'unrestricted': True,
            'form_names': [], 'scope_label': '全部数据（超级账户）',
        }

    user_perm = (kp.get('user_permissions') or {}).get(userid) or {}
    if not user_perm.get('enabled'):
        return {'enabled': False, 'unrestricted': False, 'form_names': [], 'scope_label': ''}

    forms = _effective_forms(user_perm, kp)
    # 目录键为原始大小写（如 SAL_SaleOrder），而 forms 已归一化为大写，
    # 用大小写不敏感映射转中文名，避免出现 SAL_SALEORDER 这种原始 id。
    cat_map = {_norm_form_id(fid): name for fid, name in KINGDEE_FORM_CATALOG.items()}
    form_names = [cat_map.get(fid, fid) for fid in sorted(forms, key=str)]
    scope = user_perm.get('scope', 'all') or 'all'
    scope_label = {
        'self': '仅本人数据（按业务员过滤）',
        'self_and_subordinates': '本人+下属数据（按业务员过滤）',
        'all': '全部数据（不按业务员过滤）',
    }.get(scope, scope)
    return {'enabled': True, 'unrestricted': False, 'form_names': form_names, 'scope_label': scope_label}


def check_kingdee_permission(userid: str) -> tuple[bool, str, str]:
    """
    兼容旧接口：检查用户是否有权使用金蝶（登录入口用）。

    返回 (allowed, scope, message)。
    注意：此接口只判断"是否启用/是否管理员/是否超管"，不判断具体表单权限。
    具体表单权限由 build_kingdee_form_filter 判断。
    """
    if not is_permissions_enabled():
        return True, 'all', ""

    if _is_admin_user(userid):
        return True, 'all', ""

    config = _load_config()
    kp = _get_kingdee_permissions(config)
    if _is_super_admin(userid, config):
        return True, 'all', ""

    user_permissions = kp.get('user_permissions', {})
    user_perm = user_permissions.get(userid) or {}
    if user_perm.get('enabled'):
        return True, user_perm.get('scope', 'all') or 'all', ""

    return False, "", "您没有使用金蝶查询的权限"


def get_user_accessible_folders(userid: str) -> List[str]:
    """
    获取用户可以访问的知识库文件夹列表。
    
    Args:
        userid: 用户ID
    
    Returns:
        用户可以访问的文件夹列表。如果权限管理未启用，返回 ['*'] 表示所有文件夹。
    """
    # 如果权限管理未启用，返回 ['*'] 表示无限制
    if not is_permissions_enabled():
        return ['*']

    # web 管理员（session_ 开头的用户）拥有所有文件夹权限
    if _is_admin_user(userid):
        config = _load_config()
        return list(config.get('folder_permissions', {}).keys()) or ['*']

    config = _load_config()
    folder_permissions = config.get('folder_permissions', {})
    
    accessible_folders = []
    for folder, allowed_users in folder_permissions.items():
        if userid in allowed_users:
            accessible_folders.append(folder)
    
    return accessible_folders


