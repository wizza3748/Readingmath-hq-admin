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
};

const hqWorkItems: WorkItem[] = [
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
    id: "RM-237",
    jiraUrl: "https://sloop-dev.atlassian.net/browse/RM-237",
    title: "[기관] 학습내역 기능 개선",
    internalUrl: "/admin/learning-history",
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
            <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-2 rounded-md hover:bg-muted transition-colors">
              <div className="col-span-3 font-mono text-sm text-muted-foreground">
                <a
                  href={item.jiraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {item.id}
                </a>
              </div>
              <div className="col-span-9">
                {item.internalUrl ? (
                  <Link href={item.internalUrl} className="text-base font-semibold hover:underline transition-colors block truncate">
                    {item.title}
                  </Link>
                ) : (
                  <a
                    href={item.jiraUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-semibold hover:underline transition-colors block truncate"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}
