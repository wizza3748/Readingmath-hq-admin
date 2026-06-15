const fs = require('fs');

const file = 'd:/wizza_work/Readingmath-hq-admin/src/app/content/science-exam-prep/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. GRADE_TERMS 상수 제한
// 기존 GRADE_TERMS = [ ... ] 부분을 찾아서 교체
const targetGradeTerms = `const GRADE_TERMS = [
  { v: "초3-1", l: "초등 3-1" }, { v: "초3-2", l: "초등 3-2" },
  { v: "초4-1", l: "초등 4-1" }, { v: "초4-2", l: "초등 4-2" },
  { v: "초5-1", l: "초등 5-1" }, { v: "초5-2", l: "초등 5-2" },
  { v: "초6-1", l: "초등 6-1" }, { v: "초6-2", l: "초등 6-2" },
  { v: "중1-1", l: "중등 1-1" }, { v: "중1-2", l: "중등 1-2" },
  { v: "중2-1", l: "중등 2-1" }, { v: "중2-2", l: "중등 2-2" },
  { v: "중3-1", l: "중등 3-1" }, { v: "중3-2", l: "중등 3-2" },
];`;

const replacementGradeTerms = `const GRADE_TERMS = [
  { v: "중1-1", l: "중등 1-1" },
  { v: "중2-1", l: "중등 2-1" },
  { v: "중3-1", l: "중등 3-1" },
];`;

if (content.includes(targetGradeTerms)) {
  content = content.replace(targetGradeTerms, replacementGradeTerms);
  console.log('GRADE_TERMS updated.');
} else {
  const targetCRLF = targetGradeTerms.replace(/\n/g, '\r\n');
  const replacementCRLF = replacementGradeTerms.replace(/\n/g, '\r\n');
  if (content.includes(targetCRLF)) {
    content = content.replace(targetCRLF, replacementCRLF);
    console.log('GRADE_TERMS updated (CRLF).');
  } else {
    console.log('Exact GRADE_TERMS block not found. Trying regex...');
    // regex fallback
    content = content.replace(/const GRADE_TERMS = \[[\s\S]*?\];/, replacementGradeTerms);
  }
}

// 2. useState("초3-1") -> useState("중1-1")
content = content.replace('useState("초3-1")', 'useState("중1-1")');

// 3. setSelectedGradeTerm("초3-1") -> setSelectedGradeTerm("중1-1")
content = content.replace('setSelectedGradeTerm("초3-1")', 'setSelectedGradeTerm("중1-1")');

// 4. selectedGradeTerm === "초3-1" -> selectedGradeTerm === "중1-1"
content = content.replace('selectedGradeTerm === "초3-1"', 'selectedGradeTerm === "중1-1"');

fs.writeFileSync(file, content, 'utf8');
console.log('Science exam prep grade term restriction complete!');
