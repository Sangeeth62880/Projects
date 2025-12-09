import os

from textual.app import App, ComposeResult
from textual.widgets import Footer, Header, TabPane, TabbedContent

from .services.api_client import APIClient
from .views.history import HistoryView
from .views.home import HomeView
from .views.settings import SettingsView


class VoiceTerminalApp(App):
    TITLE = "AI Voice-Controlled Terminal"

    def __init__(self) -> None:
        super().__init__()
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        self.api_client = APIClient(base_url=base_url)

    def compose(self) -> ComposeResult:
        yield Header()
        yield TabbedContent(
            TabPane("Home", HomeView()),
            TabPane("History", HistoryView()),
            TabPane("Settings", SettingsView()),
        )
        yield Footer()

    async def on_shutdown_request(self) -> None:
        await self.api_client.close()


if __name__ == "__main__":
    app = VoiceTerminalApp()
    app.run()
