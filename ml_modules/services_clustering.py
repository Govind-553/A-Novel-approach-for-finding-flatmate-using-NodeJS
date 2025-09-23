import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

conn = mysql.connector.connect(
    host=os.getenv('host'),
    user=os.getenv('user'),
    password=os.getenv('password'),
    database=os.getenv('database'),
)
cursor = conn.cursor()

cursor.execute("""
    SELECT email, food_type, room_type, amenities, pricing_value, landmark 
    FROM students 
    WHERE food_type IS NOT NULL AND room_type IS NOT NULL 
    AND amenities IS NOT NULL AND pricing_value IS NOT NULL AND landmark IS NOT NULL
""")
students_data = cursor.fetchall()
student_df = pd.DataFrame(students_data, columns=['email', 'food_type', 'room_type', 'amenities', 'pricing_value', 'landmark'])

def encode_and_cluster(df, columns, n_clusters=4, min_samples=4):
    if df.empty:
        return df

    n_samples = len(df)
    if n_samples < min_samples:
        df['cluster'] = 0
        return df

    adjusted_clusters = min(n_clusters, n_samples)

    encoders = {}
    encoded_data = pd.DataFrame()
    for col in columns:
        encoders[col] = LabelEncoder()
        encoded_data[col] = encoders[col].fit_transform(df[col])

    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(encoded_data)

    try:
        km = KMeans(n_clusters=adjusted_clusters, random_state=42)
        df['cluster'] = km.fit_predict(scaled_data)

        if adjusted_clusters > 1 and n_samples > adjusted_clusters:
            score = silhouette_score(scaled_data, df['cluster'])
            print(f"Silhouette Score for {columns}: {score:.3f}")

    except ValueError:
        df['cluster'] = 0

    return df

if not student_df.empty:
    student_df = encode_and_cluster(student_df, ['food_type', 'room_type', 'amenities', 'pricing_value', 'landmark'])
    for _, row in student_df.iterrows():
        cursor.execute("UPDATE students SET cluster = %s WHERE email = %s", (int(row['cluster']), row['email']))

cursor.execute("""
    SELECT email, food_type 
    FROM services 
    WHERE service = 'Food' AND food_type IS NOT NULL
""")
food_data = cursor.fetchall()
food_df = pd.DataFrame(food_data, columns=['email', 'food_type'])
if not food_df.empty:
    food_df = encode_and_cluster(food_df, ['food_type'])
    for _, row in food_df.iterrows():
        cursor.execute("UPDATE services SET cluster = %s WHERE email = %s AND service = 'Food'", (int(row['cluster']), row['email']))

cursor.execute("""
    SELECT email, laundry_service 
    FROM services 
    WHERE service = 'Laundry' AND laundry_service IS NOT NULL
""")
laundry_data = cursor.fetchall()
laundry_df = pd.DataFrame(laundry_data, columns=['email', 'laundry_service'])
if not laundry_df.empty:
    laundry_df = encode_and_cluster(laundry_df, ['laundry_service'])
    for _, row in laundry_df.iterrows():
        cursor.execute("UPDATE services SET cluster = %s WHERE email = %s AND service = 'Laundry'", (int(row['cluster']), row['email']))

cursor.execute("""
    SELECT email, room_type, amenities, pricing_value, landmark 
    FROM services 
    WHERE service = 'Broker' AND room_type IS NOT NULL AND amenities IS NOT NULL 
    AND pricing_value IS NOT NULL AND landmark IS NOT NULL
""")
broker_data = cursor.fetchall()
broker_df = pd.DataFrame(broker_data, columns=['email', 'room_type', 'amenities', 'pricing_value', 'landmark'])
if not broker_df.empty:
    broker_df = encode_and_cluster(broker_df, ['room_type', 'amenities', 'pricing_value', 'landmark'])
    for _, row in broker_df.iterrows():
        cursor.execute("UPDATE services SET cluster = %s WHERE email = %s AND service = 'Broker'", (int(row['cluster']), row['email']))

def recommend_services(student_email, cursor):
    cursor.execute("""
        SELECT food_type, room_type, amenities, pricing_value, landmark, cluster 
        FROM students WHERE email = %s
    """, (student_email,))
    student = cursor.fetchone()
    if not student:
        return {"error": "Student not found"}

    student_prefs = {
        'food_type': student[0],
        'room_type': student[1],
        'amenities': student[2],
        'pricing_value': student[3],
        'landmark': student[4],
        'cluster': student[5]
    }

    recommendations = {'Food': [], 'Laundry': [], 'Broker': []}

    food_query = """
        SELECT email, business_name, food_type, cluster
        FROM services
        WHERE service = 'Food' AND food_type IS NOT NULL
        ORDER BY (cluster = %s) DESC, FIELD(food_type, %s, 'Both') DESC, business_name
    """
    food_preference = student_prefs['food_type']
    cursor.execute(food_query, (student_prefs['cluster'], food_preference))
    food_results = cursor.fetchall()
    recommendations['Food'] = [
        {'email': row[0], 'business_name': row[1], 'food_type': row[2], 'cluster': row[3]}
        for row in food_results
    ]

    laundry_query = """
        SELECT email, business_name, laundry_service, cluster
        FROM services
        WHERE service = 'Laundry' AND laundry_service IS NOT NULL
        ORDER BY (cluster = %s) DESC, business_name
    """
    cursor.execute(laundry_query, (student_prefs['cluster'],))
    laundry_results = cursor.fetchall()
    recommendations['Laundry'] = [
        {'email': row[0], 'business_name': row[1], 'laundry_service': row[2], 'cluster': row[3]}
        for row in laundry_results
    ]

    broker_query = """
        SELECT email, business_name, room_type, amenities, pricing_value, landmark, cluster
        FROM services
        WHERE service = 'Broker' 
            AND room_type = %s 
            AND amenities = %s 
            AND pricing_value = %s 
            AND landmark = %s
        ORDER BY (cluster = %s) DESC, business_name
    """
    cursor.execute(broker_query, (
        student_prefs['room_type'], student_prefs['amenities'],
        student_prefs['pricing_value'], student_prefs['landmark'],
        student_prefs['cluster']
    ))
    broker_results = cursor.fetchall()
    recommendations['Broker'] = [
        {
            'email': row[0],
            'business_name': row[1],
            'room_type': row[2],
            'amenities': row[3],
            'pricing_value': row[4],
            'landmark': row[5],
            'cluster': row[6]
        }
        for row in broker_results
    ]

    return recommendations

conn.commit()
cursor.close()
conn.close()

print("✅ Clustering completed and recommendations generated.")
