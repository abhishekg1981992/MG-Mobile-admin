import pool from '../config/db.js';
import { addDays } from '../utils/dateUtils.js';

export const listRenewals = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT r.*, p.policy_number, p.client_id FROM renewals r JOIN policies p ON r.policy_id=p.id ORDER BY renewal_date ASC');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const createRenewal = async (req, res) => {
  try {
    const { policy_id, renewal_date, status } = req.body;
    const [result] = await pool.query('INSERT INTO renewals (policy_id, renewal_date, status) VALUES (?,?,?)', [policy_id, renewal_date, status||'pending']);
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const markRenewalComplete = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('UPDATE renewals SET status = ? WHERE id = ?', ['done', id]);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
