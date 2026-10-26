from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.core.database import get_db

router = APIRouter()

@router.get("/")
async def get_all_stations():
    db = get_db()
    stations_cursor = db.stations.find().limit(100)
    stations = await stations_cursor.to_list(length=100)
    
    for s in stations:
        s["_id"] = str(s["_id"])
        
    return {"success": True, "data": stations}

@router.get("/nearby")
async def get_nearby_stations(lat: float, lng: float, radius: float = 10.0):
    db = get_db()
    
    # MongoDB 2dsphere index required for $geoNear, but we'll do a simple coordinate bounding box or aggregation if geospatial isn't setup.
    # For a hackathon where lat/long aren't GeoJSON formats natively in our import script, we'll do a quick math bounding box.
    # 1 deg lat = ~111km. 1 deg lng = ~111 * cos(lat)
    lat_delta = radius / 111.0
    lng_delta = radius / (111.0 * (min(max(lat, -90), 90) % 90 == 0 and 1 or 0.8)) # Rough approx for India (~0.9)
    
    query = {
        "latitude": {"$gte": lat - lat_delta, "$lte": lat + lat_delta},
        "longitude": {"$gte": lng - lng_delta, "$lte": lng + lng_delta}
    }
    
    cursor = db.stations.find(query).limit(50)
    stations = await cursor.to_list(length=50)
    
    for s in stations:
        s["_id"] = str(s["_id"])
        # Calculate rough distance
        s["distance_km"] = round(((s["latitude"] - lat)**2 + (s["longitude"] - lng)**2)**0.5 * 111.0, 1)
        
    # Sort by distance
    stations = sorted(stations, key=lambda x: x["distance_km"])
        
    return {"success": True, "data": stations}

@router.get("/{id}")
async def get_station_details(id: str):
    db = get_db()
    station = await db.stations.find_one({"station_id": id})
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
        
    station["_id"] = str(station["_id"])
    
    chargers_cursor = db.chargers.find({"station_id": id})
    chargers = await chargers_cursor.to_list(length=100)
    
    for c in chargers:
        c["_id"] = str(c["_id"])
        
    station["chargers"] = chargers
    
    return {"success": True, "data": station}
