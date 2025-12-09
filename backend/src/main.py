from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import audio, auth, execute, history, interpret
from .utils.config import get_settings

settings = get_settings()

app = FastAPI(title="AI Voice-Controlled Terminal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(audio.router)
app.include_router(interpret.router)
app.include_router(execute.router)
app.include_router(history.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
