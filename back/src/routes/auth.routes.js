import express from 'express';
import { register, login, getProfile } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middlewares/auth.js';
import { validateRegister } from '../middlewares/validator.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user (student)
 * @access Public
 */
router.post('/register', validateRegister, register);

/**
 * @route POST /api/auth/login
 * @desc User login
 * @access Public
 */
router.post('/login', login);

/**
 * @route GET /api/auth/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', authenticateUser, getProfile);

export default router;
