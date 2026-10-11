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

let lastMongoError: string | null = null;

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDistCandidates = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../../../client/dist'),
];
const clientDist = clientDistCandidates.find((dir) => fs.existsSync(dir));

// Health / Test Routes
app.get('/api/test', (_req, res) => {
  res.json({
    success: true,
    message: 'Backend API is running and connected with MongoDB Atlas!',
    database: mongoose.connection.name || 'parkshare',
    mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting',
    mongoReadyState: mongoose.connection.readyState,
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongoReadyState: mongoose.connection.readyState,
    hasMongoUriConfigured: Boolean(process.env.MONGODB_URI),
    mongoError: lastMongoError,
    database: mongoose.connection.name || null,
    totalSpaces: dbStore.parkingSpaces.length,
    totalUsers: dbStore.users.length,
    totalBookings: dbStore.bookings.length,
    totalVehicles: dbStore.vehicles.length,
    renderTip:
      mongoose.connection.readyState !== 1
        ? 'Check: (1) MongoDB Atlas IP Whitelist (0.0.0.0/0 in Network Access), (2) MONGODB_URI configured in Render Environment Variables.'
        : undefined,
  });
});

// Main API Routes
app.use('/api', routes);

// Serve Frontend or fallback
if (clientDist) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send('ParkShare Backend API is running!');
  });
  app.use('*', (_req, res) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
  });
}

// MongoDB connection event monitoring
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost/disconnected.');
});

mongoose.connection.on('error', (err) => {
  lastMongoError = err.message;
  console.error('⚠️ MongoDB connection error:', err.message);
});

// Clean & sanitize MongoDB URI (removes accidental newlines/spaces/quotes when pasted into Render)
const rawMongoUri = process.env.MONGODB_URI?.trim().replace(/^["']|["']$/g, '');
const mongoUri = rawMongoUri ? rawMongoUri.replace(/[\r\n\s]+/g, '') : undefined;

// Connect to MongoDB Atlas
if (mongoUri) {
  const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔌 Attempting to connect to MongoDB Atlas (${maskedUri})...`);

  mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    })
    .then(async () => {
      lastMongoError = null;
      console.log(` Connected to MongoDB Atlas successfully! Database: [${mongoose.connection.name}]`);
      await dbStore.initFromMongo();
    })
    .catch((err) => {
      lastMongoError = err.message;
      console.error('❌ MongoDB Atlas connection failed:', err.message);
      console.error('👉 If hosted on Render:');
      console.error('   1. Ensure 0.0.0.0/0 is added to MongoDB Atlas -> Network Access -> IP Access List.');
      console.error('   2. Verify MONGODB_URI is set in the Render Dashboard Environment tab (without linebreaks).');
      console.error('   3. Verify the database user credentials in MongoDB Atlas Database Access.');
    });
} else {
  console.log('⚡ Running ParkShare repository store without MONGODB_URI (MONGODB_URI is not set in environment).');
}

app.listen(PORT, () => {
  console.log(` ParkShare backend server running on http://localhost:${PORT}`);
});
