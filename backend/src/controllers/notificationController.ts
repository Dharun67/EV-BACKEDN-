import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import UserNotificationDevice from '../models/UserNotificationDevice';
import User from '../models/User';

export const registerDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, platform } = req.body;
    const userId = req.user?._id; // Assumes authMiddleware attaches user

    if (!token) {
      res.status(400).json({ success: false, message: 'FCM token is required' });
      return;
    }

    // Upsert the device token for the user
    await UserNotificationDevice.findOneAndUpdate(
      { userId, token },
      { 
        platform: platform || 'web',
        active: true,
        lastUsedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Device registered successfully' });
  } catch (error: any) {
    console.error('Error registering device:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const unregisterDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const userId = req.user?._id;

    if (!token) {
      res.status(400).json({ success: false, message: 'FCM token is required' });
      return;
    }

    await UserNotificationDevice.findOneAndDelete({ userId, token });

    res.status(200).json({ success: true, message: 'Device unregistered successfully' });
  } catch (error: any) {
    console.error('Error unregistering device:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).select('notificationPreferences');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ 
      success: true, 
      preferences: user.notificationPreferences || {} 
    });
  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const preferences = req.body.preferences;

    if (!preferences) {
      res.status(400).json({ success: false, message: 'Preferences object is required' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { notificationPreferences: preferences } },
      { new: true }
    ).select('notificationPreferences');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ 
      success: true, 
      message: 'Preferences updated successfully',
      preferences: user.notificationPreferences
    });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
