import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

router.get('/statistics', userController.getUserStatistics);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);

export default router;
