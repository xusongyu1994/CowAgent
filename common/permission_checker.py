#!/usr/bin/env python3
# -*- coding=utf-8 -*-
"""
权限检查模块

用于在消息处理时检查用户是否有权访问知识库或使用金蝶。
"""

import json
import logging
import os
from typing import Dict, List, Optional

from common.utils import expand_path

logger = logging.getLogger(__name__)

# Web 管理员的 session ID 前缀
WEB_ADMIN_SESSION_PREFIX = 'session_'


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
    """Load permission config from file."""
    config_path = _get_config_path()
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"[PermissionChecker] Failed to load config: {e}")
            return {}
    return {}


def is_permissions_enabled() -> bool:
    """
    检查权限管理是否启用。
    由 UI 开关直接控制，读取 permission_config.json 中的 enabled 字段。
    
    Returns:
        bool: 如果启用返回True，否则返回False（默认关闭）
    """
    config = _load_config()
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


def check_kingdee_permission(userid: str) -> tuple[bool, str, str]:
    """
    检查用户是否有权使用金蝶。
    
    Args:
        userid: 用户ID
    
    Returns:
        (allowed, scope, message): 是否允许访问、权限范围、提示消息
    """
    # 如果权限管理未启用，默认允许访问
    if not is_permissions_enabled():
        return True, 'all', ""

    # web 管理员（session_ 开头的用户）拥有所有权限
    if _is_admin_user(userid):
        return True, 'all', ""

    config = _load_config()
    kingdee_permissions = config.get('kingdee_permissions', {})
    user_permissions = kingdee_permissions.get('user_permissions', {})
    
    # 检查用户权限
    user_perm = user_permissions.get(userid)
    if user_perm and user_perm.get('enabled'):
        return True, user_perm.get('scope', 'self'), ""
    
    # 检查是否是上级（可以查看下属数据）
    for uid, perm in user_permissions.items():
        if perm.get('enabled') and perm.get('scope') == 'self_and_subordinates':
            # TODO: 检查 userid 是否是 uid 的下属
            # 这需要 wecom_user_details.json 中有 leader_userid 字段
            pass
    
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


def get_user_subordinates(userid: str) -> List[str]:
    """
    获取用户的下属列表（用于金蝶权限层级查看）。
    
    Args:
        userid: 用户ID
    
    Returns:
        下属的用户ID列表
    """
    # TODO: 实现获取下属列表的逻辑
    # 这需要读取 wecom_user_details.json 并查找 leader_userid = userid 的用户
    return []
