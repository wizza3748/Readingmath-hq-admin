
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "@tanstack/react-table";
import { ArrowUpDown, Download, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { useFirebase, useFirestore } from "@/firebase";
import { getInstitutions, type Institution } from "@/lib/institutions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const serviceStatusVariant: {
  [key in Institution["serviceStatus"]]:
    | "default"
    | "secondary"
    | "destructive"
    | "outline";
} = {
  정상: "default",
  무료사용: "secondary",
  일시정지: "outline",
  미납정지: "destructive",
};

const franchiseTypeVariant: {
  [key in NonNullable<Institution["franchiseType"]>]: "default" | "secondary" | "outline";
} = {
  스탠다드: "default",
  슬림: "secondary",
  가맹전: "outline",
  학교: "default",
};

const columns: ColumnDef<Institution>[] = [
  {
    accessorKey: "id",
    header: "고유번호",
    cell: ({ row }) => <div className="lowercase truncate w-20">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "branch1",
    header: "지사1",
  },
  {
    accessorKey: "branch2",
    header: "지사2",
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        기관명
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/institutions/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "serviceType",
    header: "서비스 타입",
  },
  {
    accessorKey: "serviceStatus",
    header: "서비스 상태",
    cell: ({ row }) => (
      <Badge variant={serviceStatusVariant[row.getValue("serviceStatus")]}>
        {row.getValue("serviceStatus")}
      </Badge>
    ),
  },
  {
    accessorKey: "franchiseType",
    header: "가맹 타입",
    cell: ({ row }) => {
        const franchiseType = row.getValue("franchiseType") as Institution["franchiseType"];
        if (!franchiseType) return null;
        return (
            <Badge variant={franchiseTypeVariant[franchiseType]}>
                {franchiseType}
            </Badge>
        )
    },
  },
  {
    accessorKey: "ownerName",
    header: "기관장명",
  },
  {
    accessorKey: "ownerContact",
    header: "기관장 연락처",
  },
   {
    accessorKey: "fees.minFee",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        최소 이용 금액
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right">
        {(row.original.fees?.minFee ?? 0).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        등록일
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as any;
        if (!createdAt) return '';
        const date = createdAt.toDate();
        return date.toLocaleDateString('ko-KR');
    }
  },
];

const branchOptions: MultiSelectOption[] = [
  { value: "서울", label: "서울" },
  { value: "경기", label: "경기" },
  { value: "부산", label: "부산" },
  { value: "인천", label: "인천" },
];
const serviceTypeOptions: MultiSelectOption[] = [
  { value: "수학+과학", label: "수학+과학" },
  { value: "수학", label: "수학" },
  { value: "과학", label: "과학" },
];
const serviceStatusOptions: MultiSelectOption[] = [
  { value: "정상", label: "정상" },
  { value: "무료사용", label: "무료사용" },
  { value: "일시정지", label: "일시정지" },
  { value: "미납정지", label: "미납정지" },
];
const franchiseTypeOptions: MultiSelectOption[] = [
  { value: "스탠다드", label: "스탠다드" },
  { value: "슬림", label: "슬림" },
  { value: "가맹전", label: "가맹전" },
  { value: "학교", label: "학교" },
];

function SearchFilters({
  table,
}: {
  table: ReturnType<typeof useReactTable<Institution>>;
}) {
  const [search, setSearch] = React.useState("");

  const handleSearch = () => {
    if (search.trim().length < 2 && search.trim().length > 0) {
      alert("검색어는 2자 이상 입력해주세요.");
      return;
    }
    table.getColumn("name")?.setFilterValue(search);
  };

  const handleReset = () => {
    setSearch("");
    table.resetColumnFilters();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      <MultiSelect
        options={branchOptions}
        placeholder="지사"
        className="lg:col-span-1"
      />
      <MultiSelect
        options={serviceTypeOptions}
        placeholder="서비스 타입"
        className="lg:col-span-1"
      />
      <MultiSelect
        options={serviceStatusOptions}
        placeholder="서비스 상태"
        className="lg:col-span-1"
      />
      <MultiSelect
        options={franchiseTypeOptions}
        placeholder="가맹 타입"
        className="lg:col-span-1"
      />
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="자동 결제" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="registered">등록</SelectItem>
          <SelectItem value="unregistered">미등록</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="기관명으로 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="xl:col-span-2"
      />
      <div className="flex gap-2 xl:col-start-5 xl:col-span-2">
        <Button onClick={handleSearch} className="flex-1">
          검색
        </Button>
        <Button onClick={handleReset} variant="outline" className="flex-1">
          초기화
        </Button>
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
                            {Array.from({ length: 11 }).map((_, i) => (
                                <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={i}>
                                {Array.from({ length: 11 }).map((_, j) => (
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

function InstitutionsTableContent() {
  const router = useRouter();
  const firestore = useFirestore();
  const [data, setData] = React.useState<Institution[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

   React.useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const unsubscribe = getInstitutions(firestore, (institutions) => {
      setData(institutions);
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
    }
  });

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardContent className="pt-6">
          <SearchFilters table={table} />
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            총 {table.getFilteredRowModel().rows.length}개
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              엑셀 다운로드
            </Button>
            <Button onClick={() => router.push("/institutions/new")}>
              <Plus className="mr-2 h-4 w-4" />
              기관 등록
            </Button>
          </div>
        </div>
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
    </div>
  );
}

export function InstitutionsTable() {
    const { firestore } = useFirebase();

    if (!firestore) {
        return (
            <div className="w-full space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {Array.from({length: 7}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    </CardContent>
                </Card>
                <div className="py-4">
                  <TableSkeleton />
                </div>
            </div>
        )
    }

    return <InstitutionsTableContent />;
}
