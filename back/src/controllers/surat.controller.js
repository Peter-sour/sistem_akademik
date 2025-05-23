import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * Get all letter requests
 * @route GET /api/pengajuan
 */
export const getLetters = async (req, res) => {
  try {
    let query, queryParams;

    if (req.user && req.user.peran === 'mahasiswa') {
      const studentResult = await pool.query(
        'SELECT id FROM mahasiswa WHERE pengguna_id = $1',
        [req.user.id]
      );

      if (studentResult.rows.length === 0) {
        return errorResponse(res, 'Data mahasiswa tidak ditemukan', 404);
      }

      const studentId = studentResult.rows[0].id;

      query = `
        SELECT ps.id, ps.jenis_surat, ps.keperluan, ps.status, ps.mahasiswa_id,
               m.nim, m.nama as nama_mahasiswa
        FROM permintaan_surat ps
        JOIN mahasiswa m ON ps.mahasiswa_id = m.id
        WHERE ps.mahasiswa_id = $1
        ORDER BY ps.id DESC
      `;
      queryParams = [studentId];
    } else if (req.user && (req.user.peran === 'admin' || req.user.peran === 'dosen')) {
      query = `
        SELECT ps.id, ps.jenis_surat, ps.keperluan, ps.status,
               m.nim, m.nama as nama_mahasiswa
        FROM permintaan_surat ps
        JOIN mahasiswa m ON ps.mahasiswa_id = m.id
        ORDER BY ps.id DESC
      `;
      queryParams = [];
    } else {
      return errorResponse(res, 'Forbidden', 403);
    }

    const result = await pool.query(query, queryParams);
    return successResponse(res, result.rows);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error');
  }
};

/**
 * Create a letter request
 * @route POST /api/pengajuan
 */

export const createLetter = async (req, res) => {
  try {
    if (!req.user || req.user.peran !== 'mahasiswa') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { jenis_surat, keperluan } = req.body;

    if (!jenis_surat || !keperluan) {
      return res.status(400).json({
        success: false,
        error: 'jenis_surat dan keperluan wajib diisi',
      });
    }

    // Dapatkan ID mahasiswa berdasarkan pengguna login
    const mhsResult = await pool.query(
      'SELECT id FROM mahasiswa WHERE pengguna_id = $1',
      [req.user.id]
    );

    if (mhsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Data mahasiswa tidak ditemukan',
      });
    }

    const mahasiswaId = mhsResult.rows[0].id;

    const insertResult = await pool.query(
      `INSERT INTO permintaan_surat (mahasiswa_id, jenis_surat, keperluan, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [mahasiswaId, jenis_surat, keperluan, 'menunggu']
    );

    return res.status(201).json({
      success: true,
      data: insertResult.rows[0],
    });
  } catch (err) {
    console.error('Error creating letter request:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};


/**
 * Update a letter request
 * @route PUT /api/pengajuan/:id
 */
export const updateLetter = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user && req.user.peran === 'mahasiswa') {
      const { keperluan } = req.body;

      if (!keperluan) {
        return errorResponse(res, 'Keperluan surat harus diisi', 400);
      }

      const studentResult = await pool.query(
        'SELECT id FROM mahasiswa WHERE pengguna_id = $1',
        [req.user.id]
      );

      if (studentResult.rows.length === 0) {
        return errorResponse(res, 'Data mahasiswa tidak ditemukan', 404);
      }

      const studentId = studentResult.rows[0].id;

      const result = await pool.query(
        `UPDATE permintaan_surat
         SET keperluan = $1
         WHERE mahasiswa_id = $2
         RETURNING keperluan`,
        [keperluan, studentId]
      );

      if (result.rows.length === 0) {
        return errorResponse(res,
          'Pengajuan surat tidak ditemukan, bukan milik Anda, atau sudah diproses', 404);
      }

      return successResponse(res, result.rows[0]);
    } else if (req.user && (req.user.peran === 'admin' || req.user.peran === 'dosen')) {
      const { status, keterangan } = req.body;

      if (!status) {
        return errorResponse(res, 'Status surat harus diisi', 400);
      }

      const validStatuses = ['menunggu', 'diproses', 'selesai', 'ditolak'];
      if (validStatuses.indexOf(status) === -1) {
        return errorResponse(res, 'Status tidak valid', 400);
      }

      let result;
      if (keterangan) {
        result = await pool.query(
          `UPDATE permintaan_surat
           SET status = $1, keterangan = $2, diupdate_pada = CURRENT_TIMESTAMP
           WHERE id = $3
           RETURNING *`,
          [status, keterangan, id]
        );
      } else {
        result = await pool.query(
          `UPDATE permintaan_surat
           SET status = $1, diupdate_pada = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING *`,
          [status, id]
        );
      }

      if (result.rows.length === 0) {
        return errorResponse(res, 'Pengajuan surat tidak ditemukan', 404);
      }

      return successResponse(res, result.rows[0]);
    } else {
      return errorResponse(res, 'Forbidden', 403);
    }
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error');
  }
};

/**
 * Get letter request by ID
 * @route GET /api/pengajuan/:id
 */
export const getLetterById = async (req, res) => {
  try {
    const { id } = req.params;
    let query, queryParams;

    if (req.user && req.user.peran === 'mahasiswa') {
      const studentResult = await pool.query(
        'SELECT id FROM mahasiswa WHERE pengguna_id = $1',
        [req.user.id]
      );

      if (studentResult.rows.length === 0) {
        return errorResponse(res, 'Data mahasiswa tidak ditemukan', 404);
      }

      const studentId = studentResult.rows[0].id;

      query = `
        SELECT ps.id, ps.jenis_surat, ps.keperluan, ps.status, ps.keterangan,
               ps.dibuat_pada, ps.diupdate_pada,
               m.nim, m.nama as nama_mahasiswa,
               p.nama as diupdate_oleh
        FROM permintaan_surat ps
        JOIN mahasiswa m ON ps.mahasiswa_id = m.id
        LEFT JOIN pengguna p ON ps.diupdate_oleh = p.id
        WHERE ps.id = $1 AND ps.mahasiswa_id = $2
      `;
      queryParams = [id, studentId];
    } else if (req.user && (req.user.peran === 'admin' || req.user.peran === 'dosen')) {
      query = `
        SELECT ps.id, ps.jenis_surat, ps.keperluan, ps.status, ps.keterangan,
               ps.dibuat_pada, ps.diupdate_pada,
               m.nim, m.nama as nama_mahasiswa, m.program_studi, m.angkatan,
               p.nama as diupdate_oleh
        FROM permintaan_surat ps
        JOIN mahasiswa m ON ps.mahasiswa_id = m.id
        LEFT JOIN pengguna p ON ps.diupdate_oleh = p.id
        WHERE ps.id = $1
      `;
      queryParams = [id];
    } else {
      return errorResponse(res, 'Forbidden', 403);
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return errorResponse(res, 'Pengajuan surat tidak ditemukan', 404);
    }

    return successResponse(res, result.rows[0]);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error');
  }
};

/**
 * Delete letter request
 * @route DELETE /api/pengajuan/:id
 */
export const deleteLetter = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user && req.user.peran === 'mahasiswa') {
      const studentResult = await pool.query(
        'SELECT id FROM mahasiswa WHERE pengguna_id = $1',
        [req.user.id]
      );

      if (studentResult.rows.length === 0) {
        return errorResponse(res, 'Data mahasiswa tidak ditemukan', 404);
      }

      const studentId = studentResult.rows[0].id;

      const result = await pool.query(
        `DELETE FROM permintaan_surat
         WHERE id = $1 AND mahasiswa_id = $2 AND status = 'menunggu'
         RETURNING id`,
        [id, studentId]
      );

      if (result.rows.length === 0) {
        return errorResponse(res,
          'Pengajuan surat tidak ditemukan, bukan milik Anda, atau sudah diproses', 404);
      }

      return successResponse(res, { message: 'Pengajuan surat berhasil dihapus' });
    } else if (req.user && req.user.peran === 'admin') {
      const result = await pool.query(
        `DELETE FROM permintaan_surat WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Pengajuan surat tidak ditemukan', 404);
      }

      return successResponse(res, { message: 'Pengajuan surat berhasil dihapus' });
    } else {
      return errorResponse(res, 'Forbidden', 403);
    }
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error');
  }
};

/**
 * Get letter requests statistics
 * @route GET /api/pengajuan/statistik
 */
export const getLetterStats = async (req, res) => {
  try {
    if (!req.user || (req.user.peran !== 'admin' && req.user.peran !== 'dosen')) {
      return errorResponse(res, 'Forbidden', 403);
    }

    const statsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'menunggu') as menunggu,
        COUNT(*) FILTER (WHERE status = 'diproses') as diproses,
        COUNT(*) FILTER (WHERE status = 'selesai') as selesai,
        COUNT(*) FILTER (WHERE status = 'ditolak') as ditolak,
        COUNT(*) as total
      FROM permintaan_surat
    `;

    const result = await pool.query(statsQuery);

    return successResponse(res, result.rows[0]);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error');
  }
};

/**
 * Get list of letter types
 * @route GET /api/pengajuan/jenis-surat
 */
export const getLetterTypes = async (req, res) => {
  try {
    const letterTypes = [
      { id: 'keterangan_aktif', nama: 'Surat Keterangan Aktif' },
      { id: 'keterangan_kuliah', nama: 'Surat Keterangan Kuliah' },
      { id: 'rekomendasi', nama: 'Surat Rekomendasi' },
      { id: 'ijin_penelitian', nama: 'Surat Ijin Penelitian' },
      { id: 'ijin_praktikum', nama: 'Surat Ijin Praktikum' },
      { id: 'lainnya', nama: 'Lainnya' }
    ];

    return successResponse(res, letterTypes);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error');
  }
};
