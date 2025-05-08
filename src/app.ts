import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import cookieParser from 'cookie-parser';
import path from 'path';

// Routes imports
import userRoutes from './routes/userRoutes';
import farmerRoutes from './routes/farmerRoutes';
import vendorRoutes from './routes/vendorRoutes';
import ngoRoutes from './routes/ngoRoutes';

// Error handler type
interface Error {
  message: string;
  stack?: string;
  status?: number;
}

// Environment variables
dotenv.config();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Connect to MongoDB
connectDB();

// Initialize Express
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/ngos', ngoRoutes);

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'AgriSense API is running',
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// Handle 404s
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  
  const statusCode = err.status || 500;
  
  res.status(statusCode).json({
    message: err.message,
    stack: NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Add production deployment support
if (NODE_ENV === 'production') {
  // Set static folder (for frontend build)
  const clientBuildPath = path.join(__dirname, '../../frontend/.next');
  app.use(express.static(clientBuildPath));
  
  // Serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

// Export app for testing
export default app; 