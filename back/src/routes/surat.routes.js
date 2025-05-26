import { Router } from 'express';
import {
  getLetters,
  createLetter,
  updateLetter,
  getLetterById,
  deleteLetter,
  getLetterStats,
  getLetterTypes
} from '../controllers/surat.controller.js';
import { authenticateUser } from '../middlewares/auth.js';
import { validateLetter, validateLetterStatus } from '../middlewares/validator.js';

const router = Router();

/**
 * @route GET /api/pengajuan
 * @desc Get all letter requests
 * @access Private
 */
router.get('/', authenticateUser, getLetters);

/**
 * @route POST /api/pengajuan
 * @desc Create a letter request
 * @access Private (Students only)
 */
router.post('/', authenticateUser, createLetter);

/**
 * @route PUT /api/pengajuan/:id
 * @desc Update a letter request
 * @access Private (Students can update their own pending requests, Admin/Lecturers can update status)
 */
router.put('/:id', authenticateUser, updateLetter);

/**
 * @route GET /api/pengajuan/:id
 * @desc Get letter request by ID
 * @access Private (Students can only see their own, Admin/Lecturers can see all)
 */
router.get('/:id', authenticateUser, getLetterById);

/**
 * @route DELETE /api/pengajuan/:id
 * @desc Delete letter request
 * @access Private (Students can delete their own pending requests, Admin can delete any)
 */
router.delete('/:id', authenticateUser, deleteLetter);

/**
 * @route GET /api/pengajuan/statistik
 * @desc Get letter requests statistics
 * @access Private (Admin and Lecturers only)
 */
router.get('/statistik', authenticateUser, getLetterStats);

/**
 * @route GET /api/pengajuan/jenis-surat
 * @desc Get list of letter types
 * @access Private
 */
router.get('/jenis-surat', authenticateUser, getLetterTypes);

export default router;