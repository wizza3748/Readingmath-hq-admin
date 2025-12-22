import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DiagnosticTestsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold font-headline tracking-tight mb-6">
        진단평가관리(과학)
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>콘텐츠 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <p>진단평가관리(과학) 콘텐츠가 여기에 표시됩니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
