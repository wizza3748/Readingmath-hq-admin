"use client";

import * as React from "react";
import Link from "next/link";
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
  Card,
  CardContent,
} from "@/components/ui/card";
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
import { MultiSelect } from "@/components/ui/multi-select";

type Institution = {
  id: string;
  branch1: string;
  branch2: string;
  name: string;
  serviceType: "수학+과학" | "수학" | "과학";
  serviceStatus: "정상" | "무료사용" | "일시정지" | "미납정지";
  franchiseType: "가맹전" | "스탠다드" | "슬림" | "학교";
  autoPayment: "등록" | "미등록";
  points: {
    paid: number;
    free?: number;
  };
  minFee: number;
  perStudentFee: number;
  studentCount: number;
  registrationDate: string;
};

const DUMMY_DATA: Institution[] = [
  {
    id: "INST001",
    branch1: "서울",
    branch2: "강남",
    name: "강남 리딩수학",
    serviceType: "수학+과학",
    serviceStatus: "정상",
    franchiseType: "스탠다드",
    autoPayment: "등록",
    points: { paid: 350000, free: 100000 },
    minFee: 500000,
    perStudentFee: 50000,
    studentCount: 25,
    registrationDate: "2023-01-15",
  },
  {
    id: "INST002",
    branch1: "경기",
    branch2: "분당",
    name: "분당 과학의 신",
    serviceType: "과학",
    serviceStatus: "무료사용",
    franchiseType: "가맹전",
    autoPayment: "미등록",
    points: { paid: 0 },
    minFee: 0,
    perStudentFee: 0,
    studentCount: 10,
    registrationDate: "2023-02-20",
  },
  {
    id: "INST003",
    branch1: "서울",
    branch2: "서초",
    name: "서초 영재수학",
    serviceType: "수학",
    serviceStatus: "일시정지",
    franchiseType: "슬림",
    autoPayment: "등록",
    points: { paid: 120000 },
    minFee: 300000,
    perStudentFee: 40000,
    studentCount: 15,
    registrationDate: "2022-11-30",
  },
  {
    id: "INST004",
    branch1: "부산",
    branch2: "해운대",
    name: "해운대 코딩과학",
    serviceType: "수학+과학",
    serviceStatus: "미납정지",
    franchiseType: "스탠다드",
    autoPayment: "미등록",
    points: { paid: 50000, free: 20000 },
    minFee: 500000,
    perStudentFee: 55000,
    studentCount: 30,
    registrationDate: "2023-05-10",
  },
    {
    id: "INST005",
    branch1: "인천",
    branch2: "송도",
    name: "송도 국제학교",
    serviceType: "수학+과학",
    serviceStatus: "정상",
    franchiseType: "학교",
    autoPayment: "등록",
    points: { paid: 1000000 },
    minFee: 1000000,
    perStudentFee: 60000,
    studentCount: 100,
    registrationDate: "2021-08-01",
  },
];

const serviceStatusVariant: {
  [key in Institution["serviceStatus"]]: "default" | "secondary" | "destructive" | "outline";
} = {
  정상: "default",
  무료사용: "secondary",
  일시정지: "outline",
  미납정지: "destructive",
};

const franchiseTypeVariant: {
  [key in Institution["franchiseType"]]: "default" | "secondary" | "outline";
} = {
  스탠다드: "default",
  슬림: "secondary",
  가맹전: "outline",
  학교: "default",
};

const columns: ColumnDef<Institution>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        고유번호
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue("id")}</div>,
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
      <Link href="#" className="font-medium text-primary hover:underline">
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
    cell: ({ row }) => (
      <Badge variant={franchiseTypeVariant[row.getValue("franchiseType")]}>
        {row.getValue("franchiseType")}
      </Badge>
    ),
  },
  {
    accessorKey: "autoPayment",
    header: "자동 결제",
  },
  {
    accessorKey: "points",
    header: ({ column }) => (
       <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        포인트
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const points: Institution["points"] = row.getValue("points");
      const formattedPaid = points.paid.toLocaleString();
      const formattedFree = points.free?.toLocaleString();
      return (
        <div className="text-right">
          {formattedPaid}
          {formattedFree && <span className="text-muted-foreground">({formattedFree})</span>}
        </div>
      );
    },
    sortingFn: (rowA, rowB, columnId) => {
        const pointsA = rowA.getValue(columnId) as Institution['points'];
        const pointsB = rowB.getValue(columnId) as Institution['points'];
        return pointsA.paid - pointsB.paid;
    }
  },
  {
    accessorKey: "minFee",
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
      <div className="text-right">{row.getValue<number>("minFee").toLocaleString()}</div>
    ),
  },
  {
    accessorKey: "perStudentFee",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        인당 이용료
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right">{row.getValue<number>("perStudentFee").toLocaleString()}</div>
    ),
  },
  {
    accessorKey: "studentCount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        사용 중 학생 수
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-right">{row.getValue("studentCount")}</div>,
  },
  {
    accessorKey: "registrationDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        등록일
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
];

const branchOptions = [
  { value: "서울", label: "서울" },
  { value: "경기", label: "경기" },
  { value: "부산", label: "부산" },
  { value: "인천", label: "인천" },
];
const serviceTypeOptions = [
  { value: "수학+과학", label: "수학+과학" },
  { value: "수학", label: "수학" },
  { value: "과학", label: "과학" },
];
const serviceStatusOptions = [
  { value: "정상", label: "정상" },
  { value: "무료사용", label: "무료사용" },
  { value: "일시정지", label: "일시정지" },
  { value: "미납정지", label: "미납정지" },
];
const franchiseTypeOptions = [
  { value: "스탠다드", label: "스탠다드" },
  { value: "슬림", label: "슬림" },
  { value: "가맹전", label: "가맹전" },
  { value: "학교", label: "학교" },
];

function SearchFilters({ table }: { table: ReturnType<typeof useReactTable<Institution>> }) {
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
      <MultiSelect options={branchOptions} placeholder="지사" className="lg:col-span-1" />
      <MultiSelect options={serviceTypeOptions} placeholder="서비스 타입" className="lg:col-span-1" />
      <MultiSelect options={serviceStatusOptions} placeholder="서비스 상태" className="lg:col-span-1" />
      <MultiSelect options={franchiseTypeOptions} placeholder="가맹 타입" className="lg:col-span-1" />
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
        <Button onClick={handleSearch} className="flex-1">검색</Button>
        <Button onClick={handleReset} variant="outline" className="flex-1">초기화</Button>
      </div>
    </div>
  );
}

export function InstitutionsTable() {
  const [data] = React.useState(() => [...DUMMY_DATA]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              기관 등록
            </Button>
          </div>
        </div>
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
  );
}
