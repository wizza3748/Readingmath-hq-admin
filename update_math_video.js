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
  let videoCount = 0;

  const targetVideoUrl = "https://youtu.be/8cuQVowUw6U?si=M_-nYwgtGemwdgH3";

  mathCurricula.forEach(courseObj => {
    courseObj.types.forEach(type => {
      totalTypes++;
      const hasVideo = Math.random() < 0.8;
      if (hasVideo) {
        type.videoUrl = targetVideoUrl;
        videoCount++;
      } else {
        delete type.videoUrl;
      }
    });
  });

  console.log(`총 수학 유형 수: ${totalTypes}`);
  console.log(`동영상이 추가된 유형 수: ${videoCount} (~${Math.round(videoCount / totalTypes * 100)}%)`);

  const newMathText = startMarker + JSON.stringify(mathCurricula, null, 2) + ';\n\n';
  let newContent = content.substring(0, startIndex) + newMathText + content.substring(endIndex);

  // import 구문 보정 (getStoredClasses, getStoredStudents 누락 방지)
  const importTeacher = 'import { getStoredClasses } from "./teacher-mock";';
  const importStudent = 'import { getStoredStudents } from "./student-mock";';
  
  // 중간에 껴있을지 모르는 import 구문 제거
  newContent = newContent.replace(new RegExp(importTeacher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?\\n', 'g'), '');
  newContent = newContent.replace(new RegExp(importStudent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?\\n', 'g'), '');
  newContent = newContent.replace(new RegExp(importTeacher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  newContent = newContent.replace(new RegExp(importStudent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  
  // 파일 최상단에 import 추가
  const importsToAdd = `${importTeacher}\n${importStudent}\n`;
  newContent = importsToAdd + newContent;

  fs.writeFileSync(mockFilePath, newContent, 'utf8');
  console.log('✅ 수학 대표 유형 동영상 목데이터 업데이트 완료!');
} catch (e) {
  console.error('JSON 파싱 또는 파일 쓰기 오류:', e);
}
