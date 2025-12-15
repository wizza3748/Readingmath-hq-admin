import { InstitutionsTable } from "@/components/app/institutions/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InstitutionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold font-headline tracking-tight">
        기관 목록
      </h1>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-headline">기관 검색</CardTitle>
          <CardDescription>
            다양한 조건으로 기관을 검색할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Filters will go here */}
          <div className="text-center text-muted-foreground py-8">
            검색 필터 영역입니다.
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <InstitutionsTable />
      </div>
    </div>
  );
}
