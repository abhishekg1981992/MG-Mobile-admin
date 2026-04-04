import pool from '../config/db.js';

export const createPolicy = async (req, res) => {
  try {
    const { client_id, provider, policy_number, policy_type, premium_amount, sum_assured, start_date, end_date, frequency, status } = req.body;
    const [result] = await pool.query(
      `INSERT INTO policies (client_id, provider, policy_number, policy_type, premium_amount, sum_assured, start_date, end_date, frequency, status)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [client_id, provider, policy_number, policy_type, premium_amount, sum_assured, start_date, end_date, frequency, status]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getPolicies = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM policies ORDER BY id DESC');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getAllPoliciesWithDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.client_id,
        p.provider,
        p.policy_number,
        p.policy_type,
        p.premium_amount,
        p.sum_assured,
        p.start_date,
        p.end_date,
        p.frequency,
        p.status,
        p.created_at,
        c.name as client_name,
        c.phone as client_phone,
        c.email as client_email,
        c.address as client_address
      FROM policies p
      LEFT JOIN clients c ON p.client_id = c.id
      ORDER BY p.id DESC
    `);
    return res.json({
      total: rows.length,
      policies: rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getPolicyById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM policies WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Policy not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const updatePolicy = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const fields = Object.keys(payload).map(k => `${k}=?`).join(',');
    const values = Object.values(payload);
    values.push(id);
    await pool.query(`UPDATE policies SET ${fields} WHERE id=?`, values);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const deletePolicy = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM policies WHERE id=?', [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
