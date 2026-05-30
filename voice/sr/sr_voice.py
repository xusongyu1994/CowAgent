"""
本地/在线混合语音识别模块，基于 SpeechRecognition
- 在线模式：Google Web Speech API（免费，无需 Key，需联网）
- 支持中文识别
"""
import os
import logging
import tempfile
import subprocess
import shutil

from bridge.reply import Reply, ReplyType
from common.log import logger
from voice.voice import Voice
from config import conf

# 抑制不必要的日志
logging.getLogger("urllib3").setLevel(logging.WARNING)


class SRVoice(Voice):
    """基于 SpeechRecognition 的语音识别（Google 免费 API）"""

    def __init__(self):
        self.engine = conf().get("sr_engine", "google")
        self._sr = None
        logger.info("[SRVoice] 初始化，引擎: {}".format(self.engine))

    @property
    def sr(self):
        if self._sr is None:
            import speech_recognition as sr
            self._sr = sr
        return self._sr

    def _find_ffmpeg(self):
        """查找 ffmpeg 可执行文件路径"""
        # 优先使用完整路径
        ffmpeg_exe = r"C:\ffmpeg\bin\ffmpeg.exe"
        if os.path.isfile(ffmpeg_exe):
            return ffmpeg_exe
        # 从 PATH 查找
        ffmpeg_in_path = shutil.which("ffmpeg")
        if ffmpeg_in_path:
            return ffmpeg_in_path
        return None

    def voiceToText(self, voice_file):
        logger.debug("[SRVoice] 识别语音文件: {}".format(voice_file))
        try:
            sr = self.sr
            r = sr.Recognizer()

            # 用 ffmpeg 转换为 16k wav
            ffmpeg_exe = self._find_ffmpeg()
            if not ffmpeg_exe:
                logger.error("[SRVoice] ffmpeg 未找到，请安装 ffmpeg 到 C:\\ffmpeg\\bin\\ffmpeg.exe")
                return Reply(ReplyType.ERROR, "语音识别需要 ffmpeg，请安装后重试")

            tmp_wav = os.path.join(tempfile.gettempdir(), "sr_conv.wav")
            cmd = [
                ffmpeg_exe, "-y", "-i", voice_file,
                "-ac", "1", "-ar", "16000",
                "-sample_fmt", "s16", tmp_wav
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.warning("[SRVoice] ffmpeg 转换失败，尝试直接读取: {}".format(result.stderr))
                audio_file = voice_file
            else:
                audio_file = tmp_wav

            with sr.AudioFile(audio_file) as source:
                audio = r.record(source)
                # 使用 Google 免费 API（无需 Key）
                text = r.recognize_google(audio, language="zh-CN")
                logger.info("[SRVoice] 识别结果: {}".format(text))
                if not text:
                    return Reply(ReplyType.ERROR, "没有检测到语音内容，请重新发送")
                return Reply(ReplyType.TEXT, text)

        except sr.UnknownValueError:
            logger.warning("[SRVoice] 无法识别语音内容")
            return Reply(ReplyType.ERROR, "没有听清，请重新发送")
        except sr.RequestError as e:
            logger.error("[SRVoice] API 请求失败: {}".format(e))
            return Reply(ReplyType.ERROR, "语音识别服务不可用，请稍后再试")
        except Exception as e:
            logger.error("[SRVoice] 识别失败: {}".format(e), exc_info=True)
            return Reply(ReplyType.ERROR, "语音识别失败，请稍后再试")

    def textToVoice(self, text):
        try:
            from voice.pytts.pytts_voice import PyttsVoice
            return PyttsVoice().textToVoice(text)
        except Exception as e:
            logger.error("[SRVoice] TTS 不可用: {}".format(e))
            return Reply(ReplyType.ERROR, "TTS 功能不可用")
