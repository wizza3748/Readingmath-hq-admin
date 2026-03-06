
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { format, addDays, startOfToday } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { updateServiceReservation, Institution } from "@/lib/db";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";


const formSchema = z.object({
  effectiveDate: z.date({
    required_error: "변경 적용일을 선택해주세요.",
  }).refine((date) => date > startOfToday(), {
    message: "예약일자는 오늘 이후 날짜만 선택 가능합니다.",
  }),
  serviceStatus: z.enum(["일시정지", "정상", "무료사용"]),
  serviceType: z.enum(["수학+과학", "수학", "과학"]),
  reason: z.string().optional(),
  minFee: z.string().min(1, "최소 이용 금액을 입력해주세요."),
  perStudentFee: z.string().optional(),
  perStudentFee1: z.string().optional(),
  perStudentFee2: z.string().optional(),
}).superRefine((data, ctx) => {
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

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return "";
  return value.toLocaleString();
};

export function ServiceChangeModal({
  children,
  institutionId,
  institution,
}: {
  children: React.ReactNode;
  institutionId: string;
  institution: Institution;
}) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [open, setOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      effectiveDate: undefined,
      serviceStatus: (institution.serviceStatus === "미납정지" ? "정상" : institution.serviceStatus) as any,
      serviceType: institution.serviceType,
      reason: "",
      minFee: formatCurrency(institution.fees?.minFee) || "0",
      perStudentFee: formatCurrency(institution.fees?.perStudentFee),
      perStudentFee1: formatCurrency(institution.fees?.perStudentFee1),
      perStudentFee2: formatCurrency(institution.fees?.perStudentFee2),
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        effectiveDate: undefined,
        serviceStatus: (institution.serviceStatus === "미납정지" ? "정상" : institution.serviceStatus) as any,
        serviceType: institution.serviceType,
        reason: "",
        minFee: formatCurrency(institution.fees?.minFee) || "0",
        perStudentFee: formatCurrency(institution.fees?.perStudentFee),
        perStudentFee1: formatCurrency(institution.fees?.perStudentFee1),
        perStudentFee2: formatCurrency(institution.fees?.perStudentFee2),
      });
    }
  }, [open, institution, form]);


  const onSubmit = async (data: FormValues) => {
    if (!firestore) {
      toast({ variant: "destructive", title: "오류", description: "데이터베이스에 연결할 수 없습니다." });
      return;
    }
    try {
      // Create a copy without empty reason if not provided
      const submissionData: any = {
        ...data,
        franchiseType: institution.franchiseType || "가맹전"
      };
      if (!submissionData.reason) delete submissionData.reason;

      await updateServiceReservation(firestore, institutionId, submissionData);
      toast({
        title: "서비스 변경 예약 완료",
        description: `${format(data.effectiveDate, "yyyy-MM-dd")}부터 서비스가 변경됩니다.`,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating service reservation:", error);
      toast({
        variant: "destructive",
        title: "예약 실패",
        description: "서비스 변경 예약 중 오류가 발생했습니다.",
      });
    }
  };

  const tomorrow = addDays(startOfToday(), 1);
  const serviceType = form.watch("serviceType");

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold">서비스 변경 예약</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="effectiveDate"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[140px,1fr] items-center space-y-0 gap-4">
                  <FormLabel className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    <span className="text-red-500 mr-1">*</span>예약일자
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal border-gray-200",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                          {field.value ? (
                            format(field.value, "yyyy-MM-dd")
                          ) : (
                            <span>2026-03-10</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date <= startOfToday()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="col-start-2" />
                </FormItem>
              )}
            />

            <Separator className="my-2 bg-slate-100" />

            <FormField
              control={form.control}
              name="serviceStatus"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[100px,1fr] items-center space-y-0 gap-4">
                  <FormLabel className="text-sm font-medium text-gray-700">서비스 상태</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex items-center space-x-6"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="무료사용" />
                        </FormControl>
                        <FormLabel className={cn("font-normal cursor-pointer", field.value === "무료사용" && "text-blue-600 font-bold")}>무료사용</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="정상" />
                        </FormControl>
                        <FormLabel className={cn("font-normal cursor-pointer", field.value === "정상" && "text-blue-600 font-bold")}>정상</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="일시정지" />
                        </FormControl>
                        <FormLabel className={cn("font-normal cursor-pointer", field.value === "일시정지" && "text-blue-600 font-bold")}>일시정지</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage className="col-start-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[100px,1fr] items-center space-y-0 gap-4">
                  <FormLabel className="text-sm font-medium text-gray-700">서비스 타입</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="서비스 타입을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="수학">리딩수학</SelectItem>
                      <SelectItem value="과학">리딩과학</SelectItem>
                      <SelectItem value="수학+과학">리딩수학+과학 통합</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-start-2" />
                </FormItem>
              )}
            />

            <Separator className="my-2 bg-slate-100" />

            {/* Fee Fields */}
            <FormField
              control={form.control}
              name="minFee"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[100px,1fr] items-center space-y-0 gap-4">
                  <FormLabel className="flex items-center text-sm font-medium text-gray-700">
                    최소 이용 금액 <span className="text-red-500 ml-1">*</span>
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
                          placeholder="최소 이용 금액"
                          className="border-gray-200"
                        />
                      )}
                    />
                  </FormControl>
                  <FormMessage className="col-start-2" />
                </FormItem>
              )}
            />

            {serviceType === "수학+과학" ? (
              <>
                <FormField
                  control={form.control}
                  name="perStudentFee1"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-[100px,1fr] items-center space-y-0 gap-4">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        인당 이용료(1과목) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Controller
                          control={form.control}
                          name="perStudentFee1"
                          render={({ field: { onChange, value } }) => (
                            <CurrencyInput
                              value={value}
                              onChange={onChange}
                              className="border-gray-200"
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage className="col-start-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="perStudentFee2"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-[100px,1fr] items-center space-y-0 gap-4">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        인당 이용료(2과목) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Controller
                          control={form.control}
                          name="perStudentFee2"
                          render={({ field: { onChange, value } }) => (
                            <CurrencyInput
                              value={value}
                              onChange={onChange}
                              className="border-gray-200"
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage className="col-start-2" />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <FormField
                control={form.control}
                name="perStudentFee"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[100px,1fr] items-center space-y-0 gap-4">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      인당 이용료 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="perStudentFee"
                        render={({ field: { onChange, value } }) => (
                          <CurrencyInput
                            value={value}
                            onChange={onChange}
                            className="border-gray-200"
                          />
                        )}
                      />
                    </FormControl>
                    <FormMessage className="col-start-2" />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="grid grid-cols-[100px,1fr] items-start space-y-0 gap-4">
                  <FormLabel className="text-sm font-medium text-gray-700 mt-2">사유</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="서비스 변경 사유를 입력하세요."
                      className="min-h-[120px] resize-none border-gray-200"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-start-2" />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-8 justify-end gap-2 flex-row">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-gray-200 text-gray-600 px-8">
                  취소
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-8"> 확인 </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

