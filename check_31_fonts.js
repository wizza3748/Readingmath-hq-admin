const AdmZip = require('adm-zip');
const path = require('path');

const filePath = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task/중3-1 문제은행 과학 단원별 유형명.xlsx';
const zip = new AdmZip(filePath);
const stylesEntry = zip.getEntry('xl/styles.xml');
const stylesXml = stylesEntry.getData().toString('utf8');

const fontsMatch = stylesXml.match(/<fonts[^>]*>([\s\S]*?)<\/fonts>/);
console.log('Fonts XML:', fontsMatch ? fontsMatch[0] : 'None');
