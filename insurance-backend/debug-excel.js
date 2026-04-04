import XLSX from 'xlsx';
import fs from 'fs';

try {
  const wb = XLSX.readFile('../client_data.xlsx');
  const sheetName = 'Star';
  const ws = wb.Sheets[sheetName];
  
  // Read raw data without treating first row as header
  const data = XLSX.utils.sheet_to_json(ws, {defval: '', header: 1});
  
  console.log('First 10 rows of raw data:');
  data.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
  });
} catch (err) {
  console.error('Error:', err.message);
}
