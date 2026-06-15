const fs = require('fs');
const path = require('path');

const mockFilePath = path.join(__dirname, 'src/lib/task-center-mock.ts');
if (!fs.existsSync(mockFilePath)) {
  console.error('task-center-mock.ts 파일을 찾을 수 없습니다.');
  process.exit(1);
}

let content = fs.readFileSync(mockFilePath, 'utf8');

// 1. MATH_CURRICULA 파싱 및 비디오 추가
const mathStart = 'export const MATH_CURRICULA: Curriculum[] = ';
const mathEnd = 'export const SCIENCE_CURRICULA';
const mathStartIndex = content.indexOf(mathStart);
const mathEndIndex = content.indexOf(mathEnd, mathStartIndex);

if (mathStartIndex === -1 || mathEndIndex === -1) {
  console.error('MATH_CURRICULA 경계를 찾을 수 없습니다.');
  process.exit(1);
}

let mathText = content.substring(mathStartIndex + mathStart.length, mathEndIndex).trim();
if (mathText.endsWith(';')) mathText = mathText.slice(0, -1);

// 2. SCIENCE_CURRICULA 파싱 및 비디오 추가
const sciStart = 'export const SCIENCE_CURRICULA: Curriculum[] = ';
const sciEnd = 'export const SAMPLE_CLASSES';
const sciStartIndex = content.indexOf(sciStart);
const sciEndIndex = content.indexOf(sciEnd, sciStartIndex);

if (sciStartIndex === -1 || sciEndIndex === -1) {
  console.error('SCIENCE_CURRICULA 경계를 찾을 수 없습니다.');
  process.exit(1);
}

let sciText = content.substring(sciStartIndex + sciStart.length, sciEndIndex).trim();
if (sciText.endsWith(';')) sciText = sciText.slice(0, -1);

try {
  const mathCurricula = JSON.parse(mathText);
  const scienceCurricula = JSON.parse(sciText);

  let mathTotal = 0, mathVideo = 0;
  let sciTotal = 0, sciVideo = 0;

  // 수학 처리
  mathCurricula.forEach(courseObj => {
    courseObj.types.forEach(type => {
      mathTotal++;
      if (Math.random() < 0.8) {
        mathVideo++;
        type.videoUrl = "https://youtu.be/YBdu7V4-ObM?si=wRF3Ft52uu7cbvWj";
      } else {
        delete type.videoUrl; // 20%는 비디오 없음
      }
    });
  });

  // 과학 처리
  scienceCurricula.forEach(courseObj => {
    courseObj.types.forEach(type => {
      sciTotal++;
      if (Math.random() < 0.8) {
        sciVideo++;
        type.videoUrl = "https://youtu.be/s1G_j-KW_Tk?si=xk0d4ppedI3wgil5";
      } else {
        delete type.videoUrl; // 20%는 비디오 없음
      }
    });
  });

  console.log(`수학: 총 ${mathTotal}개 유형 중 ${mathVideo}개 동영상 추가 완료 (~${Math.round(mathVideo/mathTotal*100)}%)`);
  console.log(`과학: 총 ${sciTotal}개 유형 중 ${sciVideo}개 동영상 추가 완료 (~${Math.round(sciVideo/sciTotal*100)}%)`);

  // 원본 텍스트 조합
  const newMathText = mathStart + JSON.stringify(mathCurricula, null, 2) + ';\n\n';
  const newSciText = sciStart + JSON.stringify(scienceCurricula, null, 2) + ';\n\n';

  const newContent = content.substring(0, mathStartIndex) + 
                     newMathText + 
                     content.substring(mathEndIndex, sciStartIndex) + 
                     newSciText + 
                     content.substring(sciEndIndex);

  fs.writeFileSync(mockFilePath, newContent, 'utf8');
  console.log('✅ task-center-mock.ts 비디오 주입 완료!');

} catch (e) {
  console.error('오류 발생:', e);
}
