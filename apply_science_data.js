const fs = require('fs');

const courses = [
  { c: "초3-1", units: ["과학 탐구", "물질의 성질", "동물의 한살이", "자석의 이용", "지구의 모습"] },
  { c: "초3-2", units: ["동물의 생활", "지표의 변화", "물질의 상태", "소리의 성질"] },
  { c: "초4-1", units: ["지층과 화석", "식물의 한살이", "물체의 무게", "혼합물의 분리"] },
  { c: "초4-2", units: ["식물의 생활", "물의 상태 변화", "거울과 그림자", "화산과 지진"] },
  { c: "초5-1", units: ["온도와 열", "태양계와 별", "용해와 용액", "다양한 생물과 우리 생활"] },
  { c: "초5-2", units: ["날씨와 우리 생활", "산과 염기", "물체의 빠르기", "우리 몸의 구조와 기능"] },
  { c: "초6-1", units: ["지구와 달의 운동", "여러 가지 기체", "식물의 구조와 기능", "빛과 렌즈"] },
  { c: "초6-2", units: ["전기의 이용", "계절의 변화", "연소와 소화", "우리 몸의 구조와 기능"] },
  { c: "중1-1", units: ["지권의 변화", "여러 가지 힘", "생물의 다양성", "기체의 성질"] },
  { c: "중1-2", units: ["물질의 상태 변화", "빛과 파동", "과학과 나의 미래"] },
  { c: "중2-1", units: ["물질의 구성", "전기와 자기", "태양계", "식물과 에너지"] },
  { c: "중2-2", units: ["동물과 에너지", "물질의 특성", "수권과 해수의 순환", "열과 우리 생활"] },
  { c: "중3-1", units: ["화학 반응의 규칙", "기권과 날씨", "운동과 에너지", "자극과 반응"] },
  { c: "중3-2", units: ["생식과 유전", "에너지 전환과 보존", "별과 우주", "과학기술과 인류문명"] }
];

const curricula = courses.map((courseObj, i) => {
  const units = courseObj.units;
  const types = [];
  units.forEach((unitName, j) => {
    const majorUnit = `${j + 1}단원-${unitName}`;
    
    types.push({
      id: `sc-${courseObj.c}-${j}-1-1`,
      majorUnit,
      minorUnit: `${unitName} (1)`,
      typeName: `${unitName} 개념 탐구`,
      difficultyCount: { basic: 10, intermediate: 5, advanced: 2 }
    });
    types.push({
      id: `sc-${courseObj.c}-${j}-1-2`,
      majorUnit,
      minorUnit: `${unitName} (1)`,
      typeName: `다양한 형태의 ${unitName} 이해`,
      difficultyCount: { basic: 8, intermediate: 8, advanced: 4 }
    });
    types.push({
      id: `sc-${courseObj.c}-${j}-2-1`,
      majorUnit,
      minorUnit: `${unitName} (2)`,
      typeName: `${unitName} 현상 분석`,
      difficultyCount: { basic: 2, intermediate: 8, advanced: 10 }
    });
  });
  return {
    id: `sci-${courseObj.c}`,
    subject: "science",
    course: courseObj.c,
    types
  };
});

const mockFile = 'src/lib/task-center-mock.ts';
let content = fs.readFileSync(mockFile, 'utf8');

let newDataString = 'export const SCIENCE_CURRICULA: Curriculum[] = ' + JSON.stringify(curricula, null, 2) + ';';

// We want to replace everything from "export const SCIENCE_CURRICULA" up to "// ─────────────────────────────────────────────\n// 샘플 학생 데이터"
const startStr = 'export const SCIENCE_CURRICULA: Curriculum[] = [';
const endStr = '// 샘플 학생 데이터';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  // Wait, there's a divider line before "샘플 학생 데이터". We should find the exact place to slice.
  // The end indicator is just the divider.
  const marker = '// ─────────────────────────────────────────────\n// 샘플 학생 데이터';
  const realEndIndex = content.indexOf(marker);
  
  if (realEndIndex !== -1) {
    content = content.substring(0, startIndex) + newDataString + '\n\n' + content.substring(realEndIndex);
  }
}

// Now replace task-101 and task-102
const t101 = `    selectedTypes: [
      {
        curriculumId: "sci-중1-1", course: "중1-1",
        typeId: "sc-중1-1-0-1-1", majorUnit: "1단원-지권의 변화", minorUnit: "지권의 변화 (1)",
        typeName: "지권의 변화 개념 탐구",
        problemCount: 7, maxCount: { basic: 10, intermediate: 5, advanced: 2 },
      },
    ]`;

const t102 = `    selectedTypes: [
      {
        curriculumId: "sci-중1-1", course: "중1-1",
        typeId: "sc-중1-1-0-1-1", majorUnit: "1단원-지권의 변화", minorUnit: "지권의 변화 (1)",
        typeName: "지권의 변화 개념 탐구",
        problemCount: 5, maxCount: { basic: 10, intermediate: 5, advanced: 2 },
      },
      {
        curriculumId: "sci-중1-1", course: "중1-1",
        typeId: "sc-중1-1-0-1-2", majorUnit: "1단원-지권의 변화", minorUnit: "지권의 변화 (1)",
        typeName: "다양한 형태의 지권의 변화 이해",
        problemCount: 5, maxCount: { basic: 8, intermediate: 8, advanced: 4 },
      },
    ]`;

content = content.replace(/id: "task-101"[\s\S]*?selectedTypes: \[\s*[\s\S]*?\s*\]/, match => match.replace(/selectedTypes: \[\s*[\s\S]*?\s*\]/, t101));
content = content.replace(/id: "task-102"[\s\S]*?selectedTypes: \[\s*[\s\S]*?\s*\]/, match => match.replace(/selectedTypes: \[\s*[\s\S]*?\s*\]/, t102));

// Update the task names to match the new types
content = content.replace(/id: "task-101"[\s\S]*?name: "[^"]*"/, match => match.replace(/name: "[^"]*"/, 'name: "1단원-지권의 변화 > 지권의 변화 개념 탐구"'));
content = content.replace(/id: "task-102"[\s\S]*?name: "[^"]*"/, match => match.replace(/name: "[^"]*"/, 'name: "1단원-지권의 변화 > 지권의 변화 개념 탐구 외 1건"'));

fs.writeFileSync(mockFile, content, 'utf8');
console.log("Successfully replaced SCIENCE_CURRICULA and tasks");
