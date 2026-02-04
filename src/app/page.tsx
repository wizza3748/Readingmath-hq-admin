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
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-12 gap-4 text-sm text-muted-foreground mb-4">
          <div className="col-span-2">일감</div>
          <div className="col-span-8">제목</div>
          <div className="col-span-2 text-right">바로가기</div>
        </div>
        <Separator />
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-4 items-center mt-4">
            <div className="col-span-2">
              <a
                href={item.jiraUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {item.id}
              </a>
            </div>
            <div className="col-span-8">
              {item.internalUrl ? (
                <Link href={item.internalUrl} className="hover:underline">
                  {item.title}
                </Link>
              ) : (
                <span>{item.title}</span>
              )}
            </div>
            <div className="col-span-2 flex justify-end">
              {item.internalUrl && (
                <Link href={item.internalUrl}>
                  <Link2 className="h-5 w-5 text-primary hover:opacity-80" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight mb-6">
          리딩수학과학 - 본사관리자
        </h1>
        {renderWorkList(hqWorkItems)}
      </div>

      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight mb-6">
          리딩수학과학 - 기관관리자
        </h1>
        {renderWorkList(agencyWorkItems)}
      </div>
    </div>
  );
}
