"use client";

import { useParams, useRouter } from "next/navigation";
import { CalendarDays, List, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMockInstitution } from "@/lib/institution-mock";
import { cn } from "@/lib/utils";

function Field({
  label,
  value,
  required,
  className,
  placeholder,
}: {
  label: string;
  value?: string | number;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={cn("grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3", className)}>
      <span className="text-right text-xs text-slate-500">
        {required && <span className="mr-1 text-rose-400">*</span>}
        {label}
      </span>
      <Input defaultValue={value} placeholder={placeholder} className="h-9 bg-white text-xs" />
    </label>
  );
}

function RadioOption({ name, label, checked }: { name: string; label: string; checked?: boolean }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <input type="radio" name={name} defaultChecked={checked} className="accent-blue-500" />
      {label}
    </label>
  );
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {action}
    </div>
  );
}

export default function InstitutionInfoPage() {
  const params = useParams();
  const router = useRouter();
  const institution = getMockInstitution(String(params.institutionId));

  if (!institution) return null;

  return (
    <>
      <section className="rounded-xl border border-slate-100 bg-white p-7 shadow-sm">
        <SectionTitle title="기관 정보" />

        <div className="mt-6 space-y-4">
          <Field label="기관명" value={institution.name} required />

          <div className="grid gap-4 xl:grid-cols-2">
            <label className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3">
              <span className="text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>지사1</span>
              <select defaultValue={institution.branch1} className="h-9 rounded-md border border-input bg-white px-3 text-xs">
                <option value="">지사1 선택</option>
                {["대구", "부산", "전주", "대전", "화성", "천안", "안산", "울산", "광주", "김포", "평택안성"].map((branch) => <option key={branch}>{branch}</option>)}
              </select>
            </label>
            <label className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3">
              <span className="text-right text-xs text-slate-500">지사2</span>
              <select defaultValue={institution.branch2} className="h-9 rounded-md border border-input bg-white px-3 text-xs">
                <option value="">지사2 선택</option>
                {["강남", "수원", "일산", "해운대"].map((branch) => <option key={branch}>{branch}</option>)}
              </select>
            </label>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Field label="매일국어 기관명" value={institution.everydayKoreanName} />
            <Field label="독도 기관명" value={institution.dokdoName} />
          </div>

          <div className="grid grid-cols-[110px_minmax(0,280px)_auto] items-center gap-3">
            <span className="text-right text-xs text-slate-500">우편번호</span>
            <Input defaultValue={institution.zipCode} className="h-9 bg-slate-50 text-xs" />
            <Button type="button" size="sm" className="justify-self-start bg-lime-500 hover:bg-lime-600">주소검색</Button>
          </div>
          <Field label="주소" value={institution.address} />
          <Field label="상세주소" value={institution.addressDetail} />

          <div className="grid gap-4 xl:grid-cols-3">
            <Field label="담당자명" value={institution.managerName} />
            <Field label="담당자 연락처" value={institution.managerContact} />
            <Field label="담당자 이메일" value={institution.email} placeholder="example@email.com" />
          </div>

          <label className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3">
            <span className="text-right text-xs text-slate-500">최근 계약 갱신일</span>
            <div className="relative">
              <Input defaultValue={institution.lastContractDate} placeholder="날짜 선택" className="h-9 pr-9 text-xs" />
              <CalendarDays className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </label>

          <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3">
            <span className="text-right text-xs text-slate-500">첨부파일</span>
            <Button type="button" variant="secondary" size="sm" className="w-fit"><Upload className="mr-2 h-4 w-4" />파일 선택</Button>
          </div>
        </div>

        <div className="mt-8">
          <SectionTitle title="서비스 정보" action={<Button type="button" variant="outline" size="sm">서비스 변경 예약</Button>} />
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center gap-5">
              <span className="w-28 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>서비스 상태</span>
              <RadioOption name="serviceStatus" label="무료사용" checked={institution.serviceStatus === "무료사용"} />
              <RadioOption name="serviceStatus" label="정상" checked={institution.serviceStatus === "정상"} />
              <RadioOption name="serviceStatus" label="미납정지" checked={institution.serviceStatus === "미납정지"} />
              <RadioOption name="serviceStatus" label="일시정지" checked={institution.serviceStatus === "일시정지"} />
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <span className="w-28 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>서비스 타입</span>
              <RadioOption name="serviceType" label="리딩수학" checked={institution.serviceType === "리딩수학"} />
              <RadioOption name="serviceType" label="리딩과학" checked={institution.serviceType === "리딩과학"} />
              <RadioOption name="serviceType" label="리딩수학+과학 통합" checked={institution.serviceType === "리딩수학+과학 통합"} />
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <span className="w-28 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>가맹 타입</span>
              <RadioOption name="franchiseType" label="가맹전" checked={institution.franchiseType === "가맹전"} />
              <RadioOption name="franchiseType" label="스탠다드" checked={institution.franchiseType === "스탠다드"} />
              <RadioOption name="franchiseType" label="학교" checked={institution.franchiseType === "학교"} />
            </div>

            <div className="grid gap-4 border-t border-slate-100 pt-5 xl:grid-cols-2">
              <div className="grid grid-cols-[110px_minmax(0,180px)_auto] items-center gap-3">
                <span className="text-right text-xs text-slate-500">가맹비</span>
                <Input defaultValue={institution.minFee.toLocaleString()} className="h-9 text-xs" />
                <Button type="button" size="sm">입금 처리</Button>
              </div>
              <div className="grid grid-cols-[110px_minmax(0,180px)_auto] items-center gap-3">
                <span className="text-right text-xs text-slate-500">교육비</span>
                <Input defaultValue="0" className="h-9 text-xs" />
                <Button type="button" size="sm">입금 처리</Button>
              </div>
              <Field label="최소 이용 금액" value={institution.minFee.toLocaleString()} required />
              <Field label="인당 이용료(1과목)" value={institution.perStudentFeeOneSubject.toLocaleString()} required />
              <div />
              <Field label="인당 이용료(2과목)" value={institution.perStudentFeeTwoSubjects.toLocaleString()} required />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <SectionTitle title="수수료 정산 비율" action={<Button type="button" variant="outline" size="sm">수수료율 변경 예약</Button>} />
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <Field label="이용료 수수료율" value={institution.usageFeeRate} />
            <Field label="가맹비 수수료율" value={institution.franchiseFeeRate ?? "미입력 시 기본 설정 적용"} />
          </div>
        </div>

        <div className="mt-8">
          <SectionTitle title="메모" />
          <label className="mt-6 grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3">
            <span className="pt-2 text-right text-xs text-slate-500">관리자 메모</span>
            <Textarea defaultValue={institution.memo} className="min-h-32" />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" className="bg-sky-500 px-7 hover:bg-sky-600">저장</Button>
        </div>
      </section>

      <Button type="button" variant="outline" onClick={() => router.push("/institutions")}>
        <List className="mr-2 h-4 w-4" />목록
      </Button>
    </>
  );
}
