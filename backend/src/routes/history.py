from fastapi import APIRouter, Depends

from ..models.command_model import command_history
from ..models.user_model import User
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history")
def history_endpoint(user: User = Depends(get_current_user)) -> dict:
    entries = command_history.get_entries_for_user(user.id)
    return {"history": [entry.dict() for entry in entries]}
