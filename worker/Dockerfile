FROM python:3.12-slim

WORKDIR /app

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy project files
COPY pyproject.toml .
COPY *.py ./
COPY db/ db/
COPY services/ services/
COPY repositories/ repositories/
COPY jobs/ jobs/

# Install dependencies
RUN uv sync --frozen --no-cache

CMD ["uv", "run", "python", "main.py"]
