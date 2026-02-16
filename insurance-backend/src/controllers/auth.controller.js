import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const refreshToken = async (req, res) => {
  // simple refresh (could be improved with refresh tokens stored in DB)
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    const payload = jwt.verify(token, JWT_SECRET);
    const newToken = jwt.sign({ id: payload.id, role: payload.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token: newToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
