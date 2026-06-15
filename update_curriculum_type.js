const fs = require('fs');
const file = 'd:/wizza_work/Readingmath-hq-admin/src/lib/task-center-mock.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `export interface CurriculumType {
  id: string;
  majorUnit: string;`;

if (content.includes(target)) {
  content = content.replace(
    `export interface CurriculumType {
  id: string;
  majorUnit: string;`,
    `export interface CurriculumType {
  id: string;
  majorUnit: string;
  textbook?: string;`
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully added textbook to CurriculumType interface!');
} else {
  // CRLF
  const targetCRLF = target.replace(/\n/g, '\r\n');
  if (content.includes(targetCRLF)) {
    content = content.replace(
      `export interface CurriculumType {\r\n  id: string;\r\n  majorUnit: string;`,
      `export interface CurriculumType {\r\n  id: string;\r\n  majorUnit: string;\r\n  textbook?: string;`
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully added textbook to CurriculumType interface (CRLF)!');
  } else {
    console.error('CurriculumType interface target not found.');
  }
}
