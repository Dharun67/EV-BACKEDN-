import os
import json
import pandas as pd
from datetime import datetime

MODEL_DIR = os.path.join(os.path.dirname(__file__), '../../models')
os.makedirs(MODEL_DIR, exist_ok=True)
METADATA_FILE = os.path.join(MODEL_DIR, 'maintenance_metadata.json')
CHARGER_STATS_FILE = os.path.join(MODEL_DIR, 'charger_health_stats.json')

def generate_health_stats():
    print("Loading real cleaned dataset for predictive maintenance...")
    csv_path = os.path.join(os.path.dirname(__file__), '../../../data/cleaned/ev_charging_sessions.csv')
    df = pd.read_csv(csv_path)
    
    total_sessions = len(df)
    
    # We will treat space_id as chargerId since a space generally corresponds to a charger in this dataset
    # And station_id is the grouping station. 
    # If the user asks for chargerId prediction, we look up space_id.
    
    # Feature Engineering per Charger (space_id)
    charger_stats = {}
    
    for charger_id, group in df.groupby('space_id'):
        sessions_count = len(group)
        total_energy = group['energy_consumed_kwh'].sum()
        
        # Zero energy sessions (proxy for failure / immediate disconnect)
        zero_energy_sessions = len(group[group['energy_consumed_kwh'] == 0])
        zero_energy_rate = zero_energy_sessions / sessions_count if sessions_count > 0 else 0
        
        # Idle/abnormal connection behavior: connection is vastly longer than charging, but energy is low
        # Indicates charger error or communication fault.
        abnormal_sessions = len(group[(group['connection_duration_min'] > group['charging_duration_min'] * 2) & (group['energy_consumed_kwh'] < 5)])
        abnormal_rate = abnormal_sessions / sessions_count if sessions_count > 0 else 0
        
        # Baseline Health is 100
        health_score = 100.0
        
        # Deduct based on wear and tear (usage intensity)
        # Assuming typical charger lifetime of 10000 sessions or 500000 kWh, scale down gently
        wear_tear_penalty = (sessions_count / 100) + (total_energy / 5000)
        health_score -= wear_tear_penalty
        
        # Deduct heavily for zero energy / abnormal faults
        fault_penalty = (zero_energy_rate * 40) + (abnormal_rate * 20)
        health_score -= fault_penalty
        
        # Clamp between 0 and 100
        health_score = max(0.0, min(100.0, health_score))
        
        # Risk classification
        if health_score >= 80:
            risk_level = "HEALTHY"
            recommended_action = "None"
            priority = "LOW"
        elif health_score >= 60:
            risk_level = "MONITOR"
            recommended_action = "Routine inspection at next service window"
            priority = "LOW"
        elif health_score >= 40:
            risk_level = "WARNING"
            recommended_action = "Schedule maintenance soon (High fault rate detected)"
            priority = "MEDIUM"
        else:
            risk_level = "CRITICAL"
            recommended_action = "Immediate inspection required! Potential hardware failure."
            priority = "URGENT"
            
        charger_stats[charger_id] = {
            "sessionsCount": int(sessions_count),
            "totalEnergyKwh": float(total_energy),
            "zeroEnergyRate": float(zero_energy_rate),
            "abnormalRate": float(abnormal_rate),
            "healthScore": float(round(health_score, 1)),
            "riskLevel": risk_level,
            "recommendedAction": recommended_action,
            "priority": priority,
            "stationId": group.iloc[0]['station_id']
        }
        
    # Save the static stats mapping to be used by the predictor
    # (Since this is unsupervised, the "model" is this precomputed mapping of historical reality)
    with open(CHARGER_STATS_FILE, 'w') as f:
        json.dump(charger_stats, f, indent=2)
        
    print(f"Generated health stats for {len(charger_stats)} chargers.")
    
    # Model Metadata as requested
    metadata = {
        "model_name": "Unsupervised_Charger_Health_Scoring",
        "model_version": "1.0.0",
        "training_date": datetime.utcnow().isoformat(),
        "dataset": "ev_charging_sessions.csv",
        "features": ["sessionsCount", "totalEnergyKwh", "zeroEnergyRate", "abnormalRate"],
        "target": "None (Unsupervised)",
        "training_rows": total_sessions,
        "testing_rows": 0,
        "metrics": {
            "accuracy": None,
            "precision": None,
            "recall": None,
            "f1_score": None,
            "roc_auc": None
        },
        "limitations": "No direct maintenance or failure labels available in dataset. Using rule-based health score based on session faults and usage intensity."
    }
    
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print("Done! Maintenance baseline generated.")

if __name__ == '__main__':
    generate_health_stats()
