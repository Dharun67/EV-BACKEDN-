const http = require('http');
const mongoose = require('mongoose');
const Redis = require('ioredis');

async function checkService(url, name) {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                console.log(`✅ ${name} is running at ${url} (Status: ${res.statusCode})`);
                resolve(true);
            } else {
                console.log(`⚠️ ${name} returned status ${res.statusCode} at ${url}`);
                resolve(false);
            }
        });

        req.on('error', (err) => {
            console.log(`❌ ${name} is NOT running at ${url} (Error: ${err.message})`);
            resolve(false);
        });
        
        req.setTimeout(2000, () => {
            req.abort();
            console.log(`❌ ${name} timed out at ${url}`);
            resolve(false);
        });
    });
}

async function checkMongoDB() {
    const uri = "mongodb+srv://dharun143:dharun143@cluster0.mxw8xkj.mongodb.net/gridwise?retryWrites=true&w=majority";
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`✅ MongoDB connected successfully.`);
        await mongoose.disconnect();
    } catch (err) {
        console.log(`❌ MongoDB connection failed: ${err.message}`);
    }
}

async function checkRedis() {
    const redisUrl = "rediss://default:gQAAAAAAAnqKAAIgcDJlODI3MDNjZjAyNzM0ZDBmYjVkYmJjOWVkMThjYzkxYQ@legible-gnat-162442.upstash.io:6379";
    return new Promise((resolve) => {
        const client = new Redis(redisUrl, { connectTimeout: 5000 });
        client.on('connect', () => {
            console.log(`✅ Redis connected successfully.`);
            client.quit();
            resolve(true);
        });
        client.on('error', (err) => {
            console.log(`❌ Redis connection failed: ${err.message}`);
            client.quit();
            resolve(false);
        });
    });
}

async function runChecks() {
    console.log("Starting GridWise Connections Check...\n");
    await checkService('http://localhost:5000/api/health', 'Backend API (Health Check)'); // adjust endpoint if needed
    await checkService('http://localhost:5173', 'Frontend Server');
    await checkService('http://localhost:8000', 'ML Service API');
    
    await checkMongoDB();
    await checkRedis();
    
    console.log("\nCheck finished.");
}

runChecks();
