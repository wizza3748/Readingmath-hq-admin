
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { getDiagnosticTest, updateDiagnosticTestStatus, type DiagnosticTest } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionList } from '@/components/app/diagnostic-tests/question-list';
import { QuestionModal } from '@/components/app/diagnostic-tests/question-modal';
import { useToast } from '@/hooks/use-toast';

export default function DiagnosticTestDetailPage({ params }: { params: { testId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase() ?? {};
  const [test, setTest] = React.useState<DiagnosticTest | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const testId = params.testId;
    if (!firestore || !testId) return;

    setLoading(true);
    const unsubscribe = getDiagnosticTest(firestore, testId, (data) => {
      setTest(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, params]);

  const handleStatusToggle = async (checked: boolean) => {
    if (!firestore || !test) return;
    const newStatus = checked ? '검수완료' : '검수전';
    try {
      await updateDiagnosticTestStatus(firestore, params.testId, newStatus);
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
        <QuestionModal testId={params.testId} questionType="유형">
            <Button>유형 문제 등록</Button>
        </QuestionModal>
        <QuestionModal testId={params.testId} questionType="서술형">
            <Button>서술형 문제 등록</Button>
        </QuestionModal>
      </div>
      
      <QuestionList testId={params.testId} />
      
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
        <Button variant="outline" onClick={() => router.push('/content/diagnostic-tests')}>
          목록
        </Button>
      </div>
    </div>
  );
}
