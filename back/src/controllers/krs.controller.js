import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

/**
 * Get student's KRS
 * @route GET /api/krs
 */
export const getKrs = async (req, res) => {
  try {
    // Validasi role
    if (!req.user || req.user.peran !== 'mahasiswa') {
      return errorResponse(res, 'Forbidden', 403);
    }

    // Ambil ID mahasiswa dan program_id dari pengguna yang login
    const studentResult = await pool.query(
      'SELECT id, program_id FROM mahasiswa WHERE pengguna_id = $1',
      [req.user.id]
    );

    if (studentResult.rows.length === 0) {
      return errorResponse(res, 'Data mahasiswa tidak ditemukan', 404);
    }

    const programId = studentResult.rows[0].program_id;
    const { tahun_akademik, semester } = req.query;

    // Query KRS berdasarkan mahasiswa_id
    let query = `
     SELECT m.id,mk.id as matkul_id,m.semester, mk.kode,m.nama as nama_mahasiswa,m.tahun_masuk, m.program_id,mk.kode, mk.nama as nama_matakuliah
         , mk.sks, d.nama as nama_dosen, mk.jadwal
      FROM mahasiswa m
      JOIN mata_kuliah mk ON m.program_id = mk.program_id
      LEFT JOIN dosen d ON mk.dosen_id = d.id
      WHERE m.program_id = $1
    `;

    const params = [programId];


    const result = await pool.query(query, params);
    return successResponse(res, result.rows);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Server error');
  }
};


/**
 * Add course to KRS
 * @route POST /api/krs
 */
export const addKrs = async (req, res) => {
  try {
    const { mata_kuliah_id } = req.body;

    // Validasi role user harus mahasiswa
    if (!req.user || req.user.peran !== 'mahasiswa') {
      return res.status(403).json({ success: false, message: 'Forbidden: hanya mahasiswa yang dapat menambahkan KRS.' });
    }

    // Ambil data mahasiswa berdasarkan pengguna_id
    const studentResult = await pool.query(
      'SELECT id, program_id FROM mahasiswa WHERE pengguna_id = $1',
      [req.user.id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Data mahasiswa tidak ditemukan',
      });
    }

    const mahasiswaId = studentResult.rows[0].id;

    // Insert ke database
    const result = await pool.query(
      `INSERT INTO krs (mahasiswa_id, mata_kuliah_id, tahun_akademik, semester,nilai)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;`,
      [mahasiswaId, mata_kuliah_id, '2023/2024' ,'ganjil', null]
    );
    // Cek jika gagal insert (harusnya jarang terjadi)
    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mata kuliah sudah ada di KRS atau terjadi kesalahan saat menambahkan.'
      });
    }
    // Jika berhasil, kembalikan data yang baru ditambahkan
    return res.status(201).json({
      success: true,
      message: 'Mata kuliah berhasil ditambahkan ke KRS',
      data: result.rows[0]
    });
  } catch (error) {
    // Tangani error dari trigger PostgreSQL
    if (error.code === 'P0001' && error.message.includes('Total SKS melebihi batas maksimal')) {
      return res.status(400).json({
        success: false,
        message: 'Total SKS melebihi batas maksimal 24. Tidak bisa tambah mata kuliah.'
      });
    }

    // Tangani error umum
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};


/**
 * Delete course from KRS
 * @route DELETE /api/krs/:id
 */
export const deleteKrs = async (req, res) => {
  try {
    const { mahasiswa_id, mata_kuliah_id } = req.body;

    // Validasi input
    if (!mahasiswa_id || !mata_kuliah_id) {
      return errorResponse(res, 'mahasiswa_id dan mata_kuliah_id wajib diisi', 400);
    }

    // Eksekusi penghapusan
    const result = await pool.query(
      'DELETE FROM krs WHERE mahasiswa_id = $1 AND mata_kuliah_id = $2 RETURNING mahasiswa_id, mata_kuliah_id',
      [mahasiswa_id, mata_kuliah_id]
    );

    // Cek apakah baris dihapus
    if (result.rowCount === 0) {
      return res.status(404).json({
      success: false,
      message: 'Data KRS tidak ditemukan',
      mahasiswa_id,
      mata_kuliah_id
  });
    }

    return successResponse(res, { message: 'Mata kuliah berhasil dihapus dari KRS' });

  } catch (error) {
    console.error('deleteKrs error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};


export const getAvailableCourses = async (req, res) => {
  try {
    if (!req.user || req.user.peran !== 'mahasiswa') {
      return errorResponse(res, 'Forbidden', 403);
    }

    const studentResult = await pool.query(
      'SELECT id FROM mahasiswa WHERE pengguna_id = $1',
      [req.user.id]
    );

    if (studentResult.rows.length === 0) {
      return errorResponse(res, 'Data mahasiswa tidak ditemukan', 404);
    }

    const programId = studentResult.rows[0].program_id;
    const { semester } = req.query; // opsional filter semester

    let query = `
     WITH data AS (
  SELECT
    n.id,
    m.nama AS nama_mahasiswa,
    n.mata_kuliah_id,
    mk.jadwal,
    n.mahasiswa_id,
    m.nim,
    mk.kode,
    mk.nama AS nama_mata_kuliah,
    mk.sks,
    n.tahun_akademik,
    n.semester,
    n.nilai,
    d.nama AS nama_dosen
  FROM
    krs n
    JOIN mahasiswa m ON n.mahasiswa_id = m.id
    JOIN mata_kuliah mk ON n.mata_kuliah_id = mk.id
    LEFT JOIN dosen d ON mk.dosen_id = d.id
  WHERE
    m.pengguna_id = $1
)
SELECT *, (SELECT COUNT(*) FROM data) AS total_baris,
(SELECT SUM(sks) FROM data) AS total_sks FROM data;
    `;
    const params = [req.user.id];

    if (semester) {
      query += ' AND mk.semester = $2';
      params.push(semester);
    }

    const result = await pool.query(query, params);
    return successResponse(res, result.rows);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Server error');
  }
};

export const getGrade = async (req, res) => {
  try {
    if (!req.user || req.user.peran !== 'mahasiswa') {
      return errorResponse(res, 'Forbidden', 403);
    }

    const studentResult = await pool.query(
      'SELECT id FROM mahasiswa WHERE pengguna_id = $1',
      [req.user.id]
    );

    if (studentResult.rows.length === 0) {
      return errorResponse(res, 'Data mahasiswa tidak ditemukan', 404);
    }

    const mahasiswaId = studentResult.rows[0].id;

    const result = await pool.query(
      `
        SELECT
      m.semester,
      m.nama as nama_mahasiswa,
      mk.kode,
      mk.nama AS nama_mata_kuliah,
      mk.sks,
      nilai_ke_angka(k.nilai) AS nilai_angka,
      k.nilai as nilai_huruf,
      r.peringkat,
      r.ipk_4 as ipk,
      totals.total_sks_lulus,
      totals.total_sks_tidak_lulus
      FROM mahasiswa m
        JOIN krs k ON m.id = k.mahasiswa_id
        JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
        JOIN ranking_mahasiswa_dengan_3_ipk r ON m.id = r.mahasiswa_id
        JOIN (
            SELECT
                mahasiswa_id,
                SUM(CASE WHEN nilai IN ('A', 'A-', 'B+', 'B', 'B-') THEN sks ELSE 0 END) AS total_sks_lulus,
                SUM(CASE WHEN nilai NOT IN ('A', 'A-', 'B+', 'B', 'B-') THEN sks ELSE 0 END) AS total_sks_tidak_lulus
            FROM krs
            JOIN mata_kuliah ON krs.mata_kuliah_id = mata_kuliah.id
            GROUP BY mahasiswa_id
        ) totals ON totals.mahasiswa_id = m.id
      WHERE m.pengguna_id = $1
      ORDER BY mk.kode;
      `,
      [req.user.id]
    );

    return successResponse(res, result.rows);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Server error');
  }
};

export const getRanking = async (req, res) => {
  try {
    if (!req.user || req.user.peran !== 'mahasiswa') {
      return errorResponse(res, 'Forbidden', 403);
    }

    const studentResult = await pool.query(
      'SELECT program_id FROM mahasiswa WHERE pengguna_id = $1',
      [req.user.id]
    );

    if (studentResult.rows.length === 0) {
      return errorResponse(res, 'Data mahasiswa tidak ditemukan', 404);
    }

    const programId = studentResult.rows[0].program_id;

    const result = await pool.query(
      `select m.pengguna_id,m.program_id ,r.peringkat, m.nama as nama_mahasiswa , m.nim , p.fakultas , r.ipk_4
      from ranking r
        join mahasiswa m on r.mahasiswa_id = m.id
        join program_studi p on p.id = m.program_id
        where m.program_id = $1
      order by r.peringkat asc
      `,
      [programId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Data ranking tidak ditemukan', 404);
    }

    return successResponse(res, result.rows[0]);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Server error');
  }
};