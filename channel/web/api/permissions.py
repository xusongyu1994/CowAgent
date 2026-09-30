"""权限管理 Web API（金蝶表单权限、知识库文件夹权限、用户、审计日志等）。

提取自重构前的 channel/web/web_channel.py。
"""

import json
import os
import re
import threading
import time

import web

from agent.registry import get_agent_registry
from common.log import logger
from config import conf

from channel.web.core._common import _check_auth, _require_auth

def _require_admin():
    """权限管理类 API 专用守卫：仅密码管理员可访问，企微普通用户拒绝。

    权限管理接口暴露全量用户的知识库/金蝶权限配置与审计日志，若企微用户可直调
    API，即使前端已隐藏菜单/路由守卫，仍可绕过 UI 读取甚至篡改权限，构成越权。
    因此这类接口必须在后端做"仅管理后台"隔离。
    （密码登录未启用时 _check_auth 恒通过，等同内网信任环境，符合既有约定。）
    """
    if _check_auth():
        return
    raise web.HTTPError("403 Forbidden",
                        {"Content-Type": "application/json; charset=utf-8"},
                        json.dumps({"status": "error", "message": "无权限：该操作仅限管理后台"}))
def _atomic_write_json(file_path: str, data) -> None:
    """原子写 JSON 文件：先写临时文件再 os.replace，避免并发读到半截内容。

    权限配置若被非原子写破坏，permission_checker 的 fail-closed 会拒绝所有
    金蝶/知识库查询（宁可不可用也不越权）；原子写从源头消除该风险。
    """
    tmp_path = f"{file_path}.tmp"
    with open(tmp_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp_path, file_path)

class PermissionsKingdeeFormRolesHandler:
    """返回金蝶表单目录、预置角色默认表单集、销售类表单清单（供前端渲染，不硬编码）。"""

    def GET(self):
        _require_admin()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            from common.permission_checker import (
                DEFAULT_FORM_ROLES, KINGDEE_FORM_CATALOG, ROLE_NAMES,
                SALE_SCOPED_FORMS,
            )
            return json.dumps({
                "status": "success",
                "data": {
                    "forms": KINGDEE_FORM_CATALOG,
                    "roles": DEFAULT_FORM_ROLES,
                    "role_names": ROLE_NAMES,
                    "sale_scoped_forms": sorted(SALE_SCOPED_FORMS),
                },
            }, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[PermissionsKingdeeFormRolesHandler] GET error: {e}")
            return json.dumps({"status": "error", "message": str(e)}, ensure_ascii=False)


class PermissionsKingdeeSuperAdminsHandler:
    """保存金蝶超级账户名单。"""

    def GET(self):
        _require_admin()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            config = self._load_config()
            kp = config.get('kingdee_permissions', {}) or {}
            return json.dumps({
                "status": "success",
                "data": {"super_admins": kp.get('super_admins', [])},
            }, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[PermissionsKingdeeSuperAdminsHandler] GET error: {e}")
            return json.dumps({"status": "error", "message": str(e)}, ensure_ascii=False)

    def POST(self):
        _require_admin()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            data = json.loads(web.data())
            super_admins = data.get('super_admins', [])
            if not isinstance(super_admins, list):
                return json.dumps({"status": "error", "message": "super_admins 必须是数组"})

            config = self._load_config()
            config.setdefault('kingdee_permissions', {})
            config['kingdee_permissions']['super_admins'] = [str(u) for u in super_admins]
            self._save_config(config)
            return json.dumps({"status": "success"}, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[PermissionsKingdeeSuperAdminsHandler] POST error: {e}")
            return json.dumps({"status": "error", "message": str(e)}, ensure_ascii=False)

    def _load_config(self):
        config_path = self._get_config_path()
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"kingdee_permissions": {"super_admins": []}}

    def _save_config(self, config):
        _atomic_write_json(self._get_config_path(), config)

    def _get_config_path(self):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        tmp_dir = os.path.join(project_root, "tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        return os.path.join(tmp_dir, "permission_config.json")


class PermissionsConfigHandler:
    """API for managing permission configuration."""

    def GET(self):
        _require_admin()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            config = self._load_config()
            return json.dumps({"status": "success", "data": config}, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[PermissionsConfigHandler] GET error: {e}")
            return json.dumps({"status": "error", "message": str(e)})

    def POST(self):
        _require_admin()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            data = json.loads(web.data())
            config = self._load_config()

            # Update permissions enabled state
            if 'enabled' in data:
                config['enabled'] = data['enabled']

            # Update knowledge permissions
            if 'knowledge_permissions' in data:
                config['knowledge_permissions'] = data['knowledge_permissions']

            # Update kingdee permissions
            if 'kingdee_permissions' in data:
                kd_perm = data['kingdee_permissions']
                self._validate_kingdee_permissions(kd_perm)
                config['kingdee_permissions'] = kd_perm

            # Update folder permissions
            if 'folder_permissions' in data:
                config['folder_permissions'] = data['folder_permissions']

            # Audit log: copy from frontend if present (frontend sends entire audit_log array)
            if 'audit_log' in data:
                config['audit_log'] = data['audit_log']
            # 兼容旧的 audit_entry 单条追加方式
            elif 'audit_entry' in data:
                if 'audit_log' not in config:
                    config['audit_log'] = []
                config['audit_log'].append(data['audit_entry'])

            # 限制审计日志容量，保留最近 1000 条
            if config.get('audit_log'):
                config['audit_log'] = config['audit_log'][-1000:]

            self._save_config(config)
            return json.dumps({"status": "success"}, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[PermissionsConfigHandler] POST error: {e}")
            return json.dumps({"status": "error", "message": str(e)})

    def _validate_kingdee_permissions(self, kd_perm):
        """
        校验金蝶权限配置的合法性，非法则抛出 ValueError。

        校验项：
        - role 必须存在于预置角色
        - extra_forms / removed_forms 必须是合法 form_id
        - direct_subordinates 不能成环（DFS）
        - 启用时至少有一个有效表单
        - super_admins 必须是已知用户（宽松校验：仅要求是列表）
        """
        from common.permission_checker import (
            DEFAULT_FORM_ROLES, KINGDEE_FORM_CATALOG, ROLE_NAMES,
        )
        if not isinstance(kd_perm, dict):
            raise ValueError("kingdee_permissions 必须是对象")

        user_permissions = kd_perm.get('user_permissions', {}) or {}
        valid_roles = set(DEFAULT_FORM_ROLES.keys())
        valid_forms = set(KINGDEE_FORM_CATALOG.keys())

        for userid, perm in user_permissions.items():
            if not isinstance(perm, dict):
                raise ValueError(f"用户 {userid} 的金蝶配置必须是对象")

            # role 合法性
            role = perm.get('role') or ''
            if role and role not in valid_roles:
                raise ValueError(f"用户 {userid} 的角色「{role}」不存在（可选：{', '.join(sorted(valid_roles))}）")

            # form 合法性（宽容处理）
            # 对"不在权限清单内"的历史遗留表单（如 STK_OutStock）宽容跳过校验，
            # 仅为避免旧配置阻塞保存。注意：这类表单在运行时不会放行——
            # build_kingdee_form_filter 对不在用户「有效表单」内的任何 form_id 都返回 None
            # （见 permission_checker 安全修复），即保存通过但实际查询会被拒绝，
            # 因此应在权限页面移除这类表单后再使用。
            for key in ('extra_forms', 'removed_forms'):
                for fid in (perm.get(key) or []):
                    if fid.upper() not in {f.upper() for f in valid_forms}:
                        # 不在权限清单内的表单：宽容跳过，不阻塞
                        logger.info(f"[Permissions] 用户 {userid} 的 {key} 含清单外表单「{fid}」，已忽略校验")
                        continue

            # scope 合法性
            scope = perm.get('scope') or 'all'
            if scope not in ('self', 'self_and_subordinates', 'all'):
                raise ValueError(f"用户 {userid} 的 scope「{scope}」非法")

            # 启用时必须有至少一个有效表单
            # 仅当用户显式配置了表单相关字段（role / extra_forms）时才强制校验；
            # 旧格式（只有 enabled 或只有 scope，无 role/表单）视为"待迁移"，不阻塞保存。
            if perm.get('enabled'):
                has_form_config = any(
                    k in perm for k in ('role', 'extra_forms')
                )
                if has_form_config:
                    base = set(DEFAULT_FORM_ROLES.get(role, [])) if role else set()
                    extra = set(perm.get('extra_forms') or [])
                    removed = set(perm.get('removed_forms') or [])
                    effective = (base | extra) - removed
                    if not effective:
                        raise ValueError(f"用户 {userid} 已启用但未配置任何表单，请至少选择一个表单或角色")

        # direct_subordinates 循环检测（全局 DFS）
        self._check_subordinate_cycles(user_permissions)

    def _check_subordinate_cycles(self, user_permissions):
        """检测 direct_subordinates 是否成环。"""
        WHITE, GRAY, BLACK = 0, 1, 2
        color = {}
        for uid in user_permissions:
            color[uid] = WHITE

        def dfs(uid, path):
            color[uid] = GRAY
            perm = user_permissions.get(uid) or {}
            for sub in (perm.get('direct_subordinates') or []):
                if sub not in color:
                    color[sub] = WHITE
                if color[sub] == GRAY:
                    raise ValueError(f"下属关系存在循环: {' -> '.join(path + [sub])}")
                if color[sub] == WHITE:
                    dfs(sub, path + [sub])
            color[uid] = BLACK

        for uid in list(user_permissions.keys()):
            if color[uid] == WHITE:
                dfs(uid, [uid])

    def _load_config(self):
        config_path = self._get_config_path()
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            "knowledge_permissions": {"folder_permissions": {}},
            "kingdee_permissions": {"default_strategy": "deny", "user_permissions": {}},
            "folder_permissions": {},
            "audit_log": []
        }

    def _save_config(self, config):
        _atomic_write_json(self._get_config_path(), config)

    def _get_config_path(self):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        tmp_dir = os.path.join(project_root, "tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        return os.path.join(tmp_dir, "permission_config.json")


class PermissionsUsersHandler:
    """API for getting user list."""

    def GET(self):
        _require_admin()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            params = web.input(department='')
            department = params.department.strip()

            users = self._load_users()
            departments = set()
            user_list = []

            for userid, info in users.items():
                dept = info.get('department', '')
                departments.add(dept)
                if department and dept != department:
                    continue
                user_list.append({
                    'name': info.get('name', userid),  # 使用中文名，如果没有则使用userid
                    'userid': userid,
                    'department': dept,
                    'leader_userid': info.get('leader_userid', ''),
                    'leader_name': info.get('leader_name', '')  # 如果有上级中文名也一并返回
                })

            return json.dumps({
                "status": "success",
                "data": {
                    "users": user_list,
                    "departments": sorted(list(departments))
                }
            }, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[PermissionsUsersHandler] GET error: {e}")
            return json.dumps({"status": "error", "message": str(e)})

    def _load_users(self):
        """Load users from permission_config.json (synced by PermissionsSyncUsersHandler)."""
        config_path = self._get_config_path()
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    return config.get('users', {})
            except Exception as e:
                logger.error(f"[PermissionsUsersHandler] Failed to load users from config: {e}")
                # Fallback to wecom_user_details.json
                return self._load_users_from_wecom()
        # Fallback to wecom_user_details.json if permission_config.json doesn't exist
        return self._load_users_from_wecom()

    def _load_users_from_wecom(self):
        """Fallback: load users directly from wecom_user_details.json."""
        wecom_path = self._get_wecom_path()
        if os.path.exists(wecom_path):
            try:
                with open(wecom_path, 'r', encoding='utf-8') as f:
                    users_data = json.load(f)
                    # Convert to same format as permission_config.json users field
                    converted = {}
                    for name, info in users_data.items():
                        userid = info.get('userid', '')
                        if userid:
                            converted[userid] = {
                                'name': name,
                                'userid': userid,
                                'department': info.get('department', ''),
                                'leader_userid': info.get('leader_userid', '')
                            }
                    return converted
            except Exception as e:
                logger.error(f"[PermissionsUsersHandler] Failed to load users from wecom: {e}")
        return {}

    def _get_config_path(self):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        tmp_dir = os.path.join(project_root, "tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        return os.path.join(tmp_dir, "permission_config.json")

    def _get_wecom_path(self):
        from common.utils import expand_path
        ws_root = expand_path(conf().get("agent_workspace", "~/cow"))
        tmp_dir = os.path.join(ws_root, "tmp")
        path = os.path.join(tmp_dir, "wecom_user_details.json")
        if os.path.exists(path):
            return path
        # 与 _get_users_path 保持一致：agent_workspace 下没有时回退到工程根
        # 的 tmp/（本实例的 wecom_user_details.json 实际就存放在这里）。
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        fallback_path = os.path.join(project_root, "tmp", "wecom_user_details.json")
        if os.path.exists(fallback_path):
            return fallback_path
        return path


class PermissionsFoldersHandler:
    """API for getting knowledge base folder list."""

    def GET(self):
        _require_admin()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            folders = self._get_knowledge_folders()
            return json.dumps({
                "status": "success",
                "data": {"folders": folders}
            }, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[PermissionsFoldersHandler] GET error: {e}")
            return json.dumps({"status": "error", "message": str(e)})

    def _get_knowledge_folders(self):
        from common.utils import expand_path
        ws_root = expand_path(conf().get("agent_workspace", "~/cow"))
        knowledge_dir = os.path.join(ws_root, "knowledge")
        folders = []
        if os.path.exists(knowledge_dir):
            for item in os.listdir(knowledge_dir):
                item_path = os.path.join(knowledge_dir, item)
                if os.path.isdir(item_path):
                    folders.append(item)
        return sorted(folders)


class PermissionsSyncUsersHandler:
    """API for syncing users from WeCom API."""

    def POST(self):
        _require_admin()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            logger.info("[PermissionsSyncUsersHandler] Syncing users from WeCom API")
            
            # 优先从企微 API 获取全量用户数据
            api_users = self._fetch_all_users_from_api()
            
            if api_users is not None:
                # API 可用 → 直接使用 API 数据（最新最准确）
                converted_users = api_users
                logger.info(f"[PermissionsSyncUsersHandler] 从企微 API 获取到 {len(converted_users)} 个用户")
            else:
                # API 不可用 → 降级到读取 wecom_user_details.json（现有逻辑）
                converted_users = self._fallback_read_file_users()
            
            if converted_users is None:
                return json.dumps({
                    "status": "error",
                    "message": "同步用户失败：企微API不可用且本地用户数据文件也不存在"
                }, ensure_ascii=False)
            
            # Save to permission config
            config_path = self._get_config_path()
            config = {}
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            
            config['users'] = converted_users
            
            # 清理 folder_permissions 和 kingdee_permissions 中的离职用户引用
            valid_userids = set(converted_users.keys())
            config = self._cleanup_invalid_user_refs(config, valid_userids)
            
            _atomic_write_json(config_path, config)
            
            # 如果数据来自 API（最新最准确），同时覆写 wecom_user_details.json 缓存
            if api_users is not None:
                self._write_clean_wecom_cache(converted_users)
            
            logger.info(f"[PermissionsSyncUsersHandler] Synced {len(converted_users)} users")
            
            return json.dumps({
                "status": "success",
                "message": f"成功同步 {len(converted_users)} 个用户",
                "data": {"count": len(converted_users)}
            }, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[PermissionsSyncUsersHandler] POST error: {e}")
            return json.dumps({"status": "error", "message": str(e)})

    def _fetch_all_users_from_api(self) -> dict:
        """
        从企微 API 获取全量用户数据，直接构建 permission config 格式的用户列表。
        
        Returns:
            dict: {userid: {name, userid, department, leader_userid}} 
                  如果 API 不可用返回 None
        """
        try:
            from channel.wechatcom.wechatcomapp_channel import WechatComAppChannel
            ch = WechatComAppChannel()
            if ch.client is None:
                logger.warning("[PermissionsSyncUsersHandler] WeCom client 不可用")
                return None

            # 1. 获取全量部门列表
            dept_list = ch.client.department.get()
            if not dept_list:
                return None

            # 2. 构建 dept_id -> {name, parentid} 映射
            dept_map = {}
            for dept in dept_list:
                dept_id = dept.get('id')
                if dept_id:
                    dept_map[dept_id] = {
                        'name': dept.get('name', ''),
                        'parentid': dept.get('parentid', 0)
                    }

            # 3. 构建 dept_id -> 完整部门路径（如 "揽盛电气/研发中心"）
            dept_paths = {}
            for dept_id in dept_map:
                parts = []
                current = dept_id
                visited = set()
                while current and current in dept_map and current not in visited:
                    visited.add(current)
                    parts.insert(0, dept_map[current]['name'])
                    parent = dept_map[current]['parentid']
                    if parent == 0 or parent == current:
                        break
                    current = parent
                dept_paths[dept_id] = '/'.join(parts)

            # 4. 获取活跃用户列表（status=1 只返回已激活成员，排除离职/禁用）
            #    注意：不能只用根部门 + fetch_child=True 拉取——企微 API 在部分部署下
            #    只返回根部门直属用户，子部门用户会全部缺失。因此改为遍历所有部门
            #    逐个拉取，再按 userid 去重（result 以 userid 为 key，天然去重）。
            user_list = []
            seen_userids = set()
            for dept in dept_list:
                dept_id = dept.get('id')
                if not dept_id:
                    continue
                try:
                    ul = ch.client.user.list(dept_id, fetch_child=False, simple=False, status=1)
                except Exception as e:
                    logger.warning(f"[PermissionsSyncUsersHandler] 拉取部门[{dept_id}]用户失败: {e}")
                    continue
                ul_users = ul.get('userlist', ul) if isinstance(ul, dict) else ul
                for u in ul_users or []:
                    uid = (u.get('userid') or '').strip()
                    if uid and uid not in seen_userids:
                        seen_userids.add(uid)
                        user_list.append(u)

            # 5. 构建 full user info dict
            result = {}
            for user in user_list:
                uid = user.get('userid', '')
                if not uid:
                    continue
                
                # 构建部门路径（取第一个部门）
                dept_ids = user.get('department', [])
                department = ''
                if dept_ids:
                    paths = [dept_paths.get(did, '') for did in dept_ids if dept_paths.get(did)]
                    department = paths[0] if paths else ''
                
                name = user.get('name', '')
                # 如果 name 为空，尝试用别名
                if not name:
                    alias = user.get('alias', '') or user.get('mobile', '') or uid
                    name = alias
                
                result[uid] = {
                    'name': name,
                    'userid': uid,
                    'department': department,
                    'leader_userid': user.get('leader_userid', '')
                }

            logger.info(f"[PermissionsSyncUsersHandler] 从企微 API 获取到 {len(result)} 个用户")
            return result

        except Exception as e:
            logger.warning(f"[PermissionsSyncUsersHandler] 从 API 获取用户失败: {e}")
            return None

    def _fallback_read_file_users(self) -> dict:
        """
        降级方案：从 wecom_user_details.json 读取用户数据。
        Returns dict 或 None（文件不存在时）。
        """
        users_path = self._get_users_path()
        if not os.path.exists(users_path):
            fallback_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
                "tmp", "wecom_user_details.json"
            )
            if os.path.exists(fallback_path):
                users_path = fallback_path
            else:
                logger.error(f"[PermissionsSyncUsersHandler] 用户数据文件不存在 (tried: {users_path}, {fallback_path})")
                return None
        
        with open(users_path, 'r', encoding='utf-8') as f:
            users_data = json.load(f)
        
        # 尝试从 API 获取部门路径（仅用于增强部门信息）
        enriched_dept = self._fetch_full_department_paths()
        
        # Convert wecom_user_details.json format to permission config format
        # wecom_user_details format: { "name": { "userid": "...", "department": "..." } }
        # permission config format: { "userid": { "name": "...", "department": "...", "userid": "..." } }
        converted_users = {}
        for name, info in users_data.items():
            userid = info.get('userid', '')
            if userid:
                department = info.get('department', '')
                if enriched_dept and userid in enriched_dept:
                    department = enriched_dept[userid]
                converted_users[userid] = {
                    'name': name,
                    'userid': userid,
                    'department': department,
                    'leader_userid': info.get('leader_userid', '')
                }
        
        # 从 API 获取了活跃用户数据时，过滤掉已离职/禁用的用户
        if enriched_dept:
            before_count = len(converted_users)
            converted_users = {uid: info for uid, info in converted_users.items() if uid in enriched_dept}
            removed_count = before_count - len(converted_users)
            if removed_count > 0:
                logger.info(f"[PermissionsSyncUsersHandler] 过滤掉 {removed_count} 个离职/禁用用户")
        
        return converted_users

    def _fetch_full_department_paths(self) -> dict:
        """
        从企微 API 获取部门树和用户详情，
        构建 userid -> 完整部门路径 的映射。
        返回 dict，key=userid, value=完整路径（如 "揽盛电气/研发中心"）。
        如果获取失败，返回空 dict。
        """
        try:
            from channel.wechatcom.wechatcomapp_channel import WechatComAppChannel
            ch = WechatComAppChannel()
            if ch.client is None:
                logger.warning("[PermissionsSyncUsersHandler] WeCom client 不可用，跳过部门路径增强")
                return {}

            # 1. 获取全量部门列表
            dept_list = ch.client.department.get()
            if not dept_list:
                return {}

            # 2. 构建 dept_id -> {name, parentid} 映射
            dept_map = {}
            for dept in dept_list:
                dept_id = dept.get('id')
                if dept_id:
                    dept_map[dept_id] = {
                        'name': dept.get('name', ''),
                        'parentid': dept.get('parentid', 0)
                    }

            # 3. 构建 dept_id -> 完整部门路径（如 "揽盛电气/研发中心"）
            dept_paths = {}
            for dept_id in dept_map:
                parts = []
                current = dept_id
                visited = set()
                while current and current in dept_map and current not in visited:
                    visited.add(current)
                    parts.insert(0, dept_map[current]['name'])
                    parent = dept_map[current]['parentid']
                    if parent == 0 or parent == current:
                        break
                    current = parent
                dept_paths[dept_id] = '/'.join(parts)

            # 4. 获取活跃用户列表（status=1 只返回已激活成员，排除离职/禁用）
            #    注意：不能只用根部门 + fetch_child=True 拉取——企微 API 在部分部署下
            #    只返回根部门直属用户，子部门用户会全部缺失。因此改为遍历所有部门
            #    逐个拉取，再按 userid 去重，确保拿到全量活跃用户（否则后续用它过滤
            #    会误删子部门用户，导致权限管理页面用户缺失）。
            user_list = []
            seen_userids = set()
            for dept in dept_list:
                dept_id = dept.get('id')
                if not dept_id:
                    continue
                try:
                    ul = ch.client.user.list(dept_id, fetch_child=False, simple=False, status=1)
                except Exception as e:
                    logger.warning(f"[PermissionsSyncUsersHandler] 拉取部门[{dept_id}]用户失败: {e}")
                    continue
                ul_users = ul.get('userlist', ul) if isinstance(ul, dict) else ul
                for u in ul_users or []:
                    uid = (u.get('userid') or '').strip()
                    if uid and uid not in seen_userids:
                        seen_userids.add(uid)
                        user_list.append(u)

            # 5. 为每个用户构建完整部门路径
            result = {}
            for user in user_list:
                uid = user.get('userid', '')
                if not uid:
                    continue
                dept_ids = user.get('department', [])
                if dept_ids:
                    paths = [dept_paths.get(did, '') for did in dept_ids if dept_paths.get(did)]
                    result[uid] = paths[0] if paths else ''  # 取第一个部门的完整路径
                else:
                    result[uid] = ''

            logger.info(f"[PermissionsSyncUsersHandler] 从企微 API 获取到 {len(result)} 个用户的部门路径（用于增强）")
            return result

        except Exception as e:
            logger.warning(f"[PermissionsSyncUsersHandler] 获取部门路径失败: {e}")
            return {}

    def _find_root_department_id(self, dept_list: list) -> int:
        """从部门列表中找到根部门 ID。"""
        for dept in dept_list:
            if dept.get("parentid", 0) == 0:
                return dept["id"]
        return dept_list[0]["id"] if dept_list else None

    def _write_clean_wecom_cache(self, users: dict):
        """
        用 API 获取的干净数据覆写 wecom_user_details.json 缓存文件，
        确保 API 降级时读取到的也是不含离职用户的数据。

        Args:
            users: {userid: {name, userid, department, leader_userid}} 
                   来自 API 的干净用户数据
        """
        cache_path = self._get_users_path()
        try:
            # 转换为 wecom_user_details.json 的格式: { name: { userid, department, leader_userid } }
            cache_data = {}
            for uid, info in users.items():
                cache_data[info['name']] = {
                    'userid': uid,
                    'department': info.get('department', ''),
                    'leader_userid': info.get('leader_userid', '')
                }
            
            os.makedirs(os.path.dirname(cache_path), exist_ok=True)
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"[PermissionsSyncUsersHandler] 已更新 wecom_user_details.json 缓存 ({len(users)} 个在职用户)")
        except Exception as e:
            logger.warning(f"[PermissionsSyncUsersHandler] 更新 wecom_user_details.json 缓存失败: {e}")

    def _cleanup_invalid_user_refs(self, config: dict, valid_userids: set) -> dict:
        """
        清理 config 中已离职用户的引用。
        
        从 folder_permissions、kingdee_permissions.user_permissions、
        direct_subordinates 和 super_admins 中移除 valid_userids 中不存在的 userid。
        """
        # 清理 folder_permissions
        folder_perms = config.get('folder_permissions', {})
        for folder in list(folder_perms.keys()):
            original = folder_perms[folder]
            folder_perms[folder] = [uid for uid in original if uid in valid_userids]
            if len(folder_perms[folder]) != len(original):
                removed = len(original) - len(folder_perms[folder])
                logger.info(f"[PermissionsSyncUsersHandler] 清理文件夹「{folder}」权限中 {removed} 个离职用户")

        # 清理 kingdee_permissions.user_permissions（含 direct_subordinates 中的离职 userid）
        kingdee_perms = config.get('kingdee_permissions', {})
        if not isinstance(kingdee_perms, dict):
            kingdee_perms = {}
            config['kingdee_permissions'] = kingdee_perms
        user_perms = kingdee_perms.get('user_permissions', {})
        removed_kd = [uid for uid in user_perms if uid not in valid_userids]
        for uid in removed_kd:
            del user_perms[uid]
        if removed_kd:
            logger.info(f"[PermissionsSyncUsersHandler] 清理金蝶权限中 {len(removed_kd)} 个离职用户: {removed_kd}")

        # 清理每个用户配置中 direct_subordinates 里的离职 userid
        for uid, perm in list(user_perms.items()):
            if not isinstance(perm, dict):
                continue
            subs = perm.get('direct_subordinates') or []
            valid_subs = [s for s in subs if s in valid_userids]
            if len(valid_subs) != len(subs):
                perm['direct_subordinates'] = valid_subs
                logger.info(f"[PermissionsSyncUsersHandler] 清理用户 {uid} 的直属下属中离职用户")

        # 清理 super_admins 中的离职 userid
        super_admins = kingdee_perms.get('super_admins') or []
        valid_admins = [s for s in super_admins if s in valid_userids]
        if len(valid_admins) != len(super_admins):
            kingdee_perms['super_admins'] = valid_admins
            logger.info(f"[PermissionsSyncUsersHandler] 清理超级账户中的离职用户")

        return config

    def _get_users_path(self):
        """Get path to wecom_user_details.json, checking multiple possible locations."""
        from common.utils import expand_path
        
        # First try configured agent_workspace
        ws_root = expand_path(conf().get("agent_workspace", "~/cow"))
        tmp_dir = os.path.join(ws_root, "tmp")
        path = os.path.join(tmp_dir, "wecom_user_details.json")
        if os.path.exists(path):
            return path
        
        # Fallback: try local tmp directory (relative to project root)
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        fallback_path = os.path.join(project_root, "tmp", "wecom_user_details.json")
        if os.path.exists(fallback_path):
            return fallback_path
        
        # Return the configured path as default (caller will handle missing file)
        return path

    def _get_config_path(self):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        tmp_dir = os.path.join(project_root, "tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        return os.path.join(tmp_dir, "permission_config.json")


class PermissionsAuditLogHandler:
    """API for getting audit log."""

    def GET(self):
        _require_admin()
        web.header('Content-Type', 'application/json; charset=utf-8')
        try:
            params = web.input(permission_type='', search='', limit='500')
            permission_type = params.permission_type.strip()
            search = params.search.strip()
            limit = int(params.limit)

            config = self._load_config()
            audit_log = config.get('audit_log', [])

            if permission_type:
                audit_log = [entry for entry in audit_log if entry.get('permission_type') == permission_type]

            if search:
                search_lower = search.lower()
                audit_log = [
                    entry for entry in audit_log
                    if search_lower in (entry.get('operator', '') or '').lower()
                    or search_lower in (entry.get('target', '') or '').lower()
                    or search_lower in (entry.get('details', '') or '').lower()
                    or search_lower in (entry.get('action', '') or '').lower()
                ]

            audit_log = audit_log[-limit:]

            return json.dumps({
                "status": "success",
                "data": {"audit_log": audit_log}
            }, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[PermissionsAuditLogHandler] GET error: {e}")
            return json.dumps({"status": "error", "message": str(e)})

    def _load_config(self):
        config_path = self._get_config_path()
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"audit_log": []}

    def _get_config_path(self):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        tmp_dir = os.path.join(project_root, "tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        return os.path.join(tmp_dir, "permission_config.json")


