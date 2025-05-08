import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Farm, { IFarm, ICrop, ICropBase } from '../models/Farm';
import YieldPrediction from '../models/YieldPrediction';
import mongoose from 'mongoose';

// @desc    Get farm profile for the current user
// @route   GET /api/farmers/farm
// @access  Private/Farmer
export const getFarmProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const farm = await Farm.findOne({ owner: req.user.id });

    if (farm) {
      res.json(farm);
    } else {
      res.status(404).json({ message: 'Farm not found' });
    }
  } catch (error) {
    console.error('Get farm profile error:', error);
    res.status(500).json({ message: 'Server error getting farm profile' });
  }
};

// @desc    Create or update farm profile
// @route   PUT /api/farmers/farm
// @access  Private/Farmer
export const updateFarmProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { name, location, size, soilCharacteristics, waterSource, equipment } = req.body;

    // Find existing farm or create new one
    let farm = await Farm.findOne({ owner: req.user.id });

    if (farm) {
      // Update existing farm
      farm.name = name || farm.name;
      farm.location = location || farm.location;
      farm.size = size || farm.size;
      farm.soilCharacteristics = soilCharacteristics || farm.soilCharacteristics;
      farm.waterSource = waterSource || farm.waterSource;
      farm.equipment = equipment || farm.equipment;

      const updatedFarm = await farm.save();
      res.json(updatedFarm);
    } else {
      // Create new farm
      farm = await Farm.create({
        owner: req.user.id,
        name,
        location,
        size,
        crops: [],
        soilCharacteristics,
        waterSource,
        equipment
      });

      res.status(201).json(farm);
    }
  } catch (error) {
    console.error('Update farm profile error:', error);
    res.status(500).json({ message: 'Server error updating farm profile' });
  }
};

// @desc    Add a new crop to farm
// @route   POST /api/farmers/crops
// @access  Private/Farmer
export const addCrop = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { name, variety, plantingDate, expectedHarvestDate, area, soilType, irrigationType, previousYields } = req.body;

    const farm = await Farm.findOne({ owner: req.user.id });
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found. Please create a farm profile first.' });
    }

    // Create new crop data
    const cropData: ICropBase = {
      name,
      variety,
      plantingDate: new Date(plantingDate),
      expectedHarvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : undefined,
      area,
      soilType,
      irrigationType,
      previousYields
    };

    // Add new crop to the crops array with type assertion
    // This is safe because Mongoose will handle the document conversion
    farm.crops.push(cropData as unknown as ICrop);

    // Save the farm document which will also save the new crop
    const updatedFarm = await farm.save();
    
    // Get the newly added crop
    const newCrop = updatedFarm.crops[updatedFarm.crops.length - 1];

    res.status(201).json(newCrop);
  } catch (error) {
    console.error('Add crop error:', error);
    res.status(500).json({ message: 'Server error adding crop' });
  }
};

// @desc    Update a crop
// @route   PUT /api/farmers/crops/:cropId
// @access  Private/Farmer
export const updateCrop = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const cropId = req.params.cropId;
    const updateData = req.body;

    const farm = await Farm.findOne({ owner: req.user.id });
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Find crop index
    const cropIndex = farm.crops.findIndex(
      (crop) => crop._id.toString() === cropId
    );

    if (cropIndex === -1) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Update crop fields
    Object.keys(updateData).forEach((key) => {
      if (key === 'plantingDate' || key === 'expectedHarvestDate') {
        if (updateData[key]) {
          farm.crops[cropIndex].set(key, new Date(updateData[key]));
        }
      } else {
        if (updateData[key] !== undefined) {
          farm.crops[cropIndex].set(key, updateData[key]);
        }
      }
    });

    await farm.save();
    res.json(farm.crops[cropIndex]);
  } catch (error) {
    console.error('Update crop error:', error);
    res.status(500).json({ message: 'Server error updating crop' });
  }
};

// @desc    Delete a crop
// @route   DELETE /api/farmers/crops/:cropId
// @access  Private/Farmer
export const deleteCrop = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const cropId = req.params.cropId;

    const farm = await Farm.findOne({ owner: req.user.id });
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Filter out the crop to delete
    farm.crops = farm.crops.filter(
      (crop) => crop._id.toString() !== cropId
    );

    await farm.save();
    res.json({ message: 'Crop removed successfully' });
  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({ message: 'Server error deleting crop' });
  }
};

// @desc    Get yield predictions for current user's farm
// @route   GET /api/farmers/predictions
// @access  Private/Farmer
export const getYieldPredictions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const farm = await Farm.findOne({ owner: req.user.id });
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    const predictions = await YieldPrediction.find({ farm: farm._id });
    res.json(predictions);
  } catch (error) {
    console.error('Get yield predictions error:', error);
    res.status(500).json({ message: 'Server error getting yield predictions' });
  }
};

// @desc    Generate a new yield prediction
// @route   POST /api/farmers/predictions
// @access  Private/Farmer
export const requestNewPrediction = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { cropName, cropVariety, cropArea } = req.body;

    const farm = await Farm.findOne({ owner: req.user.id });
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // In a real implementation, this would call an ML model service
    // For now, we'll create a mock prediction with simulated data

    const mockPrediction = {
      farm: farm._id,
      crop: {
        name: cropName,
        variety: cropVariety,
        area: cropArea
      },
      prediction: {
        expectedYield: Math.floor(Math.random() * 5000) + 3000, // Random yield between 3000-8000
        yieldUnit: 'kg/ha',
        lowerBound: 0, // Will be calculated below
        upperBound: 0, // Will be calculated below
        confidenceLevel: 0.85
      },
      factors: {
        soilQuality: Math.random() * 10,
        weatherConditions: ['moderate rainfall', 'good sunlight'][Math.floor(Math.random() * 2)],
        pestRisks: Math.random() > 0.5 ? ['aphids', 'whiteflies'] : ['none'],
        rainfall: Math.floor(Math.random() * 300) + 500, // Random rainfall between 500-800mm
        temperature: {
          min: 15 + Math.random() * 5,
          max: 25 + Math.random() * 5,
          average: 20 + Math.random() * 5
        }
      },
      recommendations: {
        irrigationSchedule: 'Twice weekly, 20mm per session',
        fertilizers: [
          {
            type: 'Nitrogen-rich',
            amount: 50,
            unit: 'kg/ha',
            applicationTime: 'Every 2 weeks'
          }
        ],
        pestManagement: ['Monitor for pests regularly', 'Use organic pesticides if needed'],
        harvestingDate: new Date(Date.now() + Math.random() * 7776000000) // Random date 1-90 days in future
      },
      createdAt: new Date()
    };

    // Calculate lower and upper bounds
    mockPrediction.prediction.lowerBound = Math.floor(mockPrediction.prediction.expectedYield * 0.9);
    mockPrediction.prediction.upperBound = Math.floor(mockPrediction.prediction.expectedYield * 1.1);

    const prediction = await YieldPrediction.create(mockPrediction);
    res.status(201).json(prediction);
  } catch (error) {
    console.error('Request new prediction error:', error);
    res.status(500).json({ message: 'Server error requesting new prediction' });
  }
}; 