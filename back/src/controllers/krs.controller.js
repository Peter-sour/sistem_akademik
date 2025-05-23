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
     SELECT m.id, mk.kode,m.nama as nama_mahasiswa,m.tahun_masuk, m.program_id,mk.kode, mk.nama as nama_matakuliah
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
    // Validasi role mahasiswa
    if (!req.user || req.user.peran !== 'mahasiswa') {
      return errorResponse(res, 'Akses ditolak', 403);
    }

    const { mata_kuliah_id, tahun_akademik } = req.body;

    // Validasi input
    if (!mata_kuliah_id || !tahun_akademik) {
      return errorResponse(res, 'Field mata_kuliah_id dan tahun_akademik wajib diisi', 400);
    }

    // Ambil data mahasiswa
    const mahasiswaResult = await pool.query(
      'SELECT id, semester FROM mahasiswa WHERE pengguna_id = $1',
      [req.user.id]
    );

    if (mahasiswaResult.rows.length === 0) {
      return errorResponse(res, 'Data mahasiswa tidak ditemukan', 404);
    }

    const mahasiswaId = mahasiswaResult.rows[0].id;
    const semesterMahasiswa = mahasiswaResult.rows[0].semester;

    // Cek mata kuliah
    const mataKuliahResult = await pool.query(
      `SELECT mk.*, d.nama as nama_dosen
       FROM mata_kuliah mk
       JOIN dosen d ON mk.dosen_id = d.id
       WHERE mk.id = $1`,
      [mata_kuliah_id]
    );

    if (mataKuliahResult.rows.length === 0) {
      return errorResponse(res, 'Mata kuliah tidak ditemukan', 404);
    }

    const mataKuliah = mataKuliahResult.rows[0];

    // Validasi semester
    if (mataKuliah.semester > semesterMahasiswa) {
      return errorResponse(res, `Mata kuliah ini untuk semester ${mataKuliah.semester}, Anda semester ${semesterMahasiswa}`, 400);
    }

    // Cek duplikasi
    const krsAdaResult = await pool.query(
      'SELECT id FROM krs WHERE mahasiswa_id = $1 AND mata_kuliah_id = $2 AND tahun_akademik = $3',
      [mahasiswaId, mata_kuliah_id, tahun_akademik]
    );

    if (krsAdaResult.rows.length > 0) {
      return errorResponse(res, 'Mata kuliah sudah ada dalam KRS', 409);
    }

    // Cek kapasitas
    const kapasitasResult = await pool.query(
      'SELECT COUNT(*) as jumlah_terdaftar FROM krs WHERE mata_kuliah_id = $1',
      [mata_kuliah_id]
    );

    const jumlahTerdaftar = parseInt(kapasitasResult.rows[0].jumlah_terdaftar);
    if (jumlahTerdaftar >= mataKuliah.kapasitas_maksimal) {
      return errorResponse(res, 'Kapasitas mata kuliah sudah penuh', 400);
    }

    // Cek total SKS
    const sksResult = await pool.query(
      `SELECT COALESCE(SUM(mk.sks), 0) as total_sks
       FROM krs k JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
       WHERE k.mahasiswa_id = $1`,
      [mahasiswaId]
    );

    const totalSksSekarang = parseInt(sksResult.rows[0].total_sks);
    const batasSks = 24;

    if (totalSksSekarang + mataKuliah.sks > batasSks) {
      return errorResponse(res, `Total SKS akan melebihi batas maksimal (${batasSks} SKS)`, 400);
    }

    // Cek jadwal bentrok
    const jadwalBentrokResult = await pool.query(
      `SELECT mk.nama FROM krs k
       JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
       WHERE k.mahasiswa_id = $1 AND mk.hari = $2
       AND ((mk.jam_mulai <= $3 AND mk.jam_selesai > $3)
            OR (mk.jam_mulai < $4 AND mk.jam_selesai >= $4))`,
      [mahasiswaId, mataKuliah.hari, mataKuliah.jam_mulai, mataKuliah.jam_selesai]
    );

    if (jadwalBentrokResult.rows.length > 0) {
      return errorResponse(res, `Jadwal bentrok dengan mata kuliah ${jadwalBentrokResult.rows[0].nama}`, 400);
    }

    // Insert ke tabel krs (tambah tahun_akademik dan semester)
    const insertResult = await pool.query(
      `INSERT INTO krs (mahasiswa_id, mata_kuliah_id, tahun_akademik, semester, dibuat_pada)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [mahasiswaId, mata_kuliah_id, tahun_akademik, semesterMahasiswa]
    );

    // Log aktivitas
    await pool.query(
      `INSERT INTO log_krs (mahasiswa_id, mata_kuliah_id, aksi, dibuat_pada)
       VALUES ($1, $2, $3, NOW())`,
      [mahasiswaId, mata_kuliah_id, 'TAMBAH']
    );

    return successResponse(res, {
      krs: insertResult.rows[0],
      mata_kuliah: mataKuliah
    }, 201, 'Mata kuliah berhasil ditambahkan ke KRS');

  } catch (error) {
    console.error('Error menambahkan mata kuliah ke KRS:', error);
    if (error.code === '23505') {
      return errorResponse(res, 'Mata kuliah sudah ada di KRS', 400);
    }
    return errorResponse(res, 'Terjadi kesalahan server', 500);
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
