import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link2 } from "lucide-react";

type WorkItem = {
  id: string;
  jiraUrl: string;
  title: string;
  internalUrl?: string;
  isNew?: boolean;
};

const hqWorkItems: WorkItem[] = [
  {
    id: "RM-429",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-429",
    title: "[본사] 문제은행 과제 출력 기능 추가",
    internalUrl: "/content/science-question-bank/499?tab=questions",
    isNew: true,
  },
  {
    id: "RM-422",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-422",
    title: "[본사] 학습운영관리 > 과제 현황",
    internalUrl: "/learning-operations/task-status",
    isNew: true,
  },
  {
    id: "RM-267",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-267",
    title: "[본사] 지사관리 및 지사 정산 조회 기능 개발",
    internalUrl: "/branches",
  },
  {
    id: "RM-263",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-263",
    title: "[본사] 기관 서비스 변경 예약 기능 확장",
    internalUrl: "/institutions/zhQ9cSA29ExPK4FlcSDH",
  },
  {
    id: "RM-236",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-236",
    title: "[본사/프론트] 리딩과학 문제은행/시험대비",
    internalUrl: "/content/science-question-bank",
  },
  {
    id: "RM-235",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-235",
    title: "[본사] 선생님관리(B2C) 주간학습알림 화면 개발",
    internalUrl: "/b2c/weekly-notification",
  },
  {
    id: "RM-226",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-226",
    title: "[본사] 공동구매 운영 시스템",
    internalUrl: "/admin/groupbuy",
  },
  {
    id: "RM-203",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-203",
    title: "선생님관리자(B2C) 학습상담",
    internalUrl: "/b2c/learning-counseling-detail",
  },
  {
    id: "RM-201",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-201",
    title: "과학탐구력 진단평가 보고서 샘플(과학)",
    internalUrl: "/content/diagnostic-test-report-samples",
  },
  {
    id: "RM-198",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-198",
    title: "[본사] 콘텐츠관리 > 진단평가관리(과학)",
    internalUrl: "/content/diagnostic-tests",
  },
  {
    id: "RM-133",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-133",
    title: "리딩수학과학 기관목록 테스트",
    internalUrl: "/institutions",
  },
];

const agencyWorkItems: WorkItem[] = [
  {
    id: "RM-402",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-402",
    title: "[기관] 학생상세 > 시험대비 탭",
    internalUrl: "/admin/student-list/s1?tab=exam-prep",
    isNew: true,
  },
  {
    id: "RM-360",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-360",
    title: "[기관] 과제 센터",
    internalUrl: "/admin/task-center",
    isNew: true,
  },
  {
    id: "RM-383",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-383",
    title: "[기관] 선생님별 담당 반 설정",
    internalUrl: "/admin/teacher-list",
  },
  {
    id: "RM-237",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-237",
    title: "[기관] 학습내역 기능 개선",
    internalUrl: "/admin/learning-history",
  },
];

const frontWorkItems: WorkItem[] = [
  {
    id: "RM-362",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-362",
    title: "[프론트] 시험 대비 v2",
    internalUrl: "/content/math-exam-prep",
    isNew: true,
  },
  {
    id: "RM-361",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-361",
    title: "[프론트] 과제 센터",
    internalUrl: "/content/math-home",
    isNew: true,
  },
  {
    id: "RM-293",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-293",
    title: "[프론트] 공통 커리큘럼 레이어 수정 - 유형도전 영역 추가 (UI 설계)",
    internalUrl: "/content/exam-prep/common-curriculum",
  },
  {
    id: "RM-236",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-236",
    title: "[프론트] 리딩과학 시험대비",
    internalUrl: "/content/science-home",
  },
  {
    id: "RM-236",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-236",
    title: "[프론트] 리딩과학 시험대비 - 훈련 완료 화면",
    internalUrl: "/content/exam-prep/mock/training-complete",
  },
  {
    id: "RM-236",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-236",
    title: "[프론트] 리딩과학 시험대비 - 훈련 결과 화면",
    internalUrl: "/content/exam-prep/mock/training-result",
  },
];

export default function WorkListPage() {
  const renderWorkList = (items: WorkItem[]) => (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-muted-foreground mb-4 px-2">
          <div className="col-span-3">일감 ID</div>
          <div className="col-span-9">제목</div>
        </div>
        <Separator />
        <div className="space-y-1 mt-2">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.internalUrl}`}
              className={`grid grid-cols-12 gap-4 items-center p-2 rounded-md transition-colors ${
                item.isNew
                  ? "bg-amber-50 hover:bg-amber-100 border border-amber-200"
                  : "hover:bg-muted"
              }`}
            >
              <div className="col-span-3 font-mono text-sm">
                <a
                  href={item.jiraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hover:underline font-semibold ${
                    item.isNew ? "text-amber-600" : "text-muted-foreground"
                  }`}
                >
                  {item.id}
                </a>
                {item.isNew && (
                  <span className="ml-1.5 inline-block text-[10px] font-bold uppercase tracking-wide bg-amber-500 text-white px-1.5 py-0.5 rounded-full leading-none align-middle">
                    NEW
                  </span>
                )}
              </div>
              <div className="col-span-9">
                {item.internalUrl ? (
                  <Link
                    href={item.internalUrl}
                    className={`text-base font-semibold hover:underline transition-colors block truncate ${
                      item.isNew ? "text-amber-700" : ""
                    }`}
                  >
                    {item.title}
                  </Link>
                ) : (
                  <a
                    href={item.jiraUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-base font-semibold hover:underline transition-colors block truncate ${
                      item.isNew ? "text-amber-700" : ""
                    }`}
                  >
                    {item.title}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold font-headline tracking-tight border-l-4 border-primary pl-3">
            본사관리자
          </h2>
          {renderWorkList(hqWorkItems)}
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold font-headline tracking-tight border-l-4 border-primary pl-3">
            기관관리자
          </h2>
          {renderWorkList(agencyWorkItems)}
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold font-headline tracking-tight border-l-4 border-indigo-500 pl-3">
            프론트
          </h2>
          {renderWorkList(frontWorkItems)}
        </div>
      </div>
    </div>
  );
}
