import pymongo
from datetime import datetime, timedelta
import random

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "gridwise"

def seed_demo_data():
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    print("Seeding demo data into GridWise MongoDB...")
    
    # 1. Users
    db.users.delete_many({"data_source": "SIMULATED"})
    users = []
    for i in range(30):
        users.append({
            "user_id": f"USR-{1000+i}",
            "name": f"Demo User {i+1}",
            "email": f"demo{i+1}@gridwise.app",
            "role": "USER",
            "data_source": "SIMULATED",
            "created_at": datetime.utcnow()
        })
    db.users.insert_many(users)
    
    # 2. Vehicles
    db.vehicles.delete_many({"data_source": "SIMULATED"})
    brands_models = [
        ("Tata", "Nexon EV", 40.5, "CCS2", 140),
        ("MG", "ZS EV", 50.3, "CCS2", 150),
        ("Hyundai", "Ioniq 5", 72.6, "CCS2", 180),
        ("BYD", "Atto 3", 60.48, "CCS2", 160)
    ]
    vehicles = []
    for user in users:
        bm = random.choice(brands_models)
        vehicles.append({
            "vehicle_id": f"VEH-{user['user_id']}",
            "user_id": user["user_id"],
            "brand": bm[0],
            "model": bm[1],
            "battery_capacity_kwh": bm[2],
            "current_battery_percentage": random.randint(15, 85),
            "connector_type": bm[3],
            "efficiency_wh_per_km": bm[4],
            "data_source": "SIMULATED",
            "created_at": datetime.utcnow()
        })
    db.vehicles.insert_many(vehicles)
    
    # Fetch valid stations to bind bookings to
    stations = list(db.stations.find().limit(50))
    if not stations:
        print("No stations found. Please run import_stations.py first.")
        return
        
    chargers = list(db.chargers.find({"station_id": {"$in": [s["station_id"] for s in stations]}}))
    
    # 3. Bookings & Charging Sessions
    db.bookings.delete_many({"data_source": "SIMULATED"})
    db.charging_sessions.delete_many({"data_source": "SIMULATED"})
    
    bookings = []
    sessions = []
    
    for i in range(500):
        user = random.choice(users)
        veh = next(v for v in vehicles if v["user_id"] == user["user_id"])
        charger = random.choice(chargers)
        
        start_time = datetime.utcnow() - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23))
        end_time = start_time + timedelta(minutes=random.randint(20, 60))
        
        booking_id = f"BKG-{80000+i}"
        
        bookings.append({
            "booking_id": booking_id,
            "user_id": user["user_id"],
            "vehicle_id": veh["vehicle_id"],
            "station_id": charger["station_id"],
            "charger_id": charger["charger_id"],
            "booking_date": start_time,
            "start_time": start_time,
            "end_time": end_time,
            "estimated_energy_kwh": random.uniform(10, 30),
            "estimated_cost": random.uniform(150, 450),
            "queue_position": 0,
            "status": "COMPLETED",
            "data_source": "SIMULATED"
        })
        
        sessions.append({
            "session_id": f"SESS-{90000+i}",
            "user_id": user["user_id"],
            "vehicle_id": veh["vehicle_id"],
            "station_id": charger["station_id"],
            "charger_id": charger["charger_id"],
            "start_time": start_time,
            "end_time": end_time,
            "initial_battery_percentage": random.randint(10, 40),
            "final_battery_percentage": random.randint(70, 95),
            "energy_delivered_kwh": random.uniform(10, 30),
            "charging_duration_minutes": (end_time - start_time).seconds / 60,
            "average_power_kw": charger["power_kw"] * 0.8,
            "cost": random.uniform(150, 450),
            "status": "COMPLETED",
            "data_source": "SIMULATED"
        })
    
    db.bookings.insert_many(bookings)
    db.charging_sessions.insert_many(sessions)
    
    # 4. Queue, Weather, Traffic
    db.queue_entries.delete_many({"data_source": "SIMULATED"})
    db.weather_data.delete_many({"source": "SIMULATED"})
    db.traffic_data.delete_many({"source": "SIMULATED"})
    
    queue_entries = []
    weather_data = []
    traffic_data = []
    
    for station in stations:
        for _ in range(40):
            ts = datetime.utcnow() - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23))
            
            queue_entries.append({
                "station_id": station["station_id"],
                "timestamp": ts,
                "queue_length": random.randint(0, 5),
                "active_sessions": random.randint(0, station["charger_count"]),
                "available_chargers": random.randint(0, station["charger_count"]),
                "average_wait_minutes": random.randint(0, 45),
                "data_source": "SIMULATED"
            })
            
            weather_data.append({
                "station_id": station["station_id"],
                "timestamp": ts,
                "temperature_c": random.uniform(22, 38),
                "humidity": random.uniform(40, 90),
                "rainfall_mm": random.choice([0, 0, 0, 5, 12]),
                "wind_speed_kmh": random.uniform(5, 25),
                "weather_condition": random.choice(["Clear", "Cloudy", "Rain"]),
                "source": "SIMULATED"
            })
            
            traffic_data.append({
                "station_id": station["station_id"],
                "timestamp": ts,
                "traffic_level": random.choice(["LOW", "MODERATE", "HIGH"]),
                "traffic_speed_kmh": random.uniform(15, 60),
                "congestion_score": random.uniform(0, 100),
                "source": "SIMULATED"
            })
            
    db.queue_entries.insert_many(queue_entries)
    db.weather_data.insert_many(weather_data)
    db.traffic_data.insert_many(traffic_data)
    
    print("Demo Data Seeding Complete!")
    print(f"Users: 30")
    print(f"Vehicles: 30")
    print(f"Bookings: 500")
    print(f"Charging Sessions: 500")
    print(f"Queue History: {len(queue_entries)}")
    print(f"Weather Records: {len(weather_data)}")
    print(f"Traffic Records: {len(traffic_data)}")

if __name__ == "__main__":
    seed_demo_data()
