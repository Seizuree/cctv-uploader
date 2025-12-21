from fastapi import FastAPI

from app.api.routes import router as api_router
from app.db.session import Base, engine

app = FastAPI()
app.include_router(api_router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
