# AI Voice-Controlled Terminal

FastAPI backend with Textual TUI for a voice-driven command experience. Commands are validated against a whitelist and executed in a sandboxed executor.

## Getting started

```bash
pip install -r backend/requirements.txt
uvicorn src.main:app --reload --app-dir backend
```

Run tests:

```bash
PYTHONPATH=backend/src python -m pytest backend/tests
```

Launch the TUI (requires the backend running):

```bash
pip install -r textual_ui/requirements.txt
python -m textual_ui.app
```

Docker:

```bash
docker-compose up --build
```
