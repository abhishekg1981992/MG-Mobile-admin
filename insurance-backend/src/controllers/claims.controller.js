import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';

export const createClaim = async (req, res) => {
  try {
    const { policy_id, claim_type, claim_date, description, amount } = req.body;
    const [result] = await pool.query('INSERT INTO claims (policy_id, claim_type, claim_date, description, amount, status) VALUES (?,?,?,?,?,?)', [policy_id, claim_type, claim_date, description, amount, 'submitted']);
    const claimId = result.insertId;
    // handle files
    if (req.files && req.files.length>0) {
      const insertDocs = [];
      for (const f of req.files) {
        const newPath = path.join('uploads/claims', f.filename + '_' + f.originalname);
        fs.renameSync(f.path, newPath);
        insertDocs.push([claimId, newPath, f.originalname]);
      }
      await pool.query('INSERT INTO documents (claim_id, path, filename) VALUES ?', [insertDocs]);
    }
    return res.status(201).json({ id: claimId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const listClaims = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT c.*, p.policy_number FROM claims c JOIN policies p ON c.policy_id=p.id ORDER BY c.id DESC');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getClaimById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM claims WHERE id=?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Claim not found' });
    const claim = rows[0];
    const [docs] = await pool.query('SELECT * FROM documents WHERE claim_id=?', [id]);
    claim.documents = docs;
    return res.json(claim);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const updateClaim = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const fields = Object.keys(payload).map(k => `${k}=?`).join(',');
    const values = Object.values(payload);
    values.push(id);
    if (fields) await pool.query(`UPDATE claims SET ${fields} WHERE id=?`, values);
    // files
    if (req.files && req.files.length>0) {
      const insertDocs = [];
      for (const f of req.files) {
        const newPath = path.join('uploads/claims', f.filename + '_' + f.originalname);
        fs.renameSync(f.path, newPath);
        insertDocs.push([id, newPath, f.originalname]);
      }
      await pool.query('INSERT INTO documents (claim_id, path, filename) VALUES ?', [insertDocs]);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
