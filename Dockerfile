FROM python:3.10-slim

# Install system dependencies
RUN apt update && apt install -y ffmpeg

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy project files
COPY pyproject.toml uv.lock ./
COPY app ./app

# Sync dependencies
RUN uv sync --frozen --no-dev

# Run the application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
