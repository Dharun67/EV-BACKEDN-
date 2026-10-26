import os
from pymongo import MongoClient
import pandas as pd

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "gridwise"

def get_db():
    client = MongoClient(MONGO_URI)
    return client[DB_NAME]

def get_demand_data():
    """
    Fetches real demand data from MongoDB and returns a pandas DataFrame.
    """
    db = get_db()
    cursor = db.demanddatas.find({})
    df = pd.DataFrame(list(cursor))
    
    if df.empty:
        return df

    # Drop the mongo ID
    if '_id' in df.columns:
        df = df.drop(columns=['_id'])
    
    # Ensure timestamp is datetime
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
    return df

def get_charging_sessions():
    """
    Fetches real charging sessions from MongoDB and returns a pandas DataFrame.
    """
    db = get_db()
    cursor = db.chargingsessions.find({})
    df = pd.DataFrame(list(cursor))
    
    if df.empty:
        return df

    if '_id' in df.columns:
        df = df.drop(columns=['_id'])
        
    if 'startTime' in df.columns:
        df['startTime'] = pd.to_datetime(df['startTime'])
    if 'endTime' in df.columns:
        df['endTime'] = pd.to_datetime(df['endTime'])
        
    return df

def get_stations():
    """
    Fetches real stations from MongoDB and returns a pandas DataFrame.
    """
    db = get_db()
    cursor = db.stations.find({})
    df = pd.DataFrame(list(cursor))
    
    if df.empty:
        return df

    if '_id' in df.columns:
        df = df.drop(columns=['_id'])
        
    return df
