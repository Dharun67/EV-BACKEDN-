# GridWise Backend

The Node.js backend for the GridWise EV Mobility platform.

## Requirements
- Node.js 18+
- MongoDB 6.0+ or MongoDB Atlas

## Installation

```bash
cd backend
npm install
```

## Environment Variables
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Ensure `MONGODB_URI` points to your active MongoDB instance.

## Running Backend
To run in development mode with hot-reloading (uses `tsx`):
```bash
npm run dev
```

## Importing Cleaned Data
To safely import or re-sync the cleaned datasets into MongoDB:
```bash
npm run import-data
```
*Note: This script uses `upsert` so it is safe to run multiple times without duplicating data.*

## Endpoints (Current)
- `GET /api/health` - Check API and DB connectivity.
- `GET /api/stats/database` - View database record counts.

## Project Structure
```
backend/
├── src/
│   ├── config/       (Database connections)
│   ├── models/       (Mongoose schemas)
│   ├── middleware/   (Global error handling)
│   ├── routes/       (API route endpoints)
│   ├── app.ts        (Express app logic)
│   └── server.ts     (Server entry point)
├── scripts/
│   └── importData.ts (Data seeding script)
├── .env              (Environment variables)
└── package.json
```
