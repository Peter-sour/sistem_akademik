import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * Get student profile
 * @route GET /api/mahasiswa/:id
 */
export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || (req.user.peran !== 'admin' && req.user.id !== parseInt(id))) {
      return errorResponse(res, 'Forbidden', 403);
    }

    const result = await pool.query(
      `SELECT m.id, m.nim, m.nama,m.nomor_telepon, m.alamat,  m.semester, m.tahun_masuk, m.status,
              p.kode as program_kode, p.nama as program_nama, p.fakultas, p.jenjang
       FROM mahasiswa m
       JOIN program_studi p ON m.program_id = p.id
       WHERE m.pengguna_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Mahasiswa tidak ditemukan', 404);
    }

    return successResponse(res, result.rows[0]);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error');
  }
};

/**
 * Update student profile
 * @route PUT /api/mahasiswa/:id
 */
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, semester } = req.body;

    if (!req.user || (req.user.peran !== 'admin' && req.user.id !== parseInt(id))) {
      return errorResponse(res, 'Forbidden', 403);
    }

    const result = await pool.query(
      'UPDATE mahasiswa SET nama = $1, semester = $2 WHERE pengguna_id = $3 RETURNING *',
      [nama, semester, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Mahasiswa tidak ditemukan', 404);
    }

    return successResponse(res, result.rows[0]);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error');
  }
};
