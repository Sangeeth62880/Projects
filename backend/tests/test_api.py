import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from src.main import app  # noqa: E402


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


def get_auth_header(client: TestClient) -> dict:
    response = client.post(
        "/auth/login",
        data={"username": "admin", "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_interpret_and_execute_flow(client: TestClient) -> None:
    headers = get_auth_header(client)

    interpret_resp = client.post(
        "/api/interpret", json={"transcript": "check system status"}, headers=headers
    )
    assert interpret_resp.status_code == 200
    intent = interpret_resp.json()["intent"]
    assert intent == "system_status"

    execute_resp = client.post(
        "/api/execute",
        json={"intent": intent, "slots": {}},
        headers=headers,
    )
    assert execute_resp.status_code == 200
    body = execute_resp.json()
    assert body["intent"] == "system_status"
    assert body["result"]["executionResult"]["status"] == "ok"

    history_resp = client.get("/api/history", headers=headers)
    assert history_resp.status_code == 200
    history = history_resp.json()["history"]
    assert len(history) >= 1
