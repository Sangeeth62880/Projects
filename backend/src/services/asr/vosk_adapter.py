from typing import Dict


class VoskAdapter:
    def transcribe(self, audio_data: str) -> Dict[str, str]:
        return {"transcript": "Stubbed Vosk transcription"}


vosk_adapter = VoskAdapter()
