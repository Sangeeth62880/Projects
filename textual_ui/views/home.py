from textual.app import ComposeResult
from textual.containers import Vertical
from textual.message import Message
from textual.widgets import Button, Input, Log, Static


class HomeView(Vertical):
    class CommandResult(Message):
        def __init__(self, message: str) -> None:
            super().__init__()
            self.message = message

    def compose(self) -> ComposeResult:
        yield Static("Command")
        yield Input(placeholder="e.g., check system status", id="command-input")
        yield Button("Interpret & Execute", id="run-command")
        yield Log(id="command-output")

    async def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id != "run-command":
            return
        app = self.app
        command_input = self.query_one("#command-input", Input)
        output = self.query_one("#command-output", Log)
        transcript = command_input.value.strip()
        if not transcript:
            output.write_line("Please enter a command text.")
            return
        try:
            interpretation = await app.api_client.interpret(transcript)
            intent = interpretation.get("intent", "unknown")
            slots = interpretation.get("slots", {})
            output.write_line(f"Intent: {intent} slots={slots}")
            execution = await app.api_client.execute(intent, slots)
            output.write_line(f"Execution: {execution}")
        except Exception as exc:  # noqa: BLE001
            output.write_line(f"Error: {exc}")
