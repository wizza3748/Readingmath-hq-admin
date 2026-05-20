const fs = require('fs');

const file = 'src/lib/task-center-mock.ts';
let content = fs.readFileSync(file, 'utf8');

// Update task-001
content = content.replace(
  /id: "task-001"[\s\S]*?assignedStudents: \[([\s\S]*?)\]/,
  (match) => {
    if (match.includes('assignedClasses:')) return match;
    return match + ',\n    assignedClasses: ["1반"],\n    individualStudentIds: ["s3"]';
  }
);

// Update task-003
content = content.replace(
  /id: "task-003"[\s\S]*?assignedStudents: \[([\s\S]*?)\]/,
  (match) => {
    if (match.includes('assignedClasses:')) return match;
    return match + ',\n    assignedClasses: ["1반", "2반"],\n    individualStudentIds: []';
  }
);

// Update task-101
content = content.replace(
  /id: "task-101"[\s\S]*?assignedStudents: \[([\s\S]*?)\]/,
  (match) => {
    if (match.includes('assignedClasses:')) return match;
    return match + ',\n    assignedClasses: [],\n    individualStudentIds: ["s5"]';
  }
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated INITIAL_TASKS with assignedClasses and individualStudentIds.');
