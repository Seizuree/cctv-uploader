from fastapi import FastAPI

from api.routes import router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="CCTV Worker API",
        description="API for manually triggering video clip processing",
        version="0.1.0",
    )

    app.include_router(router)

    return app
