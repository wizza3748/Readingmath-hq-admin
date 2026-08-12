import { InstitutionsTable } from "@/components/app/institutions/table";

export default function InstitutionsPage() {
  return (
    <div className="min-w-0 space-y-5 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">기관목록</h1>
        <p className="mt-1 text-xs text-slate-400">Home&nbsp; - &nbsp;기관관리&nbsp; - &nbsp;기관목록</p>
      </div>
      <InstitutionsTable />
    </div>
  );
}
