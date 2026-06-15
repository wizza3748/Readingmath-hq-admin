const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task/중1-1 문제은행 과학 단원별 유형명.xlsx';
const wb = XLSX.readFile(filePath, { cellStyles: true });
const ws = wb.Sheets['1-1-1단원'];

const keys = Object.keys(ws).filter(k => !k.startsWith('!'));

// 빨간색 글씨 세포 찾기
console.log('=== 셀 스타일 분석 ===');
const styled = keys.filter(k => {
  const c = ws[k];
  return c && c.s && JSON.stringify(c.s) !== '{"patternType":"none"}';
});

if (styled.length === 0) {
  console.log('스타일 있는 셀이 없습니다 - cellStyles 옵션으로도 색상 정보를 읽을 수 없음');
} else {
  styled.slice(0, 30).forEach(k => {
    const c = ws[k];
    console.log(k, c.v, JSON.stringify(c.s));
  });
}

// wb.SSF 확인
console.log('\n=== workbook 정보 ===');
console.log('Props:', JSON.stringify(wb.Props));

// 전체 셀 중 값이 있는 A열 모두 출력
console.log('\n=== A열 값 (전체) ===');
keys.filter(k => k.startsWith('A')).forEach(k => {
  const c = ws[k];
  if (c && c.v) console.log(k, ':', c.v, '| style:', JSON.stringify(c.s));
});
