"""
WeCom Webhook Send Tool - 企微机器人Webhook：发送消息到群聊
支持文本、Markdown、图片、图文、文件等多种消息类型
"""
import os
import json
import requests
from typing import Dict, Any, List, Optional
from agent.tools.base_tool import BaseTool, ToolResult
from common.log import logger


class WecomWebhookSend(BaseTool):
    """企微机器人Webhook：发送消息到群聊（支持多个群聊）"""

    name: str = "wecom_webhook_send"
    description: str = (
        "通过企微机器人Webhook，发送消息到一个或多个群聊。"
        "支持多种消息类型：文本(text)、Markdown(markdown)、图片(image)、图文(news)、文件(file)。"
        "可以指定接收的群聊名称或Webhook URL，支持同时发送到多个群聊。"
        "使用前需要先在企微群聊中添加机器人，获取Webhook URL并配置到config.json中。"
    )
    # 声明 context 属性（由 agent_stream.py 动态设置为 Agent 实例）
    context: Any = None

    params: dict = {
        "type": "object",
        "properties": {
            "message": {
                "type": "string",
                "description": "要发送的消息内容。文本或Markdown格式。",
            },
            "msgtype": {
                "type": "string",
                "enum": ["text", "markdown", "image", "news", "file"],
                "description": "消息类型。text=文本，markdown=Markdown，image=图片，news=图文，file=文件。默认text。",
                "default": "text"
            },
            "group_names": {
                "type": "array",
                "items": {"type": "string"},
                "description": "目标群聊名称列表（在config.json中配置的名称）。如果未指定，则发送到所有配置的群聊。",
            },
            "webhook_urls": {
                "type": "array",
                "items": {"type": "string"},
                "description": "（可选）直接指定Webhook URL列表。如果提供，将覆盖group_names。",
            },
            "mentions": {
                "type": "array",
                "items": {"type": "string"},
                "description": "（可选）要@的成员userid列表。仅对text和markdown消息有效。",
            },
            "file_path": {
                "type": "string",
                "description": "（可选）要发送的文件路径。仅对file类型有效。",
            },
            "image_path": {
                "type": "string",
                "description": "（可选）要发送的图片路径。仅对image类型有效。",
            },
            "news_articles": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                        "url": {"type": "string"},
                        "picurl": {"type": "string"}
                    }
                },
                "description": "（可选）图文消息的文章列表。仅对news类型有效。",
            },
        },
        "required": ["message"]
    }

    def __init__(self, config: dict = None):
        self.config = config or {}
        self.cwd = self.config.get("cwd", os.getcwd())

    def execute(self, args: Dict[str, Any]) -> ToolResult:
        message: str = args.get("message", "").strip()
        msgtype: str = args.get("msgtype", "text")
        group_names: List[str] = args.get("group_names", [])
        webhook_urls: List[str] = args.get("webhook_urls", [])
        mentions: List[str] = args.get("mentions", [])
        file_path: str = args.get("file_path", "").strip()
        image_path: str = args.get("image_path", "").strip()
        news_articles: List[dict] = args.get("news_articles", [])

        if not message and msgtype not in ["image", "file", "news"]:
            return ToolResult.fail("Error: 必须提供 message 参数")

        # 获取Webhook URLs
        if webhook_urls:
            # 直接使用提供的URL
            target_webhooks = webhook_urls
        else:
            # 从配置中读取
            target_webhooks = self._get_webhook_urls(group_names)
            if not target_webhooks:
                return ToolResult.fail(
                    "Error: 未找到有效的Webhook URL。"
                    "请在config.json中配置 wecom_webhook.urls，或直接提供webhook_urls参数。"
                )

        # 根据消息类型构建payload
        try:
            if msgtype == "text":
                payload = self._build_text_payload(message, mentions)
            elif msgtype == "markdown":
                payload = self._build_markdown_payload(message)
            elif msgtype == "image":
                payload = self._build_image_payload(image_path)
            elif msgtype == "news":
                payload = self._build_news_payload(news_articles)
            elif msgtype == "file":
                # 文件需要先上传到企微，获取media_id
                return ToolResult.fail("文件发送功能需要先上传文件到企微，当前版本暂不支持。请使用text或markdown类型。")
            else:
                return ToolResult.fail(f"Error: 不支持的消息类型: {msgtype}")

            # 发送到所有目标Webhook
            results = self._send_to_webhooks(target_webhooks, payload)

            # 汇总结果
            success_count = sum(1 for r in results if r["success"])
            fail_count = len(results) - success_count

            if success_count == 0:
                error_msgs = [r["error"] for r in results if not r["success"]]
                return ToolResult.fail(f"所有发送都失败了: {'; '.join(error_msgs)}")

            summary = f"成功发送到 {success_count} 个群聊"
            if fail_count > 0:
                summary += f"，{fail_count} 个群聊发送失败"

            return ToolResult.success({
                "summary": summary,
                "success_count": success_count,
                "fail_count": fail_count,
                "results": results
            })

        except Exception as e:
            logger.error(f"[WecomWebhookSend] 发送失败: {e}")
            return ToolResult.fail(f"发送失败: {str(e)}")

    def _get_webhook_urls(self, group_names: List[str] = None) -> List[str]:
        """
        从配置中读取Webhook URLs
        配置格式（config.json）：
        {
            "wecom_webhook": {
                "urls": {
                    "群组名称1": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx1",
                    "群组名称2": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx2"
                }
            }
        }
        """
        try:
            # 从config.json读取配置
            config_path = os.path.join(os.getcwd(), "config.json")
            if not os.path.exists(config_path):
                logger.error(f"[WecomWebhookSend] 配置文件不存在: {config_path}")
                return []

            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)

            wecom_webhook_config = config.get("wecom_webhook", {})
            urls_config = wecom_webhook_config.get("urls", {})

            if not urls_config:
                logger.warning("[WecomWebhookSend] config.json中未配置 wecom_webhook.urls")
                return []

            # 如果指定了group_names，只返回指定的URL
            if group_names:
                target_urls = []
                for group_name in group_names:
                    if group_name in urls_config:
                        target_urls.append(urls_config[group_name])
                    else:
                        logger.warning(f"[WecomWebhookSend] 未找到群聊配置: {group_name}")
                return target_urls
            else:
                # 未指定group_names，返回所有URL
                return list(urls_config.values())

        except Exception as e:
            logger.error(f"[WecomWebhookSend] 读取Webhook配置失败: {e}")
            return []

    def _build_text_payload(self, content: str, mentioned_list: List[str] = None) -> dict:
        """构建文本消息payload"""
        payload = {
            "msgtype": "text",
            "text": {
                "content": content
            }
        }
        if mentioned_list:
            payload["text"]["mentioned_list"] = mentioned_list
        return payload

    def _build_markdown_payload(self, content: str) -> dict:
        """构建Markdown消息payload"""
        return {
            "msgtype": "markdown",
            "markdown": {
                "content": content
            }
        }

    def _build_image_payload(self, image_path: str) -> dict:
        """构建图片消息payload"""
        if not image_path or not os.path.exists(image_path):
            raise ValueError(f"图片文件不存在: {image_path}")

        # 读取图片并转为base64
        import base64
        with open(image_path, "rb") as f:
            image_data = f.read()
            base64_data = base64.b64encode(image_data).decode('utf-8')

        # 计算md5
        import hashlib
        md5_hash = hashlib.md5(image_data).hexdigest()

        return {
            "msgtype": "image",
            "image": {
                "base64": base64_data,
                "md5": md5_hash
            }
        }

    def _build_news_payload(self, articles: List[dict]) -> dict:
        """构建图文消息payload"""
        if not articles:
            raise ValueError("图文消息必须提供articles参数")

        return {
            "msgtype": "news",
            "news": {
                "articles": articles
            }
        }

    def _send_to_webhooks(self, webhook_urls: List[str], payload: dict) -> List[dict]:
        """
        发送消息到多个Webhook URL
        返回结果列表：[{"url": "...", "success": True/False, "error": "..."}]
        """
        results = []

        for url in webhook_urls:
            try:
                response = requests.post(
                    url,
                    json=payload,
                    timeout=10
                )
                response.raise_for_status()
                result = response.json()

                if result.get("errcode") == 0:
                    results.append({
                        "url": url,
                        "success": True,
                        "response": result
                    })
                    logger.info(f"[WecomWebhookSend] 发送成功: {url}")
                else:
                    error_msg = f"errcode={result.get('errcode')}, errmsg={result.get('errmsg')}"
                    results.append({
                        "url": url,
                        "success": False,
                        "error": error_msg
                    })
                    logger.error(f"[WecomWebhookSend] 发送失败: {url}, {error_msg}")

            except Exception as e:
                results.append({
                    "url": url,
                    "success": False,
                    "error": str(e)
                })
                logger.error(f"[WecomWebhookSend] 发送异常: {url}, {e}")

        return results
