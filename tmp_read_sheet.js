const XLSX = require('xlsx');

async function test() {
    const url = "https://docs.google.com/spreadsheets/d/1ab0Gv_xYKC_9GAslhOJIdulkhYMXm7b4/export?format=xlsx&gid=1673281242";
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    for (const sheetName of workbook.SheetNames) {
        console.log("Sheet:", sheetName);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(JSON.stringify(data.slice(0, 10), null, 2));
        break;
    }
}

test();
