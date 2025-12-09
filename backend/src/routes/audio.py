from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..controllers.asr_controller import transcribe_audio
from ..models.user_model import User
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["audio"])


class AudioRequest(BaseModel):
    audio_data: str


@router.post("/audio")
def audio_endpoint(
    payload: AudioRequest, _: User = Depends(get_current_user)
) -> dict:
    return transcribe_audio(payload.audio_data)
