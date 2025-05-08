import express from 'express';
import { 
  listProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getSpoilageRisks,
  getDemandForecasts
} from '../controllers/vendorController';
import { protect, vendorOnly } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected and vendor-only
router.use(protect, vendorOnly);

// Product management
router.get('/products', listProducts);
router.get('/products/:productId', getProductById);
router.post('/products', createProduct);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProduct);

// Analytics
router.get('/spoilage-risks', getSpoilageRisks);
router.get('/demand-forecasts', getDemandForecasts);

export default router; 