from textual.app import ComposeResult
from textual.containers import Vertical
from textual.widgets import Button, Log


class HistoryView(Vertical):
    def compose(self) -> ComposeResult:
        yield Button("Refresh", id="refresh-history")
        yield Log(id="history-log")

    async def on_mount(self) -> None:
        await self.refresh_history()

    async def refresh_history(self) -> None:
        log = self.query_one("#history-log", Log)
        log.clear()
        try:
            data = await self.app.api_client.history()
            for entry in data.get("history", []):
                log.write_line(
                    f"{entry['timestamp']}: {entry['intent']} -> {entry['result']}"
                )
        except Exception as exc:  # noqa: BLE001
            log.write_line(f"Error loading history: {exc}")

    async def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "refresh-history":
            await self.refresh_history()
