
'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type DiagnosticTest = {
  id: number;
  semesterName: string;
  totalQuestions: number;
  createdAt: string;
  status: '검수전' | '검수완료';
};

const initialData: DiagnosticTest[] = [
    { id: 15, semesterName: '초등 3학년 1학기', totalQuestions: 50, createdAt: '2024-01-15 10:30:00', status: '검수전' },
    { id: 16, semesterName: '초등 3학년 2학기', totalQuestions: 50, createdAt: '2024-01-15 10:30:00', status: '검수전' },
    { id: 17, semesterName: '초등 4학년 1학기', totalQuestions: 50, createdAt: '2024-01-15 10:30:00', status: '검수완료' },
    { id: 18, semesterName: '초등 4학년 2학기', totalQuestions: 50, createdAt: '2024-01-15 10:30:00', status: '검수전' },
    { id: 19, semesterName: '초등 5학년 1학기', totalQuestions: 50, createdAt: '2024-01-15 10:30:00', status: '검수완료' },
    { id: 20, semesterName: '초등 5학년 2학기', totalQuestions: 50, createdAt: '2024-01-15 10:30:00', status: '검수전' },
    { id: 21, semesterName: '초등 6학년 1학기', totalQuestions: 50, createdAt: '2024-01-15 10:30:00', status: '검수완료' },
    { id: 22, semesterName: '초등 6학년 2학기', totalQuestions: 50, createdAt: '2024-01-15 10:30:00', status: '검수전' },
    { id: 23, semesterName: '중등 1학년 1학기', totalQuestions: 100, createdAt: '2024-02-01 14:00:00', status: '검수전' },
    { id: 24, semesterName: '중등 1학년 2학기', totalQuestions: 100, createdAt: '2024-02-01 14:00:00', status: '검수완료' },
    { id: 25, semesterName: '중등 2학년 1학기', totalQuestions: 100, createdAt: '2024-02-01 14:00:00', status: '검수전' },
    { id: 26, semesterName: '중등 2학년 2학기', totalQuestions: 100, createdAt: '2024-02-01 14:00:00', status: '검수완료' },
    { id: 27, semesterName: '중등 3학년 1학기', totalQuestions: 100, createdAt: '2024-02-01 14:00:00', status: '검수전' },
    { id: 28, semesterName: '중등 3학년 2학기', totalQuestions: 100, createdAt: '2024-02-01 14:00:00', status: '검수완료' },
];


const statusVariant: {
    [key in DiagnosticTest['status']]: 'default' | 'secondary';
  } = {
    검수완료: 'default',
    검수전: 'secondary',
  };


const columns: ColumnDef<DiagnosticTest>[] = [
  {
    accessorKey: 'id',
    header: '고유번호',
    cell: ({ row }) => <div>{row.getValue('id')}</div>,
  },
  {
    accessorKey: 'semesterName',
    header: '학기명',
    cell: ({ row }) => (
      <Link href="#" className="font-medium text-primary hover:underline">
        {row.getValue('semesterName')}
      </Link>
    ),
  },
  {
    accessorKey: 'totalQuestions',
    header: () => <div className="text-center">총 문제 수</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue('totalQuestions')}</div>,
  },
  {
    accessorKey: 'createdAt',
    header: '등록일시',
    cell: ({ row }) => <div>{row.getValue('createdAt')}</div>,
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => (
        <Badge variant={statusVariant[row.getValue('status')]}>
            {row.getValue('status')}
        </Badge>
    ),
  },
  {
    id: 'actions',
    header: '편집',
    cell: ({ row }) => {
      return (
        <Link href="#">
            <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
            </Button>
        </Link>
      );
    },
  },
];

function SearchFilters({
  columnFilters,
  setColumnFilters,
}: {
  columnFilters: ColumnFiltersState;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
}) {
  
  const handleFilterChange = (columnId: string, value: string | undefined) => {
    setColumnFilters(prev => {
        const newFilters = prev.filter(f => f.id !== columnId);
        if (value && value !== 'all') {
            newFilters.push({ id: columnId, value });
        }
        return newFilters;
    });
  }

  const handleReset = () => {
    setColumnFilters([]);
    const statusSelect = document.getElementById('status-select-trigger');
    if (statusSelect) {
        (statusSelect as HTMLButtonElement).childNodes[0].textContent = '상태';
    }
  }

  const status = columnFilters.find(f => f.id === 'status')?.value as string || 'all';

  return (
    <div className="flex flex-col sm:flex-row gap-4">
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
            <Select value={status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger id="status-select-trigger" className="w-full sm:w-[150px]">
                    <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="검수전">검수전</SelectItem>
                    <SelectItem value="검수완료">검수완료</SelectItem>
                </SelectContent>
            </Select>
            <Input
                placeholder="학기명으로 검색"
                value={(columnFilters.find(f => f.id === 'semesterName')?.value as string) || ''}
                onChange={(event) => handleFilterChange('semesterName', event.target.value)}
                className="w-full sm:w-[250px]"
            />
        </div>
        <div className="flex gap-2">
            <Button onClick={() => {}} className="flex-1 sm:flex-initial">적용</Button>
            <Button onClick={handleReset} variant="outline" className="flex-1 sm:flex-initial">초기화</Button>
        </div>
    </div>
  );
}

export default function DiagnosticTestsPage() {
  const [data] = React.useState<DiagnosticTest[]>(() => [...initialData].sort((a, b) => a.id - b.id));
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'id', desc: false }
  ]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([
        { id: 'status', value: '검수전' }
    ]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  React.useEffect(() => {
    const statusFilter = columnFilters.find(filter => filter.id === 'status');
    const statusSelect = document.getElementById('status-select-trigger');
    if (statusSelect) {
      if (statusFilter && statusFilter.value !== 'all') {
        (statusSelect as HTMLButtonElement).childNodes[0].textContent = statusFilter.value as string;
      } else {
        (statusSelect as HTMLButtonElement).childNodes[0].textContent = '상태';
      }
    }
  }, [columnFilters]);
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold font-headline tracking-tight mb-6">
        진단평가관리(과학)
      </h1>
      <div className="w-full space-y-6">
        <Card>
            <CardContent className="pt-6">
                <SearchFilters columnFilters={columnFilters} setColumnFilters={setColumnFilters} />
            </CardContent>
        </Card>

        <div>
            <div className="rounded-md border">
            <Table>
                <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        return (
                        <TableHead key={header.id}>
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
                    <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                    >
                        {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                            {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                            )}
                        </TableCell>
                        ))}
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                    >
                        결과가 없습니다.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </div>
            <div className="py-4">
                <DataTablePagination table={table} />
            </div>
        </div>
      </div>
    </div>
  );
}
