"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  getInstitutionBillingSettings,
  getMockInstitution,
  type InstitutionBillingSettings,
} from "@/lib/institution-mock";

const INSTITUTION_ID = "1238";
const PROFILE_STORAGE_KEY = "institution-profile:1238";

type EditableProfile = {
  zipCode: string;
  address: string;
  addressDetail: string;
  managerName: string;
  managerContact: string;
  managerEmail: string;
};

function ReadonlyField({ label, value, className }: { label: string; value?: string | number; className?: string }) {
  return (
    <label className={`grid grid-cols-[125px_minmax(0,1fr)] items-center gap-3 ${className || ""}`}>
      <span className="text-right text-xs text-slate-500">{label}</span>
      <Input value={value ?? ""} readOnly className="h-9 bg-slate-50 text-xs text-slate-500" />
    </label>
  );
}

function EditableField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-3">
      <span className="text-right text-xs text-slate-500">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-9 bg-white text-xs" />
    </label>
  );
}

function ReadonlyValue({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-3">
      <span className="text-right text-xs text-slate-500">{label}</span>
      {badge ? (
        <span className="w-fit rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-500">{value}</span>
      ) : (
        <Input value={value} readOnly className="h-9 bg-slate-50 text-xs text-slate-500" />
      )}
    </div>
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
  const { toast } = useToast();
  const [billing, setBilling] = React.useState<InstitutionBillingSettings | null>(null);
  const initialProfile = React.useMemo<EditableProfile>(() => ({
    zipCode: institution?.zipCode || "",
    address: institution?.address || "",
    addressDetail: institution?.addressDetail || "",
    managerName: institution?.managerName || "",
    managerContact: institution?.managerContact || "",
    managerEmail: institution?.email || "",
  }), [institution]);
  const [savedProfile, setSavedProfile] = React.useState<EditableProfile>(initialProfile);
  const [profile, setProfile] = React.useState<EditableProfile>(initialProfile);

  React.useEffect(() => {
    if (!institution) return;
    setBilling(getInstitutionBillingSettings(institution));
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = { ...initialProfile, ...JSON.parse(stored) } as EditableProfile;
      setSavedProfile(parsed);
      setProfile(parsed);
    } catch { /* invalid mock profile data falls back to the fixed institution */ }
  }, [institution, initialProfile]);

  if (!institution || !billing) return null;

  const serviceStatus = billing.serviceStatusAfterEvent || institution.serviceStatus;

  const updateProfile = (key: keyof EditableProfile, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const handleAddressSearch = () => {
    if (!window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (data: { zonecode: string; roadAddress: string }) => {
        setProfile((current) => ({ ...current, zipCode: data.zonecode, address: data.roadAddress }));
      },
    }).open();
  };

  const handleSave = () => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setSavedProfile(profile);
    toast({ title: "저장되었습니다." });
  };

  const handleCancel = () => {
    setProfile(savedProfile);
  };

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
            <div className="grid grid-cols-[125px_350px_auto_1fr] items-center gap-3">
              <span className="text-right text-xs text-slate-500">우편번호</span>
              <Input value={profile.zipCode} readOnly className="h-9 bg-slate-50 text-xs text-slate-500" />
              <Button type="button" size="sm" onClick={handleAddressSearch} className="h-9 w-fit bg-lime-500 px-5 text-white hover:bg-lime-600">주소검색</Button>
            </div>
            <ReadonlyField label="주소" value={profile.address} />
            <EditableField label="상세 주소" value={profile.addressDetail} onChange={(value) => updateProfile("addressDetail", value)} />
            <div className="grid gap-4 xl:grid-cols-3">
              <EditableField label="담당자명" value={profile.managerName} onChange={(value) => updateProfile("managerName", value)} />
              <EditableField label="담당자 연락처" value={profile.managerContact} onChange={(value) => updateProfile("managerContact", value)} />
              <EditableField label="담당자 이메일" value={profile.managerEmail} onChange={(value) => updateProfile("managerEmail", value)} />
            </div>
            <div className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-3">
              <span className="text-right text-xs text-slate-500">첨부파일</span>
              <span className="text-xs text-slate-400">-</span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-6 text-base font-bold text-slate-900">서비스 정보</h3>
            <div className="space-y-5">
              <div className="grid gap-4 xl:grid-cols-2">
                <ReadonlyValue label="서비스 상태" value={serviceStatus} badge />
                <ReadonlyValue label="서비스 타입" value={institution.serviceType} />
                <ReadonlyValue label="가맹 타입" value={institution.franchiseType} />
                <ReadonlyValue label="과금 유형" value={billing.billingType} />
                {billing.billingType === "이벤트 과금" && (
                  <ReadonlyValue label="이벤트 과금 방식" value={billing.eventBillingMethod} />
                )}
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
                    <div />
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

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
            <Button type="button" variant="outline" onClick={handleCancel}>취소</Button>
            <Button type="button" onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">저장</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
