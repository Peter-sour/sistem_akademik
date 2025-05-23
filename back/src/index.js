import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

import pool from './config/db.js';

import authRoutes from './routes/auth.routes.js';
import mahasiswaRoutes from './routes/profile.routes.js';
import krsRoutes from './routes/krs.routes.js';
import pengajuanRoutes from './routes/surat.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;



app.use(cors({
  origin: 'http://localhost:5173',      // Ganti dengan URL frontend kamu
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));


app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'OK',
      message: 'Database connected successfully',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/krs', krsRoutes);
app.use('/api/pengajuan', pengajuanRoutes);


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Academic API' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Attempting to connect to database...');

  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.error('Failed to connect to database:', err);
    } else {
      console.log('Database connected successfully at:', result.rows[0].now);
    }
  });
});

export default app;
