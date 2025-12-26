# CCTV Worker

Python worker service untuk video clipping dan upload ke Google Cloud Storage.

## Overview

Worker ini memproses packing items dengan:
1. Download video segments dari Hikvision NVR/DVR
2. Merge dan cut video sesuai start_time dan end_time
3. Upload hasil clip ke GCS
4. Update status di database

## Features

- **Auto Batch Processing**: Secara otomatis memproses items dengan status `READY_FOR_BATCH`
- **Manual Trigger via HTTP API**: Trigger processing untuk specific packing item
- **Graceful Shutdown**: Handle SIGTERM/SIGINT untuk Docker environments
- **Retry Mechanism**: Exponential backoff untuk GCS upload
- **Disk Space Check**: Validasi disk space sebelum download

## Requirements

- Python 3.10+
- FFmpeg (untuk video processing)
- PostgreSQL database
- Google Cloud Storage bucket dengan HMAC keys

## Installation

```bash
cd worker
uv sync
```

## Configuration

Copy `.env.example` ke `.env` dan sesuaikan:

```bash
cp .env.example .env
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CAMERA_ENCRYPTION_KEY` | Fernet key untuk decrypt camera password |
| `GCS_BUCKET` | GCS bucket name |
| `GCS_ACCESS_KEY` | GCS HMAC access key |
| `GCS_SECRET_KEY` | GCS HMAC secret key |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BATCH_INTERVAL_SECONDS` | 60 | Interval antara batch processing |
| `BATCH_SIZE` | 10 | Jumlah items per batch |
| `TEMP_VIDEO_DIR` | /tmp/cctv | Directory untuk temporary video files |
| `EXACT_CUT` | false | Gunakan re-encoding untuk exact cut |
| `TRACK_ID` | 101 | Hikvision track ID |
| `WORKER_HOST` | 0.0.0.0 | HTTP server host |
| `WORKER_PORT` | 8001 | HTTP server port |
| `AUTO_BATCH_ENABLED` | true | Enable/disable auto batch processing |

## Running

### Development

```bash
cd worker
uv run python -m main
```

### Docker

```bash
docker-compose up worker
```

## API Endpoints

### POST /trigger

Trigger processing untuk specific packing item.

Request:
```json
{
  "packing_item_id": 123
}
```

Response (202 Accepted):
```json
{
  "status": "accepted",
  "packing_item_id": 123,
  "message": "Job queued for processing"
}
```

Error Response (400/404):
```json
{
  "status": "error",
  "message": "Packing item not found or not ready"
}
```

### GET /health

Health check endpoint.

Response:
```json
{
  "status": "healthy",
  "auto_batch": true,
  "queue_size": 0
}
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Worker                        │
│                                                  │
│  ┌──────────────┐      ┌────────────────────┐   │
│  │  HTTP Server │      │  Background Loop   │   │
│  │  (FastAPI)   │      │  (Auto Batch)      │   │
│  │              │      │                    │   │
│  │  POST /trigger      │  while True:       │   │
│  │    -> queue job     │    process_batch() │   │
│  │    -> 202 Accepted  │    sleep(interval) │   │
│  └──────────────┘      └────────────────────┘   │
│           │                     │               │
│           └─────────┬───────────┘               │
│                     ▼                           │
│          ┌─────────────────────┐                │
│          │   Job Processor     │                │
│          │ (Shared Processing) │                │
│          └─────────────────────┘                │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
worker/
├── api/
│   ├── __init__.py
│   ├── app.py              # FastAPI app factory
│   ├── routes.py           # HTTP endpoints
│   └── schemas.py          # Pydantic models
├── db/
│   ├── models/             # SQLAlchemy models
│   └── session.py          # Database session
├── jobs/
│   ├── batch_processor.py  # Batch processing logic
│   └── job_queue.py        # Manual trigger queue
├── repositories/           # Data access layer
├── services/
│   ├── ffmpeg_processor.py # Video processing
│   ├── hikvision_client.py # Hikvision ISAPI client
│   ├── segment_downloader.py
│   ├── uploader.py         # GCS upload
│   └── utils.py
├── config.py               # Configuration
├── encryption.py           # Camera password decryption
├── main.py                 # Entrypoint
├── Dockerfile
├── pyproject.toml
└── .env.example
```

## Processing Flow

1. Packing item dengan status `READY_FOR_BATCH` diambil dari database
2. Download video segments dari Hikvision NVR berdasarkan start_time dan end_time
3. Merge semua segments menjadi satu file
4. Cut video sesuai exact time range
5. Upload hasil ke GCS
6. Create mini_clip record di database
7. Update packing item status ke `CLIP_GENERATED`

## Troubleshooting

### Worker tidak bisa connect ke database

Pastikan `DATABASE_URL` sudah benar dan database sudah running.

### Upload ke GCS gagal

- Periksa `GCS_ACCESS_KEY` dan `GCS_SECRET_KEY`
- Pastikan bucket sudah ada dan HMAC keys memiliki permission yang cukup

### Video processing gagal

- Pastikan FFmpeg sudah terinstall
- Periksa disk space di `TEMP_VIDEO_DIR`
- Cek log untuk error message dari Hikvision API
