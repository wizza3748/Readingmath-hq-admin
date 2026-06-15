
"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useFirebase } from "@/firebase";
import { getInstitution, type Institution } from "@/lib/db";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

function InfoItem({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-sm text-muted-foreground">{label}</div>
      {children ? (
        <div className="font-semibold">{children}</div>
      ) : (
        <div className="font-semibold">{value || "-"}</div>
      )}
    </div>
  );
}

function BasicInfoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-6">
            {Array.from({length: 9}).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-24" />
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BasicInfo({ institution, loading }: { institution: Institution | null, loading: boolean }) {
  if (loading) {
    return <BasicInfoSkeleton />;
  }
  if (!institution) {
    return null;
  }

  const {
    name,
    branch1,
    ownerContact,
    createdAt,
    updatedAt,
    id,
  } = institution;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    // Firestore Timestamp or JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("ko-KR");
  };

  const institutionCode = id ? id.substring(0, 6).toUpperCase() : "";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="font-headline text-2xl">{name}</CardTitle>
          <Button>기관 로그인</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-6">
          <InfoItem label="지사명" value={branch1} />
          <InfoItem label="대표 연락처" value={ownerContact} />
          <InfoItem label="등록 선생님 수" value={0} />
          <InfoItem label="사용 학생 수" value={0} />
          <InfoItem label="유료 포인트" value="0" />
          <InfoItem label="무료 포인트" value="0" />
          <InfoItem label="기관 등록일" value={formatDate(createdAt)} />
          <InfoItem label="최근 수정일" value={formatDate(updatedAt)} />
          <InfoItem label="기관 코드">
            <div className="flex items-center gap-2">
              <span>{institutionCode}</span>
              <Button variant="outline" size="sm">바로가기</Button>
            </div>
          </InfoItem>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstitutionDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [institution, setInstitution] = React.useState<Institution | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { firestore } = useFirebase() ?? {};
  
  const pathSegments = pathname.split('/');
  const institutionId = pathSegments[2];
  const activeTab = !pathSegments[3] ? 'info' : pathSegments[3];


  const handleTabChange = (value: string) => {
    if (value === 'info') {
      router.push(`/institutions/${institutionId}`);
    } else {
      router.push(`/institutions/${institutionId}/${value}`);
    }
  };
  
  React.useEffect(() => {
    if (!firestore || !institutionId) {
      if(!institutionId) setLoading(false);
      return;
    };

    setLoading(true);
    const unsubscribe = getInstitution(firestore, institutionId, (data) => {
      setInstitution(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [firestore, institutionId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <BasicInfo institution={institution} loading={loading} />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="sticky top-16 bg-background z-10 py-2">
            <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="info">기관정보</TabsTrigger>
                <TabsTrigger value="students">학생목록</TabsTrigger>
                <TabsTrigger value="teachers">선생님목록</TabsTrigger>
                <TabsTrigger value="points">포인트내역</TabsTrigger>
                <TabsTrigger value="payments">결제내역</TabsTrigger>
                <TabsTrigger value="inquiries">문의내역</TabsTrigger>
                <TabsTrigger value="logs">활동로그</TabsTrigger>
            </TabsList>
        </div>
        <div className="mt-6">
            <TabsContent value={activeTab} forceMount>
              {children}
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
