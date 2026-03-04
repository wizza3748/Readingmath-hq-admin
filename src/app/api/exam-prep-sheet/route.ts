import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 항상 최신 데이터를 가져오도록 설정

export async function GET() {
    const sheetId = "1ab0Gv_xYKC_9GAslhOJIdulkhYMXm7b4";
    // gid를 지정하지 않으면 스프레드시트 내의 전체 시트를 하나의 xlsx로 다운받습니다.
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch spreadsheet: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="sheet.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error fetching google sheet:', error);
        return NextResponse.json({ error: '데이터를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
