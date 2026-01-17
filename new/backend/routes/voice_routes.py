from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
import io
from schemas.schemas import TTSRequest, STTResponse
from ai.whisper_stt import WhisperSTT
from ai.tts_engine import TTSEngine

router = APIRouter()

# Initialize voice components
whisper_stt = WhisperSTT()
tts_engine = TTSEngine()


@router.post("/stt", response_model=STTResponse)
async def speech_to_text(audio: UploadFile = File(...)):
    """Convert speech audio to text using Whisper."""
    try:
        # Read audio file
        audio_bytes = await audio.read()
        
        # Transcribe using Whisper
        result = await whisper_stt.transcribe(audio_bytes)
        
        return STTResponse(
            transcription=result["text"],
            confidence=result.get("confidence", 0.95)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT Error: {str(e)}")


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to child-friendly speech audio."""
    try:
        # Generate audio
        audio_buffer = await tts_engine.synthesize(
            text=request.text,
            voice=request.voice
        )
        
        return StreamingResponse(
            io.BytesIO(audio_buffer),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Error: {str(e)}")
