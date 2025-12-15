import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold font-headline tracking-tight">
        대시보드
      </h1>
      <div className="mt-6 grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">환영합니다!</CardTitle>
            <CardDescription>
              리딩수학과학 본사 관리자 페이지에 오신 것을 환영합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>관리자님 로그인하셨습니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
