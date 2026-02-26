"use client";

import * as React from "react";
import {
    ChevronRight,
    ChevronDown,
    Search,
    Pencil,
    Trash2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Mock Data ---

interface QuestionStatus {
    id: number;
    status: "검수전" | "검수완료";
}

interface QuestionBankItem {
    id: number;
    attribute: string;
    learningProcess: string;
    mainUnit: string;
    subUnit: string;
    subUnitType: string;
    difficulty: "기본" | "실력" | "심화";
    questions: QuestionStatus[];
}

const initialData: QuestionBankItem[] = [
    {
        id: 499,
        attribute: "물리영역",
        learningProcess: "초등 3-1",
        mainUnit: "1단원 힘과 우리 생활",
        subUnit: "힘의 크기 비교와 도구를 이용해 무게 비교하기",
        subUnitType: "(1) 물체를 밀거나 당기기, 수평 잡기",
        difficulty: "기본",
        questions: [
            { id: 1, status: "검수완료" },
            { id: 2, status: "검수완료" },
            { id: 3, status: "검수완료" },
        ],
    },
    {
        id: 514,
        attribute: "물리영역",
        learningProcess: "초등 3-1",
        mainUnit: "1단원 힘과 우리 생활",
        subUnit: "힘의 크기 비교와 도구를 이용해 무게 비교하기",
        subUnitType: "(2) 물체의 무게 측정과 도구의 이용",
        difficulty: "실력",
        questions: [
            { id: 1, status: "검수완료" },
            { id: 2, status: "검수완료" },
            { id: 3, status: "검수완료" },
        ],
    },
    {
        id: 551,
        attribute: "생명과학영역",
        learningProcess: "초등 3-1",
        mainUnit: "2단원 동물의 생활",
        subUnit: "동물의 생김새와 생활 방식",
        subUnitType: "(1) 우리 주변의 동물",
        difficulty: "심화",
        questions: [
            { id: 1, status: "검수완료" },
            { id: 2, status: "검수전" },
            { id: 3, status: "검수완료" },
        ],
    },
    {
        id: 552,
        attribute: "생명과학영역",
        learningProcess: "초등 3-1",
        mainUnit: "2단원 동물의 생활",
        subUnit: "동물의 생김새와 생활 방식",
        subUnitType: "(2) 동물의 사는 곳에 따른 특징",
        difficulty: "기본",
        questions: [
            { id: 1, status: "검수완료" },
            { id: 2, status: "검수완료" },
            { id: 3, status: "검수완료" },
        ],
    },
    {
        id: 739,
        attribute: "화학영역",
        learningProcess: "초등 3-2",
        mainUnit: "1단원 - 물체와 물질",
        subUnit: "물질의 성질, 물체의 분류, 여러 가지 물질의 상태, 물질의 성질을 이용한 물체",
        subUnitType: "(1) 물체를 이루는 물질의 성질과 물체의 분류",
        difficulty: "실력",
        questions: [
            { id: 1, status: "검수완료" },
            { id: 2, status: "검수완료" },
            { id: 3, status: "검수완료" },
        ],
    },
];

// 트리 구조 데이터
const curriculumTree = [
    {
        id: "term1",
        title: "초등 3-1",
        children: [
            {
                id: "main1",
                title: "1단원-힘과 우리 생활",
                children: [
                    {
                        id: "sub1",
                        title: "힘의 크기 비교와 도구를 이용해 무게 비교하기",
                        children: [
                            { id: "type1", title: "(1) 물체를 밀거나 당기기, 수평 잡기", isType: true },
                            { id: "type2", title: "(2) 물체의 무게 측정과 도구의 이용", isType: true },
                        ],
                    },
                ],
            },
            {
                id: "main2",
                title: "2단원-동물의 생활",
                children: [
                    {
                        id: "sub2",
                        title: "동물의 생김새와 생활 방식",
                        children: [
                            { id: "type3", title: "(1) 우리 주변의 동물", isType: true },
                            { id: "type4", title: "(2) 동물의 사는 곳에 따른 특징", isType: true },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "term2",
        title: "초등 3-2",
        children: [
            {
                id: "main3",
                title: "1단원-물체와 물질",
                children: [
                    {
                        id: "sub3",
                        title: "물질의 성질, 물체의 분류, 여러 가지 물질의 상태, 물질의 성질을 이용한 물체",
                        children: [
                            { id: "type5", title: "(1) 물체를 이루는 물질의 성질과 물체의 분류", isType: true },
                        ],
                    },
                ],
            },
        ]
    }
];

// --- Components ---

function CurriculumTreeNode({ node, level = 0, onSelect, selectedId }: { node: any, level?: number, onSelect: (id: string, isType: boolean) => void, selectedId: string | null }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={`flex items-center py-1 px-2 cursor-pointer hover:bg-muted rounded-sm gap-1 ${selectedId === node.id ? 'bg-muted font-semibold' : ''}`}
                onClick={() => {
                    if (hasChildren) setIsOpen(!isOpen);
                    onSelect(node.id, !!node.isType);
                }}
            >
                <span className="w-4 flex items-center justify-center">
                    {hasChildren ? (isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />) : null}
                </span>
                <span className="text-sm">{node.title}</span>
                {node.isType && <Badge variant="secondary" className="ml-auto text-[10px] scale-90">유형</Badge>}
                {level === 0 && <span className="text-muted-foreground text-xs ml-2 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); console.log("Apply", node.id); }}>적용</span>}
                {level === 1 && <span className="text-muted-foreground text-xs ml-2 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); console.log("Apply", node.id); }}>적용</span>}
                {node.isType && (
                    <div className="flex gap-2 ml-auto">
                        <span className="text-muted-foreground text-xs cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); console.log("Apply", node.id); }}>적용</span>
                        <Link href={`/content/science-question-bank/${node.id}`} className="text-muted-foreground text-xs cursor-pointer hover:underline" onClick={(e) => e.stopPropagation()}>바로가기</Link>
                    </div>
                )}
            </div>
            {hasChildren && isOpen && (
                <div className="ml-4 border-l pl-2 mt-1 flex flex-col gap-1">
                    {node.children.map((child: any) => (
                        <CurriculumTreeNode key={child.id} node={child} level={level + 1} onSelect={onSelect} selectedId={selectedId} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ScienceQuestionBankPage() {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedCurriculumId, setSelectedCurriculumId] = React.useState<string | null>(null);

    const filteredData = React.useMemo(() => {
        return initialData.filter(item => {
            const matchesSearch =
                item.learningProcess.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.mainUnit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.subUnit.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [searchTerm]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold font-headline tracking-tight">문제은행(과학)</h1>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                    Home &gt; 콘텐츠관리 &gt; <span className="text-foreground font-medium">문제은행(과학)</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                            커리큘럼 검색
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>커리큘럼 목록</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 flex-1 overflow-hidden flex flex-col gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="검색어를 입력해주세요" className="pl-8" />
                            </div>
                            <ScrollArea className="flex-1 border rounded-md p-4">
                                <div className="flex flex-col gap-1">
                                    {curriculumTree.map(node => (
                                        <CurriculumTreeNode
                                            key={node.id}
                                            node={node}
                                            onSelect={(id) => setSelectedCurriculumId(id)}
                                            selectedId={selectedCurriculumId}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <DialogFooter className="flex justify-between items-center w-full">
                            <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700">적용</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-white overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[100px] font-bold">고유번호</TableHead>
                            <TableHead className="w-[150px] font-bold">속성</TableHead>
                            <TableHead className="w-[120px] font-bold">학습과정</TableHead>
                            <TableHead className="w-[200px] font-bold">단원</TableHead>
                            <TableHead className="w-[250px] font-bold">중단원</TableHead>
                            <TableHead className="w-[300px] font-bold">중단원유형</TableHead>
                            <TableHead className="w-[100px] font-bold">난이도</TableHead>
                            <TableHead className="w-[200px] font-bold">검수 상태</TableHead>
                            <TableHead className="w-[80px] font-bold text-center">편집</TableHead>
                            <TableHead className="w-[80px] font-bold text-center">삭제</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-mono text-muted-foreground">{item.id}</TableCell>
                                <TableCell>{item.attribute}</TableCell>
                                <TableCell>{item.learningProcess}</TableCell>
                                <TableCell className="truncate max-w-[200px]">{item.mainUnit}</TableCell>
                                <TableCell className="truncate max-w-[250px]">{item.subUnit}</TableCell>
                                <TableCell className="text-muted-foreground hover:underline cursor-pointer">
                                    <Link href={`/content/science-question-bank/${item.id}`}>
                                        {item.subUnitType}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={item.difficulty === "기본" ? "secondary" : item.difficulty === "실력" ? "default" : "destructive"}>
                                        {item.difficulty}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {item.questions.map((q) => (
                                            <Link key={q.id} href={`/content/science-question-bank/${item.id}?tab=questions&questionId=${q.id}`}>
                                                <Badge
                                                    variant="secondary"
                                                    className={`px-2 py-0 h-6 text-[11px] font-normal cursor-pointer transition-colors ${q.status === "검수완료"
                                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    [{q.id}]
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Link href={`/content/science-question-bank/${item.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                    검색 결과가 없습니다.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
                * 검수완료만 출제 포함 | 검수전은 출제 제외
            </div>
        </div>
    );
}
