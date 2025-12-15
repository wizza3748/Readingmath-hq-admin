
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
import { Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  effectiveDate: z.date({
    required_error: "변경 적용일을 선택해주세요.",
  }),
  serviceStatus: z.enum(["일시정지", "정상", "무료사용", "미납정지"]),
  franchiseType: z.enum(["가맹전", "스탠다드", "슬림", "학교"]),
  serviceType: z.enum(["수학+과학", "수학", "과학"]),
});

type FormValues = z.infer<typeof formSchema>;

export function ServiceChangeModal({
  children,
  currentService,
}: {
  children: React.ReactNode;
  currentService: {
    serviceStatus: "일시정지" | "정상" | "무료사용" | "미납정지";
    franchiseType?: "가맹전" | "스탠다드" | "슬림" | "학교";
    serviceType: "수학+과학" | "수학" | "과학";
  };
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      effectiveDate: undefined,
      serviceStatus: currentService.serviceStatus,
      franchiseType: currentService.franchiseType || "가맹전",
      serviceType: currentService.serviceType,
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Service change reservation:", data);
    toast({
      title: "서비스 변경 예약 완료",
      description: `${format(data.effectiveDate, "yyyy-MM-dd")}부터 서비스가 변경됩니다.`,
    });
    setOpen(false);
  };
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>서비스 변경 예약</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             <FormField
              control={form.control}
              name="effectiveDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>변경 적용일 *</FormLabel>
                   <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                            format(field.value, "PPP", { locale: ko })
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
                        onSelect={(date) => {
                          field.onChange(date)
                          setCalendarOpen(false)
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
              name="serviceStatus"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>서비스 상태</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-2"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="일시정지" />
                        </FormControl>
                        <FormLabel className="font-normal">일시정지</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="정상" />
                        </FormControl>
                        <FormLabel className="font-normal">정상</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="무료사용" />
                        </FormControl>
                        <FormLabel className="font-normal">무료사용</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="미납정지" />
                        </FormControl>
                        <FormLabel className="font-normal">미납정지</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
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
                      className="grid grid-cols-2 gap-2"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="가맹전" />
                        </FormControl>
                        <FormLabel className="font-normal">가맹전</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="스탠다드" />
                        </FormControl>
                        <FormLabel className="font-normal">스탠다드</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="슬림" />
                        </FormControl>
                        <FormLabel className="font-normal">슬림</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="학교" />
                        </FormControl>
                        <FormLabel className="font-normal">학교</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>서비스 타입</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-2"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="수학+과학" />
                        </FormControl>
                        <FormLabel className="font-normal">수학+과학</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="수학" />
                        </FormControl>
                        <FormLabel className="font-normal">수학</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="과학" />
                        </FormControl>
                        <FormLabel className="font-normal">과학</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  취소
                </Button>
              </DialogClose>
              <Button type="submit">예약</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
