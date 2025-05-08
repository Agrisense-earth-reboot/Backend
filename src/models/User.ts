import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  FARMER = 'farmer',
  VENDOR = 'vendor',
  NGO = 'ngo',
  ADMIN = 'admin'
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  location: {
    country: string;
    region: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.FARMER
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
    phoneNumber: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// We'll implement password hashing before save in a later step

const User = mongoose.model<IUser>('User', userSchema);

export default User; 