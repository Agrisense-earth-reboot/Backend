import express from 'express';
import { 
  getFarmProfile, 
  updateFarmProfile, 
  addCrop, 
  updateCrop, 
  deleteCrop, 
  getYieldPredictions, 
  requestNewPrediction 
} from '../controllers/farmerController';
import { protect, farmerOnly } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected and farmer-only
router.use(protect, farmerOnly);

// Farm management
router.get('/farm', getFarmProfile);
router.put('/farm', updateFarmProfile);

// Crop management
router.post('/crops', addCrop);
router.put('/crops/:cropId', updateCrop);
router.delete('/crops/:cropId', deleteCrop);

// Yield predictions
router.get('/predictions', getYieldPredictions);
router.post('/predictions', requestNewPrediction);

export default router; 