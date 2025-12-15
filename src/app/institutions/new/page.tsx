import { InstitutionForm } from "@/components/app/institutions/form";

export default function NewInstitutionPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold font-headline tracking-tight">
          신규 기관 등록
        </h1>
        <p className="text-muted-foreground mt-2">
          새로운 기관 정보를 시스템에 등록합니다. * 는 필수 입력 항목입니다.
        </p>

        <InstitutionForm />
      </div>
    </div>
  );
}
