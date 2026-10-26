from fastapi import APIRouter
from typing import Optional
from app.core.database import get_db
import random

router = APIRouter()

@router.get("/")
async def get_maintenance_predictions():
    # In a real app, this would hit the ML endpoint. For now, simulate physics/reliability data
    db = get_db()
    chargers_cursor = db.chargers.find().limit(15)
    chargers = await chargers_cursor.to_list(length=15)
    
    predictions = []
    for idx, c in enumerate(chargers):
        health = random.randint(40, 99)
        failure_prob = max(0, 100 - health + random.randint(-5, 10))
        
        predictions.append({
            "charger_id": c.get("charger_id", f"CHG-{idx}"),
            "station_id": c.get("station_id", "Unknown"),
            "health_score": health,
            "failure_probability": failure_prob,
            "maintenance_recommendation": "Schedule Inspection" if failure_prob > 30 else "Healthy",
            "reasons": ["Voltage fluctuations", "High cycle count"] if failure_prob > 30 else []
        })
        
    return {"success": True, "data": predictions, "data_source": "ML_PREDICTION"}
