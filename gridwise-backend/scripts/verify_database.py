import pymongo
import os

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "gridwise"

def verify():
    print("\nGRIDWISE DATABASE HEALTH\n")
    try:
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        client.server_info()
    except Exception:
        print("ERROR: Cannot connect to MongoDB at", MONGO_URI)
        return
        
    db = client[DB_NAME]
    
    collections = [
        "stations", "chargers", "users", "vehicles", "bookings",
        "charging_sessions", "queue_entries", "weather_data", "traffic_data"
    ]
    
    for coll in collections:
        count = db[coll].count_documents({})
        if count > 0:
            print(f"{coll.replace('_', ' ').title().ljust(25)} [OK] {count}")
        else:
            print(f"{coll.replace('_', ' ').title().ljust(25)} [MISSING] 0 (missing data)")
            
    print("\nML Models\n")
    model_dir = r"C:\Users\dharu\OneDrive\Desktop\EV MOBILITY\GridWise\gridwise-backend\app\ml\models"
    models = ["wait_model.joblib", "demand_model.joblib", "maintenance_model.joblib"]
    
    for m in models:
        path = os.path.join(model_dir, m)
        if os.path.exists(path):
            print(f"{m.replace('.joblib', '').replace('_', ' ').title().ljust(25)} [OK]")
        else:
            print(f"{m.replace('.joblib', '').replace('_', ' ').title().ljust(25)} [MISSING]")
            
    print("\nDATABASE READY")

if __name__ == "__main__":
    verify()
