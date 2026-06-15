const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task';
try {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
  console.log('XLSX Files:', files);
  
  files.forEach(xlsxFile => {
    const filePath = path.join(dir, xlsxFile);
    console.log(`\n========================================`);
    console.log(`Reading file: ${xlsxFile}`);
    console.log(`========================================`);
    
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('--- Top 10 Rows ---');
    data.slice(0, 10).forEach((row, i) => {
      console.log(`Row ${i + 1}:`, row);
    });
  });
} catch (e) {
  console.error('Error reading xlsx:', e);
}
