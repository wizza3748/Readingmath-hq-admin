const { getStoredStudents } = require('D:/wizza_work/Readingmath-hq-admin/src/lib/student-mock.ts');

// Node.js에서 typescript 파일을 직접 require하기 어렵거나 컴파일러가 필요할 수 있으므로,
// student-mock.ts 파일 내부에 하드코딩된 MOCK_STUDENTS를 직접 읽어와 분석하겠습니다.
const fs = require('fs');
const content = fs.readFileSync('D:/wizza_work/Readingmath-hq-admin/src/lib/student-mock.ts', 'utf8');

// 간단히 JSON.parse 등으로 MOCK_STUDENTS를 추출하거나 직접 파일 상의 리스트를 찾아 출력해봅니다.
console.log('--- Checking student-mock.ts storage data ---');
// localStorage에서 저장되는 원본 형태를 브라우저 환경과 가깝게 흉내내거나 mock 데이터를 직접 읽습니다.
// student-mock.ts 내용을 조회해 봅시다.
