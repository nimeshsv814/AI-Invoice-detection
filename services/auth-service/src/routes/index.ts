import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRegister, validateLogin } from '../middleware/validate.middleware';

const router = Router();

router.post('/auth/register', validateRegister, controller.register);
router.post('/auth/login', validateLogin, controller.login);
router.post('/auth/refresh', controller.refreshToken);
router.post('/auth/logout', authenticate, controller.logout);
router.get('/auth/profile', authenticate, controller.getProfile);

// Admin-only User Management
router.get('/users', authenticate, authorize(['admin']), controller.getUsers);
router.delete('/users/:id', authenticate, authorize(['admin']), controller.deleteUser);

export default router;
