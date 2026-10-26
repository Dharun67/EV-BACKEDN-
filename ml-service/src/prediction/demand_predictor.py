import os
import json
import joblib
import pandas as pd
from datetime import datetime

MODEL_DIR = os.path.join(os.path.dirname(__file__), '../../models')
MODEL_PATH = os.path.join(MODEL_DIR, 'demand_model.joblib')
METADATA_PATH = os.path.join(MODEL_DIR, 'demand_metadata.json')

model = None
metadata = None

def load_model():
    global model, metadata
    if os.path.exists(MODEL_PATH) and os.path.exists(METADATA_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            with open(METADATA_PATH, 'r') as f:
                metadata = json.load(f)
            return True
        except Exception as e:
            print(f"Failed to load demand model: {e}")
            return False
    return False

# Load it once globally when module is imported
load_model()

def get_demand_level(predicted_demand):
    if not metadata or 'thresholds' not in metadata:
        return "UNKNOWN"
        
    t = metadata['thresholds']
    if predicted_demand <= t['LOW_MAX']:
        return "LOW"
    elif predicted_demand <= t['MEDIUM_MAX']:
        return "MEDIUM"
    elif predicted_demand <= t['HIGH_MAX']:
        return "HIGH"
    else:
        return "VERY_HIGH"

def predict_demand(station_id, timestamp_str):
    if not model:
        if not load_model():
            raise Exception("Demand model not available")
            
    try:
        dt = pd.to_datetime(timestamp_str)
    except:
        dt = pd.Timestamp.now()
        
    hour = dt.hour
    day_of_week = dt.dayofweek
    day_of_month = dt.day
    month = dt.month
    is_weekend = 1 if day_of_week >= 5 else 0
    
    # Normally we would fetch real lag demand from a cache/db. 
    # For now, default to 0 as most of the time it is 0.
    previous_demand = 0 
    
    # Create feature dataframe in the exact same order as training
    features = pd.DataFrame([{
        'station_id': station_id,
        'hour': hour,
        'day_of_week': day_of_week,
        'day_of_month': day_of_month,
        'month': month,
        'is_weekend': is_weekend,
        'previous_demand': previous_demand
    }])
    
    prediction = model.predict(features)[0]
    
    # Ensure no negative predictions (due to Gradient Boosting behavior)
    predicted_demand = max(0, int(round(prediction)))
    demand_level = get_demand_level(predicted_demand)
    
    return {
        "success": True,
        "stationId": station_id,
        "predictedDemand": predicted_demand,
        "demandLevel": demand_level,
        "predictionHorizon": "1 hour",
        "modelVersion": metadata.get('model_version', '1.0') if metadata else "1.0",
        "timestamp": dt.isoformat()
    }
