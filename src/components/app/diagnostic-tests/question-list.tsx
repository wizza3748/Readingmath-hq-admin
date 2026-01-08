
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Trash2, Edit } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { onSnapshot } from 'firebase/firestore';
import { getQuestionsQuery, deleteQuestion, updateQuestionExtended, updateQuestion, type Question, initialCurriculumUnits } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { QuestionModal } from './question-modal';
import { Switch } from '@/components/ui/switch';


export function QuestionList({ testId }: { testId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingQuestion, setEditingQuestion] = React.useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const curriculumUnitMap = React.useMemo(() => {
    const map = new Map<string, string>();
    initialCurriculumUnits.forEach(unit => {
      map.set(unit.id, unit.mediumUnit);
    });
    return map;
  }, []);

  React.useEffect(() => {
    if (!firestore || !testId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = getQuestionsQuery(firestore, testId);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const questions: Question[] = [];
      querySnapshot.forEach((doc) => {
        questions.push({ id: doc.id, ...doc.data() } as Question);
      });
      setQuestions(questions);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching questions:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, [firestore, testId]);

  const handleDelete = async (questionId: string) => {
    if (!firestore) return;
    try {
      await deleteQuestion(firestore, testId, questionId);
      toast({
        title: "삭제되었습니다.",
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: "문제 삭제 중 오류가 발생했습니다.",
      });
    }
  };

  const handleExtendedToggle = async (questionId: string, isExtended: boolean) => {
    if (!firestore) return;
    try {
      await updateQuestionExtended(firestore, testId, questionId, isExtended);
      if (isExtended) {
        toast({
          title: "확장문제로 설정되었습니다.",
        });
      }
    } catch (error) {
      console.error("Error updating extended status:", error);
      toast({
        variant: "destructive",
        title: "업데이트 실패",
        description: "확장문제 설정 중 오류가 발생했습니다.",
      });
    }
  };

  const handleBehavioralAreaChange = async (questionId: string, behavioralArea: string) => {
    if (!firestore) return;
    try {
      await updateQuestion(firestore, testId, questionId, {
        behavioralArea: behavioralArea as any
      });
      toast({
        title: "행동영역이 수정되었습니다.",
        duration: 1000
      });
    } catch (error) {
      console.error("Error updating behavioral area:", error);
      toast({
        variant: "destructive",
        title: "수정 실패",
        description: "행동영역 수정 중 오류가 발생했습니다.",
      });
    }
  };

  const handleOpenModal = (question: Question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const columns: ColumnDef<Question>[] = [
    {
      accessorKey: 'questionNumber',
      header: '번호',
      cell: ({ row, table }) => {
        const sortedRows = table.getSortedRowModel().rows;
        const rowIndex = sortedRows.findIndex(sortedRow => sortedRow.id === row.id);
        return rowIndex + 1;
      }
    },
    { accessorKey: 'questionType', header: '문제 타입', cell: ({ row }) => row.original.questionType === '유형' ? '객관식' : row.original.questionType },
    {
      accessorKey: 'subUnitType',
      header: '단원',
      cell: ({ row }) => {
        const subUnitId = row.original.subUnitType;
        const mediumUnitName = curriculumUnitMap.get(subUnitId) || subUnitId || '-';
        return <div className='w-40'>{mediumUnitName}</div>;
      }
    },
    { accessorKey: 'contentArea', header: '내용영역', cell: ({ row }) => row.original.contentArea || '-' },
    {
      accessorKey: 'behavioralArea',
      header: '행동영역',
      cell: ({ row }) => (
        <Select
          value={row.original.behavioralArea}
          onValueChange={(value) => handleBehavioralAreaChange(row.original.id, value)}
        >
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue placeholder="선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="개념이해력">개념이해력</SelectItem>
            <SelectItem value="문제해결력">문제해결력</SelectItem>
            <SelectItem value="문해력">문해력</SelectItem>
            <SelectItem value="추론력">추론력</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    { accessorKey: 'difficulty', header: '난이도', cell: ({ row }) => row.original.difficulty || '-' },
    {
      accessorKey: 'prompt',
      header: '발문',
      cell: ({ row }) => <div className="truncate w-60">{row.original.prompt}</div>
    },
    {
      accessorKey: 'solutionCount',
      header: '풀이답안수',
      cell: ({ row }) => {
        const question = row.original;
        let count = 0;
        if (question.questionType === '객관식' || question.questionType === '유형') {
          if (question.answerType === '입력형') {
            count = question.answers?.length || 0;
          } else if (question.answerType === '선지형' || question.answerType === '순서맞추기') {
            count = (question.answers && question.answers.length > 0) ? 1 : 0;
          }
        } else if (question.questionType === '서술형') {
          count = question.answers?.length || 0;
        }
        return <div className="text-center">{count}</div>
      }
    },
    {
      accessorKey: 'isExtended',
      header: '확장문제',
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isExtended}
          onCheckedChange={(checked) => handleExtendedToggle(row.original.id, !!checked)}
        />
      )
    },
    {
      accessorKey: 'isReviewed',
      header: '검수여부',
      cell: ({ row }) => <Switch checked={!!row.original.isReviewed} disabled />
    },
    {
      id: 'actions',
      header: '관리',
      cell: ({ row }) => {
        const question = row.original;
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600" onClick={() => handleOpenModal(question)}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(question.id)}>확인</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: questions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'questionNumber', desc: false }]
    }
  });

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  등록된 문제가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {editingQuestion && (
        <QuestionModal
          key={editingQuestion.id}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          testId={testId}
          question={editingQuestion}
          questionType={editingQuestion.questionType}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

