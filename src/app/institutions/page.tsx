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
      
      <InstitutionsTable />
    </div>
  );
}
