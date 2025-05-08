import mongoose, { Document, Schema } from 'mongoose';

export enum AnalyticsType {
  YIELD = 'yield',
  WASTE = 'waste',
  MARKET = 'market',
  DISTRIBUTION = 'distribution',
  ENVIRONMENTAL = 'environmental'
}

export interface IAnalytics extends Document {
  title: string;
  description: string;
  type: AnalyticsType;
  timeframe: {
    start: Date;
    end: Date;
  };
  scope: {
    country?: string;
    region?: string;
    cropTypes?: string[];
  };
  metrics: {
    name: string;
    value: number;
    unit: string;
    trend?: number; // percentage change from previous period
  }[];
  visualizations?: {
    type: string; // 'bar', 'line', 'pie', etc.
    title: string;
    data: any; // Simplified for now, would contain structured data for charts
  }[];
  insights?: string[];
  recommendations?: string[];
  sources?: {
    name: string;
    url?: string;
    date?: Date;
  }[];
  accessRights: {
    public: boolean;
    restrictedTo?: string[]; // Array of user IDs or roles
  };
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(AnalyticsType),
      required: true
    },
    timeframe: {
      start: {
        type: Date,
        required: true
      },
      end: {
        type: Date,
        required: true
      }
    },
    scope: {
      country: String,
      region: String,
      cropTypes: [String]
    },
    metrics: [{
      name: {
        type: String,
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        required: true
      },
      trend: Number
    }],
    visualizations: [{
      type: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      data: Schema.Types.Mixed
    }],
    insights: [String],
    recommendations: [String],
    sources: [{
      name: {
        type: String,
        required: true
      },
      url: String,
      date: Date
    }],
    accessRights: {
      public: {
        type: Boolean,
        default: false
      },
      restrictedTo: [String]
    }
  },
  {
    timestamps: true
  }
);

const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);

export default Analytics; 