export interface User {
  id: number;
  email: string;
  password: string;
  peran: UserRole;
  aktif: boolean;
}

export type UserRole = 'mahasiswa' | 'dosen' | 'admin';

export interface Student {
  id: number;
  pengguna_id: number;
  nim: string;
  nama: string;
  program_id: number;
  semester: number;
  tahun_masuk: number;
  status: StudentStatus;
}

export type StudentStatus = 'aktif' | 'nonaktif' | 'lulus' | 'keluar';

export interface Program {
  id: number;
  kode: string;
  nama: string;
  fakultas: string;
  jenjang: 'D3' | 'S1' | 'S2' | 'S3';
}

export interface Lecturer {
  id: number;
  pengguna_id: number | null;
  nidn: string;
  nama: string;
  bidang_keahlian: string | null;
}

export interface Course {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  program_id: number;
  dosen_id: number | null;
}

export interface KRS {
  id: number;
  mahasiswa_id: number;
  mata_kuliah_id: number;
  tahun_akademik: string;
  semester: 'ganjil' | 'genap';
  nilai: string | null;
}

export interface LetterRequest {
  id: number;
  mahasiswa_id: number;
  jenis_surat: string;
  keperluan: string;
  status: LetterStatus;
  disetujui_oleh: number | null;
}

export type LetterStatus = 'menunggu' | 'disetujui' | 'ditolak' | 'selesai';