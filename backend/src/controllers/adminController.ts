import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import AdminAuditLog from '../models/AdminAuditLog';
export const logAdminAction = async (adminId: string, action: string, targetType: string, targetId: string, metadata: any, req: AuthRequest) => {
  try 
  {
    await AdminAuditLog.create({
      adminId,
      action,
      targetType,
      targetId,
      metadata,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    console.error('[AdminAuditLog] Error logging action:', error);
  }
};
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).select('-firebaseUid');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('[Admin] Get users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
export const changeUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (role !== 'USER' && role !== 'ADMIN') {
      res.status(400).json({ success: false, message: 'Invalid role provided' });
      return;
    }
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    await logAdminAction(req.user._id, 'ROLE_CHANGED', 'USER', user._id.toString(), { newRole: role }, req);
    res.status(200).json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    console.error('[Admin] Change user role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await AdminAuditLog.find({}).sort({ createdAt: -1 }).populate('adminId', 'name email');
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('[Admin] Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
