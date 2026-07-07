---
name: 权限管理页面设计与实现（更新版）
overview: 为 CowAgent 项目新增权限管理页面，管理企微用户访问知识库和使用金蝶的权限。支持按部门筛选用户、显示审计日志、金蝶权限支持层级查看（领导可看手下数据）。基于现有的 permission_config.json 和 wecom_user_details.json，新增前端页面、后端 API 和权限检查逻辑。
design:
  architecture:
    framework: html
  styleKeywords:
    - Dark Mode
    - Admin Panel
    - Data Table
    - Toggle Switch
    - Enterprise
  fontSystem:
    fontFamily: Inter
    heading:
      size: 20px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#35A85B"
      - "#228547"
      - "#1C6B3B"
    background:
      - "#111111"
      - "#1A1A1A"
      - "#0A0A0A"
    text:
      - "#FFFFFF"
      - "#E2E8F0"
      - "#94A3B8"
    functional:
      - "#35A85B"
      - "#EF4444"
      - "#F59E0B"
      - "#3B82F6"
todos:
  - id: add-sidebar-menu
    content: 在chat.html的管理组菜单中添加"权限"菜单项（第189行后）
    status: pending
  - id: add-permissions-view
    content: 在chat.html中添加权限管理视图容器（view-permissions）
    status: pending
    dependencies:
      - add-sidebar-menu
  - id: add-view-meta
    content: 在console.js的VIEW_META中添加permissions视图元数据（第714行后）
    status: pending
    dependencies:
      - add-permissions-view
  - id: add-navigation-hook
    content: 在console.js中添加权限视图的导航钩子和懒加载逻辑
    status: pending
    dependencies:
      - add-view-meta
  - id: implement-permissions-api
    content: 在web_channel.py中添加PermissionsHandler类和API端点
    status: pending
  - id: add-url-routes
    content: 在web_channel.py的urls元组中注册权限管理路由
    status: pending
    dependencies:
      - implement-permissions-api
  - id: implement-frontend-logic
    content: 在console.js中实现权限管理的前端逻辑（loadPermissionsView、renderUserTable等）
    status: pending
    dependencies:
      - add-navigation-hook
  - id: add-i18n-text
    content: 在console.js的I18N对象中添加权限管理相关的多语言文本
    status: pending
    dependencies:
      - implement-frontend-logic
  - id: implement-permission-check
    content: 在消息处理流程中添加权限检查逻辑（知识库和金蝶）
    status: pending
    dependencies:
      - implement-permissions-api
  - id: test-permissions-page
    content: 测试权限管理页面功能，验证用户列表加载、权限切换、配置保存和审计日志
    status: pending
    dependencies:
      - add-i18n-text
      - implement-permission-check
---

## 产品概述

为揽盛电气智能体控制台新增权限管理页面，用于管理企微用户访问知识库和使用金蝶查询功能的权限。

## 核心功能

1. **企微用户管理**：展示所有企微用户列表，支持查看用户姓名、别名、部门信息
2. **知识库权限管理**：管理哪些企微用户可以访问知识库，支持单个用户授权/撤销、批量操作
3. **金蝶权限管理**：管理哪些企微用户可以使用金蝶查询功能，支持单个用户授权/撤销、批量操作，支持层级查看（领导可见手下员工数据）
4. **权限配置持久化**：将权限配置保存到`tmp/permission_config.json`文件
5. **用户数据同步**：从企微获取最新用户数据并更新`tmp/wecom_user_details.json`
6. **审计日志**：记录权限变更的历史记录
7. **按部门筛选**：支持按部门筛选用户列表

## 技术栈选择

- **前端**：HTML + Tailwind CSS + Vanilla JavaScript（与现有chat.html保持一致）
- **后端**：Python web.py框架（与现有web_channel.py保持一致）
- **数据存储**：JSON文件（与现有配置存储方式保持一致）

## 数据结构调整

### 1. 扩展 wecom_user_details.json 结构

添加 `leader_userid` 字段以支持金蝶权限的层级查看：

```
{
  "尼娅-Niya": {
    "userid": "TangFangPing",
    "department": "揽盛电气",
    "leader_userid": ""
  },
  "乐金辉": {
    "userid": "YueJinHui",
    "department": "总经办",
    "leader_userid": "TangFangPing"
  }
}
```

### 2. 扩展 permission_config.json 结构

添加审计日志配置和金蝶权限范围：

```
{
  "knowledge_permissions": {
    "default_folder_users": ["web_admin"]
  },
  "kingdee_permissions": {
    "default_strategy": "deny",
    "user_permissions": {
      "TangFangPing": {"enabled": true, "scope": "self"},
      "YueJinHui": {"enabled": true, "scope": "self_and_subordinates"}
    }
  },
  "folder_permissions": {},
  "audit_log": [
    {
      "timestamp": "2026-06-25T14:36:00",
      "operator": "admin",
      "action": "grant",
      "target_user": "TangFangPing",
      "permission_type": "kingdee",
      "details": "启用金蝶权限，范围：仅自己"
    }
  ]
}
```

## 实施方案

### 1. 后端API设计

在`channel/web/web_channel.py`中添加以下API端点：

- `GET /api/permissions` - 获取权限配置和用户列表
- `POST /api/permissions/knowledge/grant` - 授权知识库权限
- `POST /api/permissions/knowledge/revoke` - 撤销知识库权限
- `POST /api/permissions/kingdee/grant` - 授权金蝶权限
- `POST /api/permissions/kingdee/revoke` - 撤销金蝶权限
- `POST /api/permissions/sync-users` - 同步企微用户数据
- `GET /api/permissions/audit-log` - 获取审计日志

### 2. 后端Handler实现

新增`PermissionsHandler`类，包含以下方法：

- `GET()` - 返回当前权限配置和用户列表
- `POST()` - 处理权限变更请求（通过解析path实现）

权限数据操作封装在独立的函数中：

- `_load_permission_config()` - 加载权限配置
- `_save_permission_config(data)` - 保存权限配置
- `_load_wecom_users()` - 加载企微用户数据
- `_sync_wecom_users()` - 从企微API同步用户数据
- `_add_audit_log()` - 添加审计日志记录

### 3. URL路由注册

在`web_channel.py`的`urls`元组中注册新路由（第1204行前）：

```python
'/api/permissions', 'PermissionsHandler',
'/api/permissions/(.*)', 'PermissionsHandler',
```

### 4. 前端页面设计

在`chat.html`中添加（第189行后，Monitor Group前）：

- 侧边栏菜单项：在"管理"组下添加"权限"菜单项
- 视图容器：添加`view-permissions`视图
- i18n文本：添加权限管理相关的多语言文本

在`console.js`中添加（第714行后）：

- VIEW_META注册：添加`permissions`视图元数据
- 导航钩子：添加权限视图的懒加载逻辑
- 权限管理功能函数：`loadPermissionsView()`、`renderUserTable()`等

### 5. 权限检查逻辑

在`channel/wechatcom/wechatcomapp_channel.py`的消息处理流程中添加权限检查：

- 知识库权限检查：在处理知识库查询前检查用户是否在`knowledge_permissions.default_folder_users`列表中
- 金蝶权限检查：在处理金蝶查询前检查用户是否在`kingdee_permissions.user_permissions`中且enabled=true
- 权限不足时返回错误提示

## 目录结构

```
channel/web/
├── chat.html                          [MODIFY] 添加权限管理视图和菜单项（第189行后）
├── static/js/console.js               [MODIFY] 添加权限管理前端逻辑（第714行后添加VIEW_META）
└── web_channel.py                     [MODIFY] 添加权限管理API端点（第1204行前添加路由）
tmp/
├── permission_config.json              [MODIFY] 扩展权限配置结构
├── wecom_user_details.json            [MODIFY] 添加leader_userid字段
└── permission_audit.log              [NEW] 审计日志文件
```

## 设计风格

采用与现有控制台一致的设计风格，使用暗色主题（dark mode），保持界面统一性和专业性。

## 页面布局

### 权限管理页面整体结构

页面分为两个主要功能区，使用标签页（Tabs）切换：

1. **知识库权限**标签页
2. **金蝶权限**标签页

### 页面头部区块

- 标题："权限管理"
- 描述："管理企微用户访问知识库和使用金蝶的权限"
- 操作按钮：
- "同步用户"按钮（从企微刷新用户列表）
- "保存配置"按钮（保存权限修改）

### 用户列表表格区块

表格包含以下列：

- 复选框（支持批量操作）
- 用户姓名
- 用户别名/UserID
- 部门（支持筛选）
- 知识库权限状态（开关切换）
- 金蝶权限状态（开关切换）
- 金蝶权限范围（下拉选择：仅自己/自己及下属）

### 批量操作栏区块

- 显示已选用户数量
- "批量授权知识库"按钮
- "批量撤销知识库"按钮
- "批量授权金蝶"按钮
- "批量撤销金蝶"按钮

### 审计日志区块

- 显示权限变更的历史记录
- 包含操作时间、操作人、操作类型、操作对象、权限类型

### 交互设计

- 使用Toggle开关组件切换权限状态
- 权限变更后自动保存到后端（防抖处理，延迟1秒）
- 表格支持按部门筛选（下拉选择）
- 表格支持按姓名搜索（输入框实时筛选）

## Agent Extensions

无相关扩展工具需要使用。本方案主要基于项目现有代码结构和模式进行实现。