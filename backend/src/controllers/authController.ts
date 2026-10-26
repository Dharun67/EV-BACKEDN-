import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Vehicle from '../models/Vehicle';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  evModel: z.string().optional(),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Auto-assign ADMIN role to specific emails for easy testing
    const role = validatedData.email.toLowerCase() === 'admin@gridwise.com' ? 'ADMIN' : 'USER';

    const newUser = new User({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: role,
      status: 'ACTIVE',
      emailVerified: false,
    });

    await newUser.save();

    // Create a default vehicle for the user so their dashboard looks professional immediately
    const evModelString = validatedData.evModel || 'Tesla Model 3';
    const brand = evModelString.split(' ')[0] || 'Tesla';
    const newVehicle = new Vehicle({
      vehicleId: `V-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: newUser._id.toString(),
      brand: brand,
      vehicleModel: evModelString,
      batteryCapacityKwh: 75,
      batteryPercentage: 78,
      rangeKm: 340,
      status: 'ACTIVE'
    });
    await newVehicle.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please sign in.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid input data', errors: (error as any).errors });
    } else {
      console.error('[Auth Register] Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'gridwise_super_secret_key_2026';
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error: any) {
    console.error('[Auth Login] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = req.user;

    // Update lastLoginAt
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        profileImage: user.profileImage,
        organization: user.organization
      }
    });
  } catch (error: any) {
    console.error('[Auth GetMe] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
