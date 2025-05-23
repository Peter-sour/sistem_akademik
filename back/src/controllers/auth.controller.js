import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import { hashPassword, comparePassword } from '../utils/passwordUtil.js';
import dotenv from 'dotenv';
dotenv.config();


// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || '4fT8$g!9s2@#Ld76z1^&bO9xPq';
const JWT_EXPIRES_IN = '24h';

/**
 * Register a new user (student)
 * @route POST /api/auth/register
 */
export const register = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { email, password, nama, nim, program_id, tahun_masuk, semester = 1 } = req.body;

    const emailCheck = await client.query(
      'SELECT * FROM pengguna WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Email sudah terdaftar', 400);
    }

    const nimCheck = await client.query(
      'SELECT * FROM mahasiswa WHERE nim = $1',
      [nim]
    );

    if (nimCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'NIM sudah terdaftar', 400);
    }

    const programCheck = await client.query(
      'SELECT * FROM program_studi WHERE id = $1',
      [program_id]
    );

    if (programCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Program studi tidak ditemukan', 404);
    }

    const hashedPassword = await hashPassword(password);

    const userResult = await client.query(
      'INSERT INTO pengguna (email, password, peran, aktif) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, hashedPassword, 'mahasiswa', true]
    );

    const userId = userResult.rows[0].id;

    await client.query(
      'INSERT INTO mahasiswa (pengguna_id, nim, nama, program_id, semester, tahun_masuk, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, nim, nama, program_id, semester, tahun_masuk, 'aktif']
    );

    await client.query('COMMIT');

    const token = jwt.sign({ id: userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return successResponse(res, {
      user: {
        id: userId,
        email,
        peran: 'mahasiswa'
      },
      token
    }, 201);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return errorResponse(res, 'Server error');
  } finally {
    client.release();
  }
};

/**
 * User login
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email dan password harus diisi', 400);
    }

    const result = await pool.query(
      'SELECT * FROM pengguna WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Email atau password salah', 401);
    }

    const user = result.rows[0];

    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch) {
      return errorResponse(res, 'Email atau password salah', 401);
    }

    const token = jwt.sign({ id: user.id, email: user.email , password : user.password}, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    console.log('Generated token:', token);

    return successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        peran: user.peran
      },
      token
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error');
  }
};

/**
 * Get user profile
 * @route GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    let userData;

    if (req.user.peran === 'mahasiswa') {
      const result = await pool.query(`
        SELECT m.id, m.nim, m.pengguna_id,m.nama, m.semester, m.tahun_masuk, m.status,
              p.kode as program_kode, p.nama as program_nama, p.fakultas, p.jenjang
        FROM mahasiswa m
        JOIN program_studi p ON m.program_id = p.id
        WHERE m.pengguna_id = $1
      `, [req.user.id]);

      if (result.rows.length === 0) {
        return errorResponse(res, 'Data mahasiswa tidak ditemukan', 404);
      }

      userData = result.rows[0];
    } else if (req.user.peran === 'dosen') {
      const result = await pool.query(`
        SELECT id, nidn, nama, bidang_keahlian
        FROM dosen
        WHERE pengguna_id = $1
      `, [req.user.id]);

      if (result.rows.length === 0) {
        return errorResponse(res, 'Data dosen tidak ditemukan', 404);
      }

      userData = result.rows[0];
    }

    return successResponse(res, {
      id: req.user.id,
      email: req.user.email,
      peran: req.user.peran,
      nim : req.user.nim,
      ...userData
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error');
  }
};
