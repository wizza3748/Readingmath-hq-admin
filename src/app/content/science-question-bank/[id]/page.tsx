"use client";

import * as React from "react";
import {
    ChevronLeft,
    Save,
    Trash2,
    List,
    FileCheck2,
    Plus,
    FileText,
    Eye,
    Pencil,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// --- Mock Data ---

interface Question {
    id: string;
    number: number;
    questionId: string;
    stem: string;
    type: string;
    difficulty: "기본" | "실력" | "심화" | "최상위";
    isInspected: boolean;
}

const mockQuestions: Question[] = [
    { id: "1", number: 1, questionId: "Q-1001", stem: "다음을 읽고 물체와 물질의 관계를...", type: "객관식", difficulty: "기본", isInspected: true },
    { id: "2", number: 2, questionId: "Q-1002", stem: "우리 주변에서 볼 수 있는 나무로 된...", type: "주관식", difficulty: "실력", isInspected: false },
    { id: "3", number: 3, questionId: "Q-1003", stem: "금속으로 만든 물체의 공통적인 성질은...", type: "객관식", difficulty: "기본", isInspected: true },
];

export default function SubUnitTypeDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = React.useState("info");
    const [questions, setQuestions] = React.useState<Question[]>(mockQuestions);

    // Handle query parameters for auto-opening modal
    React.useEffect(() => {
        const tab = searchParams.get("tab");
        const questionId = searchParams.get("questionId");

        if (tab === "questions") {
            setActiveTab("questions");
        }

        if (questionId) {
            const question = questions.find(q => q.id === questionId);
            if (question) {
                setSelectedQuestion(question);
                setIsModalOpen(true);
            }
        }
    }, [searchParams, questions]);

    // Form State
    const [formData, setFormData] = React.useState({
        attribute: "화학영역",
        name: "(1) 물체를 이루는 물질의 성질과 물체의 분류",
        textbook: "기타",
        o2Page: 12,
        o2Number: "1-5",
        wanjaPage: 15,
        wanjaNumber: "2-10",
        isImportant: true,
        createdAt: "2024-02-25 14:00:00",
        difficulty: "실력" as "기본" | "실력" | "심화"
    });

    const [selectedQuestion, setSelectedQuestion] = React.useState<Question | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const handleOpenModal = (q: Question) => {
        setSelectedQuestion(q);
        setIsModalOpen(true);
    };

    const handleSaveQuestion = (updatedQuestion: Question) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === updatedQuestion.id) {
                // If difficulty changed, status becomes "검수전"
                const statusChanged = q.difficulty !== updatedQuestion.difficulty;
                return { ...updatedQuestion, isInspected: statusChanged ? false : updatedQuestion.isInspected };
            }
            return q;
        }));
        handleCloseModal();
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Clear questionId from URL when modal closes
        const params = new URLSearchParams(searchParams.toString());
        params.delete("questionId");
        const queryString = params.toString();
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    };

    const inspectedCount = questions.filter(q => q.isInspected).length;
    const totalCount = questions.length;
    const progress = (inspectedCount / totalCount) * 100;
    const needsInspection = inspectedCount < totalCount;

    const handleBulkInspection = () => {
        setQuestions(prev => prev.map(q => ({ ...q, isInspected: true })));
    };

    const difficultyVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        "기본": "secondary",
        "실력": "default",
        "심화": "destructive",
        "최상위": "outline"
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
            {/* --- 공통 상단 영역 --- */}
            <div className="flex flex-col gap-1 border-b pb-4">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                    초등 3-2 <ChevronLeft className="h-3 w-3 rotate-180" /> 1단원 - 물체와 물질 <ChevronLeft className="h-3 w-3 rotate-180" /> 물질의 성질, 물체의 분류...
                </div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">
                    {formData.name}
                </h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="info" className="px-8">기본 정보</TabsTrigger>
                    <TabsTrigger value="questions" className="px-8">유형 문제</TabsTrigger>
                </TabsList>

                {/* --- [탭] 기본 정보 --- */}
                <TabsContent value="info" className="mt-6">
                    <Card>
                        <CardContent className="pt-6 flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">속성</Label>
                                    <Select value={formData.attribute} onValueChange={(val) => setFormData(prev => ({ ...prev, attribute: val }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="속성을 선택해주세요" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="속성없음">속성없음</SelectItem>
                                            <SelectItem value="물리영역">물리영역</SelectItem>
                                            <SelectItem value="생명과학영역">생명과학영역</SelectItem>
                                            <SelectItem value="지구과학영역">지구과학영역</SelectItem>
                                            <SelectItem value="화학영역">화학영역</SelectItem>
                                            <SelectItem value="탐구활동영역">탐구활동영역</SelectItem>
                                            <SelectItem value="통합과학영역">통합과학영역</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">이름</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="이름을 입력해주세요"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">난이도</Label>
                                    <div className="flex items-center gap-4 bg-muted/30 px-4 py-2 rounded-lg border h-10">
                                        <RadioGroup
                                            value={formData.difficulty}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, difficulty: val as any }))}
                                            className="flex gap-4"
                                        >
                                            {["기본", "실력", "심화"].map((level) => (
                                                <div key={level} className="flex items-center gap-1.5">
                                                    <RadioGroupItem value={level} id={`subunit-diff-${level}`} />
                                                    <Label htmlFor={`subunit-diff-${level}`} className="text-sm cursor-pointer">{level}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">교과서</Label>
                                    <Select value={formData.textbook} onValueChange={(val) => setFormData(prev => ({ ...prev, textbook: val }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="교과서를 선택해주세요" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="오투">오투</SelectItem>
                                            <SelectItem value="완자">완자</SelectItem>
                                            <SelectItem value="오투+완자">오투+완자</SelectItem>
                                            <SelectItem value="기타">기타(기본값)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 교과서 하단 정보 필드 */}
                                {(formData.textbook === "오투" || formData.textbook === "오투+완자") && (
                                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100 mb-2">
                                        <div className="space-y-2">
                                            <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">오투 쪽수</Label>
                                            <Input type="number" value={formData.o2Page} onChange={(e) => setFormData(prev => ({ ...prev, o2Page: parseInt(e.target.value) }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">오투 문제번호</Label>
                                            <Input value={formData.o2Number} onChange={(e) => setFormData(prev => ({ ...prev, o2Number: e.target.value }))} />
                                        </div>
                                    </div>
                                )}

                                {(formData.textbook === "완자" || formData.textbook === "오투+완자") && (
                                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-green-50/50 rounded-lg border border-green-100 mb-2">
                                        <div className="space-y-2">
                                            <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">완자 쪽수</Label>
                                            <Input type="number" value={formData.wanjaPage} onChange={(e) => setFormData(prev => ({ ...prev, wanjaPage: parseInt(e.target.value) }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">완자 문제번호</Label>
                                            <Input value={formData.wanjaNumber} onChange={(e) => setFormData(prev => ({ ...prev, wanjaNumber: e.target.value }))} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center space-x-2 pt-6">
                                    <Switch
                                        id="important"
                                        checked={formData.isImportant}
                                        onCheckedChange={(val) => setFormData(prev => ({ ...prev, isImportant: val }))}
                                    />
                                    <Label htmlFor="important" className="cursor-pointer">중요 유형</Label>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">등록일시</Label>
                                    <div className="text-sm border p-2 rounded-md bg-muted/30">{formData.createdAt}</div>
                                </div>
                            </div>


                        </CardContent>
                    </Card>

                    <div className="flex justify-between items-center mt-6">
                        <Button variant="outline" className="flex gap-2" onClick={() => router.push("/content/science-question-bank")}>
                            <List className="h-4 w-4" /> 목록
                        </Button>
                        <div className="flex gap-2 items-center">
                            {questions.length > 0 && <span className="text-xs text-muted-foreground mr-2">* 문항이 있는 유형은 삭제할 수 없습니다.</span>}
                            <Button className="flex gap-2 bg-indigo-600 hover:bg-indigo-700">
                                <Save className="h-4 w-4" /> 저장
                            </Button>
                            <Button variant="destructive" className="flex gap-2" disabled={questions.length > 0}>
                                <Trash2 className="h-4 w-4" /> 삭제
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* --- [탭] 유형 문제 --- */}
                <TabsContent value="questions" className="mt-6 flex flex-col gap-6">
                    <Card className="bg-muted/30">
                        <CardContent className="pt-6 flex flex-col gap-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1 flex-1 max-w-md">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-semibold">검수 진행률</span>
                                        <span className="text-slate-600 font-bold">{inspectedCount} / {totalCount} ({Math.round(progress)}%)</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                                <div className="flex gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="default" className="bg-teal-600 hover:bg-teal-700 flex gap-2">
                                                <FileCheck2 className="h-4 w-4" /> 일괄 검수
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>일괄 검수</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-6 text-center">
                                                {needsInspection ? (
                                                    <div className="space-y-2">
                                                        <p className="text-lg">검수전 문제 <span className="text-slate-600 font-bold">{totalCount - inspectedCount}</span>건을 일괄 검수완료 처리합니다.</p>
                                                        <p className="text-muted-foreground text-sm">진행하시겠습니까?</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-lg">검수완료 처리할 문제가 없습니다.</p>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                {needsInspection ? (
                                                    <>
                                                        <DialogTrigger asChild><Button variant="outline">취소</Button></DialogTrigger>
                                                        <Button onClick={handleBulkInspection} className="bg-teal-600 hover:bg-teal-700">검수완료</Button>
                                                    </>
                                                ) : (
                                                    <DialogTrigger asChild><Button className="bg-teal-600 hover:bg-teal-700">확인</Button></DialogTrigger>
                                                )}
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white flex gap-2">
                                        <Plus className="h-4 w-4" /> 문제등록
                                    </Button>
                                </div>
                            </div>
                            {needsInspection && (
                                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">
                                    <AlertCircle className="h-4 w-4" />
                                    검수가 완료되지 않은 문제는 학생에게 출제되지 않습니다.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[80px] font-bold">번호</TableHead>
                                    <TableHead className="w-[120px] font-bold">문제 ID</TableHead>
                                    <TableHead className="font-bold">발문</TableHead>
                                    <TableHead className="w-[120px] font-bold">문제타입</TableHead>
                                    <TableHead className="w-[120px] font-bold">검수여부</TableHead>
                                    <TableHead className="w-[80px] font-bold text-center">수정</TableHead>
                                    <TableHead className="w-[80px] font-bold text-center">삭제</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {questions.map((q) => (
                                    <TableRow key={q.id}>
                                        <TableCell className="font-medium">{q.number}</TableCell>
                                        <TableCell className="font-mono text-xs">{q.questionId}</TableCell>
                                        <TableCell className="truncate max-w-[400px]">{q.stem}</TableCell>
                                        <TableCell><Badge variant="outline">{q.type}</Badge></TableCell>
                                        <TableCell>
                                            {q.isInspected ? (
                                                <Badge className="bg-green-100 text-green-700 border-green-200">검수완료</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200">검수전</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 mr-1" onClick={() => handleOpenModal(q)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-300">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <Button variant="outline" className="flex gap-2" onClick={() => router.push("/content/science-question-bank")}>
                            <List className="h-4 w-4" /> 목록
                        </Button>
                        <Button variant="outline" className="flex gap-2">
                            <Eye className="h-4 w-4" /> 미리보기
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- 문제 상세 모달 (전체 화면) --- */}
            {
                selectedQuestion && (
                    <QuestionDetailModal
                        open={isModalOpen}
                        onOpenChange={(open) => {
                            if (!open) handleCloseModal();
                            else setIsModalOpen(true);
                        }}
                        question={selectedQuestion}
                        onSave={handleSaveQuestion}
                    />
                )
            }
        </div >
    );
}

// --- Question Detail Modal Component ---
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function QuestionDetailModal({ open, onOpenChange, question, onSave }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    question: Question;
    onSave: (q: Question) => void;
}) {
    const [difficulty, setDifficulty] = React.useState<Question["difficulty"]>(question.difficulty);
    const [activeTab, setActiveTab] = React.useState("info");

    const handleSave = () => {
        onSave({ ...question, difficulty });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-full w-full h-[100vh] flex flex-col p-0 gap-0 overflow-hidden border-none rounded-none">
                {/* Header Section */}
                <div className="border-b bg-white p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold">문제 상세</DialogTitle>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col pt-2 px-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <TabsList className="justify-start bg-transparent border-b rounded-none h-auto p-0 gap-8">
                            <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1 text-base">문제 정보</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1 text-base">변경 로그</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto pt-6 pb-10">
                            <TabsContent value="info" className="m-0 flex flex-col gap-8">
                                <div className="space-y-3">
                                    <Label className="text-lg font-bold">발문</Label>
                                    <div className="p-4 border rounded-md bg-white min-h-[300px]">
                                        <p className="text-muted-foreground mb-4">다음을 읽고 물체와 물질의 관계를 물질의 성질과 연결하여 설명하시오.</p>
                                        <div className="w-full flex justify-center py-8">
                                            <div className="relative w-80 h-60 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed">
                                                <span className="text-muted-foreground text-sm">[문제 이미지 영역]</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-lg font-bold">보기</Label>
                                    <div className="p-4 border rounded-md bg-white min-h-[100px] flex items-center">
                                        <span className="text-muted-foreground">Type something...</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-lg font-bold">답안</Label>
                                    <div className="p-6 border rounded-md bg-slate-50 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="bg-white border px-3 py-1.5 rounded-md text-sm">선지형</div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" className="text-blue-600 bg-white">①② 생성</Button>
                                                <Button size="sm" variant="outline" className="text-blue-600 bg-white">㉠㉡ 생성</Button>
                                                <Button size="sm" variant="outline" className="text-blue-600 bg-white">OX 생성</Button>
                                                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">선지 추가</Button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4">
                                                <span className="text-red-500 font-bold">정답</span>
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked readOnly /> 1</label>
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" readOnly /> 2</label>
                                                </div>
                                            </div>
                                            <div className="p-4 border rounded-md bg-white">선지 1: 미는 모습</div>
                                            <div className="p-4 border rounded-md bg-white">선지 2: 당기는 모습</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-lg font-bold">해설</Label>
                                    <div className="p-4 border rounded-md bg-white min-h-[100px]">
                                        유모차와 휠체어를 앞으로 보내려면 밀어야 합니다.
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="history" className="m-0 pt-4">
                                <div className="rounded-md border bg-white">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>작업자</TableHead>
                                                <TableHead>변경 시간</TableHead>
                                                <TableHead>변경 내용</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>관리자1</TableCell>
                                                <TableCell>2024-02-25 15:00:00</TableCell>
                                                <TableCell>난이도 변경: 기본 → 실력</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>시스템</TableCell>
                                                <TableCell>2024-02-24 10:00:00</TableCell>
                                                <TableCell>문제 최초 등록</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Footer Section */}
                <div className="p-4 border-t bg-slate-50 flex items-center justify-end gap-6">
                    <div className="flex items-center gap-2">
                        <Label className="text-sm font-semibold">검수 여부</Label>
                        <Switch checked={question.isInspected} disabled />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="bg-orange-400 hover:bg-orange-500 text-white border-none px-6">미리보기</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 px-8" onClick={handleSave}>문제 저장</Button>
                        <Button variant="secondary" className="px-8 bg-slate-400 hover:bg-slate-500 text-white" onClick={() => onOpenChange(false)}>닫기</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

