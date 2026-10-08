import os
import shutil
import wave

from common.log import logger

try:
    import pysilk
except ImportError:
    logger.debug("import pysilk failed, silk voice format will not be supported.")

try:
    from pydub import AudioSegment
    _pydub_available = True
except ImportError:
    logger.debug("import pydub failed, voice conversion features will not be supported.")
    AudioSegment = None
    _pydub_available = False

# Windows: 让 pydub 找到 ffmpeg 完整路径（必须在 pydub 导入之后）
# 依次尝试常见安装位置（迁移后 ffmpeg 位于 D 盘，C 盘为历史位置），最后回退 PATH。
# 两件事必须同时做到，否则语音转换会以 WinError 2（找不到文件）失败：
#   1) AudioSegment.converter 要拿到完整路径——pydub 的默认值只是个裸名字，
#      而且早先的版本只把 PATH 结果写进日志、并未赋值；
#   2) pydub 的 ffprobe 解析走 pydub.utils.which()，它只认 os.environ["PATH"]，
#      因此还要把 ffmpeg 所在目录并入本进程 PATH——进程继承到的 PATH 可能已过期
#      （例如从很早就打开的终端启动服务时）。
if _pydub_available:
    def _resolve_binary(name: str) -> str:
        filename = name + ".exe" if os.name == "nt" else name
        for base in (r"D:\ffmpeg\bin", r"C:\ffmpeg\bin"):
            candidate = os.path.join(base, filename)
            if os.path.isfile(candidate):
                return candidate
        return shutil.which(name) or ""

    _ffmpeg_path = _resolve_binary("ffmpeg")
    if _ffmpeg_path:
        AudioSegment.converter = _ffmpeg_path
        _ffmpeg_dir = os.path.dirname(_ffmpeg_path)
        _path_dirs = [d for d in os.environ.get("PATH", "").split(os.pathsep) if d]
        if not any(os.path.normcase(d) == os.path.normcase(_ffmpeg_dir) for d in _path_dirs):
            os.environ["PATH"] = _ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
        logger.info("[audio_convert] ffmpeg 路径: {}".format(_ffmpeg_path))
    else:
        logger.warning("[audio_convert] ffmpeg 未找到，语音格式转换将不可用")

sil_supports = [8000, 12000, 16000, 24000, 32000, 44100, 48000]  # slk转wav时，支持的采样率


def find_closest_sil_supports(sample_rate):
    """
    找到最接近的支持的采样率
    """
    if sample_rate in sil_supports:
        return sample_rate
    closest = 0
    mindiff = 9999999
    for rate in sil_supports:
        diff = abs(rate - sample_rate)
        if diff < mindiff:
            closest = rate
            mindiff = diff
    return closest


def get_pcm_from_wav(wav_path):
    """
    从 wav 文件中读取 pcm

    :param wav_path: wav 文件路径
    :returns: pcm 数据
    """
    with wave.open(wav_path, "rb") as wav:
        return wav.readframes(wav.getnframes())


def any_to_mp3(any_path, mp3_path):
    """
    把任意格式转成mp3文件
    """
    if not _pydub_available:
        raise ImportError("pydub is required for audio conversion. Please install it with: pip install pydub")
    if any_path.endswith(".mp3"):
        shutil.copy2(any_path, mp3_path)
        return
    sil_wav_path = None
    if any_path.endswith(".sil") or any_path.endswith(".silk") or any_path.endswith(".slk"):
        # pysilk decodes silk into wav only, so the audio needs a wav file of
        # its own: decoding onto any_path overwrote the caller's voice file and
        # then left nothing at mp3_path to read.
        sil_wav_path = os.path.splitext(any_path)[0] + ".silk.wav"
        sil_to_wav(any_path, sil_wav_path)
        any_path = sil_wav_path
    try:
        audio = AudioSegment.from_file(any_path)
        audio.export(mp3_path, format="mp3")
    finally:
        if sil_wav_path and os.path.exists(sil_wav_path):
            os.remove(sil_wav_path)


def any_to_wav(any_path, wav_path):
    """
    把任意格式转成wav文件
    """
    if not _pydub_available:
        raise ImportError("pydub is required for audio conversion. Please install it with: pip install pydub")
    if any_path.endswith(".wav"):
        shutil.copy2(any_path, wav_path)
        return
    if any_path.endswith(".sil") or any_path.endswith(".silk") or any_path.endswith(".slk"):
        return sil_to_wav(any_path, wav_path)
    # pydub 0.23.0+ 会将 parameters 追加到 ffmpeg 命令的输出文件 `-` 之后，
    # 因此 -nostdin 可能被当作"尾部选项"处理，是否生效取决于 ffmpeg 版本。
    # 目的是防止后台服务中 ffmpeg 子进程继承父进程的 stdin，避免死锁。
    audio = AudioSegment.from_file(any_path, parameters=["-nostdin"])
    # AudioSegment 是不可变对象：set_frame_rate/set_channels 返回新对象，不修改原对象。
    # 必须将返回值重新赋给 audio，否则修改不会生效。
    audio = audio.set_frame_rate(16000)
    audio = audio.set_channels(1)
    audio.export(wav_path, format="wav", codec='pcm_s16le')


def any_to_sil(any_path, sil_path):
    """
    把任意格式转成sil文件
    """
    if not _pydub_available:
        raise ImportError("pydub is required for audio conversion. Please install it with: pip install pydub")
    if any_path.endswith(".sil") or any_path.endswith(".silk") or any_path.endswith(".slk"):
        shutil.copy2(any_path, sil_path)
        return 10000
    audio = AudioSegment.from_file(any_path)
    rate = find_closest_sil_supports(audio.frame_rate)
    # Convert to PCM_s16
    pcm_s16 = audio.set_sample_width(2)
    pcm_s16 = pcm_s16.set_frame_rate(rate)
    wav_data = pcm_s16.raw_data
    silk_data = pysilk.encode(wav_data, data_rate=rate, sample_rate=rate)
    with open(sil_path, "wb") as f:
        f.write(silk_data)
    return audio.duration_seconds * 1000


def any_to_amr(any_path, amr_path):
    """
    把任意格式转成amr文件
    """
    if not _pydub_available:
        raise ImportError("pydub is required for audio conversion. Please install it with: pip install pydub")
    if any_path.endswith(".amr"):
        shutil.copy2(any_path, amr_path)
        return
    if any_path.endswith(".sil") or any_path.endswith(".silk") or any_path.endswith(".slk"):
        raise NotImplementedError("Not support file type: {}".format(any_path))
    audio = AudioSegment.from_file(any_path)
    audio = audio.set_frame_rate(8000)  # only support 8000
    audio.export(amr_path, format="amr")
    return audio.duration_seconds * 1000


def sil_to_wav(silk_path, wav_path, rate: int = 24000):
    """
    silk 文件转 wav
    """
    wav_data = pysilk.decode_file(silk_path, to_wav=True, sample_rate=rate)
    with open(wav_path, "wb") as f:
        f.write(wav_data)


def split_audio(file_path, max_segment_length_ms=60000):
    """
    分割音频文件
    """
    if not _pydub_available:
        raise ImportError("pydub is required for audio conversion. Please install it with: pip install pydub")
    audio = AudioSegment.from_file(file_path)
    audio_length_ms = len(audio)
    if audio_length_ms <= max_segment_length_ms:
        return audio_length_ms, [file_path]
    segments = []
    for start_ms in range(0, audio_length_ms, max_segment_length_ms):
        end_ms = min(audio_length_ms, start_ms + max_segment_length_ms)
        segment = audio[start_ms:end_ms]
        segments.append(segment)
    file_prefix = file_path[: file_path.rindex(".")]
    format = file_path[file_path.rindex(".") + 1 :]
    files = []
    for i, segment in enumerate(segments):
        path = f"{file_prefix}_{i+1}" + f".{format}"
        segment.export(path, format=format)
        files.append(path)
    return audio_length_ms, files
