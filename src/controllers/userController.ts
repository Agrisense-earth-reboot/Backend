import { Request, Response } from 'express';
import User, { IUser, UserRole } from '../models/User';
import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware';
import { Types } from 'mongoose';

interface TokenPayload extends JwtPayload {
  id: string;
  role: UserRole;
}

// Helper function to generate JWT
const generateToken = (id: string | Types.ObjectId, role: UserRole): string => {
  const payload: TokenPayload = { id: id.toString(), role };
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const options: SignOptions = { 
    expiresIn: process.env.JWT_EXPIRES_IN ? parseInt(process.env.JWT_EXPIRES_IN) : '30d'
  };
  
  return jwt.sign(payload, secret, options);
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, location, phoneNumber } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || UserRole.FARMER,
      location,
      phoneNumber
    }) as IUser;

    if (user) {
      // Generate token
      const token = generateToken(user._id as Types.ObjectId, user.role);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        token
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).exec() as IUser | null;
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken(user._id as Types.ObjectId, user.role);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await User.findById(req.user.id).select('-password').exec() as IUser | null;
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error getting profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await User.findById(req.user.id).exec() as IUser | null;
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update user fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.location = req.body.location || user.location;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

    // Update password if provided
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save() as IUser;

    // Generate new token with updated information
    const token = generateToken(updatedUser._id as Types.ObjectId, updatedUser.role);

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      location: updatedUser.location,
      token
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-password').exec() as IUser[];
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error getting users' });
  }
}; 