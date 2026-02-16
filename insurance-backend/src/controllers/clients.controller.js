import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';

export const createClient = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const [result] = await pool.query('INSERT INTO clients (name, phone, email, address) VALUES (?,?,?,?)', [name, phone, email, address]);
    const id = result.insertId;
    return res.status(201).json({ id, name, phone, email, address });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getClients = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clients ORDER BY id DESC');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getClientById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    const client = rows[0];
    const [policies] = await pool.query('SELECT * FROM policies WHERE client_id = ?', [id]);
    client.policies = policies;
    const [docs] = await pool.query('SELECT id, filename, path, uploaded_at FROM documents WHERE client_id=?', [id]);
    client.documents = docs;
    return res.json(client);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, phone, email, address } = req.body;
    await pool.query('UPDATE clients SET name=?, phone=?, email=?, address=? WHERE id=?', [name, phone, email, address, id]);
    return res.json({ id, name, phone, email, address });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM clients WHERE id=?', [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const uploadClientDocument = async (req, res) => {
  try {
    const clientId = req.params.id;

    console.log("UPLOAD DEBUG -------------------");
    console.log("clientId:", clientId);
    console.log("req.file:", req.file);

    if (!req.file) {
      console.log("No file received");
      return res.status(400).json({ error: "File not received" });
    }

    const fileData = {
      filename: req.file.filename,
      filepath: req.file.path
    };

    console.log("Inserting into DB:", fileData);

    const [result] = await pool.query(
      "INSERT INTO documents (client_id, filename, path) VALUES (?, ?, ?)",
      [clientId, fileData.filename, fileData.filepath]
    );

    console.log("DB INSERT RESULT:", result);

    res.json({ success: true, file: fileData });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

