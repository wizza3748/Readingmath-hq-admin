import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InstitutionInfoPage() {
  return (
    <Card>
        <CardHeader>
            <CardTitle>기관정보</CardTitle>
            <CardDescription>기관의 상세 정보를 확인하고 수정할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>기관정보 상세 내용이 여기에 표시됩니다.</p>
        </CardContent>
    </Card>
  );
}

    