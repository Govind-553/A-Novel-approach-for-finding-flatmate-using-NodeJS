from fastapi import APIRouter, HTTPException
from ml_modules.controllers.student_controller import get_roommate_matches
from ml_modules.controllers.service_controller import get_service_matches

router = APIRouter(prefix="/recommend", tags=["Recommendations"])

@router.get("/roommates/{student_id}")
def get_roommate_matches_endpoint(student_id: str):
    result = get_roommate_matches(student_id)
    if "error" in result:
        status_code = 404 if result["error"] == "Student not found" else 400
        raise HTTPException(status_code=status_code, detail=result["error"])
    return result

@router.get("/services/{student_id}")
def get_service_matches_endpoint(student_id: str):
    result = get_service_matches(student_id)
    if "error" in result:
        status_code = 404 if result["error"] == "Student not found" else 400
        raise HTTPException(status_code=status_code, detail=result["error"])
    return result
