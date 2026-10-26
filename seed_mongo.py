import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

load_dotenv(os.path.join(os.path.dirname(__file__), 'backend/.env'))
MONGODB_URI = os.getenv("MONGODB_URI") or "mongodb+srv://dharun143:dharun143@cluster0.mxw8xkj.mongodb.net/gridwise?retryWrites=true&w=majority"
client = AsyncIOMotorClient(MONGODB_URI)
db = client.get_database("gridwise")

async def check_and_seed():
    collections = await db.list_collection_names()
    print(f"Existing collections: {collections}")
    
    # Check battery
    if "battery" not in collections or await db["battery"].count_documents({}) == 0:
        await db["battery"].insert_one({
            "percentage": 68,
            "energyAvailableKwh": 51.2,
            "capacityKwh": 75.0,
            "estimatedRangeKm": 342,
            "status": "Healthy",
            "temperatureC": 24,
            "voltage": 355
        })
        print("Seeded battery")
        
    # Check trips
    if "trips" not in collections or await db["trips"].count_documents({}) == 0:
        await db["trips"].insert_many([
            {"day": 2, "details": "Coimbatore → Tirupur (45.2 km)"},
            {"day": 5, "details": "City Run (12.1 km)"},
            {"day": 8, "details": "Coimbatore → Ooty (86.4 km)"},
            {"day": 12, "details": "Office commute (22.5 km)"},
            {"day": 28, "details": "Coimbatore → Pollachi (67.8 km)"}
        ])
        print("Seeded trips")

    # Check payments
    if "payments" not in collections or await db["payments"].count_documents({}) == 0:
        await db["payments"].insert_many([
            {
                "date": "2026-08-28T14:30:00Z",
                "amount": 450.00,
                "type": "Charging",
                "station": "Zeon Charging, Pollachi",
                "status": "Completed"
            },
            {
                "date": "2026-08-25T09:15:00Z",
                "amount": 1500.00,
                "type": "Wallet Top-up",
                "method": "UPI",
                "status": "Completed"
            }
        ])
        print("Seeded payments")
        
    print("Done checking and seeding data.")

if __name__ == "__main__":
    asyncio.run(check_and_seed())
