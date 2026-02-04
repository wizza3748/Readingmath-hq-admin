
const students = [
    { id: "1", name: "김민준", status: "active" },
    { id: "2", name: "이서연", status: "active" },
    { id: "3", name: "박지후", status: "active" },
    { id: "4", name: "최지우", status: "active" },
    { id: "5", name: "윤준서", status: "active" },
    { id: "6", name: "이지아", status: "active" },
    { id: "7", name: "백다혜", status: "active" },
    { id: "8", name: "임채원", status: "active" },
    { id: "9", name: "조도현", status: "stopped" },
    { id: "10", name: "고서영", status: "active" }
];

const mathUnits = [
    { title: "(1) 각의 크기", path: "초등 4-1 > 2단원-각도 > 2단원", tag: "개념-R1", type: "개념" },
    { title: "(1) 각의 크기", path: "초등 4-1 > 2단원-각도 > 2단원", tag: "유형-R1", type: "유형" },
    { title: "(2) 각 그리기", path: "초등 4-1 > 2단원-각도 > 2단원", tag: "개념-R1", type: "개념" },
    { title: "(2) 각 그리기", path: "초등 4-1 > 2단원-각도 > 2단원", tag: "유형-R1", type: "유형" },
    { title: "(3) 직각보다 큰 각/작은 각", path: "초등 4-1 > 2단원-각도 > 2단원", tag: "개념-R1", type: "개념" },
    { title: "(3) 직각보다 큰 각/작은 각", path: "초등 4-1 > 2단원-각도 > 2단원", tag: "유형-R2", type: "유형" },
    { title: "(1) 만, 다섯 자리 수", path: "초등 4-1 > 1단원-큰 수 > 1단원", tag: "개념-R1", type: "개념" },
    { title: "(2) 십만, 백만, 천만, 억, 조", path: "초등 4-1 > 1단원-큰 수 > 1단원", tag: "개념-R1", type: "개념" },
    { title: "(2) 공약수와 최대공약수", path: "초등 5-1 > 2단원-약수와 배수 > 최대공약수", tag: "유형-R1", type: "유형" },
    { title: "(3) 공배수와 최소공배수", path: "초등 5-1 > 2단원-약수와 배수 > 최소공배수", tag: "개념-R1", type: "개념" }
];

const scienceUnits = [
    { title: "비행의 원리", path: "중등 2 > 물리 > 힘과 운동", tag: "개념-R1", type: "개념" },
    { title: "중력과 가속도", path: "중등 2 > 물리 > 힘과 운동", tag: "유형-R1", type: "유형" },
    { title: "광합성 작용", path: "중등 2 > 생물 > 식물의 구조", tag: "심화-R2", type: "심화" },
    { title: "세포의 구조", path: "중등 2 > 생물 > 생명 과학", tag: "개념-R1", type: "개념" },
    { title: "지각 변동", path: "중등 3 > 지구과학 > 지질학", tag: "유형-R1", type: "유형" },
    { title: "태양계의 행성", path: "중등 3 > 지구과학 > 천문학", tag: "개념-R1", type: "개념" }
];

const startMonth = [2025, 3]; // March 2025
const endMonth = [2026, 2]; // Feb 2026

const monthlyScores = { math: {}, science: {} };
const dailyDetails = { math: {}, science: {} };

function getBaseScore(studentIdx, subject) {
    if (subject === "math") return [85, 92, 75, 60, 88, 70, 95, 82, 45, 78][studentIdx];
    return [90, 80, 85, 55, 92, 65, 88, 75, 52, 85][studentIdx];
}

for (let mOffset = 0; mOffset < 12; mOffset++) {
    let year = 2025;
    let month = 3 + mOffset;
    if (month > 12) {
        year = 2026;
        month -= 12;
    }
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const daysInMonth = new Date(year, month, 0).getDate();

    ["math", "science"].forEach(sub => {
        if (!monthlyScores[sub][monthKey]) monthlyScores[sub][monthKey] = {};

        students.forEach((s, sIdx) => {
            monthlyScores[sub][monthKey][s.id] = {};
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(year, month - 1, d);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const dKey = String(d).padStart(2, "0");
                const dateKey = `${monthKey}-${dKey}`;

                // Decision: 2-4 days per month overall 0 students on weekends
                const isSystemOff = isWeekend && ((mOffset + d) % 15 === 0);

                if (isSystemOff || s.status === "stopped") {
                    monthlyScores[sub][monthKey][s.id][dKey] = null;
                } else {
                    const skips = (sIdx + d + mOffset) % 5 === 0;
                    if (skips || (isWeekend && sIdx % 2 === 0)) {
                        monthlyScores[sub][monthKey][s.id][dKey] = null;
                    } else {
                        const base = getBaseScore(sIdx, sub);
                        const varScore = Math.sin(d * 0.7 + mOffset) * 8;
                        const score = Math.min(100, Math.max(0, Math.round(base + varScore)));
                        monthlyScores[sub][monthKey][s.id][dKey] = score;

                        // Detail
                        if (!dailyDetails[sub]) dailyDetails[sub] = {};
                        if (!dailyDetails[sub][dateKey]) dailyDetails[sub][dateKey] = { students: [] };

                        const time = 15 + (sIdx * 3) + (d % 10);
                        const tCount = 2 + (d % 3);
                        const tIdxs = [];
                        const units = sub === "math" ? mathUnits : scienceUnits;
                        for (let i = 0; i < tCount; i++) {
                            tIdxs.push((sIdx + d + i) % units.length);
                        }

                        dailyDetails[sub][dateKey].students.push({
                            id: s.id,
                            s: score,
                            c: Math.round(score * 0.25),
                            t: 25,
                            m: time,
                            n: tCount,
                            ti: tIdxs
                        });
                    }
                }
            }
        });

        // Add summaries
        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = `${monthKey}-${String(d).padStart(2, "0")}`;
            const dayData = dailyDetails[sub][dateKey];
            if (dayData && dayData.students.length > 0) {
                const ds = dayData.students;
                const count = ds.length;
                const sumScore = ds.reduce((acc, x) => acc + x.s, 0);
                const sumTime = ds.reduce((acc, x) => acc + x.m, 0);
                const sumCorr = ds.reduce((acc, x) => acc + x.c, 0);
                const sumTotal = ds.reduce((acc, x) => acc + x.t, 0);
                const sumTrainings = ds.reduce((acc, x) => acc + x.n, 0);

                dayData.summary = {
                    as: Math.round(sumScore / count),
                    p: count,
                    ts: students.filter(st => st.status === "active").length,
                    at: Math.round(sumTime / count),
                    tt: sumTime,
                    ac: Math.round(sumCorr / count),
                    atq: Math.round(sumTotal / count),
                    tc: sumCorr,
                    ttq: sumTotal,
                    art: (sumTrainings / count).toFixed(1),
                    tr: sumTrainings
                };
            }
        }
    });
}

console.log(JSON.stringify({
    students,
    mathUnits,
    scienceUnits,
    monthlyScores,
    dailyDetails
}));
