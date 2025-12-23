
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
import { getQuestions, deleteQuestion, updateQuestionExtended, type Question } from '@/lib/db';
import { Button } from '@/components/ui/button';
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

  React.useEffect(() => {
    if (!firestore || !testId) return;
    setLoading(true);
    const unsubscribe = getQuestions(firestore, testId, (data) => {
      setQuestions(data);
      setLoading(false);
    });
    return () => unsubscribe();
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

  const columns: ColumnDef<Question>[] = [
    { accessorKey: 'questionNumber', header: '번호' },
    { accessorKey: 'questionType', header: '문제 타입' },
    { accessorKey: 'subUnitType', header: '단원', cell: ({ row }) => <div className='w-40'>{row.original.subUnitType || '-'}</div> },
    { accessorKey: 'contentArea', header: '내용영역', cell: ({ row }) => row.original.contentArea || '-' },
    { accessorKey: 'difficulty', header: '난이도', cell: ({ row }) => row.original.difficulty || '-' },
    { 
        accessorKey: 'prompt', 
        header: '발문', 
        cell: ({ row }) => <div className="truncate w-60">{row.original.prompt}</div> 
    },
    { accessorKey: 'solutionCount', header: '풀이답안수', cell: ({ row }) => <div className="text-center">{row.original.solutionCount || 0}</div> },
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
            <QuestionModal testId={testId} question={question} questionType={question.questionType}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600">
                    <Edit className="h-4 w-4" />
                </Button>
            </QuestionModal>
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
  );
}
