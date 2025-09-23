import os
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from sklearn.cluster import KMeans
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import silhouette_score
import mysql.connector
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

try:
    # Connect to MySQL
    conn = mysql.connector.connect(
        host=os.getenv('host'),
        user=os.getenv('user'),
        password=os.getenv('password'),
        database=os.getenv('database'),
    )
    cursor = conn.cursor(dictionary=True)
    logging.info("Connected to database successfully")
except mysql.connector.Error as e:
    logging.error(f"Database connection failed: {e}")
    exit(1)

try:
    # Fetch student data
    cursor.execute("SELECT * FROM students")
    students = cursor.fetchall()
    if not students:
        logging.error("No student data found in the database")
        exit(1)
    df = pd.DataFrame(students)
    logging.info(f"Fetched {len(df)} student records")

    # Check for required columns
    required_columns = ['email', 'food_type', 'room_type', 'amenities', 'year', 'branch']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        logging.error(f"Missing columns in data: {missing_columns}")
        exit(1)

    # Handle missing values
    for col in ['food_type', 'room_type', 'amenities', 'year', 'branch']:
        if df[col].isnull().any():
            logging.warning(f"Missing values in {col}. Filling with 'Unknown'")
            df[col].fillna('Unknown', inplace=True)

    # Encode categorical columns
    encoders = {}
    for column in ['food_type', 'room_type', 'amenities', 'year', 'branch']:
        le = LabelEncoder()
        df[column] = le.fit_transform(df[column].astype(str))
        encoders[column] = le
        logging.info(f"Encoded column {column}")

    # Select features for clustering
    features = ['food_type', 'room_type', 'amenities', 'year', 'branch']
    X = df[features]

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    logging.info("Scaled features for clustering")

    # Determine optimal number of clusters (silhouette method)
    silhouette_scores = []
    max_clusters = min(10, len(df) // 2) 
    for k in range(2, max_clusters + 1):
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X_scaled)
        score = silhouette_score(X_scaled, kmeans.labels_)
        silhouette_scores.append(score)
    optimal_clusters = silhouette_scores.index(max(silhouette_scores)) + 2 if silhouette_scores else 4
    logging.info(f"Optimal number of clusters: {optimal_clusters}")

    # Apply K-Means clustering
    kmeans = KMeans(n_clusters=optimal_clusters, random_state=42, n_init=10)
    df['match_cluster'] = kmeans.fit_predict(X_scaled)
    logging.info("K-Means clustering completed")

    # Validate clusters (check homogeneity within clusters)
    for cluster in range(optimal_clusters):
        cluster_data = df[df['match_cluster'] == cluster]
        logging.info(f"Cluster {cluster} size: {len(cluster_data)}")
        for col in features:
            unique_values = cluster_data[col].nunique()
            logging.info(f"Cluster {cluster} - Unique {col}: {unique_values}")

    # Batch update database with cluster labels
    update_query = "UPDATE students SET match_cluster = %s WHERE email = %s"
    update_data = [(int(row['match_cluster']), row['email']) for _, row in df.iterrows()]
    cursor.executemany(update_query, update_data)
    conn.commit()
    logging.info("Database updated with cluster labels")

except Exception as e:
    logging.error(f"An error occurred: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
    logging.info("Database connection closed")

print("✅ Clusters updated successfully!")