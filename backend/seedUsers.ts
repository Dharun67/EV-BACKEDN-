import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();
import User from './src/models/User';

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  const hash = await bcrypt.hash('password123', 10);
  await User.deleteMany({ email: { $in: ['admin@gridwise.com', 'user@gridwise.com'] } });
  
  await User.create([
    { name: 'GridWise Admin', email: 'admin@gridwise.com', password: hash, role: 'ADMIN', status: 'ACTIVE' },
    { name: 'Demo Driver', email: 'user@gridwise.com', password: hash, role: 'USER', status: 'ACTIVE' }
  ]);
  
  console.log('Seeded admin and user accounts successfully.');
  process.exit(0);
}).catch(console.error);
