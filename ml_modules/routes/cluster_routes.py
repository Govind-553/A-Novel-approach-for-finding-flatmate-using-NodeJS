from fastapi import APIRouter, BackgroundTasks
from ml_modules.controllers.student_controller import execute_student_clustering
from ml_modules.controllers.service_controller import execute_service_clustering

router = APIRouter(prefix="/cluster", tags=["Clustering"])

@router.post("/students")
def cluster_students(background_tasks: BackgroundTasks, sync: bool = False):
    """
    Triggers the K-Means clustering process for students.
    If sync=True, waits for completion.
    """
    if sync:
        execute_student_clustering()
        return {"message": "Student clustering completed"}
    else:
        background_tasks.add_task(execute_student_clustering)
        return {"message": "Student clustering started in background"}

@router.post("/services")
def cluster_services(background_tasks: BackgroundTasks, sync: bool = False):
    """
    Triggers the K-Means clustering process for services.
    If sync=True, waits for completion.
    """
    if sync:
        execute_service_clustering()
        return {"message": "Service clustering completed"}
    else:
        background_tasks.add_task(execute_service_clustering)
        return {"message": "Service clustering started in background"}
