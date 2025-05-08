import mongoose, { Document, Schema } from 'mongoose';
import { IFarm } from './Farm';
import { ICrop } from './Farm';

export interface IYieldPrediction extends Document {
  farm: IFarm['_id'];
  crop: {
    name: string;
    variety?: string;
    area: number;
  };
  prediction: {
    expectedYield: number;
    yieldUnit: string;
    lowerBound: number;
    upperBound: number;
    confidenceLevel: number;
  };
  factors: {
    soilQuality?: number;
    weatherConditions?: string;
    pestRisks?: string[];
    diseaseProbability?: number;
    rainfall?: number;
    temperature?: {
      min: number;
      max: number;
      average: number;
    };
  };
  recommendations: {
    irrigationSchedule?: string;
    fertilizers?: {
      type: string;
      amount: number;
      unit: string;
      applicationTime: string;
    }[];
    pestControl?: string[];
    harvestTime?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const yieldPredictionSchema = new Schema<IYieldPrediction>(
  {
    farm: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: true
    },
    crop: {
      name: {
        type: String,
        required: true
      },
      variety: String,
      area: {
        type: Number,
        required: true
      }
    },
    prediction: {
      expectedYield: {
        type: Number,
        required: true
      },
      yieldUnit: {
        type: String,
        required: true
      },
      lowerBound: Number,
      upperBound: Number,
      confidenceLevel: {
        type: Number,
        min: 0,
        max: 1
      }
    },
    factors: {
      soilQuality: Number,
      weatherConditions: String,
      pestRisks: [String],
      diseaseProbability: Number,
      rainfall: Number,
      temperature: {
        min: Number,
        max: Number,
        average: Number
      }
    },
    recommendations: {
      irrigationSchedule: String,
      fertilizers: [{
        type: String,
        amount: Number,
        unit: String,
        applicationTime: String
      }],
      pestControl: [String],
      harvestTime: Date
    }
  },
  {
    timestamps: true
  }
);

const YieldPrediction = mongoose.model<IYieldPrediction>('YieldPrediction', yieldPredictionSchema);

export default YieldPrediction; 