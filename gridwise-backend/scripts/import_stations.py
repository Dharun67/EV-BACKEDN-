import pandas as pd
import pymongo
from pymongo import UpdateOne
import math
from datetime import datetime

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "gridwise"
DATA_FILE = r"C:\Users\dharu\OneDrive\Desktop\EV MOBILITY\GridWise\data\02_tamil_nadu_openchargemap.csv"

def import_stations():
    print("====================================")
    print("GRIDWISE DATA IMPORT")
    print("====================================")
    
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    df = pd.read_csv(DATA_FILE)
    total_records = len(df)
    
    df = df.drop_duplicates(subset=["station_id", "latitude", "longitude"])
    deduped_records = len(df)
    duplicates_removed = total_records - deduped_records
    
    # We group by station_id because some rows are just different connectors for the same station.
    grouped = df.groupby('station_id')
    
    operations = []
    charger_operations = []
    
    inserted = 0
    updated = 0
    invalid = 0
    skipped = 0
    
    for station_id, group in grouped:
        first_row = group.iloc[0]
        
        # Validation
        if math.isnan(first_row.get('latitude')) or math.isnan(first_row.get('longitude')):
            invalid += 1
            continue
            
        str_id = str(int(station_id))
        
        station_doc = {
            "station_id": str_id,
            "station_name": str(first_row.get('station_name', '')),
            "operator": str(first_row.get('operator', 'Unknown')),
            "address": str(first_row.get('address', '')),
            "city": str(first_row.get('city', '')),
            "district": "",
            "state": str(first_row.get('state', '')),
            "pincode": str(first_row.get('postcode', '')),
            "latitude": float(first_row.get('latitude')),
            "longitude": float(first_row.get('longitude')),
            "station_type": str(first_row.get('charging_type', 'AC/DC')),
            "access_type": str(first_row.get('usage_type', 'Public')),
            "opening_hours": "24/7",
            "source": str(first_row.get('source', 'Open Charge Map')),
            "charger_count": len(group),
            "status": str(first_row.get('status', 'Operational')),
            "metadata": {
                "country": str(first_row.get('country', 'India')),
                "access_comments": str(first_row.get('access_comments', ''))
            },
            "updated_at": datetime.utcnow()
        }
        
        # Upsert station
        operations.append(UpdateOne(
            {"station_id": str_id},
            {"$set": station_doc, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True
        ))
        
        # Generate chargers for this station (as requested by Step 6)
        for idx, row in group.iterrows():
            c_type = str(row.get('connector_type', 'Type 2'))
            power = float(row.get('power_kw', 50.0)) if not pd.isna(row.get('power_kw')) else 50.0
            
            charger_doc = {
                "charger_id": f"CH-{str_id}-{idx}",
                "station_id": str_id,
                "connector_type": c_type,
                "power_kw": power,
                "charger_type": "DC_FAST" if power > 22 else "AC",
                "status": "AVAILABLE",
                "current_session_id": None,
                "health_score": 100,
                "data_source": "OPEN_CHARGE_MAP",
                "updated_at": datetime.utcnow()
            }
            
            charger_operations.append(UpdateOne(
                {"charger_id": charger_doc["charger_id"]},
                {"$set": charger_doc, "$setOnInsert": {"created_at": datetime.utcnow()}},
                upsert=True
            ))

    if operations:
        res = db.stations.bulk_write(operations)
        inserted += res.upserted_count
        updated += res.modified_count
        skipped = deduped_records - inserted - updated - invalid

    if charger_operations:
        db.chargers.bulk_write(charger_operations)

    print(f"Total dataset records: {total_records}")
    print(f"Valid records: {deduped_records - invalid}")
    print(f"Invalid records: {invalid}")
    print(f"Duplicates removed: {duplicates_removed}")
    print(f"Inserted: {inserted}")
    print(f"Updated: {updated}")
    print(f"Skipped: {skipped}")
    print("\nMongoDB collection:\ngridwise.stations")
    print("\nImport completed successfully.")
    print("====================================")

if __name__ == "__main__":
    import_stations()
