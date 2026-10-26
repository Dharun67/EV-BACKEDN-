import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import Station from '../models/Station';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gridwise';

const seedStations = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const stations: any[] = [];
    const csvPath = path.resolve(__dirname, '../../../data/02_tamil_nadu_openchargemap.csv');
    
    console.log(`Reading CSV from ${csvPath}...`);

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const lat = parseFloat(row.latitude);
        const lng = parseFloat(row.longitude);
        const power = parseFloat(row.power_kw) || 50;
        const qty = parseInt(row.quantity) || 1;
        
        if (!isNaN(lat) && !isNaN(lng)) {
          stations.push({
            stationId: `ocm-${row.station_id}`,
            name: row.station_name,
            location: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            address: row.address,
            city: row.city,
            state: row.state,
            postcode: row.postcode,
            zone: row.city || 'TamilNadu',
            zoneType: 'Urban',
            status: row.status === 'Operational' ? 'Operational' : 'Offline',
            totalChargers: qty,
            availableChargers: qty,
            utilization: Math.floor(Math.random() * 60) + 20,
            powerCapacityKw: power,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            uptime: 99.0
          });
        }
      })
      .on('end', async () => {
        console.log(`Parsed ${stations.length} stations. Dropping existing Station collection...`);
        try {
          await Station.collection.drop();
        } catch (e: any) {
          if (e.code !== 26) {
            console.error('Error dropping collection:', e);
          }
        }
        
        console.log('Inserting stations...');
        await Station.insertMany(stations);
        console.log('Seeding complete. Ensuring indexes...');
        
        await Station.ensureIndexes();
        console.log('Done.');
        
        mongoose.disconnect();
      });
      
  } catch (err) {
    console.error('Seeding failed:', err);
    mongoose.disconnect();
  }
};

seedStations();
