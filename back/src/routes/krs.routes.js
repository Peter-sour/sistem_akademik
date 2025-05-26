import { Router } from 'express';
import { getGrade, getKrs, addKrs,getRanking, deleteKrs,getAvailableCourses } from '../controllers/krs.controller.js';
import { authenticateUser } from '../middlewares/auth.js';
import { validateKrs } from '../middlewares/validator.js';

const router = Router();

/**
 * @route GET /api/krs
 * @desc Get student's KRS
 * @access Private
 */
router.get('/', authenticateUser, getKrs);

/**
 * @route POST /api/krs
 * @desc Add course to KRS
 * @access Private
 */
router.post('/', authenticateUser,addKrs);

/**
 * @route DELETE /api/krs/:id
 * @desc Delete course from KRS
 * @access Private
 */
router.delete('/delete', authenticateUser, deleteKrs);

// di routes/krs.js atau routes/mataKuliah.js
router.get('/available-mata-kuliah', authenticateUser, getAvailableCourses);
router.get('/nilai',authenticateUser, getGrade);
router.get('/ranking', authenticateUser, getRanking);


export default router;