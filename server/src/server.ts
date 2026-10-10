import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import { dbStore } from './store/dbStore.js';

// Load environment variables (supports server/.env and root .env)
dotenv.config();
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '../.env' });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health / Test Routes
app.get('/', (_req, res) => {
  res.send('ParkShare Backend API is running!');
});

app.get('/api/test', (_req, res) => {
  res.json({
    success: true,
    message: 'Backend API is running and connected with MongoDB Atlas!',
    database: mongoose.connection.name || 'parkshare',
    mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    database: mongoose.connection.name,
    totalSpaces: dbStore.parkingSpaces.length,
    totalUsers: dbStore.users.length,
    totalBookings: dbStore.bookings.length,
    totalVehicles: dbStore.vehicles.length,
  });
});

// Main API Routes
app.use('/api', routes);

// Fallback for unhandled routes
app.use('*', (_req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Connect to MongoDB Atlas
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log(` Connected to MongoDB Atlas successfully! Database: [${mongoose.connection.name}]`);
      await dbStore.initFromMongo();
    })
    .catch((err) => console.warn('⚠️ MongoDB Atlas connection warning:', err.message));
} else {
  console.log('⚡ Running ParkShare repository store without MONGODB_URI.');
}

app.listen(PORT, () => {
  console.log(` ParkShare backend server running on http://localhost:${PORT}`);
});
