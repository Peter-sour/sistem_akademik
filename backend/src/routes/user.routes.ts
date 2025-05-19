import { Router } from 'express';
import { register, login, getProfile } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);    // <-- pastikan 'register' adalah function
router.post('/login', login);          // <-- pastikan 'login' adalah function
router.post('/profile', authMiddleware, getProfile);  // middleware + function

export default router;
