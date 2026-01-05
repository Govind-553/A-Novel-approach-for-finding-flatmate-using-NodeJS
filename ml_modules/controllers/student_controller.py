import logging
from pymongo import UpdateOne
from bson import ObjectId
from ml_modules.config.database import get_database
from ml_modules.utils.clustering import fetch_data, perform_clustering

logger = logging.getLogger(__name__)

def execute_student_clustering():
    logger.info("Starting Student Clustering...")
    db = get_database()
    col = db['students']
    
    features = ['food_type', 'room_type', 'amenities', 'year', 'branch', 'pricing_value']
    
    projection = {feature: 1 for feature in features}
    projection['gender'] = 1
    projection['email'] = 1
    
    df = fetch_data('students', projection=projection)
    
    if df.empty:
        return 0

    if 'gender' not in df.columns:
        return 0
    
    df['gender'] = df['gender'].fillna('Unknown')
    
    updates = []
    
    for gender in df['gender'].unique():
        gender_df = df[df['gender'] == gender].copy()
        clustered_df = perform_clustering(gender_df, features)
        
        for _, row in clustered_df.iterrows():
            updates.append(
                UpdateOne(
                    {'_id': row['_id']},
                    {'$set': {'match_cluster': int(row['new_cluster_label'])}}
                )
            )
            
    if updates:
        result = col.bulk_write(updates)
        logger.info(f"Updated {result.modified_count} student records.")
        return result.modified_count
    
    return 0

def get_roommate_matches(student_id):
    db = get_database()
    student_id = student_id.strip()
    logger.info(f"Looking up student with ID: {student_id}")
    
    try:
        obj_id = ObjectId(student_id)
    except Exception as e:
        logger.error(f"Invalid ObjectId format for {student_id}: {e}")
        return {"error": f"Invalid Student ID: {student_id}"}

    student = db.students.find_one({'_id': obj_id})
    if not student:
        logger.warning(f"Student with ID {student_id} not found in database.")
        return {"error": "Student not found"}

    cluster = student.get('match_cluster')
    gender = student.get('gender')
    
    logger.info(f"Student found. Gender: {gender}, Cluster: {cluster}")

    if cluster is None or not gender:
        return {"count": 0, "matches": []}

    matches_cursor = db.students.find({
        'match_cluster': cluster,
        'gender': gender,
        '_id': {'$ne': obj_id}
    })
    
    matches = []
    for m in matches_cursor:
        m['_id'] = str(m['_id'])
        if 'profile_pic' in m:
            del m['profile_pic'] 
        matches.append(m)

    return {"count": len(matches), "matches": matches}
