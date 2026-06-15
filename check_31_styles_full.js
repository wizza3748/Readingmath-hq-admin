const AdmZip = require('adm-zip');
const filePath = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task/중3-1 문제은행 과학 단원별 유형명.xlsx';
const zip = new AdmZip(filePath);
const stylesEntry = zip.getEntry('xl/styles.xml');
if (!stylesEntry) {
  console.log('No xl/styles.xml');
} else {
  const stylesXml = stylesEntry.getData().toString('utf8');
  console.log('stylesXml length:', stylesXml.length);
  console.log(stylesXml.substring(0, 1000));
}
