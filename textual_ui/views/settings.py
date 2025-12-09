from textual.app import ComposeResult
from textual.widgets import Button, Input, Log, Static


class SettingsView(Static):
    def compose(self) -> ComposeResult:
        yield Input(placeholder="API Base URL", id="base-url")
        yield Input(placeholder="Username", id="username")
        yield Input(placeholder="Password", password=True, id="password")
        yield Button("Login", id="login-button")
        yield Log(id="settings-log")

    async def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id != "login-button":
            return
        base_url = self.query_one("#base-url", Input).value.strip()
        username = self.query_one("#username", Input).value.strip()
        password = self.query_one("#password", Input).value.strip()
        log = self.query_one("#settings-log", Log)
        if base_url:
            await self.app.api_client.set_base_url(base_url)
        try:
            result = await self.app.api_client.login(username, password)
            log.write_line(f"Logged in as {result['user']['username']}")
        except Exception as exc:  # noqa: BLE001
            log.write_line(f"Login failed: {exc}")
