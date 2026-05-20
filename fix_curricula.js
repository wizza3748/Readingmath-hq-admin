const fs = require('fs');

const mathCourses = [
  { c: "초3-1", units: ["덧셈과 뺄셈", "평면도형", "나눗셈", "곱셈", "길이와 시간", "분수와 소수"] },
  { c: "초3-2", units: ["곱셈", "나눗셈", "원", "분수", "들이와 무게", "자료의 정리"] },
  { c: "초4-1", units: ["큰 수", "각도", "곱셈과 나눗셈", "평면도형의 이동", "막대그래프", "규칙 찾기"] },
  { c: "초4-2", units: ["분수의 덧셈과 뺄셈", "삼각형", "소수의 덧셈과 뺄셈", "사각형", "꺾은선그래프", "다각형"] },
  { c: "초5-1", units: ["자연수의 혼합 계산", "약수와 배수", "규칙과 대응", "약분과 통분", "분수의 덧셈과 뺄셈", "다각형의 둘레와 넓이"] },
  { c: "초5-2", units: ["수의 범위와 어림하기", "분수의 곱셈", "합동과 대칭", "소수의 곱셈", "직육면체", "평균과 가능성"] },
  { c: "초6-1", units: ["분수의 나눗셈", "각기둥과 각뿔", "소수의 나눗셈", "비와 비율", "여러 가지 그래프", "직육면체의 부피와 겉넓이"] },
  { c: "초6-2", units: ["분수의 나눗셈", "소수의 나눗셈", "공간과 입체", "비례식과 비례배분", "원의 넓이", "원기둥, 원뿔, 구"] },
  { c: "중1-1", units: ["소인수분해", "정수와 유리수", "문자와 식", "좌표평면과 그래프"] },
  { c: "중1-2", units: ["기본 도형", "평면도형", "입체도형", "통계"] },
  { c: "중2-1", units: ["유리수와 순환소수", "식의 계산", "일차부등식", "연립일차방정식", "일차함수와 그 그래프"] },
  { c: "중2-2", units: ["삼각형의 성질", "사각형의 성질", "도형의 닮음", "피타고라스 정리", "확률"] },
  { c: "중3-1", units: ["제곱근과 실수", "다항식의 곱셈과 인수분해", "이차방정식", "이차함수"] },
  { c: "중3-2", units: ["삼각비", "원의 성질", "통계"] }
];

const scienceCourses = [
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

const mathMinorTemplates = ["의 이해", "의 활용", " 기본 원리", " 심화 탐구"];
const mathTypeTemplates = ["식 세우기", "개념 적용하기", "문장제 해결하기", "오류 찾기", "조건에 맞는 답 구하기", "여러 가지 방법으로 풀기"];

const sciMinorTemplates = [" 관찰", " 탐구", " 특성", " 변화 이해"];
const sciTypeTemplates = ["현상 분석하기", "실험 결과 해석하기", "분류하기", "특징 비교하기", "일상생활 적용하기", "모형 만들기"];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateCurricula(courseList, isMath) {
  return courseList.map(courseObj => {
    const course = courseObj.c;
    const types = [];
    const units = courseObj.units;
    
    units.forEach((unitName, i) => {
      const majorUnitName = `${i + 1}단원-${unitName}`;
      const numMinor = rand(2, 4);
      
      if (isMath && course === "초3-1" && unitName === "덧셈과 뺄셈") {
         types.push({ id: `mt-${course}-${i}-1-1`, majorUnit: majorUnitName, minorUnit: "받아올림이 있는 세 자리 수의 덧셈", typeName: "받아올림 위치 찾기", difficultyCount: { basic: 10, intermediate: 5, advanced: 2 } });
         types.push({ id: `mt-${course}-${i}-1-2`, majorUnit: majorUnitName, minorUnit: "받아올림이 있는 세 자리 수의 덧셈", typeName: "세 자리 수 덧셈 계산하기", difficultyCount: { basic: 8, intermediate: 8, advanced: 4 } });
         types.push({ id: `mt-${course}-${i}-1-3`, majorUnit: majorUnitName, minorUnit: "받아올림이 있는 세 자리 수의 덧셈", typeName: "덧셈식 완성하기", difficultyCount: { basic: 2, intermediate: 8, advanced: 10 } });
         types.push({ id: `mt-${course}-${i}-2-1`, majorUnit: majorUnitName, minorUnit: "받아내림이 있는 세 자리 수의 뺄셈", typeName: "받아내림 위치 찾기", difficultyCount: { basic: 10, intermediate: 5, advanced: 2 } });
         types.push({ id: `mt-${course}-${i}-2-2`, majorUnit: majorUnitName, minorUnit: "받아내림이 있는 세 자리 수의 뺄셈", typeName: "세 자리 수 뺄셈 계산하기", difficultyCount: { basic: 8, intermediate: 8, advanced: 4 } });
      } else if (isMath && course === "초3-1" && unitName === "평면도형") {
         types.push({ id: `mt-${course}-${i}-1-1`, majorUnit: majorUnitName, minorUnit: "각과 직각", typeName: "직각 찾기", difficultyCount: { basic: 10, intermediate: 5, advanced: 2 } });
         types.push({ id: `mt-${course}-${i}-1-2`, majorUnit: majorUnitName, minorUnit: "각과 직각", typeName: "직각삼각형 구별하기", difficultyCount: { basic: 8, intermediate: 8, advanced: 4 } });
      } else if (!isMath && course === "중1-1" && unitName === "과학과 인류의 지속 가능한 삶") { 
         types.push({ id: `sc-${course}-${i}-1-1`, majorUnit: majorUnitName, minorUnit: "과학적 탐구 방법", typeName: "탐구 과정 이해하기", difficultyCount: { basic: 10, intermediate: 5, advanced: 2 } });
         types.push({ id: `sc-${course}-${i}-1-2`, majorUnit: majorUnitName, minorUnit: "과학적 탐구 방법", typeName: "변인 통제하기", difficultyCount: { basic: 8, intermediate: 8, advanced: 4 } });
         types.push({ id: `sc-${course}-${i}-2-1`, majorUnit: majorUnitName, minorUnit: "과학 기술과 지속 가능한 삶", typeName: "과학 기술의 영향 이해하기", difficultyCount: { basic: 10, intermediate: 5, advanced: 2 } });
         types.push({ id: `sc-${course}-${i}-2-2`, majorUnit: majorUnitName, minorUnit: "과학 기술과 지속 가능한 삶", typeName: "지속 가능한 생활 방안 찾기", difficultyCount: { basic: 8, intermediate: 8, advanced: 4 } });
      } else if (!isMath && course === "중1-1" && unitName === "생물의 다양성") { 
         types.push({ id: `sc-${course}-${i}-1-1`, majorUnit: majorUnitName, minorUnit: "생물의 구성 단계", typeName: "세포와 조직 구별하기", difficultyCount: { basic: 10, intermediate: 5, advanced: 2 } });
         types.push({ id: `sc-${course}-${i}-1-2`, majorUnit: majorUnitName, minorUnit: "생물의 구성 단계", typeName: "기관계 이해하기", difficultyCount: { basic: 8, intermediate: 8, advanced: 4 } });
      } else {
        for (let j = 1; j <= numMinor; j++) {
          const minorTemplates = isMath ? mathMinorTemplates : sciMinorTemplates;
          const typeTemplates = isMath ? mathTypeTemplates : sciTypeTemplates;
          
          const minorUnitName = `${unitName}${sample(minorTemplates)} (${j})`;
          const numTypes = rand(2, 5);
          
          for (let k = 1; k <= numTypes; k++) {
            const typeName = `${unitName} ${sample(typeTemplates)}`;
            types.push({
              id: `${isMath ? 'mt' : 'sc'}-${course}-${i}-${j}-${k}`,
              majorUnit: majorUnitName,
              minorUnit: minorUnitName,
              typeName: typeName,
              difficultyCount: { basic: rand(1, 15), intermediate: rand(1, 15), advanced: rand(0, 10) }
            });
          }
        }
      }
    });
    
    return { id: `${isMath ? 'math' : 'sci'}-${course}`, subject: isMath ? "math" : "science", course, types };
  });
}

const mathCurricula = generateCurricula(mathCourses, true);
const scienceCurricula = generateCurricula(scienceCourses, false);

const filePath = 'src/lib/task-center-mock.ts';
const fileContentStr = fs.readFileSync(filePath, 'utf8');

const mathStartMatch = fileContentStr.match(/export const MATH_CURRICULA: Curriculum\[\] = \[/);
const mathStartIdx = mathStartMatch ? mathStartMatch.index : null;

const sampleClassesMatch = fileContentStr.match(/export const SAMPLE_CLASSES/);
let endIdx = null;
if (sampleClassesMatch) {
  const beforeSample = fileContentStr.substring(0, sampleClassesMatch.index);
  const commentIdx = beforeSample.lastIndexOf('// ────────');
  endIdx = commentIdx !== -1 ? commentIdx : sampleClassesMatch.index;
}

if(mathStartIdx !== null && endIdx !== null) {
    const top = fileContentStr.substring(0, mathStartIdx);
    const bottom = fileContentStr.substring(endIdx);
    
    const mathStr = `export const MATH_CURRICULA: Curriculum[] = ${JSON.stringify(mathCurricula, null, 2)};\n\n`;
    const sciStr = `export const SCIENCE_CURRICULA: Curriculum[] = ${JSON.stringify(scienceCurricula, null, 2)};\n\n`;
    
    fs.writeFileSync(filePath, top + mathStr + sciStr + bottom);
    console.log('Successfully updated src/lib/task-center-mock.ts with correct major units');
} else {
    console.error('Could not find match indices', { mathStartIdx, endIdx });
}
