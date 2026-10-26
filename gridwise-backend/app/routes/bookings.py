from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from app.core.database import get_db

router = APIRouter()

class BookingCreate(BaseModel):
    station_id: str
    charger_id: str
    date: str
    time: str
    user_id: Optional[str] = "demo_user"
    idempotency_key: str
    duration_minutes: Optional[int] = 30

@router.post("/")
async def create_booking(booking: BookingCreate):
    db = get_db()
    
    # Check if station exists
    station = await db.stations.find_one({"station_id": booking.station_id})
    
    # Duplicate booking protection via idempotency key
    existing_booking = await db.bookings.find_one({"idempotency_key": booking.idempotency_key})
    if existing_booking:
        existing_booking["_id"] = str(existing_booking["_id"])
        return {"success": True, "data": existing_booking, "message": "Recovered existing booking from idempotency key"}
        
    # Concurrency check: Ensure charger isn't already booked for this time
    conflict = await db.bookings.find_one({
        "station_id": booking.station_id,
        "charger_id": booking.charger_id,
        "date": booking.date,
        "time": booking.time,
        "status": {"$ne": "Cancelled"}
    })
    
    if conflict:
        return {"success": False, "error": {"code": "CHARGER_UNAVAILABLE", "message": "The selected charger is no longer available."}}

    booking_doc = {
        "booking_id": str(uuid.uuid4()),
        "idempotency_key": booking.idempotency_key,
        "station_id": booking.station_id,
        "station_name": station["station_name"] if station else "Unknown Station",
        "charger_id": booking.charger_id,
        "date": booking.date,
        "time": booking.time,
        "duration_minutes": booking.duration_minutes,
        "user_id": booking.user_id,
        "status": "Confirmed",
        "created_at": datetime.utcnow()
    }
    
    await db.bookings.insert_one(booking_doc)
    booking_doc["_id"] = str(booking_doc["_id"])
    
    return {"success": True, "data": booking_doc}

@router.get("/")
async def get_bookings():
    db = get_db()
    cursor = db.bookings.find().sort("created_at", -1).limit(20)
    bookings = await cursor.to_list(length=20)
    for b in bookings:
        b["_id"] = str(b["_id"])
    return {"success": True, "data": bookings}

@router.get("/{id}")
async def get_booking(id: str):
    db = get_db()
    booking = await db.bookings.find_one({"booking_id": id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking["_id"] = str(booking["_id"])
    return {"success": True, "data": booking}

@router.post("/{id}/cancel")
async def cancel_booking(id: str):
    db = get_db()
    result = await db.bookings.update_one({"booking_id": id}, {"$set": {"status": "Cancelled"}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found or already cancelled")
    return {"success": True, "message": "Booking cancelled successfully"}
