# 权限管理功能测试检查清单

## 前端页面测试

### 1. 侧边栏菜单
- [ ] 登录后，侧边栏显示"权限"菜单项
- [ ] 点击"权限"菜单项，切换到权限管理页面
- [ ] 权限管理页面显示三个 Tab：知识库权限、金蝶权限、审计日志

### 2. 知识库权限 Tab
- [ ] 显示文件夹列表（按文件夹查看模式）
- [ ] 显示用户列表（按用户查看模式）
- [ ] 可以切换查看模式（点击"按文件夹查看" / "按用户查看"按钮）
- [ ] 点击"编辑"按钮，打开文件夹权限编辑模态框
- [ ] 在模态框中，可以勾选/取消勾选用户
- [ ] 点击"保存"按钮，保存文件夹权限
- [ ] 页面刷新，显示更新后的权限
- [ ] 按部门筛选功能正常工作
- [ ] 搜索功能正常工作

### 3. 金蝶权限 Tab
- [ ] 显示用户列表
- [ ] 显示每个用户的金蝶权限状态
- [ ] 可以勾选/取消勾选"启用金蝶权限"
- [ ] 可以选择权限范围（仅自己 / 自己及下属）
- [ ] 点击"编辑"按钮，打开金蝶权限编辑模态框
- [ ] 在模态框中，可以修改权限设置
- [ ] 点击"保存"按钮，保存金蝶权限
- [ ] 页面刷新，显示更新后的权限
- [ ] 按部门筛选功能正常工作
- [ ] 搜索功能正常工作

### 4. 审计日志 Tab
- [ ] 显示权限变更记录
- [ ] 可以按权限类型筛选（所有类型 / 知识库权限 / 金蝶权限）
- [ ] 搜索功能正常工作
- [ ] 显示完整的审计信息（时间、操作人、操作类型、权限类型、操作对象、详情）

### 5. 用户同步
- [ ] 点击"同步用户"按钮
- [ ] 显示确认对话框
- [ ] 确认后，调用同步 API
- [ ] 显示同步结果

## 后端 API 测试

### 1. 权限配置 API
```bash
# 获取权限配置
curl http://localhost:19898/api/permissions/config

# 更新权限配置
curl -X POST http://localhost:19898/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{
    "folder_permissions": {
      "测试文件夹": ["user1", "user2"]
    },
    "kingdee_permissions": {
      "user_permissions": {
        "user1": {"enabled": true, "scope": "self"}
      }
    }
  }'
```

### 2. 用户列表 API
```bash
# 获取所有用户
curl http://localhost:19898/api/permissions/users

# 按部门筛选用户
curl "http://localhost:19898/api/permissions/users?department=研发中心"
```

### 3. 文件夹列表 API
```bash
# 获取知识库文件夹列表
curl http://localhost:19898/api/permissions/folders
```

### 4. 审计日志 API
```bash
# 获取所有审计日志
curl http://localhost:19898/api/permissions/audit-log

# 按权限类型筛选
curl "http://localhost:19898/api/permissions/audit-log?permission_type=knowledge"

# 限制返回数量
curl "http://localhost:19898/api/permissions/audit-log?limit=10"
```

### 5. 用户同步 API
```bash
# 同步用户
curl -X POST http://localhost:19898/api/permissions/sync-users
```

## 权限配置文件测试

### 1. 检查配置文件结构
```bash
# 查看权限配置文件
cat tmp/permission_config.json
```

预期结构：
```json
{
  "knowledge_permissions": {
    "folder_permissions": {}
  },
  "kingdee_permissions": {
    "default_strategy": "deny",
    "user_permissions": {}
  },
  "folder_permissions": {},
  "audit_log": []
}
```

### 2. 修改权限后检查配置
- [ ] 通过前端页面修改文件夹权限
- [ ] 检查 `tmp/permission_config.json` 文件，确认 `folder_permissions` 已更新
- [ ] 通过前端页面修改金蝶权限
- [ ] 检查 `tmp/permission_config.json` 文件，确认 `kingdee_permissions` 已更新
- [ ] 进行权限修改操作
- [ ] 检查 `tmp/permission_config.json` 文件，确认 `audit_log` 已记录

## 权限检查逻辑测试（待实现）

### 1. 知识库权限检查
- [ ] 用户无权访问知识库时，返回错误提示
- [ ] 用户有权访问知识库时，正常返回查询结果
- [ ] 用户只能访问有权限的文件夹

### 2. 金蝶权限检查
- [ ] 用户无权使用金蝶时，返回错误提示
- [ ] 用户有权使用金蝶时，正常返回查询结果
- [ ] 领导可以查看下属的数据

## 常见问题排查

### 1. 页面无法显示
- 检查 `chat.html` 中是否添加了权限管理页面的 HTML
- 检查 `permissions.js` 文件是否存在
- 检查浏览器控制台是否有错误

### 2. API 调用失败
- 检查 `web_channel.py` 中是否添加了权限管理 API 的 URL 路由
- 检查 Handler 类是否定义正确
- 检查浏览器控制台的网络请求，查看错误信息

### 3. 权限配置不生效
- 检查 `tmp/permission_config.json` 文件是否存在
- 检查文件权限，确保可以读写
- 检查 JSON 格式是否正确

### 4. 用户列表为空
- 检查 `tmp/wecom_user_details.json` 文件是否存在
- 检查文件内容格式是否正确
- 检查 API 是否返回正确的数据

## 测试环境准备

### 1. 准备测试数据
- 确保 `tmp/wecom_user_details.json` 文件中有用户数据
- 确保 `workspace/knowledge/` 目录下有文件夹

### 2. 启动服务
```bash
cd d:/LandShrAgent/LandShrAgent-copy/CowAgent
python app.py
```

### 3. 访问页面
打开浏览器，访问 `http://localhost:19898/chat`，登录后测试权限管理功能

## 测试报告模板

### 测试结果
- 前端页面测试：✅ / ❌
- 后端 API 测试：✅ / ❌
- 权限配置文件测试：✅ / ❌
- 权限检查逻辑测试：✅ / ❌（待实现）

### 发现的问题
1. 问题1：描述
2. 问题2：描述

### 建议和改进
1. 建议1
2. 建议2
