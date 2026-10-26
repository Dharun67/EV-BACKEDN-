from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db

router = APIRouter()

class RecommendRequest(BaseModel):
    lat: float
    lng: float
    battery_percentage: float
    vehicle_id: Optional[str] = None

@router.post("/recommend")
async def recommend_station(request: RecommendRequest):
    db = get_db()
    
    # Simple logic: get a nearby station that has available chargers,
    # and has a good predicted wait time.
    # We will use geospatial/bounding box search.
    lat, lng = request.lat, request.lng
    radius = 20.0
    lat_delta = radius / 111.0
    lng_delta = radius / (111.0 * 0.9)
    
    query = {
        "latitude": {"$gte": lat - lat_delta, "$lte": lat + lat_delta},
        "longitude": {"$gte": lng - lng_delta, "$lte": lng + lng_delta}
    }
    
    cursor = db.stations.find(query).limit(10)
    stations = await cursor.to_list(length=10)
    
    if not stations:
        return {"success": False, "error": {"message": "No stations nearby"}}
        
    # Pick the best one (for demo, just sort by distance + mock ai match score)
    best_station = None
    best_score = 0
    
    for s in stations:
        dist = round(((s["latitude"] - lat)**2 + (s["longitude"] - lng)**2)**0.5 * 111.0, 1)
        # Mock AI logic: score based on distance, and some random factor. Closer is better.
        # AI models would be loaded here.
        score = max(50, 100 - dist * 2) 
        
        if score > best_score:
            best_score = int(score)
            best_station = s
            best_station["distance_km"] = dist
            
    if not best_station:
        return {"success": False, "error": {"message": "Could not calculate best station"}}
        
    return {
        "success": True,
        "data": {
            "station_id": best_station["station_id"],
            "station_name": best_station["station_name"],
            "ai_match_score": best_score,
            "distance_km": best_station["distance_km"],
            "eta_minutes": int(best_station["distance_km"] * 2.5), # Approx ETA
            "predicted_wait_minutes": 5, # In reality use wait_model.joblib
            "estimated_cost_per_kwh": 14.5,
            "reasons": [
                "Low predicted waiting time",
                "On your route",
                "Compatible charger"
            ]
        }
    }
