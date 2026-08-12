"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INSTITUTION_BRANCH1_OPTIONS,
  INSTITUTION_BRANCH2_OPTIONS,
  INSTITUTION_SERVICE_TYPE_OPTIONS,
  MOCK_INSTITUTIONS,
  type MockInstitution,
} from "@/lib/institution-mock";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type Filters = {
  branch1: string;
  branch2: string;
  serviceType: string;
  serviceStatus: string;
  franchiseType: string;
  automaticPayment: string;
  search: string;
};

const emptyFilters: Filters = {
  branch1: "all",
  branch2: "all",
  serviceType: "all",
  serviceStatus: "all",
  franchiseType: "all",
  automaticPayment: "all",
  search: "",
};

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 min-w-[145px] bg-white text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ServiceTypeBadge({ value }: { value: MockInstitution["serviceType"] }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-500">
      {value}
    </span>
  );
}

function ServiceStatusBadge({ value }: { value: MockInstitution["serviceStatus"] }) {
  const styles = {
    무료사용: "bg-blue-50 text-blue-500",
    정상: "bg-emerald-50 text-emerald-600",
    일시정지: "bg-orange-50 text-orange-500",
    미납정지: "bg-red-50 text-red-500",
  } as const;

  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold", styles[value])}>
      {value}
    </span>
  );
}

function InstitutionsTableRow({ institution }: { institution: MockInstitution }) {
  return (
    <tr className="border-b border-slate-100 text-xs text-slate-500 transition-colors hover:bg-slate-50/70">
      <td className="px-3 py-4"><Checkbox aria-label={`${institution.name} 선택`} /></td>
      <td className="px-3 py-4 font-medium">{institution.id}</td>
      <td className="px-3 py-4">{institution.branch1 || "-"}</td>
      <td className="px-3 py-4">{institution.branch2 || "-"}</td>
      <td className="px-3 py-4">
        <Link href={`/institutions/${institution.id}`} className="font-semibold text-sky-500 hover:underline">
          {institution.name}
        </Link>
      </td>
      <td className="px-3 py-4"><ServiceTypeBadge value={institution.serviceType} /></td>
      <td className="px-3 py-4"><ServiceStatusBadge value={institution.serviceStatus} /></td>
      <td className="px-3 py-4">
        <span className="rounded-full bg-pink-50 px-2 py-1 text-[11px] font-semibold text-pink-500">
          {institution.franchiseType}
        </span>
      </td>
      <td className="px-3 py-4 font-semibold text-slate-500">{institution.automaticPayment}</td>
      <td className="px-3 py-4 whitespace-nowrap">
        {institution.paidPoints.toLocaleString()}P
        <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
          {institution.freePoints}P
        </span>
      </td>
      <td className="px-3 py-4 text-right">{institution.minFee.toLocaleString()}원</td>
      <td className="px-3 py-4 text-right">{institution.perStudentFee.toLocaleString()}원</td>
      <td className="px-3 py-4 text-center">{institution.studentCount}</td>
      <td className="px-3 py-4 whitespace-nowrap">{institution.createdAt}</td>
      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 bg-sky-50 text-sky-500 hover:bg-sky-100" aria-label="수정 UI">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 bg-rose-50 text-rose-400 hover:bg-rose-100" aria-label="삭제 UI">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function InstitutionsTable() {
  const [draftFilters, setDraftFilters] = React.useState<Filters>(emptyFilters);
  const [filters, setFilters] = React.useState<Filters>(emptyFilters);
  const [page, setPage] = React.useState(1);

  const filteredInstitutions = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return MOCK_INSTITUTIONS.filter((institution) => {
      if (filters.branch1 !== "all" && institution.branch1 !== filters.branch1) return false;
      if (filters.branch2 !== "all" && institution.branch2 !== filters.branch2) return false;
      if (filters.serviceType !== "all" && institution.serviceType !== filters.serviceType) return false;
      if (filters.serviceStatus !== "all" && institution.serviceStatus !== filters.serviceStatus) return false;
      if (filters.franchiseType !== "all" && institution.franchiseType !== filters.franchiseType) return false;
      if (filters.automaticPayment !== "all" && institution.automaticPayment !== filters.automaticPayment) return false;
      if (search && !`${institution.name} ${institution.id}`.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [filters]);

  const pageCount = Math.max(1, Math.ceil(filteredInstitutions.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedInstitutions = filteredInstitutions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const updateDraft = (key: keyof Filters, value: string) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
  };

  const resetFilters = () => {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <FilterSelect value={draftFilters.branch1} onValueChange={(value) => updateDraft("branch1", value)} placeholder="지사1" options={INSTITUTION_BRANCH1_OPTIONS} />
          <FilterSelect value={draftFilters.branch2} onValueChange={(value) => updateDraft("branch2", value)} placeholder="지사2" options={INSTITUTION_BRANCH2_OPTIONS} />
          <FilterSelect value={draftFilters.serviceType} onValueChange={(value) => updateDraft("serviceType", value)} placeholder="서비스 타입" options={INSTITUTION_SERVICE_TYPE_OPTIONS} />
          <FilterSelect value={draftFilters.serviceStatus} onValueChange={(value) => updateDraft("serviceStatus", value)} placeholder="서비스 상태" options={["무료사용", "정상", "일시정지", "미납정지"]} />
          <FilterSelect value={draftFilters.franchiseType} onValueChange={(value) => updateDraft("franchiseType", value)} placeholder="가맹타입" options={["가맹전", "스탠다드", "학교"]} />
          <FilterSelect value={draftFilters.automaticPayment} onValueChange={(value) => updateDraft("automaticPayment", value)} placeholder="자동 결제" options={["등록", "미등록"]} />
          <Button type="button" size="sm" className="h-9 bg-blue-500 px-4 hover:bg-blue-600" onClick={applyFilters}>적용</Button>
          <Button type="button" size="sm" variant="secondary" className="h-9 px-4" onClick={resetFilters}>초기화</Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Input
              value={draftFilters.search}
              onChange={(event) => updateDraft("search", event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && applyFilters()}
              placeholder="검색어를 입력해주세요"
              className="h-10 bg-slate-50 pr-10 text-xs"
            />
            <button type="button" onClick={applyFilters} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400" aria-label="기관 검색">
              <Search className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" className="h-10 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-600">
              <Download className="mr-2 h-4 w-4" />엑셀 다운로드
            </Button>
            <Button type="button" className="h-10 bg-sky-500 hover:bg-sky-600">
              <Plus className="mr-2 h-4 w-4" />기관추가
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1850px] w-full border-collapse">
          <thead className="bg-white">
            <tr className="border-b border-slate-200 text-left text-[11px] font-semibold text-slate-400">
              <th className="w-10 px-3 py-3"><Checkbox aria-label="전체 선택" /></th>
              <th className="px-3 py-3">고유번호</th>
              <th className="px-3 py-3">지사1</th>
              <th className="px-3 py-3">지사2</th>
              <th className="min-w-[240px] px-3 py-3">기관명</th>
              <th className="px-3 py-3">서비스 타입</th>
              <th className="px-3 py-3">서비스 상태</th>
              <th className="px-3 py-3">가맹 타입</th>
              <th className="px-3 py-3">자동 결제</th>
              <th className="px-3 py-3">포인트</th>
              <th className="px-3 py-3 text-right">최소 이용 금액</th>
              <th className="px-3 py-3 text-right">인당 이용료</th>
              <th className="px-3 py-3 text-center">사용 중 학생 수</th>
              <th className="px-3 py-3">등록일</th>
              <th className="px-3 py-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {pagedInstitutions.length > 0 ? (
              pagedInstitutions.map((institution) => <InstitutionsTableRow key={institution.id} institution={institution} />)
            ) : (
              <tr><td colSpan={15} className="h-36 text-center text-sm text-slate-400">검색 결과가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span>{filteredInstitutions.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} - {Math.min(safePage * PAGE_SIZE, filteredInstitutions.length)} / 전체 {filteredInstitutions.length}</span>
          <span className="rounded-md border px-3 py-2">10</span>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" disabled={safePage === 1} onClick={() => setPage(1)}>«</Button>
          <Button type="button" variant="ghost" size="sm" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</Button>
          {Array.from({ length: Math.min(5, pageCount) }, (_, index) => {
            const start = Math.min(Math.max(1, safePage - 2), Math.max(1, pageCount - 4));
            const pageNumber = start + index;
            return (
              <Button key={pageNumber} type="button" size="sm" variant={safePage === pageNumber ? "default" : "ghost"} className={cn("h-8 w-8 p-0", safePage === pageNumber && "bg-sky-500 hover:bg-sky-600")} onClick={() => setPage(pageNumber)}>
                {pageNumber}
              </Button>
            );
          })}
          <Button type="button" variant="ghost" size="sm" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>›</Button>
          <Button type="button" variant="ghost" size="sm" disabled={safePage === pageCount} onClick={() => setPage(pageCount)}>»</Button>
        </div>
      </div>
    </section>
  );
}
