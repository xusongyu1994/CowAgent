# encoding:utf-8

from enum import Enum


class ReplyType(Enum):
    TEXT = 1  # 文本
    VOICE = 2  # 音频文件
    IMAGE = 3  # 图片文件
    IMAGE_URL = 4  # 图片URL
    VIDEO_URL = 5  # 视频URL
    FILE = 6  # 文件
    CARD = 7  # 微信名片，仅支持ntchat
    INVITE_ROOM = 8  # 邀请好友进群
    INFO = 9
    ERROR = 10
    TEXT_ = 11  # 强制文本
    VIDEO = 12
    MINIAPP = 13  # 小程序

    def __str__(self):
        return self.name


class Reply:
    def __init__(self, type: ReplyType = None, content=None):
        self.type = type
        self.content = content
        self.file_list = []  # 多文件支持：存储多个文件信息
        self.text_content = None  # 附加文本内容

    def add_file(self, file_info: dict):
        """
        添加文件到发送列表
        
        Args:
            file_info: 文件信息字典，包含 path, file_type, file_name 等字段
        """
        self.file_list.append(file_info)

    def has_multiple_files(self) -> bool:
        """检查是否包含多个文件"""
        return len(self.file_list) > 0

    def __str__(self):
        if self.file_list:
            return "Reply(type={}, content={}, files={})".format(
                self.type, self.content, len(self.file_list)
            )
        return "Reply(type={}, content={})".format(self.type, self.content)
