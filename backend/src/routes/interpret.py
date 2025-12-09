from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..controllers.nlu_controller import interpret_text
from ..models.user_model import User
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["interpret"])


class InterpretRequest(BaseModel):
    transcript: str


@router.post("/interpret")
def interpret_endpoint(
    payload: InterpretRequest, _: User = Depends(get_current_user)
) -> dict:
    return interpret_text(payload.transcript)
