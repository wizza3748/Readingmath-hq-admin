const fs = require('fs');

const mockFile = 'd:/wizza_work/Readingmath-hq-admin/src/lib/task-center-mock.ts';
let content = fs.readFileSync(mockFile, 'utf8');

const importTeacher = 'import { getStoredClasses } from "./teacher-mock";';
const importStudent = 'import { getStoredStudents } from "./student-mock";';

// 1. 중간에 삽입된 import 구문 제거 (CRLF/LF 모두 처리)
content = content.replace(importTeacher + '\r\n', '');
content = content.replace(importStudent + '\r\n', '');
content = content.replace(importTeacher + '\n', '');
content = content.replace(importStudent + '\n', '');

// 혹시 아직 남아있으면 한번 더
content = content.replace(importTeacher, '');
content = content.replace(importStudent, '');

// 2. 파일 최상단(첫 번째 줄 앞)에 import 삽입
const importsToAdd = `import { getStoredClasses } from "./teacher-mock";\nimport { getStoredStudents } from "./student-mock";\n`;
content = importsToAdd + content;

fs.writeFileSync(mockFile, content, 'utf8');
console.log('✅ import 구문을 파일 최상단으로 이동 완료!');

// 확인
const lines = content.split('\n').slice(0, 5);
console.log('상단 5줄:\n', lines.join('\n'));
