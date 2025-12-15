
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Info, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { useFirestore } from "@/firebase";
import { updateInstitution, deleteInstitution, type Institution } from "@/lib/institutions";
import { Skeleton } from "@/components/ui/skeleton";

declare global {
  interface Window {
    daum: any;
  }
}

const branchList = [
  "강남", "강북", "강서", "강원", "경남", "경산", "공주", "광주", "교육다움", 
  "구리", "구미", "김포", "대구", "대전", "동부", "동작", "부산", "본사", 
  "성남", "안산", "안양", "울산", "의정부", "인천", "인천B", "일산", "전주", 
  "제주", "천안", "청주", "평택안성", "포항", "화성"
];


const formSchema = z
  .object({
    // 기관 정보
    name: z.string().min(1, "기관명을 입력해주세요."),
    ownerName: z.string().min(1, "기관장명을 입력해주세요."),
    ownerContact: z
      .string()
      .min(1, "기관장 연락처를 입력해주세요.")
      .regex(/^[0-9-]+$/, "숫자와 하이픈만 입력해주세요."),
    email: z.string().email("올바른 이메일 형식이 아닙니다.").optional().or(z.literal("")),
    branch1: z.string().min(1, "지사1을 선택해주세요."),
    branch2: z.string().optional(),
    everydayKoreanName: z.string().optional(),
    dokdoName: z.string().optional(),
    zipCode: z.string().optional(),
    address: z.string().optional(),
    addressDetail: z.string().optional(),
    managerName: z.string().optional(),
    managerContact: z.string().optional(),
    attachment: z.any().optional(),
    lastContractDate: z.date().optional().nullable(),

    // 서비스 정보
    serviceStatus: z.enum(["일시정지", "정상", "무료사용", "미납정지"]),
    franchiseType: z
      .enum(["가맹전", "스탠다드", "슬림", "학교"])
      .optional(),
    serviceType: z.enum(["수학+과학", "수학", "과학"]),
    minFee: z.string().min(1, "최소 이용 금액을 입력해주세요."),
    perStudentFee: z.string().optional(),
    perStudentFee1: z.string().optional(),
    perStudentFee2: z.string().optional(),
    
    // 메모
    memo: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.serviceType === "수학+과학") {
      if (!data.perStudentFee1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "인당 이용료(1과목)를 입력해주세요.",
          path: ["perStudentFee1"],
        });
      }
      if (!data.perStudentFee2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "인당 이용료(2과목)를 입력해주세요.",
          path: ["perStudentFee2"],
        });
      }
    } else {
      if (!data.perStudentFee) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "인당 이용료를 입력해주세요.",
          path: ["perStudentFee"],
        });
      }
    }
  });
  
type FormValues = z.infer<typeof formSchema>;

const formatCurrency = (value: string | number | undefined | null) => {
  if (value === undefined || value === null) return "";
  const stringValue = String(value);
  const numberValue = parseInt(stringValue.replace(/[^0-9]/g, ""), 10);
  if (isNaN(numberValue)) return "";
  return numberValue.toLocaleString();
};


const CurrencyInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }>(
    ({ value, onChange, suffix = "원", ...props }, ref) => {
        const [internalValue, setInternalValue] = React.useState(value);

        React.useEffect(() => {
            setInternalValue(value);
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;
            const numericValue = value.replace(/[^0-9]/g, "");
            const formattedValue = numericValue ? parseInt(numericValue, 10).toLocaleString() : '';
            
            setInternalValue(formattedValue);

            if (onChange) {
                const event = {
                    ...e,
                    target: { ...e.target, value: formattedValue }
                };
                onChange(event as React.ChangeEvent<HTMLInputElement>);
            }
        };

        const displayValue = internalValue ? `${internalValue}${suffix}` : '';

        return <Input value={displayValue} onChange={handleChange} {...props} ref={ref} />;
    }
);
CurrencyInput.displayName = "CurrencyInput";

function InstitutionEditFormContent({ institution }: { institution: Institution }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  React.useEffect(() => {
    if (institution) {
      const fees = institution.fees || {};
      form.reset({
        name: institution.name || "",
        ownerName: institution.ownerName || "",
        ownerContact: institution.ownerContact || "",
        email: institution.email || "",
        branch1: institution.branch1 || "",
        branch2: institution.branch2 || "",
        everydayKoreanName: institution.everydayKoreanName || "",
        dokdoName: institution.dokdoName || "",
        zipCode: institution.address?.zipCode || "",
        address: institution.address?.address || "",
        addressDetail: institution.address?.addressDetail || "",
        managerName: institution.managerName || "",
        managerContact: institution.managerContact || "",
        lastContractDate: institution.lastContractDate?.toDate() || null,
        serviceStatus: institution.serviceStatus || "정상",
        franchiseType: institution.franchiseType || "가맹전",
        serviceType: institution.serviceType || "수학+과학",
        minFee: formatCurrency(fees.minFee),
        perStudentFee: formatCurrency(fees.perStudentFee),
        perStudentFee1: formatCurrency(fees.perStudentFee1),
        perStudentFee2: formatCurrency(fees.perStudentFee2),
        memo: institution.memo || "",
      });
    }
  }, [institution, form]);
  
  const serviceType = form.watch("serviceType");
  const selectedBranch1 = form.watch("branch1");

  const handleAddressSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function (data: any) {
          form.setValue("zipCode", data.zonecode);
          form.setValue("address", data.roadAddress);
          form.setFocus("addressDetail");
        },
      }).open();
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!firestore || !institution) return;
    
    try {
      await updateInstitution(firestore, institution.id, data);
      toast({
        title: "저장되었습니다.",
        description: `${data.name} 기관 정보가 성공적으로 수정되었습니다.`,
      });
    } catch (error) {
      console.error("Error updating institution:", error);
      toast({
        variant: "destructive",
        title: "저장 실패",
        description: "기관 정보 수정 중 오류가 발생했습니다.",
      });
    }
  };

  const handleDelete = async () => {
    if (!firestore || !institution) return;
    try {
        await deleteInstitution(firestore, institution.id);
        toast({
            title: "삭제되었습니다.",
            description: `${institution.name} 기관 정보가 삭제되었습니다.`
        });
        router.push("/institutions");
    } catch (error) {
        console.error("Error deleting institution:", error);
        toast({
            variant: "destructive",
            title: "삭제 실패",
            description: "기관 정보 삭제 중 오류가 발생했습니다."
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>기관 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>기관명 *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>기관장명 *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownerContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>기관장 연락처 *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="010-1234-5678" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="admin@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="everydayKoreanName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>매일국어 기관명</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dokdoName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>독도 기관명</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="md:col-span-2">
              <FormLabel>주소</FormLabel>
              <div className="flex gap-2 mt-2">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormControl>
                        <Input placeholder="우편번호" {...field} readOnly />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="button" variant="outline" onClick={handleAddressSearch}>주소검색</Button>
              </div>
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormControl>
                    <Input placeholder="기본 주소" {...field} readOnly />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressDetail"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormControl>
                    <Input placeholder="상세 주소를 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="managerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>담당자명</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="managerContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>담당자 연락처</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="010-1234-5678" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attachment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>첨부파일</FormLabel>
                   <FormControl>
                    <div className="relative">
                      <Input type="file" className="pl-12" onChange={(e) => field.onChange(e.target.files)} />
                       <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                         <Upload className="h-5 w-5 text-gray-400" />
                       </div>
                    </div>
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastContractDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>최근 계약 갱신일</FormLabel>
                   <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>날짜를 선택하세요</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="branch1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>지사1 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="1차 지사를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branchList.map(branch => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="branch2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>지사2</FormLabel>
                   <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={!selectedBranch1}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={!selectedBranch1 ? "지사1을 먼저 선택하세요" : "2차 지사를 선택하세요"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {branchList
                        .filter(branch => branch !== selectedBranch1)
                        .map(branch => (
                          <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>서비스 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-start">
                <Button type="button" variant="outline" disabled>서비스 변경 예약</Button>
            </div>
            <FormField
              control={form.control}
              name="serviceStatus"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>서비스 상태 *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex items-center space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="일시정지" />
                        </FormControl>
                        <FormLabel className="font-normal">일시정지</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="정상" />
                        </FormControl>
                        <FormLabel className="font-normal">정상</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="무료사용" />
                        </FormControl>
                        <FormLabel className="font-normal">무료사용</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="미납정지" />
                        </FormControl>
                        <FormLabel className="font-normal">미납정지</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="franchiseType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>가맹 타입</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex items-center space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="가맹전" />
                        </FormControl>
                        <FormLabel className="font-normal">가맹전</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="스탠다드" />
                        </FormControl>
                        <FormLabel className="font-normal">스탠다드</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="슬림" />
                        </FormControl>
                        <FormLabel className="font-normal">슬림</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="학교" />
                        </FormControl>
                        <FormLabel className="font-normal">학교</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>서비스 타입 *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValuechange={field.onChange}
                      value={field.value}
                      className="flex items-center space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="수학+과학" />
                        </FormControl>
                        <FormLabel className="font-normal">수학+과학</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="수학" />
                        </FormControl>
                        <FormLabel className="font-normal">수학</FormLabel>                      </FormItem>
                       <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="과학" />
                        </FormControl>
                        <FormLabel className="font-normal">과학</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormItem>
                  <FormLabel>가맹비</FormLabel>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="가맹비 금액 입력" disabled/>
                    <Button type="button" disabled>가맹비 입금 처리</Button>
                  </div>
                </FormItem>
                 <FormItem>
                  <FormLabel>교육비</FormLabel>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="교육비 금액 입력" disabled/>
                    <Button type="button" disabled>교육비 입금 처리</Button>
                  </div>
                </FormItem>
                <FormField
                  control={form.control}
                  name="minFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        최소 이용 금액 *
                        <TooltipProvider>
                           <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 cursor-help">
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>최소 이용 금액이 없는 경우 0을 반드시 입력해 주세요.</p>
                              </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                         <Controller
                            control={form.control}
                            name="minFee"
                            render={({ field: { onChange, value } }) => (
                                <CurrencyInput 
                                    value={value}
                                    onChange={onChange}
                                    placeholder="최소 이용 금액이 없는 경우 0을 반드시 입력해 주세요"
                                />
                            )}
                         />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div />

                {serviceType === "수학+과학" ? (
                    <>
                        <FormField
                            control={form.control}
                            name="perStudentFee1"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>인당 이용료(1과목) *</FormLabel>
                                <FormControl>
                                    <Controller
                                        control={form.control}
                                        name="perStudentFee1"
                                        render={({ field: { onChange, value } }) => (
                                            <CurrencyInput 
                                                value={value}
                                                onChange={onChange}
                                            />
                                        )}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="perStudentFee2"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>인당 이용료(2과목) *</FormLabel>
                                <FormControl>
                                    <Controller
                                        control={form.control}
                                        name="perStudentFee2"
                                        render={({ field: { onChange, value } }) => (
                                            <CurrencyInput 
                                                value={value}
                                                onChange={onChange}
                                            />
                                        )}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                ) : (
                    <FormField
                        control={form.control}
                        name="perStudentFee"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>인당 이용료 *</FormLabel>
                             <FormControl>
                                <Controller
                                    control={form.control}
                                    name="perStudentFee"
                                    render={({ field: { onChange, value } }) => (
                                        <CurrencyInput 
                                            value={value}
                                            onChange={onChange}
                                        />
                                    )}
                                />
                             </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>메모</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="기관 관련 메모를 입력하세요. (내부 관리용)"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-between gap-2">
          <div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>기관 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                        삭제 시 해당 기관 정보 및 모든 서비스 이용 내역이 모두 영구 삭제됩니다. 진행하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "저장 중..." : "저장"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/institutions')}>
                목록
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>기관 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({length: 14}).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>서비스 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <Skeleton className="h-10 w-40" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-4"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div>
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-4"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div>
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-4"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>메모</CardTitle>
          </CardHeader>
          <CardContent>
             <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
    </div>
  )
}


export function InstitutionEditForm({ institution, loading }: { institution: Institution | null, loading: boolean }) {
    if (loading) {
        return <FormSkeleton />;
    }

    if (!institution) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>오류</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>기관 정보를 불러올 수 없습니다. 기관 목록으로 돌아가 다시 시도해주세요.</p>
                    <Button onClick={() => window.history.back()} className="mt-4">
                        목록으로 돌아가기
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return <InstitutionEditFormContent institution={institution} />;
}

    