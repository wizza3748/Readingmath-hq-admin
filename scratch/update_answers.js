const fs = require('fs');
const path = require('path');

const mockFilePath = 'D:/wizza_work/Readingmath-hq-admin/src/lib/task-print-sample-mock.ts';

// ESM 형식의 import/export를 다루기 어려우므로,
// 텍스트 파일 자체를 읽어서 정적 파싱 후 answer 값을 3번째 선지로 교체하는 정교한 텍스트 파서를 구현합니다.
let content = fs.readFileSync(mockFilePath, 'utf-8');

// 개별 문항을 블록 단위로 나누어 분석합니다.
// 문항은 { id: "...", ... } 형식의 객체 리터럴로 기재되어 있습니다.
// choices 배열을 찾고, 그 choices 배열 내부의 3번째 문자열 요소를 찾아내어 answer 필드의 값을 그것으로 치환합니다.
// 문항 객체는 '{'로 시작해서 '}'로 끝납니다.

// 정규표현식으로 문항 객체들을 매칭합니다.
// id, choices, answer 필드가 포함된 개별 객체 리터럴을 찾습니다.
const objectRegex = /\{[\s\S]*?id:\s*"([a-zA-Z0-9_-]+)"[\s\S]*?\}/g;

let match;
const replacements = [];

while ((match = objectRegex.exec(content)) !== null) {
  const fullMatch = match[0];
  const startIndex = match.index;
  const endIndex = startIndex + fullMatch.length;
  
  // choices 추출
  const choicesMatch = fullMatch.match(/choices:\s*\[([\s\S]*?)\]/);
  if (choicesMatch) {
    const choicesStr = choicesMatch[1].trim();
    if (choicesStr) {
      // choices의 요소들을 파싱 (따옴표로 묶인 문자열들)
      // 줄바꿈이나 공백, 쉼표 기준 분리
      const items = [];
      const itemRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(choicesStr)) !== null) {
        items.push(itemMatch[1]);
      }
      
      if (items.length >= 3) {
        const thirdChoice = items[2]; // 3번째 선지 (0-indexed 2)
        console.log(`Question ID: ${match[1]} | 3rd Choice: "${thirdChoice}"`);
        
        // 해당 fullMatch 내부에서 answer: "..." 부분을 찾아 answer: "3번째선지" 로 변경
        // 이 때 이스케이프 처리 등을 주의해야 합니다.
        // 예: answer: "원래답" -> answer: "3번째선지"
        const answerRegex = /(answer:\s*)"([^"\\]*(?:\\.[^"\\]*)*)"/;
        const newFullMatch = fullMatch.replace(answerRegex, `$1"${thirdChoice.replace(/"/g, '\\"')}"`);
        
        replacements.push({
          start: startIndex,
          end: endIndex,
          original: fullMatch,
          updated: newFullMatch
        });
      }
    }
  }
}

// 파일 내용 업데이트 (역순으로 교체하여 인덱스 밀림 방지)
let updatedContent = content;
for (let i = replacements.length - 1; i >= 0; i--) {
  const rep = replacements[i];
  updatedContent = updatedContent.substring(0, rep.start) + rep.updated + updatedContent.substring(rep.end);
}

fs.writeFileSync(mockFilePath, updatedContent, 'utf-8');
console.log('\n>>> Successfully updated all choice answers to 3rd option! <<<');
