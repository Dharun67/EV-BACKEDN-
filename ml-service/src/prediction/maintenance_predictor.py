import os
import json

MODEL_DIR = os.path.join(os.path.dirname(__file__), '../../models')
STATS_PATH = os.path.join(MODEL_DIR, 'charger_health_stats.json')
METADATA_PATH = os.path.join(MODEL_DIR, 'maintenance_metadata.json')

charger_stats = None
metadata = None

def load_data():
    global charger_stats, metadata
    if os.path.exists(STATS_PATH) and os.path.exists(METADATA_PATH):
        try:
            with open(STATS_PATH, 'r') as f:
                charger_stats = json.load(f)
            with open(METADATA_PATH, 'r') as f:
                metadata = json.load(f)
            return True
        except Exception as e:
            print(f"Failed to load maintenance data: {e}")
            return False
    return False

# Load it once globally when module is imported
load_data()

def predict_maintenance(charger_id: str):
    if not charger_stats:
        if not load_data():
            raise Exception("Maintenance data not available")
            
    # Default stats if charger is unknown (brand new charger)
    stats = charger_stats.get(charger_id, {
        "healthScore": 100.0,
        "riskLevel": "HEALTHY",
        "recommendedAction": "None",
        "priority": "LOW",
        "stationId": "UNKNOWN"
    })
    
    return {
        "success": True,
        "chargerId": charger_id,
        "stationId": stats.get('stationId', 'UNKNOWN'),
        "riskLevel": stats['riskLevel'],
        "healthScore": stats['healthScore'],
        "maintenancePriority": stats['priority'],
        "recommendedAction": stats['recommendedAction'],
        "modelVersion": metadata.get('model_version', '1.0') if metadata else "1.0",
        "factors": {
            "sessionsCount": stats.get('sessionsCount', 0),
            "zeroEnergyRate": stats.get('zeroEnergyRate', 0.0),
            "abnormalRate": stats.get('abnormalRate', 0.0)
        }
    }
