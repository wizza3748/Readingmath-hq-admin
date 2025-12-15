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
  CardDescription,
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
import { Calendar as CalendarIcon, Info, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React from "react";

const formSchema = z
  .object({
    // 기관 정보
    name: z.string().min(1, "기관명을 입력해주세요."),
    ownerName: z.string().min(1, "기관장명을 입력해주세요."),
    loginId: z.string().min(1, "아이디를 입력해주세요."),
    password: z.string().min(1, "비밀번호를 입력해주세요."),
    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해주세요."),
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
    lastContractDate: z.date().optional(),

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
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
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

const formatCurrency = (value: string | undefined) => {
  if (!value) return "";
  const numberValue = parseInt(value.replace(/[^0-9]/g, ""), 10);
  if (isNaN(numberValue)) return "";
  return numberValue.toLocaleString();
};

const CurrencyInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }>(
  ({ value, onChange, suffix = "원", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      const numericValue = value.replace(/[^0-9]/g, "");
      const formattedValue = formatCurrency(numericValue);
      
      const event = {
        ...e,
        target: { ...e.target, value: formattedValue }
      };

      if (onChange) {
        onChange(event as React.ChangeEvent<HTMLInputElement>);
      }
    };
    
    const displayValue = value ? `${value}${suffix}` : '';

    return <Input value={displayValue} onChange={handleChange} {...props} ref={ref} />;
  }
);
CurrencyInput.displayName = "CurrencyInput";

export function InstitutionForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceStatus: "일시정지",
      serviceType: "수학+과학",
      minFee: "0",
    },
  });
  
  const serviceType = form.watch("serviceType");

  const onSubmit = (data: FormValues) => {
    console.log(data);
    toast({
      title: "저장되었습니다.",
      description: `${data.name} 기관 정보가 성공적으로 등록되었습니다.`,
    });
    router.push("/institutions");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
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
              name="loginId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>아이디 *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <Button type="button" variant="outline">
                      중복확인
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 *</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 확인 *</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
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
              name="branch1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>지사1 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="1차 지사를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="본사">본사</SelectItem>
                      <SelectItem value="연구소">연구소</SelectItem>
                      <SelectItem value="서울">서울</SelectItem>
                      <SelectItem value="경기">경기</SelectItem>
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
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="2차 지사를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       <SelectItem value="강남">강남</SelectItem>
                       <SelectItem value="분당">분당</SelectItem>
                    </SelectContent>
                  </Select>
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
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>주소</FormLabel>
                  <div className="flex gap-2">
                     <FormControl>
                        <Input placeholder="우편번호" {...field} />
                     </FormControl>
                    <Button type="button" variant="outline">주소검색</Button>
                  </div>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormControl>
                    <Input placeholder="기본 주소" {...field} />
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
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
            <FormField
              control={form.control}
              name="serviceStatus"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>서비스 상태 *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                      defaultValue={field.value}
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                        <FormLabel className="font-normal">수학</FormLabel>
                      </FormItem>
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
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
