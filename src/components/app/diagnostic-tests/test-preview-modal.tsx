
'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type DiagnosticTest, type Question } from '@/lib/db';
import QuestionPreview from './question-preview';
import { Skeleton } from '@/components/ui/skeleton';

interface TestPreviewModalProps {
    test: DiagnosticTest;
    questions: Question[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function TestPreviewModal({
    test,
    questions,
    open,
    onOpenChange,
    children
}: TestPreviewModalProps) {
    const [selectedQuestionId, setSelectedQuestionId] = React.useState<string | undefined>(questions[0]?.id);

    React.useEffect(() => {
        if (open && questions.length > 0 && !selectedQuestionId) {
            setSelectedQuestionId(questions[0].id);
        }
    }, [open, questions, selectedQuestionId]);

    const sortedQuestions = React.useMemo(() => {
        return [...questions].sort((a, b) => a.questionNumber - b.questionNumber);
    }, [questions]);
    
    const selectedQuestion = React.useMemo(() => {
        return sortedQuestions.find(q => q.id === selectedQuestionId);
    }, [selectedQuestionId, sortedQuestions]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-7xl w-full h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>학기 문제 미리보기: {test.semesterName}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 grid grid-cols-[200px_1fr] overflow-hidden gap-4 px-6 pb-6">
                    <div className="flex flex-col border-r pr-4">
                        <h3 className="text-lg font-semibold mb-2">문제 목록</h3>
                        <ScrollArea className="flex-1">
                            <Tabs
                                orientation="vertical"
                                value={selectedQuestionId}
                                onValueChange={setSelectedQuestionId}
                                className="w-full"
                            >
                                <TabsList className="flex flex-col h-auto items-stretch gap-1 bg-transparent p-0">
                                    {sortedQuestions.map((question) => (
                                        <TabsTrigger
                                            key={question.id}
                                            value={question.id}
                                            className="w-full justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                                        >
                                            {question.questionNumber}번 문제
                                        </TabsTrigger>
                                    ))}
                                    {sortedQuestions.length === 0 && (
                                         <div className="text-sm text-muted-foreground p-2">
                                            문제가 없습니다.
                                        </div>
                                    )}
                                </TabsList>
                            </Tabs>
                        </ScrollArea>
                    </div>
                    <div className="overflow-y-auto">
                        {selectedQuestion ? (
                             <QuestionPreview questionData={selectedQuestion} />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-gray-50 rounded-md">
                                {questions.length > 0 ? (
                                    <p>왼쪽에서 문제 번호를 선택하세요.</p>
                                ) : (
                                    <p>미리 볼 문제가 없습니다.</p>
                                )}
                           </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="p-6 pt-4 border-t">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            닫기
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
