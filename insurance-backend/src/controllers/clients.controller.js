import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';

export const createClient = async (req, res) => {
  try {
    const { name, phone, email, address, city, state, pincode, dob, nominee, notes } = req.body;
    const [result] = await pool.query(
      'INSERT INTO clients (name, phone, email, address, city, state, pincode, dob, nominee, notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [name, phone, email, address, city, state, pincode, dob || null, nominee, notes]
    );
    const id = result.insertId;
    return res.status(201).json({ id, name, phone, email, address, city, state, pincode, dob, nominee, notes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getClients = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT *, DATE_FORMAT(dob, \'%d-%m-%Y\') as dob FROM clients ORDER BY id DESC');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getClientById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT *, DATE_FORMAT(dob, \'%d-%m-%Y\') as dob FROM clients WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    const client = rows[0];
    const [policies] = await pool.query('SELECT *, DATE_FORMAT(start_date, \'%d-%m-%Y\') as start_date, DATE_FORMAT(end_date, \'%d-%m-%Y\') as end_date FROM policies WHERE client_id = ?', [id]);
    // Attach documents to each policy
    for (const policy of policies) {
      const [policyDocs] = await pool.query('SELECT id, filename, original_name, path, uploaded_at FROM documents WHERE policy_id=?', [policy.id]);
      policy.documents = policyDocs;
    }
    client.policies = policies;
    const [docs] = await pool.query('SELECT id, filename, original_name, path, uploaded_at FROM documents WHERE client_id=?', [id]);
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
    const { name, phone, email, address, city, state, pincode, dob, nominee, notes } = req.body;
    await pool.query(
      'UPDATE clients SET name=?, phone=?, email=?, address=?, city=?, state=?, pincode=?, dob=?, nominee=?, notes=? WHERE id=?',
      [name, phone, email, address, city, state, pincode, dob || null, nominee, notes, id]
    );
    return res.json({ id, name, phone, email, address, city, state, pincode, dob, nominee, notes });
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

    const relativePath = `uploads/clients/${req.file.filename}`;
    const fileData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      filepath: relativePath
    };

    console.log("Inserting into DB:", fileData);

    const [result] = await pool.query(
      "INSERT INTO documents (client_id, filename, original_name, path) VALUES (?, ?, ?, ?)",
      [clientId, fileData.filename, fileData.originalname, fileData.filepath]
    );

    console.log("DB INSERT RESULT:", result);

    res.json({ success: true, file: fileData });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

export const deleteClientDocument = async (req, res) => {
  try {
    const docId = req.params.docId;

    // Try to delete file from disk if record exists
    const [rows] = await pool.query('SELECT * FROM documents WHERE id = ?', [docId]);
    if (rows.length > 0) {
      const fs = await import('fs');
      const filePath = rows[0].path;
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Always delete from DB (even if file missing on disk)
    await pool.query('DELETE FROM documents WHERE id = ?', [docId]);
    return res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Delete document error:', err);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
};

export const importPoliciesFromExcel = async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please provide an Excel file with policy data'
      });
    }

    // Validate file type
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedMimes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Please upload an Excel file (.xlsx or .xls)'
      });
    }

    // Read and parse Excel file
    const XLSX = await import('xlsx');
    const workbook = XLSX.default.readFile(req.file.path);

    // Results tracking
    const results = {
      total_rows: 0,
      sheets_processed: 0,
      clients_created: 0,
      clients_updated: 0,
      clients_skipped: 0,
      policies_created: 0,
      policies_updated: 0,
      policies_skipped: 0,
      errors: 0,
      details: []
    };

    // Process all sheets
    for (const sheetName of workbook.SheetNames) {
      // Skip summary sheets
      if (['Total', 'Transfer', 'Sheet1'].includes(sheetName.trim())) {
        continue;
      }

      const worksheet = workbook.Sheets[sheetName];
      // Read as array of arrays (header: 1) to handle merged cells
      const rows = XLSX.default.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (!rows || rows.length === 0) {
        continue;
      }

      results.sheets_processed++;

      // Find the header row that contains "Assured Name" or "Mobile"
      let headerRowIndex = -1;
      let headerRow = null;
      
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const row = rows[i];
        const rowStr = JSON.stringify(row).toLowerCase();
        if (rowStr.includes('assured') || rowStr.includes('mobile') || rowStr.includes('policy')) {
          headerRowIndex = i;
          headerRow = row;
          break;
        }
      }

      if (headerRowIndex === -1) {
        console.log(`Sheet ${sheetName}: Could not find header row`);
        continue;
      }

      // Find column indices for required fields
      let nameColIndex = -1;
      let phoneColIndex = -1;
      let policyColIndex = -1;
      let dueDateColIndex = -1;
      let premiumColIndex = -1;
      let sumInsuredColIndex = -1;

      for (let i = 0; i < headerRow.length; i++) {
        const header = (headerRow[i] || '').toString().toLowerCase().trim();
        if (header.includes('assured') || header.includes('name')) {
          nameColIndex = i;
        } else if (header.includes('mobile') || header.includes('phone')) {
          phoneColIndex = i;
        } else if (header.includes('policy')) {
          policyColIndex = i;
        } else if (header.includes('due') || header.includes('date')) {
          dueDateColIndex = i;
        } else if (header.includes('premium')) {
          premiumColIndex = i;
        } else if (header.includes('sum') || header.includes('insured') || header.includes('s.i')) {
          sumInsuredColIndex = i;
        }
      }

      console.log(`Sheet ${sheetName}: Header row ${headerRowIndex}, Name col: ${nameColIndex}, Phone col: ${phoneColIndex}`);

      // Process data rows (starting after header row)
      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        try {
          const row = rows[i];

          // Extract fields by column index
          const name = (row[nameColIndex] || '').toString().trim();
          const phone = (row[phoneColIndex] || '').toString().trim();
          const policyNumber = (row[policyColIndex] || '').toString().trim(); // Store as-is, no processing
          const dueDate = (row[dueDateColIndex] || '').toString().trim();
          const premium = parseFloat(row[premiumColIndex]) || 0;
          const sumInsured = parseFloat(row[sumInsuredColIndex]) || 0;

          // Validate required fields - ONLY name OR phone required (at least one)
          if (!name && !phone) {
            results.clients_skipped++;
            results.details.push({
              sheet: sheetName,
              row: i + 2,
              status: 'skipped',
              error: 'Missing required fields (Assured Name or Mobile)'
            });
            continue;
          }

          // If phone is present, validate and clean it
          let cleanPhone = '';
          if (phone) {
            cleanPhone = phone.replace(/[^\d+]/g, '');
            if (!cleanPhone) {
              results.clients_skipped++;
              results.details.push({
                sheet: sheetName,
                row: i + 2,
                name: name || 'N/A',
                status: 'skipped',
                error: 'Invalid phone number format'
              });
              continue;
            }
          }

          // Step 1: Create or get client
          // If phone exists, use phone as unique key; otherwise use name
          let clientId;
          let clientLookupBy = cleanPhone ? cleanPhone : name;
          let clientLookupField = cleanPhone ? 'phone' : 'name';

          const [existingClients] = await pool.query(
            `SELECT id FROM clients WHERE ${clientLookupField} = ?`,
            [clientLookupBy]
          );

          if (existingClients.length > 0) {
            clientId = existingClients[0].id;
            results.clients_updated++;
            results.details.push({
              sheet: sheetName,
              row: i + 2,
              name,
              phone: cleanPhone || 'N/A',
              status: 'client_existing',
              client_id: clientId
            });
          } else {
            // Create new client
            const [clientResult] = await pool.query(
              'INSERT INTO clients (name, phone, email, address, city, state, pincode, dob, nominee, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [name || 'N/A', cleanPhone || '', null, '', '', '', '', null, '', '']
            );
            clientId = clientResult.insertId;
            results.clients_created++;
            results.details.push({
              sheet: sheetName,
              row: i + 2,
              name,
              phone: cleanPhone,
              status: 'client_created',
              client_id: clientId
            });
          }

          // Step 2: Create policy if policy number exists
          if (policyNumber) {
            // Create new policy (no duplicate check - policy_number is not unique)
            const [policyResult] = await pool.query(
              `INSERT INTO policies (
                client_id, 
                policy_number, 
                provider, 
                premium_amount, 
                sum_assured, 
                start_date, 
                end_date, 
                status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                clientId,
                policyNumber,
                sheetName.trim(),
                premium,
                sumInsured,
                new Date(),
                dueDate ? new Date(dueDate) : null,
                'active'
              ]
            );

            results.policies_created++;
            results.details.push({
              sheet: sheetName,
              row: i + 2,
              policy_number: policyNumber,
              insurance_company: sheetName,
              status: 'policy_created',
              policy_id: policyResult.insertId
            });
          }

        } catch (err) {
          results.errors++;
          results.details.push({
            sheet: sheetName,
            row: i + 2,
            status: 'error',
            error: err.message
          });
        }
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      success: true,
      message: `Import completed: ${results.clients_created} clients created, ${results.clients_updated} clients updated, ${results.policies_created} policies created`,
      results
    });

  } catch (err) {
    console.error('Excel import error:', err);

    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      error: 'Import failed',
      message: err.message
    });
  }
};

/**
 * Export all clients and policies as Excel file
 * GET /api/clients/export
 */
export const exportClientsAndPolicies = async (req, res) => {
  try {
    // Fetch all clients with their policies
    const [clients] = await pool.query(
      'SELECT id, name, phone, email, address, city, state, pincode, dob, nominee, notes, created_at FROM clients ORDER BY created_at DESC'
    );

    if (clients.length === 0) {
      return res.status(400).json({
        error: 'No clients found',
        message: 'Cannot export empty client list'
      });
    }

    // Fetch all policies
    const [policies] = await pool.query(
      'SELECT id, client_id, policy_number, policy_type, premium, sum_assured, start_date, end_date, status FROM policies'
    );

    // Create workbook with two sheets
    const XLSX = await import('xlsx');
    const workbook = XLSX.default.utils.book_new();

    // Sheet 1: Clients
    const clientsData = clients.map(client => ({
      'ID': client.id,
      'Name': client.name,
      'Phone': client.phone,
      'Email': client.email || '',
      'Address': client.address || '',
      'City': client.city || '',
      'State': client.state || '',
      'Pincode': client.pincode || '',
      'DOB': client.dob ? new Date(client.dob).toLocaleDateString('en-IN') : '',
      'Nominee': client.nominee || '',
      'Notes': client.notes || '',
      'Created Date': new Date(client.created_at).toLocaleDateString('en-IN')
    }));

    const clientsSheet = XLSX.default.utils.json_to_sheet(clientsData);
    clientsSheet['!cols'] = [
      { wch: 8 },   // ID
      { wch: 25 },  // Name
      { wch: 15 },  // Phone
      { wch: 25 },  // Email
      { wch: 30 },  // Address
      { wch: 15 },  // City
      { wch: 15 },  // State
      { wch: 12 },  // Pincode
      { wch: 12 },  // DOB
      { wch: 20 },  // Nominee
      { wch: 30 },  // Notes
      { wch: 15 }   // Created Date
    ];

    // Sheet 2: Policies
    const policiesData = policies.map(policy => {
      const client = clients.find(c => c.id === policy.client_id);
      return {
        'Client Name': client ? client.name : 'Unknown',
        'Phone': client ? client.phone : '',
        'Policy Number': policy.policy_number,
        'Insurance Company': policy.policy_type,
        'Premium': policy.premium,
        'Sum Insured': policy.sum_assured,
        'Start Date': policy.start_date ? new Date(policy.start_date).toLocaleDateString('en-IN') : '',
        'End Date': policy.end_date ? new Date(policy.end_date).toLocaleDateString('en-IN') : '',
        'Status': policy.status
      };
    });

    const policiesSheet = XLSX.default.utils.json_to_sheet(policiesData);
    policiesSheet['!cols'] = [
      { wch: 25 }, // Client Name
      { wch: 15 }, // Phone
      { wch: 15 }, // Policy Number
      { wch: 20 }, // Insurance Company
      { wch: 12 }, // Premium
      { wch: 12 }, // Sum Insured
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 10 }  // Status
    ];

    // Add worksheets to workbook
    XLSX.default.utils.book_append_sheet(workbook, clientsSheet, 'Clients');
    XLSX.default.utils.book_append_sheet(workbook, policiesSheet, 'Policies');

    // Generate file
    const fileName = `export_${new Date().getTime()}.xlsx`;
    const filePath = path.join(process.cwd(), 'uploads', 'exports', fileName);

    // Ensure exports directory exists
    const exportsDir = path.join(process.cwd(), 'uploads', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Write file
    XLSX.default.writeFile(workbook, filePath);

    // Send file for download
    return res.download(filePath, `clients_policies_${new Date().toISOString().split('T')[0]}.xlsx`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);
    });

  } catch (err) {
    console.error('Excel export error:', err);
    return res.status(500).json({
      error: 'Export failed',
      message: err.message
    });
  }
};

