
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
import { useFirebase, useFirestore } from "@/firebase";
import { getDiagnosticTests, type DiagnosticTest } from "@/lib/db";

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
import { Skeleton } from '@/components/ui/skeleton';

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
    cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as any;
        if (!createdAt) return null; // Render nothing if createdAt is not yet available
        // Firestore Timestamps can be converted to JS Date objects
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\. /g, '-').replace(/\.$/, '');
    }
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
    cell: () => {
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
  }

  const status = columnFilters.find(f => f.id === 'status')?.value as string || 'all';

  return (
    <div className="flex flex-col sm:flex-row gap-4">
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
            <Select key={status} value={status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-full sm:w-[150px]">
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
            <Button onClick={() => {
                // The filtering is already applied on change, this button could be used for explicit apply if needed.
            }} className="flex-1 sm:flex-initial">적용</Button>
            <Button onClick={handleReset} variant="outline" className="flex-1 sm:flex-initial">초기화</Button>
        </div>
    </div>
  );
}

function TableSkeleton() {
    return (
        <div className="space-y-4">
             <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={i}>
                                {Array.from({ length: 6 }).map((_, j) => (
                                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function DiagnosticTestsTable() {
    const firestore = useFirestore();
    const [data, setData] = React.useState<DiagnosticTest[]>([]);
    const [loading, setLoading] = React.useState(true);
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

    React.useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        const unsubscribe = getDiagnosticTests(firestore, (tests) => {
          setData(tests);
          setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);
    

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

    return (
        <div className="w-full space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <SearchFilters columnFilters={columnFilters} setColumnFilters={setColumnFilters} />
                </CardContent>
            </Card>
            {loading ? <TableSkeleton /> : (
                <>
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
                </>
            )}
        </div>
    )
}

export default function DiagnosticTestsPage() {
    // useFirebase() can be undefined on initial render, so we handle that.
    const { firestore } = useFirebase() ?? { firestore: null };

    if (!firestore) {
        return (
             <div className="p-4 sm:p-6 lg:p-8">
              <h1 className="text-2xl font-bold font-headline tracking-tight mb-6">
                진단평가관리(과학)
              </h1>
              <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Skeleton className="h-10 w-full sm:w-[150px]" />
                        <Skeleton className="h-10 w-full sm:w-[250px]" />
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-10 w-20" />
                    </div>
                </CardContent>
              </Card>
              <div className="py-4">
                <TableSkeleton />
              </div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold font-headline tracking-tight mb-6">
            진단평가관리(과학)
        </h1>
        <DiagnosticTestsTable />
        </div>
    );
}
