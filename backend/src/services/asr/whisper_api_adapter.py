from typing import Dict

from ...utils.config import get_settings


class WhisperAPIAdapter:
    def transcribe(self, audio_data: str) -> Dict[str, str]:
        settings = get_settings()
        # Placeholder: in production, call OpenAI Whisper API with the provided audio data.
        _ = settings.openai_api_key
        return {"transcript": "Simulated transcript via Whisper API"}


whisper_api_adapter = WhisperAPIAdapter()
