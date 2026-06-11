"""
WeCom App Send Tool - 企微自建应用：发送消息或文件给指定用户（支持多个）
支持中文姓名自动解析为 UserID
"""
import os
import re
import json
import time
from typing import Dict, Any, List, Optional, Tuple
from agent.tools.base_tool import BaseTool, ToolResult
from common.log import logger


class WecomAppSend(BaseTool):
    """企微自建应用：发送消息或文件给指定用户（支持多个接收者，支持中文姓名）"""

    name: str = "wecom_app_send"
    description: str = (
        "通过企微自建应用，发送消息或文件给一个或多个企微用户。"
        "可以发送纯文本消息，也可以发送本地文件（图片、文档、视频等）。"
        "接收者可以是企微的 userid（英文/数字），也可以是中文姓名（工具会自动查通讯录解析为userid）。"
        "支持多个接收者，会批量发送。"
        "注意：此工具仅在 wechatcom_app 渠道下可用。"
    )
    # 声明 context 属性（由 agent_stream.py 动态设置为 Agent 实例）
    context: Any = None

    params: dict = {
        "type": "object",
        "properties": {
            "receivers": {
                "type": "array",
                "items": {"type": "string"},
                "description": "接收者的企微 userid 列表，或中文姓名列表，例如：[\"zhangsan\", \"lisi\"] 或 [\"张三\", \"李四\"]。至少提供一个。",
            },
            "message": {
                "type": "string",
                "description": "要发送的文本消息内容。如果只发文件可不填。文本超过2048字节会自动拆分。",
            },
            "file_path": {
                "type": "string",
                "description": "（可选）要发送的本地文件路径。支持图片、文档等。",
            },
        },
        "required": ["receivers"]
    }

    # 内存缓存：姓名→userid 映射
    _name_mapping: Optional[Dict[str, str]] = None
    _mapping_cache_time: float = 0
    _mapping_cache_ttl: int = 86400  # 24小时缓存

    def __init__(self, config: dict = None):
        self.config = config or {}
        self.cwd = self.config.get("cwd", os.getcwd())

    def execute(self, args: Dict[str, Any]) -> ToolResult:
        receivers: List[str] = args.get("receivers", [])
        message: str = args.get("message", "").strip()
        file_path: str = args.get("file_path", "").strip()

        if not receivers:
            return ToolResult.fail("Error: receivers 不能为空")

        if not message and not file_path:
            return ToolResult.fail("Error: 必须提供 message 或 file_path 之一")

        # 获取渠道实例
        channel = self._get_channel()
        if not channel:
            return ToolResult.fail(
                "Error: 无法获取企微自建应用渠道实例，请确认 wechatcom_app 渠道已正确启动"
            )

        # 解析 receivers：中文姓名 → userid
        user_ids_list, errors = self._resolve_receivers(receivers, channel)
        if errors:
            # 有解析失败的，返回错误并列出已知姓名
            known_names = self._get_known_names()
            error_msg = "；".join(errors)
            if known_names:
                error_msg += f"。已知通讯录姓名：{', '.join(sorted(known_names))}"
            return ToolResult.fail(error_msg)

        if not user_ids_list:
            return ToolResult.fail("Error: 有效的接收者为空")

        agent_id = channel.agent_id
        client = channel.client

        # 获取发送者身份（通过 self.context 拿到 Agent 实例）
        sender_name = self._get_sender_name()

        try:
            # 发送文本
            if message:
                # 在消息正文前附加发送者信息
                text_to_send = self._add_sender_prefix(message, sender_name)

                from common.utils import split_string_by_utf8_length
                MAX_UTF8_LEN = 2048
                texts = split_string_by_utf8_length(text_to_send, MAX_UTF8_LEN)
                for i, txt in enumerate(texts):
                    client.message.send_text(agent_id, user_ids_list, txt)
                    if i != len(texts) - 1:
                        time.sleep(0.5)
                logger.info(f"[WecomAppSend] 文本已发送给: {user_ids_list}, 发送者: {sender_name}")

                # 注入消息到接收者的 AI 上下文
                self._inject_message_to_receivers(
                    user_ids_list, message, sender_name, channel, is_file=False
                )

            # 发送文件
            if file_path:
                abs_path = self._resolve_path(file_path)
                if not os.path.exists(abs_path):
                    return ToolResult.fail(f"Error: 文件不存在: {file_path}")

                # 发送文件前，先发一条文本说明是谁发的
                if sender_name:
                    sender_hint = f"📎 以下是 {sender_name} 给您发送的文件："
                    client.message.send_text(agent_id, user_ids_list, sender_hint)
                    time.sleep(0.3)

                ext = os.path.splitext(abs_path)[1].lower()
                if ext in ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'):
                    media_type = "image"
                elif ext in ('.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'):
                    media_type = "voice"
                elif ext in ('.mp4', '.avi', '.mov', '.mkv', '.webm'):
                    media_type = "video"
                else:
                    media_type = "file"

                with open(abs_path, "rb") as f:
                    resp = client.media.upload(media_type, f)
                media_id = resp.get("media_id")
                if not media_id:
                    return ToolResult.fail("Error: 文件上传失败，未获取到 media_id")

                if media_type == "image":
                    client.message.send_image(agent_id, user_ids_list, media_id)
                elif media_type == "voice":
                    client.message.send_voice(agent_id, user_ids_list, media_id)
                elif media_type == "video":
                    client.message.send_video(agent_id, user_ids_list, media_id)
                else:
                    client.message.send_file(agent_id, user_ids_list, media_id)

                logger.info(f"[WecomAppSend] 文件({media_type})已发送给: {user_ids_list}, media_id={media_id}, 发送者: {sender_name}")

                # 注入文件消息到接收者的 AI 上下文
                file_name = os.path.basename(abs_path) if abs_path else ""
                self._inject_message_to_receivers(
                    user_ids_list, message or "文件", sender_name, channel, is_file=True, file_name=file_name
                )

            return ToolResult.success({
                "summary": f"已成功发送给 {len(user_ids_list)} 个接收者: {', '.join(user_ids_list)}",
                "receivers": user_ids_list,
            })

        except Exception as e:
            logger.error(f"[WecomAppSend] 发送失败: {e}")
            return ToolResult.fail(f"发送失败: {str(e)}")

    def _resolve_receivers(self, receivers: List[str], channel) -> Tuple[List[str], List[str]]:
        """
        解析接收者列表：
        - 若 receiver 含中文字符，则查通讯录映射表转为 userid
        - 若 receiver 是纯英文/数字，则原样当作 userid
        返回：(user_ids_list, errors)
        """
        # 确保映射表已加载
        self._ensure_name_mapping(channel)

        user_ids = []
        errors = []
        # 匹配是否含中文字符
        chinese_pattern = re.compile(r'[\u4e00-\u9fff]')

        for r in receivers:
            r = r.strip()
            if not r:
                continue
            # 含中文，尝试按姓名查
            if chinese_pattern.search(r):
                userid = self._name_mapping.get(r) if self._name_mapping else None
                if userid:
                    user_ids.append(userid)
                else:
                    errors.append(f"找不到用户「{r}」的UserID，请确认姓名是否正确")
            else:
                # 不含中文，直接当作 userid
                user_ids.append(r)

        return user_ids, errors

    def _ensure_name_mapping(self, channel):
        """确保姓名映射表已加载（内存缓存 + 文件缓存）"""
        now = time.time()

        # 内存缓存有效，直接返回
        if self._name_mapping is not None and (now - self._mapping_cache_time) < self._mapping_cache_ttl:
            return

        # 尝试从文件缓存加载（使用绝对路径）
        tmp_dir = os.path.join(os.getcwd(), "tmp")
        cache_file = os.path.join(tmp_dir, "wecom_name_mapping.json")
        if os.path.exists(cache_file):
            try:
                mtime = os.path.getmtime(cache_file)
                if (now - mtime) < self._mapping_cache_ttl:
                    with open(cache_file, "r", encoding="utf-8") as f:
                        self._name_mapping = json.load(f)
                        self._mapping_cache_time = mtime
                        logger.info(f"[WecomAppSend] 从缓存加载姓名映射，共 {len(self._name_mapping)} 条")
                        return
            except Exception as e:
                logger.warning(f"[WecomAppSend] 读取缓存失败: {e}")

        # 缓存无效，调用 API 重建映射
        self._build_name_mapping(channel, cache_file)
        # 只有成功建立了映射（非空）才更新缓存时间
        if self._name_mapping:
            self._mapping_cache_time = now

    def _build_name_mapping(self, channel, cache_file: str):
        """
        调用企微通讯录 API 获取全量用户，建立 姓名→userid 映射
        """
        try:
            client = channel.client

            # 1. 获取根部门 ID（department.get(id=None) 返回全量部门列表）
            dept_list = client.department.get()
            root_dept_id = self._find_root_department_id(dept_list)
            if not root_dept_id:
                logger.error("[WecomAppSend] 无法找到根部门 ID")
                return

            logger.info(f"[WecomAppSend] 根部门 ID: {root_dept_id}，开始拉取全量用户...")

            # 2. 拉取全量用户（含子部门）
            user_list = client.user.list(root_dept_id, fetch_child=True, simple=False)
            # user_list 是 list of dict，每个 dict 含 userid 和 name

            mapping = {}
            for user in user_list:
                name = user.get("name", "").strip()
                userid = user.get("userid", "").strip()
                if name and userid:
                    mapping[name] = userid

            self._name_mapping = mapping
            logger.info(f"[WecomAppSend] 姓名映射建立完成，共 {len(mapping)} 条")

            # 3. 写入缓存文件
            try:
                os.makedirs(os.path.dirname(cache_file), exist_ok=True)
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(mapping, f, ensure_ascii=False, indent=2)
                logger.info(f"[WecomAppSend] 姓名映射已缓存到 {cache_file}")
            except Exception as e:
                logger.warning(f"[WecomAppSend] 写入缓存文件失败: {e}")

        except Exception as e:
            logger.error(f"[WecomAppSend] 建立姓名映射失败: {e}")

    def _find_root_department_id(self, dept_list: list) -> Optional[int]:
        """
        从部门列表中找到根部门 ID。
        dept_list 结构：[{"id": 1, "name": "xxx", "parentid": 0}, ...]
        根部门的 parentid 为 0 或不存在。
        """
        if not dept_list:
            return None
        for dept in dept_list:
            if dept.get("parentid", 0) == 0:
                return dept["id"]
        # 兜底：返回第一个部门的 id
        return dept_list[0]["id"]

    def _get_known_names(self) -> List[str]:
        """返回已知姓名列表（用于错误提示）"""
        if self._name_mapping:
            return list(self._name_mapping.keys())
        return []

    def _resolve_path(self, path: str) -> str:
        from common.utils import expand_path
        path = expand_path(path)
        if os.path.isabs(path):
            return path
        return os.path.abspath(os.path.join(self.cwd, path))

    def _get_channel(self):
        """获取 WechatComAppChannel 单例实例"""
        try:
            from channel.wechatcom.wechatcomapp_channel import WechatComAppChannel
            ch = WechatComAppChannel()
            if ch.client is None:
                logger.warning("[WecomAppSend] WechatComAppChannel 的 client 为 None，可能未正确初始化")
                return None
            return ch
        except Exception as e:
            logger.error(f"[WecomAppSend] 获取渠道实例失败: {e}")
            return None

    def _get_sender_name(self) -> str:
        """
        获取触发此次工具调用的用户昵称。
        通过 self.context（Agent 实例）拿到 current_user_nickname。
        如果获取不到，返回空字符串（不附加发送者信息）。
        """
        try:
            if hasattr(self, 'context') and self.context:
                agent = self.context
                if hasattr(agent, 'current_user_nickname') and agent.current_user_nickname:
                    return str(agent.current_user_nickname)
        except Exception as e:
            logger.warning(f"[WecomAppSend] 获取发送者姓名失败: {e}")
        return ""

    def _add_sender_prefix(self, message: str, sender_name: str) -> str:
        """
        在消息正文前附加发送者前缀。
        如果 sender_name 为空，原样返回消息。
        """
        if not sender_name:
            return message
        prefix = f"【来自：{sender_name}】\n"
        return prefix + message

    def _inject_message_to_receivers(
        self,
        user_ids: List[str],
        content: str,
        sender_name: str,
        channel,
        is_file: bool = False,
        file_name: str = "",
    ) -> None:
        """
        将消息注入到接收者的 AI 上下文中。
        
        当 A 用户通过此工具给 B 用户发送消息时，
        此方法将消息注入到 B 的 session 中，以便 B 后续询问 AI 时能看到。
        
        Args:
            user_ids: 接收者的 userid 列表
            content: 消息内容（文本）或文件描述
            sender_name: 发送者名称
            channel: 渠道实例（用于获取 channel_type）
            is_file: 是否为文件消息
            file_name: 文件名（如果是文件消息）
        """
        try:
            # 获取 AgentBridge 实例
            from bridge.bridge import Bridge
            bridge = Bridge()
            agent_bridge = bridge.get_agent_bridge()
            
            # 获取 channel_type
            channel_type = "wechatcom_app"
            if channel and hasattr(channel, 'channel_type'):
                channel_type = channel.channel_type
            
            # 为每个接收者注入消息
            for user_id in user_ids:
                try:
                    agent_bridge.inject_message_to_session(
                        session_id=user_id,
                        content=content,
                        sender_name=sender_name,
                        channel_type=channel_type,
                        is_file=is_file,
                        file_name=file_name,
                    )
                except Exception as e:
                    logger.warning(
                        f"[WecomAppSend] 注入消息到 {user_id} 的 session 失败: {e}"
                    )
        except Exception as e:
            logger.error(f"[WecomAppSend] 注入消息失败: {e}")
