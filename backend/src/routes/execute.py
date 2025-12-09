from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..controllers.executor_controller import execute_command
from ..models.user_model import User
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["execute"])


class ExecuteRequest(BaseModel):
    intent: str
    slots: Optional[Dict[str, Any]] = None


@router.post("/execute")
def execute_endpoint(
    payload: ExecuteRequest, user: User = Depends(get_current_user)
) -> dict:
    entry = execute_command(payload.intent, payload.slots or {}, user)
    return entry.dict()
