import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// Fallback for unhandled routes
app.use('*', (_req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Attempt MongoDB connection if configured
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log(' Connected to MongoDB Atlas successfully'))
    .catch((err) => console.warn(' MongoDB Atlas connection warning:', err.message));
} else {
  console.log('⚡ Running ParkShare high-performance in-memory repository store with instant demo seeding.');
}

app.listen(PORT, () => {
  console.log(` ParkShare backend server running on http://localhost:${PORT}`);
});
