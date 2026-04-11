import pool from '../config/db.js';

export const createPayment = async (req, res) => {
  try {
    const { policy_id, amount, payment_date, method, note } = req.body;
    const [result] = await pool.query('INSERT INTO payments (policy_id, amount, payment_date, method, note) VALUES (?,?,?,?,?)', [policy_id, amount, payment_date, method, note]);
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const listPayments = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT p.*, DATE_FORMAT(p.payment_date, \'%d-%m-%Y\') as payment_date, pol.policy_number FROM payments p JOIN policies pol ON p.policy_id=pol.id ORDER BY payment_date DESC');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const fields = Object.keys(payload).map(k => `${k}=?`).join(',');
    const values = Object.values(payload);
    values.push(id);
    await pool.query(`UPDATE payments SET ${fields} WHERE id=?`, values);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
