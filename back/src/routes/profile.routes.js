import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import { authenticateUser } from '../middlewares/auth.js';
import { validateProfile } from '../middlewares/validator.js';

const router = Router();

/**
 * @route GET /api/mahasiswa/:id
 * @desc Get student profile
 * @access Private
 */
router.get('/:id', authenticateUser, getProfile);

/**
 * @route PUT /api/mahasiswa/:id
 * @desc Update student profile
 * @access Private
 */
router.put('/:id', authenticateUser,validateProfile, updateProfile);

// GET /api/auth/me
// GET /api/mahasiswa/me
router.get('/mahasiswa/me', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(`
      SELECT
        m.id, m.nim, m.nama, m.program_id, m.semester, m.tahun_masuk, m.status,
        p.email
      FROM mahasiswa m
      JOIN pengguna p ON p.id = m.pengguna_id
      WHERE m.pengguna_id = $1
    `, [userId]);

    const mahasiswa = result.rows[0];
    if (!mahasiswa) return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });

    res.json(mahasiswa);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data mahasiswa' });
  }
});



export default router;