import { Request, Response } from 'express';
import Product, { IProduct, ProductStatus, ProductCategory } from '../models/Product';
import mongoose from 'mongoose';

// @desc    List all products
// @route   GET /api/vendors/products
// @access  Private/Vendor
export const listProducts = async (req: Request, res: Response) => {
  try {
    // For now, we'll simulate getting the user ID from the request
    // Later this will be handled by authentication middleware
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Query filters
    const filters: any = {};

    // Filter by category if provided
    if (req.query.category) {
      filters.category = req.query.category;
    }

    // Filter by status if provided
    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Filter by seller if 'mine' flag is set
    if (req.query.mine === 'true') {
      filters.seller = userId;
    }

    // Filter by location
    if (req.query.country) {
      filters['location.country'] = req.query.country;
    }

    if (req.query.region) {
      filters['location.region'] = req.query.region;
    }

    const products = await Product.find(filters)
      .sort({ createdAt: -1 })
      .populate('seller', 'name phoneNumber');
    
    res.json(products);
  } catch (error) {
    console.error('Error in listing products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get product by ID
// @route   GET /api/vendors/products/:productId
// @access  Private/Vendor
export const getProductById = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId)
      .populate('seller', 'name phoneNumber')
      .populate('farm', 'name location');

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Error in getting product by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new product
// @route   POST /api/vendors/products
// @access  Private/Vendor
export const createProduct = async (req: Request, res: Response) => {
  try {
    // For now, we'll simulate getting the user ID from the request
    // Later this will be handled by authentication middleware
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const {
      name,
      description,
      category,
      quantity,
      unit,
      price,
      currency,
      harvestDate,
      expiryEstimate,
      location,
      farmId,
      images,
      qualityCertification,
      organicCertification,
      storageRequirements
    } = req.body;

    const product = await Product.create({
      seller: userId,
      farm: farmId || undefined,
      name,
      description,
      category,
      quantity,
      unit,
      price,
      currency,
      harvestDate,
      expiryEstimate,
      status: ProductStatus.AVAILABLE,
      location,
      images,
      qualityCertification,
      organicCertification,
      storageRequirements
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error in creating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a product
// @route   PUT /api/vendors/products/:productId
// @access  Private/Vendor
export const updateProduct = async (req: Request, res: Response) => {
  try {
    // For now, we'll simulate getting the user ID from the request
    // Later this will be handled by authentication middleware
    const userId = req.headers['user-id'];
    const productId = req.params.productId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Find product and check ownership
    const product = await Product.findById<IProduct>(productId).lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Update product fields
    const updatedProduct = await Product.findByIdAndUpdate<IProduct>(
      productId,
      { $set: Object.fromEntries(
        Object.entries(req.body).filter(([key]) => key !== 'seller' && key !== '_id')
      )},
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found after update' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error in updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/vendors/products/:productId
// @access  Private/Vendor
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    // For now, we'll simulate getting the user ID from the request
    // Later this will be handled by authentication middleware
    const userId = req.headers['user-id'];
    const productId = req.params.productId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Find product and check ownership
    const product = await Product.findById<IProduct>(productId).lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(productId);
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Error in deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get spoilage risks for products
// @route   GET /api/vendors/spoilage-risks
// @access  Private/Vendor
export const getSpoilageRisks = async (req: Request, res: Response) => {
  try {
    // For now, we'll simulate getting the user ID from the request
    // Later this will be handled by authentication middleware
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get all products by this seller
    const products = await Product.find({ 
      seller: userId,
      status: { $ne: ProductStatus.SOLD } // Only include products not yet sold
    });

    // In a real implementation, we would use ML to predict spoilage risk
    // For now, let's simulate with mock data
    const spoilageRisks = products.map(product => {
      // Calculate days until expiry
      const currentDate = new Date();
      const expiryDate = new Date(product.expiryEstimate);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate a mock risk score
      let riskScore = 0;
      let riskLevel = 'low';
      
      if (daysUntilExpiry < 3) {
        riskScore = 0.9;
        riskLevel = 'critical';
      } else if (daysUntilExpiry < 7) {
        riskScore = 0.7;
        riskLevel = 'high';
      } else if (daysUntilExpiry < 14) {
        riskScore = 0.4;
        riskLevel = 'medium';
      } else {
        riskScore = 0.1;
        riskLevel = 'low';
      }
      
      return {
        productId: product._id,
        productName: product.name,
        expiryDate: product.expiryEstimate,
        daysUntilExpiry,
        riskScore,
        riskLevel,
        recommendations: getRiskRecommendations(riskLevel, product.category)
      };
    });
    
    res.json(spoilageRisks);
  } catch (error) {
    console.error('Error in getting spoilage risks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function for risk recommendations
const getRiskRecommendations = (riskLevel: string, category: string) => {
  switch (riskLevel) {
    case 'critical':
      return [
        'Sell immediately at discount',
        'Process into longer-lasting form',
        'Donate to local food bank within 24 hours'
      ];
    case 'high':
      return [
        'Adjust storage conditions to extend shelf life',
        'Consider promotional pricing',
        'Move to high-visibility marketplace location'
      ];
    case 'medium':
      return [
        'Monitor storage conditions daily',
        'Check for signs of early deterioration',
        'Plan marketing strategy for next week'
      ];
    default:
      return [
        'Standard storage procedures are sufficient',
        'Regular quality checks recommended'
      ];
  }
};

// @desc    Get demand forecasts for products
// @route   GET /api/vendors/demand-forecasts
// @access  Private/Vendor
export const getDemandForecasts = async (req: Request, res: Response) => {
  try {
    // For now, we'll simulate getting the user ID from the request
    // Later this will be handled by authentication middleware
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // In a real implementation, we would use ML to predict demand
    // For now, let's simulate with mock data
    const mockForecasts = Object.values(ProductCategory).map(category => {
      const demandScore = Math.random(); // Random value 0-1
      let demandTrend = 'stable';
      let priceRecommendation = 'maintain';
      
      if (demandScore > 0.7) {
        demandTrend = 'increasing';
        priceRecommendation = 'consider 5-10% increase';
      } else if (demandScore < 0.3) {
        demandTrend = 'decreasing';
        priceRecommendation = 'consider 5-10% discount';
      }
      
      return {
        category,
        demandScore,
        demandTrend,
        priceRecommendation,
        bestMarkets: getBestMarkets(category),
        forecast: {
          nextWeek: Math.floor(Math.random() * 50) + 50, // Random value 50-100
          nextMonth: Math.floor(Math.random() * 200) + 100 // Random value 100-300
        }
      };
    });
    
    res.json(mockForecasts);
  } catch (error) {
    console.error('Error in getting demand forecasts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function for best markets
const getBestMarkets = (category: string) => {
  const markets = [
    'Central Farmers Market',
    'East District Food Hub',
    'Western Agricultural Exchange',
    'Northern Territory Trade Center',
    'Southern Cooperative Market'
  ];
  
  // Randomly select 2-3 markets
  const numMarkets = Math.floor(Math.random() * 2) + 2; // Either 2 or 3
  const shuffled = [...markets].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numMarkets);
}; 