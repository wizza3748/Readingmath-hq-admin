"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMockInstitution, type MockInstitution } from "@/lib/institution-mock";

function Summary({ institution, onInstitutionLogin }: { institution: MockInstitution; onInstitutionLogin?: () => void }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white px-7 py-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">{institution.name}</h2>
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-500">{institution.serviceStatus}</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p>
              대표선생님&nbsp;: <span className="text-slate-500">{institution.ownerName}</span>
              <span className="mx-2 text-slate-200">|</span>
              아이디&nbsp;: <span className="text-slate-500">{institution.loginId}</span>
              <span className="mx-2 text-slate-200">|</span>
              연락처&nbsp;: <span className="text-slate-500">{institution.ownerContact}</span>
            </p>
            <p>
              등록 선생님 수&nbsp;: <span className="text-slate-500">{institution.teacherCount}</span>
              <span className="mx-2 text-slate-200">|</span>
              사용 학생 수&nbsp;: <span className="text-slate-500">{institution.studentCount}</span>
              <span className="mx-2 text-slate-200">|</span>
              포인트&nbsp;: <span className="text-slate-500">{institution.paidPoints}P ({institution.freePoints}P)</span>
            </p>
            <p>
              기관 등록일&nbsp;: <span className="text-slate-500">{institution.createdAt}</span>
              <span className="mx-2 text-slate-200">|</span>
              최근 수정일&nbsp;: <span className="text-slate-500">{institution.updatedAt}</span>
              <span className="mx-2 text-slate-200">|</span>
              기관코드&nbsp;: <span className="text-slate-500">{institution.institutionCode}</span>
              <Button type="button" variant="outline" size="sm" className="ml-2 h-7 border-blue-200 px-2 text-xs text-blue-500">↗ 바로가기</Button>
            </p>
          </div>
        </div>
        <div className="flex gap-2 lg:pt-3">
          <Button type="button" onClick={onInstitutionLogin} className="bg-emerald-400 hover:bg-emerald-500">기관 로그인</Button>
          <Button type="button" className="bg-rose-500 hover:bg-rose-600">기관 삭제</Button>
        </div>
      </div>
    </section>
  );
}

export default function InstitutionDetailLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname.split("/");
  const institutionId = pathSegments[2];
  const activeTab = pathSegments[3] || "info";
  const institution = getMockInstitution(institutionId);

  const handleTabChange = (value: string) => {
    if (institutionId === "1238" && value === "students") {
      router.push("/admin/student-list");
      return;
    }
    router.push(value === "info" ? `/institutions/${institutionId}` : `/institutions/${institutionId}/${value}`);
  };

  if (!institution) {
    return (
      <div className="p-8">
        <div className="rounded-xl border bg-white p-10 text-center">
          <h1 className="text-xl font-bold">기관 정보를 찾을 수 없습니다.</h1>
          <Button className="mt-5" onClick={() => router.push("/institutions")}>기관 목록</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">기관상세</h1>
        <p className="mt-1 text-xs text-slate-400">Home&nbsp; - &nbsp;기관관리&nbsp; - &nbsp;기관상세</p>
      </div>

      <Summary
        institution={institution}
        onInstitutionLogin={institution.id === "1238" ? () => router.push("/admin/institution-profile") : undefined}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="rounded-xl border border-slate-100 bg-white px-6 shadow-sm">
          <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0">
            {[
              ["info", "기관정보"],
              ["students", "학생목록"],
              ["teachers", "선생님목록"],
              ["points", "포인트내역"],
              ["payments", "결제내역"],
              ["inquiries", "문의내역"],
              ["logs", "활동로그"],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="rounded-none border-b-2 border-transparent px-3 py-4 text-sm text-slate-400 shadow-none data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:text-sky-500 data-[state=active]:shadow-none">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value={activeTab} forceMount className="mt-5">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
