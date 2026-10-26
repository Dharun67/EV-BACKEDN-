import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import Station from './src/models/Station';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gridwise';
const CSV_PATH = 'C:\\Users\\dharu\\OneDrive\\Desktop\\EV MOBILITY\\coimbatore_ev_charging_stations.csv';

async function importData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const stations: any[] = [];

    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        // Handle empty lat/lng gracefully
        let lat = parseFloat(row.latitude);
        let lng = parseFloat(row.longitude);
        
        // Use default Coimbatore center if lat/lng is missing or invalid
        if (isNaN(lat) || isNaN(lng)) {
          lat = 11.0168; // Default Coimbatore Lat
          lng = 76.9558; // Default Coimbatore Lng
        }

        const totalChargers = Math.floor(Math.random() * 4) + 2; // 2 to 5
        const availableChargers = Math.floor(Math.random() * (totalChargers + 1));
        const powerKw = row.connector_type?.includes('CCS') ? 50 : 22;

        stations.push({
          stationId: row.station_id,
          name: row.station_name,
          location: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          address: row.address || `${row.city}, ${row.state}`,
          city: row.city || 'Coimbatore',
          state: row.state || 'Tamil Nadu',
          postcode: row.pincode,
          zone: row.district || 'Coimbatore',
          zoneType: 'Urban',
          status: 'Operational',
          totalChargers,
          availableChargers,
          utilization: Math.floor(Math.random() * 100),
          powerCapacityKw: powerKw,
          rating: (Math.random() * 1 + 4).toFixed(1), // 4.0 to 5.0
          uptime: 99
        });
      })
      .on('end', async () => {
        console.log(`Parsed ${stations.length} stations from CSV.`);
        
        // Clear existing stations
        await Station.deleteMany({});
        console.log('Cleared existing stations.');
        
        // Insert new stations
        await Station.insertMany(stations);
        console.log('Successfully inserted Coimbatore stations!');
        
        mongoose.disconnect();
        process.exit(0);
      });
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

importData();
