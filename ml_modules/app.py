import logging
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ml_modules.config.database import connect_db, close_db
from ml_modules.routes import cluster_routes, recommendation_routes

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

import asyncio
from ml_modules.controllers.student_controller import execute_student_clustering
from ml_modules.controllers.service_controller import execute_service_clustering

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    
    # 1. Reset existing clusters to ensure fresh start (optional but good for debugging)
    # db = get_database()
    # db.students.update_many({}, {'$set': {'match_cluster': -1}})
    
    # 2. Run clustering in background on startup
    loop = asyncio.get_running_loop()
    # Use run_in_executor to avoid blocking the main thread with sync code
    loop.run_in_executor(None, execute_student_clustering)
    loop.run_in_executor(None, execute_service_clustering)
    
    yield
    close_db()

app = FastAPI(title="Clustering Microservice", lifespan=lifespan)

# CORS
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

# Include Routers
app.include_router(cluster_routes.router)
app.include_router(recommendation_routes.router)

@app.get("/")
def home():
    return {"message": "Clustering Service is Running (Modular Version)"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
