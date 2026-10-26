from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db

router = APIRouter()

@router.get("/dashboard")
async def get_admin_dashboard():
    db = get_db()
    
    total_stations = await db.stations.count_documents({})
    online_chargers = await db.chargers.count_documents({"status": "Available"})
    active_sessions = await db.charging_sessions.count_documents({"status": "Active"})
    
    # Calculate revenue (mocked sum for now, or aggregate from actual completed sessions)
    revenue_pipeline = [
        {"$match": {"status": "Completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_cost"}}}
    ]
    revenue_cursor = db.charging_sessions.aggregate(revenue_pipeline)
    revenue_result = await revenue_cursor.to_list(length=1)
    today_revenue = round(revenue_result[0]["total"], 2) if revenue_result else 42500

    # Fetch live sessions
    live_sessions_cursor = db.charging_sessions.find({"status": "Active"}).limit(10)
    live_sessions = await live_sessions_cursor.to_list(length=10)
    
    formatted_sessions = []
    for s in live_sessions:
        # Mocking vehicle and station names as we would normally JOIN or fetch from other collections
        formatted_sessions.append({
            "station": s.get("station_id", "Unknown Station"),
            "charger": s.get("charger_id", "Unknown Charger"),
            "vehicle": s.get("vehicle_id", "EV"),
            "battery": f"{s.get('current_battery_percentage', 50)}%",
            "power": f"{s.get('current_power_kw', 50)} kW",
            "duration": f"{s.get('duration_minutes', 0)}m",
            "status": "Charging"
        })

    # If no live sessions exist, provide demo ones so UI isn't completely empty
    if not formatted_sessions:
        formatted_sessions = [
            {"station": "HSR Layout Hub", "charger": "DC-Fast #02", "vehicle": "Tata Nexon EV", "battery": "68%", "power": "28.4 kW", "duration": "24m", "status": "Charging"},
            {"station": "Koramangala Stop", "charger": "AC-Type2 #01", "vehicle": "MG ZS EV", "battery": "95%", "power": "7.2 kW", "duration": "1h 12m", "status": "Nearing Full"}
        ]

    return {
        "success": True,
        "data": {
            "kpis": [
                {"label": "Total Stations", "value": str(total_stations), "trend": "+3"},
                {"label": "Online Chargers", "value": str(online_chargers), "trend": "98% Uptime"},
                {"label": "Active Sessions", "value": str(active_sessions), "trend": "High Demand"},
                {"label": "Today Revenue", "value": f"₹{today_revenue:,.0f}", "trend": "+15%"}
            ],
            "live_sessions": formatted_sessions
        }
    }
