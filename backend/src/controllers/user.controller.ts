import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken');
import { JWT_SECRET } from '../config/env';
import { pool } from '../config/db';
const bcrypt= require('bcrypt');
import { AuthRequest } from '../middlewares/auth.middleware'; // pastikan ini sudah dibuat

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'Username and password required' });
    return;
  }

  try {
    console.log("Registering user:", username);

    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    console.log("User check result:", userCheck.rows);

    if (userCheck.rows.length > 0) {
      res.status(409).json({ message: 'Username already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashedPassword);

    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    console.log("Insert result:", result);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: 'Server error bro' });
  }
};


export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'Username and password required' });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const result = await pool.query('SELECT id, username FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
