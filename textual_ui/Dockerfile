FROM python:3.11-slim

WORKDIR /app/textual_ui

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY textual_ui/requirements.txt /app/textual_ui/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY textual_ui /app/textual_ui

CMD ["python", "-m", "textual_ui.app"]
