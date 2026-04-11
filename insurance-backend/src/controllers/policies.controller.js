import pool from '../config/db.js';
import path from 'path';

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
        DATE_FORMAT(p.start_date, '%d-%m-%Y') as start_date,
        DATE_FORMAT(p.end_date, '%d-%m-%Y') as end_date,
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
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getPolicyById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT *, DATE_FORMAT(start_date, \'%d-%m-%Y\') as start_date, DATE_FORMAT(end_date, \'%d-%m-%Y\') as end_date FROM policies WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Policy not found' });
    const policy = rows[0];
    const [docs] = await pool.query('SELECT id, filename, path, uploaded_at FROM documents WHERE policy_id=?', [id]);
    policy.documents = docs;
    return res.json(policy);
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

export const uploadPolicyDocument = async (req, res) => {
  try {
    const policyId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ error: 'File not received' });
    }

    const fileData = {
      filename: req.file.filename,
      filepath: req.file.path
    };

    const [result] = await pool.query(
      'INSERT INTO documents (policy_id, filename, path) VALUES (?, ?, ?)',
      [policyId, fileData.filename, fileData.filepath]
    );

    res.json({ id: result.insertId, filename: fileData.filename, url: fileData.filepath, policy_id: parseInt(policyId) });
  } catch (err) {
    console.error('Policy upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
};
