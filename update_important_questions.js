const fs = require('fs');
const path = require('path');

const mockFilePath = path.join(__dirname, 'src/lib/task-center-mock.ts');
if (!fs.existsSync(mockFilePath)) {
  console.error('task-center-mock.ts 파일을 찾을 수 없습니다.');
  process.exit(1);
}

let content = fs.readFileSync(mockFilePath, 'utf8');

// 1. MATH_CURRICULA 업데이트
const mathStartMarker = 'export const MATH_CURRICULA: Curriculum[] = ';
const mathEndMarker = 'export const SCIENCE_CURRICULA';

const mathStartIndex = content.indexOf(mathStartMarker);
const mathEndIndex = content.indexOf(mathEndMarker, mathStartIndex);

if (mathStartIndex === -1 || mathEndIndex === -1) {
  console.error('MATH_CURRICULA 경계를 찾을 수 없습니다.');
  process.exit(1);
}

let mathCurriculaText = content.substring(mathStartIndex + mathStartMarker.length, mathEndIndex).trim();
if (mathCurriculaText.endsWith(';')) {
  mathCurriculaText = mathCurriculaText.slice(0, -1);
}

function getMathSampleQuestion(typeName, majorUnit) {
  const text = typeName + " " + majorUnit;
  if (text.includes('덧셈')) {
    return '다음 식을 계산하여 값을 구하시오.\n\n$$ 124 + 352 = \\Box $$';
  }
  if (text.includes('뺄셈')) {
    return '다음 식을 계산하여 값을 구하시오.\n\n$$ 352 - 124 = \\Box $$';
  }
  if (text.includes('분수')) {
    return '계산한 값을 대분수로 나타내시오.\n\n$$ 11 - 5\\frac{3}{4} = \\Box $$';
  }
  if (text.includes('나눗셈')) {
    return '다음 나눗셈의 몫과 나머지를 구하시오.\n\n$$ 45 \\div 6 = \\Box $$';
  }
  if (text.includes('곱셈')) {
    return '다음 식의 계산 결과를 구하시오.\n\n$$ 24 \\times 15 = \\Box $$';
  }
  if (text.includes('소수')) {
    return '다음 소수의 계산 결과를 구하시오.\n\n$$ 1.25 + 0.45 = \\Box $$';
  }
  return `다음 질문에 답하시오.\n\n[문제] ${typeName}과 관련된 식을 풀고 올바른 답을 구하시오.`;
}

try {
  const mathCurricula = JSON.parse(mathCurriculaText);
  mathCurricula.forEach(courseObj => {
    courseObj.types.forEach(type => {
      type.sampleQuestion = getMathSampleQuestion(type.typeName, type.majorUnit);
    });
  });

  const newMathText = mathStartMarker + JSON.stringify(mathCurricula, null, 2) + ';\n\n';
  content = content.substring(0, mathStartIndex) + newMathText + content.substring(mathEndIndex);
  console.log('✅ 수학 중요문제 목데이터 설정 완료!');
} catch (e) {
  console.error('수학 JSON 파싱 오류:', e);
}


// 2. SCIENCE_CURRICULA 업데이트
const sciStartMarker = 'export const SCIENCE_CURRICULA: Curriculum[] = [';
const sciEndMarker = 'export const SAMPLE_CLASSES';

const sciStartIndex = content.indexOf(sciStartMarker);
const sciEndIndex = content.indexOf(sciEndMarker, sciStartIndex);

if (sciStartIndex === -1 || sciEndIndex === -1) {
  console.error('SCIENCE_CURRICULA 경계를 찾을 수 없습니다.');
  process.exit(1);
}

let sciCurriculaText = content.substring(sciStartIndex + 'export const SCIENCE_CURRICULA: Curriculum[] = '.length, sciEndIndex).trim();
if (sciCurriculaText.endsWith(';')) {
  sciCurriculaText = sciCurriculaText.slice(0, -1);
}

function getSciSampleQuestion(typeName, majorUnit) {
  const text = typeName + " " + majorUnit;
  if (text.includes('지구') || text.includes('우주') || text.includes('기권') || text.includes('날씨') || text.includes('지권')) {
    return `다음 지구과학 현상에 대한 설명 중 가장 옳지 않은 것을 고르시오.\n\n(유형: ${typeName})`;
  }
  if (text.includes('물질') || text.includes('화학') || text.includes('원소') || text.includes('원자') || text.includes('이온')) {
    return `다음 화학 반응식 또는 물질의 성질에 대한 설명으로 옳은 것을 보기에서 모두 고르시오.\n\n(유형: ${typeName})`;
  }
  if (text.includes('생물') || text.includes('세포') || text.includes('유전') || text.includes('감각') || text.includes('신경')) {
    return `다음 생명 활동 현상 또는 생물의 구성에 대한 설명으로 가장 올바른 것을 고르시오.\n\n(유형: ${typeName})`;
  }
  if (text.includes('빛') || text.includes('파동') || text.includes('힘') || text.includes('에너지') || text.includes('운동') || text.includes('열')) {
    return `다음 물리 법칙 및 실험 상황에 대한 질문을 읽고, 알맞은 답을 구하시오.\n\n(유형: ${typeName})`;
  }
  return `다음 과학적 개념 및 현상에 대한 올바른 설명을 보기에서 고르시오.\n\n(유형: ${typeName})`;
}

try {
  const sciCurricula = JSON.parse(sciCurriculaText);
  sciCurricula.forEach(courseObj => {
    courseObj.types.forEach(type => {
      type.sampleQuestion = getSciSampleQuestion(type.typeName, type.majorUnit);
    });
  });

  const newSciText = 'export const SCIENCE_CURRICULA: Curriculum[] = ' + JSON.stringify(sciCurricula, null, 2) + ';\n\n';
  content = content.substring(0, sciStartIndex) + newSciText + content.substring(sciEndIndex);
  console.log('✅ 과학 중요문제 목데이터 설정 완료!');
} catch (e) {
  console.error('과학 JSON 파싱 오류:', e);
}

// 3. CurriculumType 인터페이스에 sampleQuestion?: string; 추가
// 'videoUrl?: string;' 다음에 'sampleQuestion?: string;' 추가
const videoUrlDefine = '  videoUrl?: string;';
if (content.includes(videoUrlDefine)) {
  content = content.replace(videoUrlDefine, `${videoUrlDefine}\n  sampleQuestion?: string;`);
}

// 4. import 구문 보정 (getStoredClasses, getStoredStudents 누락 방지)
const importTeacher = 'import { getStoredClasses } from "./teacher-mock";';
const importStudent = 'import { getStoredStudents } from "./student-mock";';

// 중간에 껴있을지 모르는 import 구문 제거
content = content.replace(new RegExp(importTeacher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?\\n', 'g'), '');
content = content.replace(new RegExp(importStudent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?\\n', 'g'), '');
content = content.replace(new RegExp(importTeacher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
content = content.replace(new RegExp(importStudent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');

// 파일 최상단에 import 추가
const importsToAdd = `${importTeacher}\n${importStudent}\n`;
content = importsToAdd + content;

fs.writeFileSync(mockFilePath, content, 'utf8');
console.log('✅ task-center-mock.ts 업데이트 완료!');
