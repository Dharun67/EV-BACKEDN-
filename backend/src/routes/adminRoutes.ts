import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { getUsers, changeUserRole, getAuditLogs } from '../controllers/adminController';

const router = Router();

// Secure all routes in this file
router.use(authenticate, requireRole('ADMIN'));

router.get('/users', getUsers);
router.patch('/users/:userId/role', changeUserRole);
router.get('/audit-logs', getAuditLogs);

export default router;
