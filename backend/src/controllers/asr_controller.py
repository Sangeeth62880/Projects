import uuid
from typing import Dict

from ..services.asr.vosk_adapter import vosk_adapter
from ..services.asr.whisper_api_adapter import whisper_api_adapter
from ..services.asr.whisper_cpp_adapter import whisper_cpp_adapter
from ..utils.config import get_settings


def transcribe_audio(audio_data: str) -> Dict[str, str]:
    settings = get_settings()
    if settings.openai_api_key and settings.whisper_mode == "api":
        result = whisper_api_adapter.transcribe(audio_data)
    elif settings.whisper_mode == "local":
        result = whisper_cpp_adapter.transcribe(audio_data)
    else:
        result = vosk_adapter.transcribe(audio_data)
    result["sessionId"] = str(uuid.uuid4())
    return result
