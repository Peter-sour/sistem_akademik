// middlewares/validator.js

// Validasi register pengguna (email, password, peran)
export const validateRegister = (req, res, next) => {
  const { email, password, peran } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email dan password wajib diisi',
    });
  }

  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email tidak valid',
    });
  }

  const validRoles = ['mahasiswa', 'dosen', 'admin'];
  if (peran && !validRoles.includes(peran)) {
    return res.status(400).json({
      success: false,
      message: `Peran harus salah satu dari: ${validRoles.join(', ')}`,
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password minimal 6 karakter',
    });
  }

  next();
};

// Validasi login (email, password)
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email dan password wajib diisi',
    });
  }

  next();
};

// Validasi field hanya huruf dan spasi
export const validateLetter = (value) => {
  const lettersRegex = /^[A-Za-z\s]+$/;
  return lettersRegex.test(value);
};

// Validasi status surat
export const validateLetterStatus = (value, validStatuses) => {
  return validStatuses.includes(value);
};

// Validasi data mahasiswa (pengguna_id, nim, nama, program_id, tahun_masuk, semester, status)
export const validateMahasiswa = (req, res, next) => {
  const { pengguna_id, nim, nama, program_id, tahun_masuk, semester, status } = req.body;

  if (!pengguna_id || !nim || !nama || !program_id || !tahun_masuk) {
    return res.status(400).json({
      success: false,
      message: 'Field pengguna_id, nim, nama, program_id, dan tahun_masuk wajib diisi',
    });
  }

  if (!validateLetter(nama)) {
    return res.status(400).json({
      success: false,
      message: 'Nama mahasiswa hanya boleh berisi huruf dan spasi',
    });
  }

  if (semester && (typeof semester !== 'number' || semester < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Semester harus berupa angka positif',
    });
  }

  const validStatuses = ['aktif', 'nonaktif', 'lulus', 'keluar'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status harus salah satu dari: ${validStatuses.join(', ')}`,
    });
  }

  next();
};

// Validasi data dosen (pengguna_id, nidn, nama, bidang_keahlian)
export const validateDosen = (req, res, next) => {
  const { pengguna_id, nidn, nama, bidang_keahlian } = req.body;

  if (!pengguna_id || !nidn || !nama) {
    return res.status(400).json({
      success: false,
      message: 'Field pengguna_id, nidn, dan nama wajib diisi',
    });
  }

  if (!validateLetter(nama)) {
    return res.status(400).json({
      success: false,
      message: 'Nama dosen hanya boleh berisi huruf dan spasi',
    });
  }

  if (bidang_keahlian && !validateLetter(bidang_keahlian)) {
    return res.status(400).json({
      success: false,
      message: 'Bidang keahlian hanya boleh berisi huruf dan spasi',
    });
  }

  next();
};

// Validasi permintaan surat (mahasiswa_id, jenis_surat, keperluan)
export const validatePermintaanSurat = (req, res, next) => {
  const { mahasiswa_id, jenis_surat, keperluan, status } = req.body;

  if (!mahasiswa_id || !jenis_surat || !keperluan) {
    return res.status(400).json({
      success: false,
      message: 'Field mahasiswa_id, jenis_surat, dan keperluan wajib diisi',
    });
  }

  if (status) {
    const validStatuses = ['menunggu', 'disetujui', 'ditolak', 'selesai'];
    if (!validateLetterStatus(status, validStatuses)) {
      return res.status(400).json({
        success: false,
        message: `Status harus salah satu dari: ${validStatuses.join(', ')}`,
      });
    }
  }

  next();
};

// Validasi KRS (mahasiswa_id, mata_kuliah_id, tahun_akademik, semester)
export const validateKrs = (req, res, next) => {
  const { mahasiswa_id, mata_kuliah_id, tahun_akademik, semester } = req.body;

  if (!mahasiswa_id || !mata_kuliah_id || !tahun_akademik || !semester) {
    return res.status(400).json({
      success: false,
      message: 'Field mahasiswa_id, mata_kuliah_id, tahun_akademik, dan semester wajib diisi',
    });
  }

  const validSemester = ['ganjil', 'genap'];
  if (!validSemester.includes(semester)) {
    return res.status(400).json({
      success: false,
      message: `Semester harus salah satu dari: ${validSemester.join(', ')}`,
    });
  }

  next();
};

// Validasi data profil mahasiswa untuk update/edit
export const validateProfile = (req, res, next) => {
  const { email, nama, nim, program_id, semester, tahun_masuk, status } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email wajib diisi',
    });
  }
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email tidak valid',
    });
  }

  if (!nama) {
    return res.status(400).json({
      success: false,
      message: 'Nama wajib diisi',
    });
  }

  if (!nim || nim.length < 5) {
    return res.status(400).json({
      success: false,
      message: 'NIM wajib diisi dan minimal 5 karakter',
    });
  }

  if (!program_id || typeof program_id !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Program Studi wajib diisi dan harus berupa angka',
    });
  }

  if (semester && (typeof semester !== 'number' || semester < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Semester harus berupa angka positif',
    });
  }

  if (!tahun_masuk || typeof tahun_masuk !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Tahun masuk wajib diisi dan harus berupa angka',
    });
  }

  const validStatuses = ['aktif', 'nonaktif', 'lulus', 'keluar'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status harus salah satu dari: ${validStatuses.join(', ')}`,
    });
  }

  next();
};
