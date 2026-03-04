import fs from 'fs';
import path from 'path';

function analyze() {
    const content = fs.readFileSync('src/app/content/exam-prep/page.tsx', 'utf-8');
    console.log('length', content.length);
}

analyze();
