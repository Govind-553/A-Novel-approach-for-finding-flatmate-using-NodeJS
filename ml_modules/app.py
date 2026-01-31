import logging
import uvicorn
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ml_modules.config.database import connect_db, close_db
from ml_modules.routes import cluster_routes, recommendation_routes
from ml_modules.controllers.student_controller import execute_student_clustering
from ml_modules.controllers.service_controller import execute_service_clustering

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    logger.info("Database connected")

    asyncio.create_task(asyncio.to_thread(execute_student_clustering))
    asyncio.create_task(asyncio.to_thread(execute_service_clustering))

    yield

    close_db()
    logger.info("Database connection closed")

app = FastAPI(
    title="Clustering Microservice",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://flatmate-node-backend.onrender.com",
        "https://flatmate-connect.vercel.app",
        "http://localhost:3000",
        "https://flatmate-python-backend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cluster_routes.router)
app.include_router(recommendation_routes.router)

@app.get("/")
def home():
    return {"message": "Clustering Service is Running (Modular Version)"}

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "clustering-microservice"
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000)
