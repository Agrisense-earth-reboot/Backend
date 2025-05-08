import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';

// Base interface for crop data
export interface ICropBase {
  name: string;
  variety?: string;
  plantingDate: Date;
  expectedHarvestDate?: Date;
  area: number; // in hectares
  soilType?: string;
  irrigationType?: string;
  previousYields?: {
    year: number;
    amount: number;
    unit: string;
  }[];
}

// Interface for crop document with Mongoose methods
export interface ICrop extends ICropBase, Document {
  _id: Types.ObjectId;
  [key: string]: any; // Allow dynamic property access
}

export interface IFarm extends Document {
  owner: IUser['_id'];
  name: string;
  location: {
    country: string;
    region: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  size: number; // total size in hectares
  crops: ICrop[];
  soilCharacteristics?: {
    type: string;
    pH?: number;
    nutrientLevels?: {
      nitrogen?: number;
      phosphorus?: number;
      potassium?: number;
    };
  };
  waterSource?: string[];
  equipment?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const cropSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  variety: String,
  plantingDate: {
    type: Date,
    required: true
  },
  expectedHarvestDate: Date,
  area: {
    type: Number,
    required: true
  },
  soilType: String,
  irrigationType: String,
  previousYields: [{
    year: Number,
    amount: Number,
    unit: String
  }]
});

const farmSchema = new Schema<IFarm>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    location: {
      country: {
        type: String,
        required: true
      },
      region: {
        type: String,
        required: true
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    size: {
      type: Number,
      required: true
    },
    crops: [cropSchema],
    soilCharacteristics: {
      type: {
        type: String
      },
      pH: Number,
      nutrientLevels: {
        nitrogen: Number,
        phosphorus: Number,
        potassium: Number
      }
    },
    waterSource: [String],
    equipment: [String]
  },
  {
    timestamps: true
  }
);

const Farm = mongoose.model<IFarm>('Farm', farmSchema);

export default Farm; 