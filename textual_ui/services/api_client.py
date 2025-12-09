import httpx


class APIClient:
    def __init__(self, base_url: str = "http://localhost:8000") -> None:
        self.base_url = base_url.rstrip("/")
        self.token: str | None = None
        self._client = httpx.AsyncClient(base_url=self.base_url)

    def set_base_url(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(base_url=self.base_url)

    def _auth_headers(self) -> dict:
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}

    async def login(self, username: str, password: str) -> dict:
        response = await self._client.post(
            "/auth/login",
            data={"username": username, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        body = response.json()
        self.token = body["access_token"]
        return body

    async def interpret(self, transcript: str) -> dict:
        response = await self._client.post(
            "/api/interpret",
            json={"transcript": transcript},
            headers=self._auth_headers(),
        )
        response.raise_for_status()
        return response.json()

    async def execute(self, intent: str, slots: dict | None = None) -> dict:
        response = await self._client.post(
            "/api/execute",
            json={"intent": intent, "slots": slots or {}},
            headers=self._auth_headers(),
        )
        response.raise_for_status()
        return response.json()

    async def history(self) -> dict:
        response = await self._client.get(
            "/api/history", headers=self._auth_headers()
        )
        response.raise_for_status()
        return response.json()

    async def close(self) -> None:
        await self._client.aclose()
