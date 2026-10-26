from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.core.database import get_db

router = APIRouter()

@router.get("/{station_id}")
async def get_queue(station_id: str):
    db = get_db()
    
    # In a real app we'd fetch this from Redis or MongoDB queue_entries collection.
    # For now, we will aggregate a realistic response for the UI.
    queue_cursor = db.queue_entries.find({"station_id": station_id, "status": "Waiting"}).sort("position", 1).limit(5)
    queue = await queue_cursor.to_list(length=5)
    
    formatted_queue = []
    
    # Add a charging vehicle
    formatted_queue.append({
        "id": "q_active_1",
        "vehicle": "Vehicle #24",
        "status": "Charging",
        "is_user": False
    })
    
    for idx, q in enumerate(queue):
        formatted_queue.append({
            "id": str(q["_id"]),
            "vehicle": f"Vehicle #{q.get('user_id', 'XX')[-2:].upper()}",
            "status": "Waiting",
            "is_user": False
        })
        
    # Append the user
    formatted_queue.append({
        "id": "q_user",
        "vehicle": "YOU",
        "status": "Waiting",
        "is_user": True,
        "position": len(formatted_queue) + 1
    })

    return {
        "success": True,
        "data": {
            "queue": formatted_queue,
            "estimated_wait_minutes": len(formatted_queue) * 15 - 5
        }
    }
