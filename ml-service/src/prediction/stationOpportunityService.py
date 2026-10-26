import pandas as pd
import json
import os
from datetime import datetime
from src.utils.db import get_stations, get_demand_data

MODEL_DIR = os.path.join(os.path.dirname(__file__), '../../models')
METADATA_FILE = os.path.join(MODEL_DIR, 'model_metadata.json')

def load_metadata():
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_metadata(metadata):
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)

def calculate_opportunity_scores():
    print("Calculating Station Opportunity Scores using real data...")
    stations_df = get_stations()
    demand_df = get_demand_data()
    
    if stations_df.empty:
        print("No stations data available for opportunity scoring.")
        return False
        
    # We will score each station based on its utilization, powerCapacityKw, and nearby demand.
    # Since we lack precise geospatial matching for this MVP, we will aggregate demand by zone/city
    
    # 1. Normalize Power Capacity
    max_power = stations_df['powerCapacityKw'].max()
    if pd.isna(max_power) or max_power == 0:
        max_power = 1
    stations_df['norm_power'] = stations_df['powerCapacityKw'].fillna(0) / max_power
    
    # 2. Normalize Utilization
    max_util = stations_df['utilization'].max()
    if pd.isna(max_util) or max_util == 0:
        max_util = 1
    stations_df['norm_utilization'] = stations_df['utilization'].fillna(0) / max_util
    
    # 3. Aggregate Demand by Location/Zone
    # Assuming stations have 'zone' or 'city' matching demand 'location'
    zone_demand = {}
    if not demand_df.empty:
        # Group by location and get median demand score
        if 'demandScore' in demand_df.columns:
            zone_demand_df = demand_df.groupby('location')['demandScore'].median().reset_index()
            max_ds = zone_demand_df['demandScore'].max()
            if max_ds == 0: max_ds = 1
            zone_demand_df['norm_demand'] = zone_demand_df['demandScore'] / max_ds
            zone_demand = dict(zip(zone_demand_df['location'], zone_demand_df['norm_demand']))
            
    # Apply demand to stations based on city or zone
    def get_zone_demand(row):
        city = row.get('city', '')
        zone = row.get('zone', '')
        # Simple match
        return zone_demand.get(city, zone_demand.get(zone, 0.5)) # Default to 0.5 if not found
        
    stations_df['norm_demand_context'] = stations_df.apply(get_zone_demand, axis=1)
    
    # Calculate Final Opportunity Score
    # Formula: 40% Utilization + 30% Local Demand + 30% Power Capacity (assuming high power is an asset)
    # Actually, high utilization + high demand = high opportunity for EXPANSION.
    
    stations_df['opportunityScore'] = (
        (stations_df['norm_utilization'] * 0.4) +
        (stations_df['norm_demand_context'] * 0.3) +
        (stations_df['norm_power'] * 0.3)
    )
    
    # Scale to 0-100
    stations_df['opportunityScore'] = (stations_df['opportunityScore'] * 100).round(1)
    
    # Save the scores to a CSV or just report metadata (in production this would write back to Mongo or be served live)
    output_path = os.path.join(MODEL_DIR, 'opportunity_scores.csv')
    stations_df[['stationId', 'name', 'city', 'opportunityScore', 'norm_utilization', 'norm_demand_context']].to_csv(output_path, index=False)
    
    # Update Metadata
    metadata = load_metadata()
    metadata['opportunity_model'] = {
        'version': '1.0.0',
        'last_trained': datetime.utcnow().isoformat(),
        'dataset': 'stations + demanddatas',
        'type': 'rule-based heuristic',
        'formula': '40% Utilization + 30% Local Demand + 30% Power Capacity',
        'stations_scored': len(stations_df)
    }
    save_metadata(metadata)
    
    print("Opportunity scores calculated and saved successfully.")
    return True

if __name__ == '__main__':
    calculate_opportunity_scores()
