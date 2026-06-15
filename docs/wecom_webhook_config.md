# 企微机器人Webhook配置说明

## 功能介绍

通过企微机器人Webhook，可以发送消息到企微群聊（支持内部群和外部群）。

## 配置步骤

### 1. 获取Webhook URL

1. 打开企微客户端，进入目标群聊
2. 点击右上角 `...` → `添加群机器人`
3. 设置机器人名称和头像
4. 创建成功后，会生成一个Webhook URL，格式如下：
   ```
   https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
5. 复制这个URL并保存

### 2. 配置config.json

在项目的 `config.json` 文件中添加以下配置：

```json
{
  "wecom_webhook": {
    "urls": {
      "群组名称1": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx1",
      "群组名称2": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx2"
    }
  }
}
```

**说明：**
- `群组名称1`、`群组名称2` 是你自己定义的名称，用于在使用工具时指定目标群聊
- 可以配置多个群聊，工具支持同时发送到多个群聊

### 3. 使用示例

配置完成后，AI可以通过 `wecom_webhook_send` 工具发送消息到群聊。

#### 示例1：发送文本消息到所有配置的群聊

```json
{
  "tool": "wecom_webhook_send",
  "args": {
    "message": "大家好，这是一条测试消息！",
    "msgtype": "text"
  }
}
```

#### 示例2：发送Markdown消息到指定群聊

```json
{
  "tool": "wecom_webhook_send",
  "args": {
    "message": "## 标题\n这是**加粗**文本，这是[链接](https://example.com)",
    "msgtype": "markdown",
    "group_names": ["群组名称1"]
  }
}
```

#### 示例3：发送消息并@指定成员

```json
{
  "tool": "wecom_webhook_send",
  "args": {
    "message": "@张三 请查收文件",
    "msgtype": "text",
    "mentions": ["zhangsan"]
  }
}
```

## 支持的消息类型

| 类型 | 说明 | 必需参数 |
|------|------|----------|
| `text` | 纯文本消息 | `message` |
| `markdown` | Markdown格式消息 | `message` |
| `image` | 图片消息 | `image_path` |
| `news` | 图文消息 | `news_articles` |
| `file` | 文件消息 | `file_path` (暂不支持) |

## 注意事项

1. **Webhook URL保密**：Webhook URL相当于机器人的"密钥"，不要泄露给他人
2. **消息频率限制**：企微Webhook有调用频率限制，请勿短时间内大量发送
3. **群聊权限**：只有群主或管理员才能添加机器人
4. **外部群支持**：Webhook机器人支持外部群（包含微信用户的群聊）

## 故障排查

### 发送失败

如果发送失败，请检查：
1. Webhook URL是否正确（复制完整，无多余空格）
2. 群聊中的机器人是否被删除
3. 网络连接是否正常
4. 是否触发了频率限制

### 工具未加载

如果AI无法使用 `wecom_webhook_send` 工具，请检查：
1. `agent/tools/wechatcom/wecom_webhook_send.py` 文件是否存在
2. `agent/tools/__init__.py` 中是否注册了该工具
3. `agent/tools/wechatcom/__init__.py` 中是否导出了该类
4. 查看日志中是否有加载失败的错误信息
