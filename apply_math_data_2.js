const fs = require('fs');
const courses = [
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

const curricula = courses.map((courseObj, i) => {
  const units = courseObj.units;
  const types = [];
  units.forEach((unitName, j) => {
    const majorUnit = `${j + 1}단원-${unitName}`;
    
    types.push({
      id: `mt-${courseObj.c}-${j}-1-1`,
      majorUnit,
      minorUnit: `${unitName} (1)`,
      typeName: `${unitName} 구하기`,
      difficultyCount: { basic: 10, intermediate: 5, advanced: 2 }
    });
    types.push({
      id: `mt-${courseObj.c}-${j}-1-2`,
      majorUnit,
      minorUnit: `${unitName} (1)`,
      typeName: `여러 가지 방법으로 ${unitName} 구하기`,
      difficultyCount: { basic: 8, intermediate: 8, advanced: 4 }
    });
    types.push({
      id: `mt-${courseObj.c}-${j}-2-1`,
      majorUnit,
      minorUnit: `${unitName} (2)`,
      typeName: `${unitName} 완성하기`,
      difficultyCount: { basic: 2, intermediate: 8, advanced: 10 }
    });
  });
  return {
    id: `math-${courseObj.c}`,
    subject: "math",
    course: courseObj.c,
    types
  };
});

const mockFile = 'src/lib/task-center-mock.ts';
let content = fs.readFileSync(mockFile, 'utf8');

let newDataString = 'export const MATH_CURRICULA: Curriculum[] = ' + JSON.stringify(curricula, null, 2) + ';';

const startStr = 'export const MATH_CURRICULA: Curriculum[] = [';
const endStr = 'export const SCIENCE_CURRICULA: Curriculum[] = [';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + newDataString + '\n\n' + content.substring(endIndex);
  fs.writeFileSync(mockFile, newContent, 'utf8');
  console.log("Successfully replaced MATH_CURRICULA");
} else {
  console.log("Could not find start/end markers");
}
