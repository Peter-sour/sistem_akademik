// src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { errorResponse } from '../utils/responseHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const authenticateUser = async (req, res, next) => {
  console.log('Authorization header:', req.headers.authorization);
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Unauthorized - No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verifikasi token JWT
      const decoded = jwt.verify(token, JWT_SECRET);

      // Cek apakah user ada dan aktif
      const userResult = await pool.query(
        'SELECT * FROM pengguna WHERE id = $1 AND aktif = true',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return errorResponse(res, 'User tidak ditemukan atau tidak aktif', 401);
      }

      req.user = userResult.rows[0];
      next();
    } catch (error) {
      return errorResponse(res, 'Invalid token', 401);
    }
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    if (!roles.includes(req.user.peran)) {
      return errorResponse(res, 'Forbidden - Insufficient permissions', 403);
    }

    next();
  };
};
