const fs = require('fs');
const path = require('path');

const mockFilePath = path.join(__dirname, 'src/lib/task-center-mock.ts');
if (!fs.existsSync(mockFilePath)) {
  console.error('task-center-mock.ts 파일을 찾을 수 없습니다.');
  process.exit(1);
}

let content = fs.readFileSync(mockFilePath, 'utf8');

const startMarker = 'export const MATH_CURRICULA: Curriculum[] = ';
const endMarker = 'export const SCIENCE_CURRICULA';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error('MATH_CURRICULA 경계를 찾을 수 없습니다.');
  process.exit(1);
}

let mathCurriculaText = content.substring(startIndex + startMarker.length, endIndex).trim();
if (mathCurriculaText.endsWith(';')) {
  mathCurriculaText = mathCurriculaText.slice(0, -1);
}

try {
  const mathCurricula = JSON.parse(mathCurriculaText);
  let totalTypes = 0;
  let importantTypes = 0;

  mathCurricula.forEach(courseObj => {
    courseObj.types.forEach(type => {
      totalTypes++;
      // 10% 확률로 중요 유형 유지, 90% 확률로 중요 유형 초기화
      const isImportant = Math.random() < 0.1;
      
      if (isImportant) {
        importantTypes++;
        // 기존 중요도 값을 유지함
      } else {
        type.importantCount = {
          basic: 0,
          intermediate: 0,
          advanced: 0
        };
      }
    });
  });

  console.log(`총 수학 유형 수: ${totalTypes}`);
  console.log(`선택된 중요 수학 유형 수: ${importantTypes} (~${Math.round(importantTypes / totalTypes * 100)}%)`);

  const newMathText = startMarker + JSON.stringify(mathCurricula, null, 2) + ';\n\n';
  const newContent = content.substring(0, startIndex) + newMathText + content.substring(endIndex);

  fs.writeFileSync(mockFilePath, newContent, 'utf8');
  console.log('✅ 수학 중요 유형 업데이트 완료!');
} catch (e) {
  console.error('JSON 파싱 또는 파일 쓰기 오류:', e);
}
