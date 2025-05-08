import { Request, Response } from 'express';
import Analytics, { IAnalytics, AnalyticsType } from '../models/Analytics';
import mongoose from 'mongoose';

// @desc    Get all analytics
// @route   GET /api/ngos/analytics
// @access  Private/NGO
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    // For now, we'll simulate getting the user ID from the request
    // Later this will be handled by authentication middleware
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Query filters
    const filters: any = {};

    // Filter by type if provided
    if (req.query.type) {
      filters.type = req.query.type;
    }

    // Filter by country
    if (req.query.country) {
      filters['scope.country'] = req.query.country;
    }

    // Filter by region
    if (req.query.region) {
      filters['scope.region'] = req.query.region;
    }

    // Filter by crop type
    if (req.query.cropType) {
      filters['scope.cropTypes'] = { $in: [req.query.cropType] };
    }

    // Filter by date range
    if (req.query.startDate) {
      filters['timeframe.start'] = { $gte: new Date(req.query.startDate as string) };
    }

    if (req.query.endDate) {
      filters['timeframe.end'] = { $lte: new Date(req.query.endDate as string) };
    }

    // Public analytics or ones you have access to
    filters.$or = [
      { 'accessRights.public': true },
      { 'accessRights.restrictedTo': userId }
    ];

    const analytics = await Analytics.find(filters).sort({ createdAt: -1 });
    
    res.json(analytics);
  } catch (error) {
    console.error('Error in getting analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get analytics by ID
// @route   GET /api/ngos/analytics/:analyticsId
// @access  Private/NGO
export const getAnalyticsById = async (req: Request, res: Response) => {
  try {
    const analyticsId = req.params.analyticsId;
    const userId = req.headers['user-id'];

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(analyticsId)) {
      return res.status(400).json({ message: 'Invalid analytics ID' });
    }

    const analytics = await Analytics.findById(analyticsId);

    if (!analytics) {
      return res.status(404).json({ message: 'Analytics not found' });
    }

    // Check if user has access (either public or specifically granted)
    if (!analytics.accessRights.public && 
        !analytics.accessRights.restrictedTo?.includes(userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to access these analytics' });
    }

    res.json(analytics);
  } catch (error) {
    console.error('Error in getting analytics by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new analytics
// @route   POST /api/ngos/analytics
// @access  Private/NGO
export const createAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const {
      title,
      description,
      type,
      timeframe,
      scope,
      metrics,
      visualizations,
      insights,
      recommendations,
      sources,
      accessRights
    } = req.body;

    // Add current user to restrictedTo if not public
    const updatedAccessRights = {
      ...accessRights,
      restrictedTo: accessRights.public ? undefined : 
        [...(accessRights.restrictedTo || []), userId.toString()]
    };

    const analytics = await Analytics.create({
      title,
      description,
      type,
      timeframe,
      scope,
      metrics,
      visualizations,
      insights,
      recommendations,
      sources,
      accessRights: updatedAccessRights
    });

    res.status(201).json(analytics);
  } catch (error) {
    console.error('Error in creating analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update analytics
// @route   PUT /api/ngos/analytics/:analyticsId
// @access  Private/NGO
export const updateAnalytics = async (req: Request, res: Response) => {
  try {
    const analyticsId = req.params.analyticsId;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(analyticsId)) {
      return res.status(400).json({ message: 'Invalid analytics ID' });
    }

    const analytics = await Analytics.findById(analyticsId);

    if (!analytics) {
      return res.status(404).json({ message: 'Analytics not found' });
    }

    // Check if user has access (must be in restricted list)
    if (!analytics.accessRights.restrictedTo?.includes(userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update these analytics' });
    }

    // Update fields from request body
    Object.keys(req.body).forEach(key => {
      if (key !== '_id') {
        (analytics as any)[key] = req.body[key];
      }
    });

    // Ensure user maintains access after update
    if (!analytics.accessRights.public && 
        !analytics.accessRights.restrictedTo?.includes(userId.toString())) {
      analytics.accessRights.restrictedTo = [
        ...(analytics.accessRights.restrictedTo || []),
        userId.toString()
      ];
    }

    const updatedAnalytics = await analytics.save();
    res.json(updatedAnalytics);
  } catch (error) {
    console.error('Error in updating analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete analytics
// @route   DELETE /api/ngos/analytics/:analyticsId
// @access  Private/NGO
export const deleteAnalytics = async (req: Request, res: Response) => {
  try {
    const analyticsId = req.params.analyticsId;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(analyticsId)) {
      return res.status(400).json({ message: 'Invalid analytics ID' });
    }

    const analytics = await Analytics.findById(analyticsId);

    if (!analytics) {
      return res.status(404).json({ message: 'Analytics not found' });
    }

    // Check if user has access (must be in restricted list)
    if (!analytics.accessRights.restrictedTo?.includes(userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete these analytics' });
    }

    await analytics.deleteOne();
    res.json({ message: 'Analytics removed' });
  } catch (error) {
    console.error('Error in deleting analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Export analytics data
// @route   GET /api/ngos/export/:analyticsId
// @access  Private/NGO
export const exportAnalyticsData = async (req: Request, res: Response) => {
  try {
    const analyticsId = req.params.analyticsId;
    const userId = req.headers['user-id'];
    const format = req.query.format || 'json';
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(analyticsId)) {
      return res.status(400).json({ message: 'Invalid analytics ID' });
    }

    const analytics = await Analytics.findById(analyticsId);

    if (!analytics) {
      return res.status(404).json({ message: 'Analytics not found' });
    }

    // Check if user has access
    if (!analytics.accessRights.public && 
        !analytics.accessRights.restrictedTo?.includes(userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to access these analytics' });
    }

    // Format the data according to requested format
    if (format === 'csv') {
      // In a real implementation, we would convert to CSV
      // For now, just return JSON with a message
      res.json({
        message: 'CSV export would be generated here',
        data: analytics
      });
    } else {
      // Return JSON format
      res.json({
        title: analytics.title,
        description: analytics.description,
        type: analytics.type,
        timeframe: analytics.timeframe,
        scope: analytics.scope,
        metrics: analytics.metrics,
        insights: analytics.insights || [],
        recommendations: analytics.recommendations || [],
        exportedAt: new Date(),
        sources: analytics.sources || []
      });
    }
  } catch (error) {
    console.error('Error in exporting analytics data:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 