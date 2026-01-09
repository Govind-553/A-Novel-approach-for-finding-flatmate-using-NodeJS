import logging
from pymongo import UpdateOne
from bson import ObjectId
from ml_modules.config.database import get_database
from ml_modules.utils.clustering import fetch_data, perform_clustering

logger = logging.getLogger(__name__)

def execute_service_clustering():
    logger.info("Starting Service Clustering...")
    db = get_database()
    col = db['services']
    
    # 1. Food
    food_df = fetch_data('services', {'service': 'Food'}, {'food_type': 1, 'email': 1})
    food_updates = []
    if not food_df.empty:
        clustered_food = perform_clustering(food_df, ['food_type'])
        for _, row in clustered_food.iterrows():
            food_updates.append(
                UpdateOne({'_id': row['_id']}, {'$set': {'cluster': int(row['new_cluster_label'])}})
            )
    
    # 2. Laundry
    laundry_df = fetch_data('services', {'service': 'Laundry'}, {'laundry_service': 1, 'email': 1})
    laundry_updates = []
    if not laundry_df.empty:
        clustered_laundry = perform_clustering(laundry_df, ['laundry_service'])
        for _, row in clustered_laundry.iterrows():
            laundry_updates.append(
                UpdateOne({'_id': row['_id']}, {'$set': {'cluster': int(row['new_cluster_label'])}})
            )

    # 3. Broker
    broker_df = fetch_data('services', {'service': 'Broker'}, {'room_type': 1, 'amenities': 1, 'pricing_value': 1, 'landmark': 1, 'email': 1})
    broker_updates = []
    if not broker_df.empty:
        clustered_broker = perform_clustering(broker_df, ['room_type', 'amenities', 'pricing_value', 'landmark'])
        for _, row in clustered_broker.iterrows():
            broker_updates.append(
                UpdateOne({'_id': row['_id']}, {'$set': {'cluster': int(row['new_cluster_label'])}})
            )

    total_updates = 0
    if food_updates:
        total_updates += col.bulk_write(food_updates).modified_count
    if laundry_updates:
        total_updates += col.bulk_write(laundry_updates).modified_count
    if broker_updates:
        total_updates += col.bulk_write(broker_updates).modified_count
        
    logger.info(f"Updated {total_updates} service records.")
    return total_updates

def get_service_matches(student_id):
    db = get_database()
    student_id = student_id.strip()
    logger.info(f"Looking up services for student ID: {student_id}")

    try:
        obj_id = ObjectId(student_id)
    except Exception as e:
        logger.error(f"Invalid ObjectId format for {student_id}: {e}")
        return {"error": f"Invalid Student ID: {student_id}"}

    student = db.students.find_one({'_id': obj_id})
    if not student:
        logger.warning(f"Student with ID {student_id} not found.")
        return {"error": "Student not found"}

    matches = {'Food': [], 'Laundry': [], 'Broker': []}

    def clean_docs(docs):
        cleaned = []
        for d in docs:
            d['_id'] = str(d['_id'])
            cleaned.append(d)
        return cleaned

    # Food
    food_pref = student.get('food_type')
    if food_pref:
        query = {'service': 'Food'}
        if food_pref != 'Both':
            query['food_type'] = {'$in': [food_pref, 'Both']}
        matches['Food'] = clean_docs(list(db.services.find(query)))

    # Laundry
    laundry_query = {'service': 'Laundry'}
    student_amenities = student.get('amenities', '')
    
    logger.info(f"Student {student_id} Amenities: '{student_amenities}'")
    
    matches['Laundry'] = []
    
    # Define laundry related identifiers
    laundry_keywords = {'Wash & Iron', 'Dry Cleaning', 'Pickup & Delivery', 'Subscription Plans'}
    
    needed_laundry = set()
    if student_amenities:
        if isinstance(student_amenities, str):
            curr_amenities = set(x.strip() for x in student_amenities.split(','))
        elif isinstance(student_amenities, list):
            curr_amenities = set(student_amenities)
        else:
            curr_amenities = set()
            
        needed_laundry = curr_amenities.intersection(laundry_keywords)
    
    logger.info(f"Needed Laundry: {needed_laundry}")

    if needed_laundry:
        # Filter services that offer ALL needed laundry amenities
        all_laundry = list(db.services.find(laundry_query))
        matched_laundry = []
        
        for svc in all_laundry:
            svc_offerings_str = svc.get('laundry_service', '')
            svc_offerings = set()
            if svc_offerings_str:
                svc_offerings = set(x.strip() for x in svc_offerings_str.split(','))
            
            # Check if service covers all needs (subset logic)
            is_match = needed_laundry.issubset(svc_offerings)
            logger.info(f"Service {svc.get('business_Name')} Offerings: {svc_offerings} -> Match: {is_match}")
            
            if is_match:
                matched_laundry.append(svc)
        
        matches['Laundry'] = clean_docs(matched_laundry)
    else:
        # No specific laundry matches requested, return all
        matches['Laundry'] = clean_docs(list(db.services.find(laundry_query)))

    # Broker
    room_pref = student.get('room_type')
    landmark_pref = student.get('landmark')
    price_pref = student.get('pricing_value')
    
    broker_query = {'service': 'Broker'}
    if room_pref: broker_query['room_type'] = room_pref
    if landmark_pref: broker_query['landmark'] = landmark_pref
    if price_pref: broker_query['pricing_value'] = price_pref
        
    brokers = list(db.services.find(broker_query))
    if not brokers:
        # Relax constraints
        if 'pricing_value' in broker_query: del broker_query['pricing_value']
        if 'room_type' in broker_query: del broker_query['room_type']
        brokers = list(db.services.find(broker_query))

    matches['Broker'] = clean_docs(brokers)

    return matches
