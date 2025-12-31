
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFirebase, useFirestore } from '@/firebase';
import { updateDiagnosticTestStatus, type DiagnosticTest, createBlankQuestion, getQuestionsQuery, type Question } from '@/lib/db';
import { useDiagnosticTest } from '@/hooks/use-diagnostic-test';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionList } from '@/components/app/diagnostic-tests/question-list';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot } from 'firebase/firestore';
import { TestPreviewModal } from '@/components/app/diagnostic-tests/test-preview-modal';


export default function DiagnosticTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  const { toast } = useToast();
  const { firestore } = useFirebase() ?? {};
  const { test, setTest, loading } = useDiagnosticTest(firestore, testId);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (!firestore || !testId) return;

    const q = getQuestionsQuery(firestore, testId);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedQuestions: Question[] = [];
        querySnapshot.forEach((doc) => {
            fetchedQuestions.push({ id: doc.id, ...doc.data() } as Question);
        });
        setQuestions(fetchedQuestions);
    });

    return unsubscribe;
  }, [firestore, testId]);

  const handleStatusToggle = async (checked: boolean) => {
    if (!firestore || !test) return;
    const newStatus = checked ? '검수완료' : '검수전';
    try {
      await updateDiagnosticTestStatus(firestore, testId, newStatus);
      setTest(prev => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: '상태 변경 완료',
        description: `학기 상태가 ${newStatus}로 변경되었습니다.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: '상태 변경 실패',
        description: '오류가 발생했습니다.',
      });
    }
  };

  const handleAddQuestion = async (questionType: '객관식' | '서술형') => {
    if (!firestore) return;
    try {
      await createBlankQuestion(firestore, testId, questionType);
      toast({
        title: '신규 문제가 등록되었습니다.',
      });
    } catch (error) {
      console.error('Error creating blank question:', error);
      toast({
        variant: 'destructive',
        title: '문제 등록 실패',
        description: '오류가 발생했습니다.',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="flex justify-start gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-96 w-full" />
         <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-10 w-20" />
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold">진단평가를 찾을 수 없습니다.</h1>
        <p className="text-muted-foreground mt-2">
          요청한 학기 정보를 찾을 수 없습니다. 목록으로 돌아가 다시 시도해주세요.
        </p>
        <Button onClick={() => router.push('/content/diagnostic-tests')} className="mt-4">
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold font-headline tracking-tight">
        진단평가 - {test.semesterName}
      </h1>

      <div className="flex justify-start gap-2">
        <Button onClick={() => handleAddQuestion('객관식')}>+ 객관식</Button>
        <Button onClick={() => handleAddQuestion('서술형')}>+ 서술형</Button>
      </div>
      
      <QuestionList testId={testId} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
            <Switch 
                id="review-status-toggle" 
                checked={test.status === '검수완료'}
                onCheckedChange={handleStatusToggle}
            />
            <Label htmlFor="review-status-toggle">
                {test.status === '검수완료' ? '검수완료' : '검수전'}
            </Label>
        </div>
        <div className='flex items-center gap-2'>
            <TestPreviewModal 
                test={test} 
                questions={questions}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            >
                <Button variant="outline">미리보기</Button>
            </TestPreviewModal>
            <Button variant="outline" onClick={() => router.push('/content/diagnostic-tests')}>
            목록
            </Button>
        </div>
      </div>
    </div>
  );
}
