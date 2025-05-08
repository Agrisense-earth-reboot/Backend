import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { IFarm } from './Farm';

export enum ProductStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold'
}

export enum ProductCategory {
  FRUITS = 'fruits',
  VEGETABLES = 'vegetables',
  GRAINS = 'grains',
  DAIRY = 'dairy',
  LIVESTOCK = 'livestock',
  OTHER = 'other'
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  seller: Types.ObjectId;
  farm?: Types.ObjectId;
  name: string;
  description: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  harvestDate: Date;
  expiryEstimate: Date;
  status: ProductStatus;
  location: {
    country: string;
    region: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  images?: string[];
  qualityCertification?: string[];
  organicCertification?: boolean;
  storageRequirements?: {
    temperature?: {
      min: number;
      max: number;
    };
    humidity?: {
      min: number;
      max: number;
    };
    lightSensitive?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    farm: {
      type: Schema.Types.ObjectId,
      ref: 'Farm'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: Object.values(ProductCategory),
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    harvestDate: {
      type: Date,
      required: true
    },
    expiryEstimate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.AVAILABLE
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
    images: [String],
    qualityCertification: [String],
    organicCertification: Boolean,
    storageRequirements: {
      temperature: {
        min: Number,
        max: Number
      },
      humidity: {
        min: Number,
        max: Number
      },
      lightSensitive: Boolean
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product; 