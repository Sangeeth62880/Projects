from typing import Dict


class WhisperCppAdapter:
    def transcribe(self, audio_data: str) -> Dict[str, str]:
        return {"transcript": "Stubbed whisper.cpp transcription"}


whisper_cpp_adapter = WhisperCppAdapter()
