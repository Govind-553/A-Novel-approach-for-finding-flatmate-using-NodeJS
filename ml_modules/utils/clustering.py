import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import silhouette_score
from ml_modules.config.database import get_database

def fetch_data(collection_name: str, query: dict = {}, projection: dict = None):
    """Fetches data from MongoDB and returns a Pandas DataFrame."""
    db = get_database()
    cursor = db[collection_name].find(query, projection)
    data = list(cursor)
    if not data:
        return pd.DataFrame()
    return pd.DataFrame(data)

def perform_clustering(df: pd.DataFrame, features: list, n_clusters_default: int = 4, min_samples: int = 4):
    """
    Performs clustering on the DataFrame.
    Returns the DataFrame with a new 'new_cluster_label' column.
    """
    if df.empty or len(df) < min_samples:
        df['new_cluster_label'] = 0
        return df

    # Prepare data
    X = df[features].copy()
    
    # Fill missing values
    for col in features:
        X[col] = X[col].fillna("Unknown") 

    # Encode
    X_encoded = X.copy()
    for col in features:
        le = LabelEncoder()
        X_encoded[col] = le.fit_transform(X[col].astype(str))

    # Scale
    scaler = StandardScaler()
    X_final = scaler.fit_transform(X_encoded)

    # Determine K
    max_k = min(10, len(df))
    best_k = n_clusters_default
    best_score = -1

    if len(df) > 2:
        for k in range(2, max_k + 1):
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_final)
            if len(set(labels)) > 1:
                score = silhouette_score(X_final, labels)
                if score > best_score:
                    best_score = score
                    best_k = k
    
    # Final Fit
    kmeans_final = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    df['new_cluster_label'] = kmeans_final.fit_predict(X_final)
    
    return df
