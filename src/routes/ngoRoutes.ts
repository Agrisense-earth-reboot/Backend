import express from 'express';
import { 
  getAnalytics, 
  getAnalyticsById, 
  createAnalytics, 
  updateAnalytics, 
  deleteAnalytics,
  exportAnalyticsData
} from '../controllers/ngoController';
import { protect, ngoOnly } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected and NGO-only
router.use(protect, ngoOnly);

// Analytics management
router.get('/analytics', getAnalytics);
router.get('/analytics/:analyticsId', getAnalyticsById);
router.post('/analytics', createAnalytics);
router.put('/analytics/:analyticsId', updateAnalytics);
router.delete('/analytics/:analyticsId', deleteAnalytics);

// Data export
router.get('/export/:analyticsId', exportAnalyticsData);

export default router; 