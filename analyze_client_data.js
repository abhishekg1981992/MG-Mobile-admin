import XLSX from 'xlsx';

try {
  const wb = XLSX.readFile('client_data.xlsx');
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws);

  console.log('=== CLIENT DATA ANALYSIS ===\n');
  console.log('Sheet Name:', sheetName);
  console.log('Total Rows:', data.length);
  console.log('\nColumns Found:');
  if (data.length > 0) {
    Object.keys(data[0]).forEach((col, i) => {
      console.log(`  ${i + 1}. ${col}`);
    });
  }

  console.log('\n=== FIRST 5 ROWS ===\n');
  data.slice(0, 5).forEach((row, idx) => {
    console.log(`Row ${idx + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log();
  });

  console.log('\n=== DATA SAMPLE SUMMARY ===\n');
  if (data.length > 0) {
    console.log('First Row Sample:');
    const firstRow = data[0];
    console.log(JSON.stringify(firstRow, null, 2));
  }

} catch (error) {
  console.error('Error reading file:', error.message);
  process.exit(1);
}
