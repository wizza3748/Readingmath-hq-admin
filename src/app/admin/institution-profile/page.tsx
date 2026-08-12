"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getInstitutionBillingSettings,
  getMockInstitution,
  type InstitutionBillingSettings,
} from "@/lib/institution-mock";

const INSTITUTION_ID = "1238";

function ReadonlyField({ label, value, className }: { label: string; value?: string | number; className?: string }) {
  return (
    <label className={`grid grid-cols-[125px_minmax(0,1fr)] items-center gap-3 ${className || ""}`}>
      <span className="text-right text-xs text-slate-500">{label}</span>
      <Input value={value ?? ""} readOnly className="h-9 bg-slate-50 text-xs text-slate-500" />
    </label>
  );
}

function ReadonlyRadio({ label, checked }: { label: string; checked: boolean }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <input type="radio" checked={checked} readOnly className="accent-blue-500" />
      {label}
    </label>
  );
}

function ReadonlyAmount({ label, value, suffix = "원" }: { label: string; value: string; suffix?: string }) {
  return (
    <label className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-3">
      <span className="text-right text-xs text-slate-500">{label}</span>
      <div className="relative">
        <Input value={value} readOnly className="h-9 bg-slate-50 pr-9 text-xs text-slate-500" />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">{suffix}</span>
      </div>
    </label>
  );
}

export default function InstitutionProfilePage() {
  const institution = getMockInstitution(INSTITUTION_ID);
  const [billing, setBilling] = React.useState<InstitutionBillingSettings | null>(null);

  React.useEffect(() => {
    if (institution) setBilling(getInstitutionBillingSettings(institution));
  }, [institution]);

  if (!institution || !billing) return null;

  const serviceStatus = billing.serviceStatusAfterEvent || institution.serviceStatus;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">기관 프로필</h1>
        <p className="mt-1 text-xs text-slate-400">Home - 기관정보 - 기관 프로필</p>
      </div>

      <section className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-7 py-5">
          <h2 className="text-base font-bold text-slate-900">{institution.name} 정보</h2>
        </div>

        <div className="space-y-7 p-7">
          <div className="space-y-4">
            <ReadonlyField label="기관명" value={institution.name} />
            <div className="grid grid-cols-[125px_190px_auto_1fr] items-center gap-3">
              <span className="text-right text-xs text-slate-500">기관코드</span>
              <Input value={institution.institutionCode} readOnly className="h-9 bg-slate-50 text-xs text-slate-500" />
              <Button type="button" variant="outline" size="sm" className="h-8 w-fit text-xs text-blue-500">
                <ExternalLink className="mr-1 h-3 w-3" /> 바로가기
              </Button>
            </div>
            <ReadonlyField label="우편번호" value={institution.zipCode} className="max-w-[500px]" />
            <ReadonlyField label="주소" value={institution.address} />
            <ReadonlyField label="상세 주소" value={institution.addressDetail} />
            <div className="grid gap-4 xl:grid-cols-3">
              <ReadonlyField label="담당자명" value={institution.managerName} />
              <ReadonlyField label="담당자 연락처" value={institution.managerContact} />
              <ReadonlyField label="담당자 이메일" value={institution.email} />
            </div>
            <div className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-3">
              <span className="text-right text-xs text-slate-500">첨부파일</span>
              <span className="text-xs text-slate-400">-</span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-6 text-base font-bold text-slate-900">서비스 정보</h3>
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-5">
                <span className="w-[125px] text-right text-xs text-slate-500">서비스 상태</span>
                {(["무료사용", "정상", "미납정지", "일시정지"] as const).map((value) => (
                  <ReadonlyRadio key={value} label={value} checked={serviceStatus === value} />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <span className="w-[125px] text-right text-xs text-slate-500">서비스 타입</span>
                {(["리딩수학", "리딩과학", "리딩수학+과학 통합"] as const).map((value) => (
                  <ReadonlyRadio key={value} label={value} checked={institution.serviceType === value} />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <span className="w-[125px] text-right text-xs text-slate-500">가맹 타입</span>
                {(["가맹전", "스탠다드", "학교"] as const).map((value) => (
                  <ReadonlyRadio key={value} label={value} checked={institution.franchiseType === value} />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <span className="w-[125px] text-right text-xs text-slate-500">과금 유형</span>
                {(["일반 과금", "이벤트 과금"] as const).map((value) => (
                  <ReadonlyRadio key={value} label={value} checked={billing.billingType === value} />
                ))}
              </div>

              <div className="grid gap-4 border-t border-slate-100 pt-5 xl:grid-cols-2">
                <ReadonlyAmount label="가맹비" value="0" />
                <ReadonlyAmount label="교육비" value="0" />

                {billing.billingType === "일반 과금" ? (
                  <>
                    <ReadonlyAmount label="최소 이용 금액" value={institution.minFee.toLocaleString("ko-KR")} />
                    {institution.serviceType === "리딩수학+과학 통합" ? (
                      <>
                        <ReadonlyAmount label="인당 이용료(1과목)" value={institution.perStudentFeeOneSubject.toLocaleString("ko-KR")} />
                        <div />
                        <ReadonlyAmount label="인당 이용료(2과목)" value={institution.perStudentFeeTwoSubjects.toLocaleString("ko-KR")} />
                      </>
                    ) : (
                      <ReadonlyAmount label="인당 이용료" value={institution.perStudentFeeOneSubject.toLocaleString("ko-KR")} />
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-5">
                      <span className="w-[125px] shrink-0 text-right text-xs text-slate-500">이벤트 과금 방식</span>
                      <ReadonlyRadio label="1년 선납" checked={billing.eventBillingMethod === "1년 선납"} />
                      <ReadonlyRadio label="월별 과금" checked={billing.eventBillingMethod === "월별 과금"} />
                    </div>
                    {billing.eventBillingMethod === "1년 선납" ? (
                      <ReadonlyAmount label="이벤트 1년 선납 이용료" value={billing.eventAnnualPrepaidFee} />
                    ) : (
                      <ReadonlyAmount label="이벤트 월 이용료" value={billing.eventMonthlyFee} />
                    )}
                    <ReadonlyField label="이벤트 시작일" value={billing.eventStartDate.replaceAll("-", ".")} />
                    <ReadonlyField label="이벤트 종료일" value={billing.eventEndDate.replaceAll("-", ".")} />
                    <ReadonlyAmount label="기본 포함 인원" value={billing.includedStudents} suffix="명" />
                    <ReadonlyAmount label="초과 인당 월 이용료" value={billing.excessMonthlyFee} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
