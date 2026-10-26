from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import Optional
from app.core.database import get_db
import datetime
import asyncio
import json

router = APIRouter()

@router.get("/{session_id}")
async def get_session_status(session_id: str):
    db = get_db()
    session = await db.charging_sessions.find_one({"session_id": session_id})
    
    if not session:
        # For demo purposes, we will return a mock session if not found in db
        session = {
            "session_id": session_id,
            "station_id": "demo_station",
            "station_name": "ChargeHub Peelamedu",
            "charger_id": "CCS2",
            "vehicle_id": "Vehicle #24",
            "status": "Active",
            "current_battery_percentage": 68,
            "current_power_kw": 92,
            "energy_delivered_kwh": 12.4,
            "estimated_time_remaining_minutes": 18,
            "current_cost": 180,
            "start_time": datetime.datetime.utcnow().isoformat()
        }
    else:
        session["_id"] = str(session["_id"])
        session["current_battery_percentage"] = session.get("current_battery_percentage", 68)
        session["current_power_kw"] = session.get("current_power_kw", 92)
        session["energy_delivered_kwh"] = session.get("energy_delivered_kwh", 12.4)
        session["estimated_time_remaining_minutes"] = session.get("estimated_time_remaining_minutes", 18)
        session["current_cost"] = session.get("current_cost", 180)
        
    return {"success": True, "data": session}

@router.post("/{session_id}/stop")
async def stop_session(session_id: str):
    db = get_db()
    result = await db.charging_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "Completed", "end_time": datetime.datetime.utcnow().isoformat()}}
    )
    return {"success": True, "message": "Session stopped successfully"}

# Real-time WebSocket for live charging telemetry
@router.websocket("/ws/{session_id}")
async def websocket_charging_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    # Initial state
    battery = 68
    power = 92
    energy = 12.4
    cost = 180
    time_left = 18

    try:
        while True:
            # Simulate real-time charging IoT telemetry
            battery = min(100, battery + 1)
            energy += 0.5
            cost += 7.5
            time_left = max(0, time_left - 1)
            
            # As battery fills up, charge rate (power) slows down
            if battery > 80:
                power = max(10, power - 5)

            data = {
                "type": "TELEMETRY_UPDATE",
                "session_id": session_id,
                "current_battery_percentage": battery,
                "current_power_kw": power,
                "energy_delivered_kwh": round(energy, 2),
                "estimated_time_remaining_minutes": time_left,
                "current_cost": round(cost, 2),
                "status": "Completed" if battery >= 100 else "Active"
            }
            
            await websocket.send_text(json.dumps(data))
            
            if battery >= 100:
                break
                
            await asyncio.sleep(2) # Send update every 2 seconds for demo speed
            
    except WebSocketDisconnect:
        print(f"Client disconnected from session {session_id}")
