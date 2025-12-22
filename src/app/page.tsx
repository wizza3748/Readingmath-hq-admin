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
  internalUrl: string;
};

const workItems: WorkItem[] = [
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

export default function WorkListPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold font-headline tracking-tight">
        일감 목록
      </h1>
      <div className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-12 gap-4 text-sm text-muted-foreground mb-4">
              <div className="col-span-2">일감</div>
              <div className="col-span-8">제목</div>
              <div className="col-span-2 text-right">바로가기</div>
            </div>
            <Separator />
            {workItems.map((item) => (
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
                <div className="col-span-8">{item.title}</div>
                <div className="col-span-2 flex justify-end">
                  <Link href={item.internalUrl}>
                    <Link2 className="h-5 w-5 text-muted-foreground hover:text-primary" />
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
