import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    let retries = 5;
    while (retries > 0) {
      try {
        const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (error: any) {
        retries -= 1;
        console.error(`MongoDB Connection Error: ${error.message}. Retrying... (${retries} left)`);
        if (retries === 0) {
          console.error('MongoDB connection failed after all retries. Exiting.');
          process.exit(1);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (error: any) {
    console.error(`MongoDB Initialization Error: ${error.message}`);
    process.exit(1);
  }
};
