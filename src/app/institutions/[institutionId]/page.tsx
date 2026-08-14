"use client";

import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { addDays, addMonths, addYears, format, isAfter, parseISO, startOfMonth, startOfToday, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { AlertCircle, CalendarDays, List, Upload, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getInstitutionBillingSettings,
  getInstitutionServiceReservation,
  getInstitutionServiceState,
  getMockInstitution,
  removeInstitutionServiceReservation,
  saveInstitutionBillingSettings,
  saveInstitutionServiceReservation,
  saveInstitutionServiceState,
  type InstitutionBillingSettings,
  type InstitutionBillingType,
  type InstitutionEventBillingMethod,
  type InstitutionServiceReservation,
  type MockInstitutionServiceType,
} from "@/lib/institution-mock";
import { cn } from "@/lib/utils";

function Field({
  label,
  value,
  required,
  className,
  placeholder,
}: {
  label: string;
  value?: string | number;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={cn("grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3", className)}>
      <span className="text-right text-xs text-slate-500">
        {required && <span className="mr-1 text-rose-400">*</span>}
        {label}
      </span>
      <Input defaultValue={value} placeholder={placeholder} className="h-9 bg-white text-xs" />
    </label>
  );
}

function RadioOption({ name, label, checked, disabled, onChange }: { name: string; label: string; checked?: boolean; disabled?: boolean; onChange?: () => void }) {
  return (
    <label className={cn("inline-flex items-center gap-1.5 text-xs text-slate-500", disabled && "cursor-not-allowed opacity-60")}>
      <input type="radio" name={name} {...(onChange ? { checked, onChange } : { defaultChecked: checked })} disabled={disabled} className="accent-blue-500" />
      {label}
    </label>
  );
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {action}
    </div>
  );
}

type ReservationStatus = "무료사용" | "정상" | "일시정지";
type PaymentType = "가맹비" | "교육비";
type BillingValidationErrors = Partial<Record<"billingType" | "method" | "annualPrepaidFee" | "monthlyFee" | "startDate" | "endDate" | "includedStudents" | "excessMonthlyFee", string>>;
type ReservationValidationErrors = Partial<Record<"date" | "status" | "serviceType" | "billingType" | "minFee" | "oneSubjectFee" | "twoSubjectFee" | "method" | "annualPrepaidFee" | "monthlyFee" | "startDate" | "endDate" | "includedStudents" | "excessMonthlyFee" | "unchanged", string>>;
type ReservationChange = NonNullable<InstitutionServiceReservation["changes"]>[number];

const EVENT_CALENDAR_CLASS_NAMES = {
  months: "relative",
  month: "w-full space-y-4",
  month_caption: "flex h-9 items-center justify-center",
  caption_label: "text-base font-semibold text-slate-700",
  nav: "absolute inset-x-0 top-0 flex h-9 items-center justify-between",
  button_previous: "inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100",
  button_next: "inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100",
  month_grid: "w-full border-collapse",
  weekdays: "flex w-full border-b border-slate-100 pb-2",
  weekday: "w-[46px] text-center text-xs font-medium text-slate-500",
  weeks: "block pt-1",
  week: "mt-1 flex w-full",
  day: "h-[42px] w-[46px] p-0 text-center",
  day_button: "inline-flex h-[42px] w-[46px] items-center justify-center rounded-md text-sm font-normal text-slate-700 hover:bg-blue-50 hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
  selected: "[&>button]:bg-blue-500 [&>button]:text-white [&>button]:hover:bg-blue-500 [&>button]:hover:text-white",
  today: "[&>button]:font-bold [&>button]:text-blue-500",
  outside: "[&>button]:text-slate-300",
  disabled: "[&>button]:cursor-not-allowed [&>button]:bg-slate-50 [&>button]:text-slate-300 [&>button]:hover:bg-slate-50 [&>button]:hover:text-slate-300",
  hidden: "invisible",
};

function ContractDatePicker({ label, value, onChange, disabled, minDate }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; minDate?: Date }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} aria-label={label} className={cn("h-9 w-full justify-start px-3 text-left text-xs font-normal", !value && "text-slate-400")}>
          <CalendarDays className="mr-2 h-4 w-4 text-slate-400" />
          {value ? format(parseISO(value), "yyyy.MM.dd") : "날짜 선택"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ko}
          className="w-[360px] p-4"
          classNames={EVENT_CALENDAR_CLASS_NAMES}
          selected={value ? parseISO(value) : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
            window.setTimeout(() => setOpen(false), 0);
          }}
          disabled={minDate ? (date) => date < minDate : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function IntegerInput({ label, value, onChange, suffix }: { label: string; value: string; onChange: (value: string) => void; suffix: string }) {
  return (
    <div className="relative">
      <Input
        aria-label={label}
        value={value}
        inputMode="numeric"
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onChange(digits ? Number(digits).toLocaleString("ko-KR") : "");
        }}
        className="h-9 bg-white pr-8 text-xs"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">{suffix}</span>
    </div>
  );
}

function WonInput({ value, onChange, label, disabled }: { value: string; onChange: (value: string) => void; label: string; disabled?: boolean }) {
  return (
    <div className="relative">
      <Input
        aria-label={label}
        value={value}
        disabled={disabled}
        inputMode="numeric"
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onChange(digits ? Number(digits).toLocaleString("ko-KR") : "");
        }}
        className="h-9 bg-white pr-8 text-xs"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">원</span>
    </div>
  );
}

function normalizedNumber(value: string | number) {
  return String(value).replace(/\D/g, "");
}

function displayedDate(value: string) {
  return value ? value.replace(/-/g, ".") : "-";
}

function displayedMoney(value: string | number) {
  const digits = normalizedNumber(value);
  return digits ? `${Number(digits).toLocaleString("ko-KR")}원` : "-";
}

function displayedPeople(value: string | number) {
  const digits = normalizedNumber(value);
  return digits ? `${Number(digits).toLocaleString("ko-KR")}명` : "-";
}

export default function InstitutionInfoPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const institution = getMockInstitution(String(params.institutionId));
  const [reservationOpen, setReservationOpen] = React.useState(false);
  const [reservationStatus, setReservationStatus] = React.useState<ReservationStatus>((institution?.serviceStatus === "미납정지" ? "무료사용" : institution?.serviceStatus) || "무료사용");
  const [reservationDate, setReservationDate] = React.useState("");
  const [reservationServiceType, setReservationServiceType] = React.useState<MockInstitutionServiceType>(institution?.serviceType || "리딩수학+과학 통합");
  const [reservationBillingType, setReservationBillingType] = React.useState<InstitutionBillingType>(institution?.billingType || "일반 과금");
  const [reservationEventMethod, setReservationEventMethod] = React.useState<InstitutionEventBillingMethod>(institution?.eventBillingMethod || "1년 선납");
  const [reservationMinFee, setReservationMinFee] = React.useState(institution?.minFee.toLocaleString("ko-KR") || "");
  const [reservationOneSubjectFee, setReservationOneSubjectFee] = React.useState(institution?.perStudentFeeOneSubject.toLocaleString("ko-KR") || "");
  const [reservationTwoSubjectFee, setReservationTwoSubjectFee] = React.useState(institution?.perStudentFeeTwoSubjects.toLocaleString("ko-KR") || "");
  const [reservationAnnualFee, setReservationAnnualFee] = React.useState(institution?.eventAnnualPrepaidFee.toLocaleString("ko-KR") || "");
  const [reservationMonthlyFee, setReservationMonthlyFee] = React.useState(institution?.eventMonthlyFee.toLocaleString("ko-KR") || "");
  const [reservationEventStartDate, setReservationEventStartDate] = React.useState(institution?.eventStartDate || "");
  const [reservationEventEndDate, setReservationEventEndDate] = React.useState(institution?.eventEndDate || "");
  const [reservationIncludedStudents, setReservationIncludedStudents] = React.useState(institution?.includedStudents.toLocaleString("ko-KR") || "20");
  const [reservationExcessMonthlyFee, setReservationExcessMonthlyFee] = React.useState(institution?.excessMonthlyFee.toLocaleString("ko-KR") || "5,000");
  const [reservationErrors, setReservationErrors] = React.useState<ReservationValidationErrors>({});
  const [reservationReason, setReservationReason] = React.useState("");
  const [franchiseFee, setFranchiseFee] = React.useState("0");
  const [trainingFee, setTrainingFee] = React.useState("0");
  const [paymentType, setPaymentType] = React.useState<PaymentType | null>(null);
  const [paymentAlert, setPaymentAlert] = React.useState<PaymentType | null>(null);
  const [franchiseFeePaidAt, setFranchiseFeePaidAt] = React.useState<string | null>(null);
  const [trainingFeePaidAt, setTrainingFeePaidAt] = React.useState<string | null>(null);
  const [serviceReservation, setServiceReservation] = React.useState<InstitutionServiceReservation | null>(null);
  const [cancelReservationOpen, setCancelReservationOpen] = React.useState(false);
  const [billingType, setBillingType] = React.useState<InstitutionBillingType>(institution?.billingType || "일반 과금");
  const [eventBillingMethod, setEventBillingMethod] = React.useState<InstitutionEventBillingMethod>(institution?.eventBillingMethod || "1년 선납");
  const [eventAnnualPrepaidFee, setEventAnnualPrepaidFee] = React.useState(institution?.eventAnnualPrepaidFee.toLocaleString("ko-KR") || "");
  const [eventMonthlyFee, setEventMonthlyFee] = React.useState(institution?.eventMonthlyFee.toLocaleString("ko-KR") || "");
  const [eventStartDate, setEventStartDate] = React.useState(institution?.eventStartDate || "");
  const [eventEndDate, setEventEndDate] = React.useState(institution?.eventEndDate || "");
  const [includedStudents, setIncludedStudents] = React.useState(institution?.includedStudents.toLocaleString("ko-KR") || "20");
  const [excessMonthlyFee, setExcessMonthlyFee] = React.useState(institution?.excessMonthlyFee.toLocaleString("ko-KR") || "5,000");
  const [billingErrors, setBillingErrors] = React.useState<BillingValidationErrors>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [displayedServiceStatus, setDisplayedServiceStatus] = React.useState(institution?.serviceStatus || "무료사용");
  const [displayedServiceType, setDisplayedServiceType] = React.useState<MockInstitutionServiceType>(institution?.serviceType || "리딩수학+과학 통합");

  React.useEffect(() => {
    if (!institution) return;
    let settings = getInstitutionBillingSettings(institution);
    const serviceState = getInstitutionServiceState(institution);
    const pendingReservation = getInstitutionServiceReservation(institution.id);
    setDisplayedServiceStatus(serviceState.status);
    setDisplayedServiceType(serviceState.serviceType);

    if (pendingReservation && pendingReservation.date <= format(new Date(), "yyyy-MM-dd")) {
      const appliedServiceType = pendingReservation.serviceType || serviceState.serviceType;
      saveInstitutionServiceState(institution.id, { status: pendingReservation.status, serviceType: appliedServiceType });
      setDisplayedServiceStatus(pendingReservation.status);
      setDisplayedServiceType(appliedServiceType);
      if (pendingReservation.status === "정상" && pendingReservation.billingType) {
        settings = pendingReservation.billingType === "이벤트 과금"
          ? {
              version: 3,
              billingType: "이벤트 과금",
              eventBillingMethod: pendingReservation.eventBillingMethod || "1년 선납",
              eventAnnualPrepaidFee: pendingReservation.eventAnnualPrepaidFee || "",
              eventMonthlyFee: pendingReservation.eventMonthlyFee || "",
              eventStartDate: pendingReservation.eventStartDate || "",
              eventEndDate: pendingReservation.eventEndDate || "",
              includedStudents: pendingReservation.includedStudents || "",
              excessMonthlyFee: pendingReservation.excessMonthlyFee || "",
              eventEnded: false,
              studentsPaused: false,
            }
          : { ...settings, billingType: "일반 과금", eventEnded: false, studentsPaused: false };
        saveInstitutionBillingSettings(institution.id, settings);
      }
      removeInstitutionServiceReservation(institution.id);
      setServiceReservation(null);
    } else {
      setServiceReservation(pendingReservation);
    }

    setBillingType(settings.billingType);
    setEventBillingMethod(settings.eventBillingMethod);
    setEventAnnualPrepaidFee(settings.eventAnnualPrepaidFee);
    setEventMonthlyFee(settings.eventMonthlyFee);
    setEventStartDate(settings.eventStartDate);
    setEventEndDate(settings.eventEndDate);
    setIncludedStudents(settings.includedStudents);
    setExcessMonthlyFee(settings.excessMonthlyFee);

    try {
      if (settings.billingType === "이벤트 과금" && settings.eventEndDate) {
        const eventStopAt = new Date(`${settings.eventEndDate}T00:00:00`);
        eventStopAt.setDate(eventStopAt.getDate() + 1);
        if (new Date() >= eventStopAt) {
          setDisplayedServiceStatus("일시정지");
          saveInstitutionBillingSettings(institution.id, {
            ...settings,
            eventEnded: true,
            studentsPaused: true,
            serviceStatusAfterEvent: "일시정지",
          });
        }
      }
    } catch { /* invalid legacy date falls back to the mock service state */ }
  }, [institution]);

  React.useEffect(() => {
    if (!reservationEventStartDate || reservationEventMethod !== "1년 선납") return;
    setReservationEventEndDate(format(subDays(addYears(parseISO(reservationEventStartDate), 1), 1), "yyyy-MM-dd"));
  }, [reservationEventMethod, reservationEventStartDate]);

  React.useEffect(() => {
    setEventEndDate(eventStartDate ? format(subDays(addYears(parseISO(eventStartDate), 1), 1), "yyyy-MM-dd") : "");
  }, [eventStartDate]);

  if (!institution) return null;

  const openPaymentDialog = (type: PaymentType) => {
    const value = type === "가맹비" ? franchiseFee : trainingFee;
    const amount = Number(value.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentAlert(type);
      return;
    }
    setPaymentType(type);
  };

  const paymentAmount = paymentType === "가맹비" ? franchiseFee : trainingFee;
  const completePayment = () => {
    if (!paymentType) return;
    const now = new Date();
    const paidAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    if (paymentType === "가맹비") setFranchiseFeePaidAt(paidAt);
    if (paymentType === "교육비") setTrainingFeePaidAt(paidAt);
    setPaymentType(null);
  };

  const clearBillingError = (key: keyof BillingValidationErrors) => {
    setBillingErrors((current) => ({ ...current, [key]: undefined }));
  };

  const saveBillingSettings = () => {
    if (isSaving) return;
    const errors: BillingValidationErrors = {};
    if (!billingType) errors.billingType = "과금 유형을 선택해 주세요.";
    if (billingType === "이벤트 과금") {
      if (!eventBillingMethod) errors.method = "이벤트 과금 방식을 선택해 주세요.";
      if (eventBillingMethod === "1년 선납" && !eventAnnualPrepaidFee) errors.annualPrepaidFee = "이벤트 1년 선납 이용료를 입력해 주세요.";
      if (eventBillingMethod === "월별 과금" && !eventMonthlyFee) errors.monthlyFee = "이벤트 월 이용료를 입력해 주세요.";
      if (!eventStartDate) errors.startDate = "이벤트 시작일을 선택해 주세요.";
      if (!eventEndDate) errors.endDate = "이벤트 종료일을 선택해 주세요.";
      if (eventStartDate && eventEndDate && !isAfter(parseISO(eventEndDate), parseISO(eventStartDate))) {
        errors.endDate = "이벤트 종료일은 시작일 이후 날짜로 선택해 주세요.";
      }
      if (!includedStudents) errors.includedStudents = "기본 포함 인원을 입력해 주세요.";
      if (!excessMonthlyFee) errors.excessMonthlyFee = "초과 인당 월 이용료를 입력해 주세요.";
    }
    setBillingErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    const settings: InstitutionBillingSettings = billingType === "이벤트 과금"
      ? { version: 3, billingType, eventBillingMethod, eventAnnualPrepaidFee: eventBillingMethod === "1년 선납" ? eventAnnualPrepaidFee : "", eventMonthlyFee: eventBillingMethod === "월별 과금" ? eventMonthlyFee : "", eventStartDate, eventEndDate, includedStudents, excessMonthlyFee, eventEnded: false, studentsPaused: false }
      : { version: 3, billingType, eventBillingMethod: "1년 선납", eventAnnualPrepaidFee: "", eventMonthlyFee: "", eventStartDate: "", eventEndDate: "", includedStudents: "", excessMonthlyFee: "", eventEnded: false, studentsPaused: false };
    saveInstitutionBillingSettings(institution.id, settings);
    toast({ title: "저장되었습니다." });
    setIsSaving(false);
  };

  const clearReservationError = (key: keyof ReservationValidationErrors) => {
    setReservationErrors((current) => ({ ...current, [key]: undefined }));
  };

  const openServiceReservation = () => {
    const settings = getInstitutionBillingSettings(institution);
    setReservationStatus(displayedServiceStatus === "미납정지" ? "무료사용" : displayedServiceStatus);
    setReservationDate("");
    setReservationServiceType(displayedServiceType);
    setReservationBillingType(settings.billingType);
    setReservationEventMethod(settings.eventBillingMethod);
    setReservationMinFee(institution.minFee.toLocaleString("ko-KR"));
    setReservationOneSubjectFee(institution.perStudentFeeOneSubject.toLocaleString("ko-KR"));
    setReservationTwoSubjectFee(institution.perStudentFeeTwoSubjects.toLocaleString("ko-KR"));
    setReservationAnnualFee(settings.eventAnnualPrepaidFee);
    setReservationMonthlyFee(settings.eventMonthlyFee);
    setReservationEventStartDate(settings.eventStartDate);
    setReservationEventEndDate(settings.eventEndDate);
    setReservationIncludedStudents(settings.includedStudents);
    setReservationExcessMonthlyFee(settings.excessMonthlyFee);
    setReservationReason("");
    setReservationErrors({});
    setReservationOpen(true);
  };

  const changeReservationStatus = (status: ReservationStatus) => {
    setReservationStatus(status);
    clearReservationError("status");
    if (status === "정상") {
      const settings = getInstitutionBillingSettings(institution);
      setReservationServiceType(displayedServiceType);
      setReservationBillingType(settings.billingType);
      setReservationEventMethod(settings.eventBillingMethod);
      setReservationAnnualFee(settings.eventAnnualPrepaidFee);
      setReservationMonthlyFee(settings.eventMonthlyFee);
      setReservationEventStartDate(settings.eventStartDate);
      setReservationEventEndDate(settings.eventEndDate);
      setReservationIncludedStudents(settings.includedStudents);
      setReservationExcessMonthlyFee(settings.excessMonthlyFee);
    }
  };

  const changeEventBillingMethod = (method: InstitutionEventBillingMethod) => {
    setEventBillingMethod(method);
    clearBillingError("method");
    if (method === "1년 선납") {
      setEventAnnualPrepaidFee(displayedServiceType === "리딩수학+과학 통합" ? "1,200,000" : "840,000");
      clearBillingError("annualPrepaidFee");
    } else {
      setEventMonthlyFee(displayedServiceType === "리딩수학+과학 통합" ? "100,000" : "70,000");
      clearBillingError("monthlyFee");
    }
  };

  const changeServiceType = (serviceType: MockInstitutionServiceType) => {
    setDisplayedServiceType(serviceType);
    if (billingType !== "이벤트 과금") return;
    if (eventBillingMethod === "1년 선납") {
      setEventAnnualPrepaidFee(serviceType === "리딩수학+과학 통합" ? "1,200,000" : "840,000");
      clearBillingError("annualPrepaidFee");
    } else {
      setEventMonthlyFee(serviceType === "리딩수학+과학 통합" ? "100,000" : "70,000");
      clearBillingError("monthlyFee");
    }
  };

  const changeBillingType = (nextBillingType: InstitutionBillingType) => {
    setBillingType(nextBillingType);
    setBillingErrors({});
    if (nextBillingType !== "이벤트 과금") return;
    if (eventBillingMethod === "1년 선납") {
      setEventAnnualPrepaidFee(displayedServiceType === "리딩수학+과학 통합" ? "1,200,000" : "840,000");
    } else {
      setEventMonthlyFee(displayedServiceType === "리딩수학+과학 통합" ? "100,000" : "70,000");
    }
  };

  const changeReservationBillingType = (nextBillingType: InstitutionBillingType) => {
    setReservationBillingType(nextBillingType);
    clearReservationError("billingType");
    if (billingType === "일반 과금" && nextBillingType === "이벤트 과금" && reservationDate) {
      setReservationEventStartDate(reservationDate);
    }
    if (billingType === "이벤트 과금" && nextBillingType === "일반 과금" && eventEndDate) {
      setReservationDate(format(addDays(parseISO(eventEndDate), 1), "yyyy-MM-dd"));
    }
  };

  const changeReservationDate = (value: string) => {
    setReservationDate(value);
    clearReservationError("date");
    if (billingType === "일반 과금" && reservationBillingType === "이벤트 과금") {
      setReservationEventStartDate(value);
    }
  };

  const changeReservationServiceType = (serviceType: MockInstitutionServiceType) => {
    setReservationServiceType(serviceType);
    clearReservationError("serviceType");
    if (reservationBillingType === "이벤트 과금") {
      if (reservationEventMethod === "1년 선납") {
        setReservationAnnualFee(serviceType === "리딩수학+과학 통합" ? "1,200,000" : "840,000");
        clearReservationError("annualPrepaidFee");
      } else {
        setReservationMonthlyFee(serviceType === "리딩수학+과학 통합" ? "100,000" : "70,000");
        clearReservationError("monthlyFee");
      }
    }
    if (billingType === "이벤트 과금" && eventBillingMethod === "월별 과금" && serviceType !== displayedServiceType) {
      setReservationDate(format(startOfMonth(addMonths(new Date(), 1)), "yyyy-MM-dd"));
      setReservationMonthlyFee(serviceType === "리딩수학+과학 통합" ? "100,000" : "70,000");
    }
  };

  const changeReservationEventMethod = (method: InstitutionEventBillingMethod) => {
    setReservationEventMethod(method);
    clearReservationError("method");
    if (method === "1년 선납") {
      setReservationAnnualFee(reservationServiceType === "리딩수학+과학 통합" ? "1,200,000" : "840,000");
      clearReservationError("annualPrepaidFee");
    } else {
      setReservationMonthlyFee(reservationServiceType === "리딩수학+과학 통합" ? "100,000" : "70,000");
      clearReservationError("monthlyFee");
    }
  };

  const getReservationChanges = (): ReservationChange[] => {
    const changes: ReservationChange[] = [];
    const appendChange = (label: string, before: string, after: string, beforeComparable = before, afterComparable = after) => {
      if (beforeComparable !== afterComparable) changes.push({ label, before, after });
    };

    appendChange("서비스 상태", displayedServiceStatus, reservationStatus);

    if (reservationStatus === "정상" || reservationStatus === "무료사용") {
      appendChange("서비스 타입", displayedServiceType, reservationServiceType);
    }

    if (reservationStatus !== "정상") return changes;

    appendChange("과금 유형", billingType, reservationBillingType);

    const currentContract = billingType === "일반 과금"
      ? [
          ["최소 이용 금액", displayedMoney(institution.minFee), normalizedNumber(institution.minFee)],
          [displayedServiceType === "리딩수학+과학 통합" ? "인당 이용료(1과목)" : "인당 이용료", displayedMoney(institution.perStudentFeeOneSubject), normalizedNumber(institution.perStudentFeeOneSubject)],
          ...(displayedServiceType === "리딩수학+과학 통합" ? [["인당 이용료(2과목)", displayedMoney(institution.perStudentFeeTwoSubjects), normalizedNumber(institution.perStudentFeeTwoSubjects)]] : []),
        ]
      : [
          ["이벤트 과금 방식", eventBillingMethod, eventBillingMethod],
          [eventBillingMethod === "1년 선납" ? "이벤트 1년 선납 이용료" : "이벤트 월 이용료", displayedMoney(eventBillingMethod === "1년 선납" ? eventAnnualPrepaidFee : eventMonthlyFee), normalizedNumber(eventBillingMethod === "1년 선납" ? eventAnnualPrepaidFee : eventMonthlyFee)],
          ["이벤트 시작일", displayedDate(eventStartDate), eventStartDate],
          ["이벤트 종료일", displayedDate(eventEndDate), eventEndDate],
          ["기본 포함 인원", displayedPeople(includedStudents), normalizedNumber(includedStudents)],
          ["초과 인당 월 이용료", displayedMoney(excessMonthlyFee), normalizedNumber(excessMonthlyFee)],
        ];

    const selectedContract = reservationBillingType === "일반 과금"
      ? [
          ["최소 이용 금액", displayedMoney(reservationMinFee), normalizedNumber(reservationMinFee)],
          [reservationServiceType === "리딩수학+과학 통합" ? "인당 이용료(1과목)" : "인당 이용료", displayedMoney(reservationOneSubjectFee), normalizedNumber(reservationOneSubjectFee)],
          ...(reservationServiceType === "리딩수학+과학 통합" ? [["인당 이용료(2과목)", displayedMoney(reservationTwoSubjectFee), normalizedNumber(reservationTwoSubjectFee)]] : []),
        ]
      : [
          ["이벤트 과금 방식", reservationEventMethod, reservationEventMethod],
          [reservationEventMethod === "1년 선납" ? "이벤트 1년 선납 이용료" : "이벤트 월 이용료", displayedMoney(reservationEventMethod === "1년 선납" ? reservationAnnualFee : reservationMonthlyFee), normalizedNumber(reservationEventMethod === "1년 선납" ? reservationAnnualFee : reservationMonthlyFee)],
          ["이벤트 시작일", displayedDate(reservationEventStartDate), reservationEventStartDate],
          ["이벤트 종료일", displayedDate(reservationEventEndDate), reservationEventEndDate],
          ["기본 포함 인원", displayedPeople(reservationIncludedStudents), normalizedNumber(reservationIncludedStudents)],
          ["초과 인당 월 이용료", displayedMoney(reservationExcessMonthlyFee), normalizedNumber(reservationExcessMonthlyFee)],
        ];

    const currentByLabel = new Map(currentContract.map(([label, display, comparable]) => [label, { display, comparable }]));
    const selectedByLabel = new Map(selectedContract.map(([label, display, comparable]) => [label, { display, comparable }]));
    const contractLabels = Array.from(new Set([...currentByLabel.keys(), ...selectedByLabel.keys()]));
    contractLabels.forEach((label) => {
      const current = currentByLabel.get(label);
      const selected = selectedByLabel.get(label);
      appendChange(label, current?.display || "-", selected?.display || "-", current?.comparable || "", selected?.comparable || "");
    });

    return changes;
  };

  const reservationChanges = getReservationChanges();
  const hasReservationChanges = reservationChanges.length > 0;

  const saveServiceReservation = () => {
    const errors: ReservationValidationErrors = {};
    if (!reservationDate) errors.date = "예약일자를 선택해 주세요.";
    if (!reservationStatus) errors.status = "서비스 상태를 선택해 주세요.";

    if (reservationStatus === "정상" || reservationStatus === "무료사용") {
      if (!reservationServiceType) errors.serviceType = "서비스 타입을 선택해 주세요.";
    }

    if (reservationStatus === "정상") {
      if (!reservationBillingType) errors.billingType = "과금 유형을 선택해 주세요.";
      if (reservationBillingType === "일반 과금") {
        if (!reservationMinFee) errors.minFee = "최소 이용 금액을 입력해 주세요.";
        if (!reservationOneSubjectFee) errors.oneSubjectFee = reservationServiceType === "리딩수학+과학 통합" ? "인당 이용료(1과목)를 입력해 주세요." : "인당 이용료를 입력해 주세요.";
        if (reservationServiceType === "리딩수학+과학 통합" && !reservationTwoSubjectFee) errors.twoSubjectFee = "인당 이용료(2과목)를 입력해 주세요.";
      } else {
        if (!reservationEventMethod) errors.method = "이벤트 과금 방식을 선택해 주세요.";
        if (reservationEventMethod === "1년 선납" && !reservationAnnualFee) errors.annualPrepaidFee = "이벤트 1년 선납 이용료를 입력해 주세요.";
        if (reservationEventMethod === "월별 과금" && !reservationMonthlyFee) errors.monthlyFee = "이벤트 월 이용료를 입력해 주세요.";
        if (!reservationEventStartDate) errors.startDate = "이벤트 시작일을 선택해 주세요.";
        if (!reservationEventEndDate) errors.endDate = "이벤트 종료일을 선택해 주세요.";
        if (reservationEventStartDate && reservationEventEndDate && !isAfter(parseISO(reservationEventEndDate), parseISO(reservationEventStartDate))) {
          errors.endDate = "이벤트 종료일은 시작일 이후 날짜로 선택해 주세요.";
        }
        if (!reservationIncludedStudents) errors.includedStudents = "기본 포함 인원을 입력해 주세요.";
        if (!reservationExcessMonthlyFee) errors.excessMonthlyFee = "초과 인당 월 이용료를 입력해 주세요.";
      }
    }

    if (billingType === "이벤트 과금" && reservationBillingType === "일반 과금" && eventEndDate) {
      const requiredDate = format(addDays(parseISO(eventEndDate), 1), "yyyy-MM-dd");
      if (!activeAnnualPrepaid && reservationDate !== requiredDate) errors.date = "일반 과금 전환 예약일은 이벤트 종료일 다음 날로 선택해 주세요.";
    }

    if (annualPrepaidEarliestDate && reservationDate && parseISO(reservationDate) < annualPrepaidEarliestDate) {
      errors.date = "1년 선납 예약일자는 이벤트 종료일 다음 날부터 선택해 주세요.";
    }

    if (billingType === "이벤트 과금" && eventBillingMethod === "월별 과금" && reservationServiceType !== displayedServiceType) {
      const requiredDate = format(startOfMonth(addMonths(new Date(), 1)), "yyyy-MM-dd");
      if (reservationDate !== requiredDate) errors.date = "월별 과금 기관의 서비스 타입 변경일은 다음 달 1일로 선택해 주세요.";
    }

    if (!hasReservationChanges) errors.unchanged = "변경할 서비스 정보를 선택하거나 입력해 주세요.";

    setReservationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const currentContractSummary = billingType === "일반 과금"
      ? `최소 ${institution.minFee.toLocaleString("ko-KR")}원 · 인당 ${institution.perStudentFeeOneSubject.toLocaleString("ko-KR")}원${displayedServiceType === "리딩수학+과학 통합" ? ` / ${institution.perStudentFeeTwoSubjects.toLocaleString("ko-KR")}원` : ""}`
      : `${eventBillingMethod} · ${eventBillingMethod === "1년 선납" ? eventAnnualPrepaidFee : eventMonthlyFee}원 · ${eventStartDate} ~ ${eventEndDate} · ${includedStudents}명 / 초과 ${excessMonthlyFee}원`;
    const selectedContractSummary = reservationBillingType === "일반 과금"
      ? `최소 ${reservationMinFee}원 · 인당 ${reservationOneSubjectFee}원${reservationServiceType === "리딩수학+과학 통합" ? ` / ${reservationTwoSubjectFee}원` : ""}`
      : `${reservationEventMethod} · ${reservationEventMethod === "1년 선납" ? reservationAnnualFee : reservationMonthlyFee}원 · ${reservationEventStartDate} ~ ${reservationEventEndDate} · ${reservationIncludedStudents}명 / 초과 ${reservationExcessMonthlyFee}원`;
    const reservation: InstitutionServiceReservation = {
      version: 1,
      date: reservationDate,
      status: reservationStatus,
      reason: reservationReason,
      beforeStatus: displayedServiceStatus,
      beforeServiceType: displayedServiceType,
      beforeBillingType: billingType,
      changes: reservationChanges,
      ...(reservationStatus === "정상" ? { beforeContractSummary: currentContractSummary, afterContractSummary: selectedContractSummary } : {}),
      ...(reservationStatus === "정상" || reservationStatus === "무료사용" ? { serviceType: reservationServiceType } : {}),
      ...(reservationStatus === "정상" ? {
        billingType: reservationBillingType,
        ...(reservationBillingType === "일반 과금" ? {
          minFee: reservationMinFee,
          perStudentFeeOneSubject: reservationOneSubjectFee,
          ...(reservationServiceType === "리딩수학+과학 통합" ? { perStudentFeeTwoSubjects: reservationTwoSubjectFee } : {}),
        } : {
          eventBillingMethod: reservationEventMethod,
          ...(reservationEventMethod === "1년 선납" ? { eventAnnualPrepaidFee: reservationAnnualFee } : { eventMonthlyFee: reservationMonthlyFee }),
          eventStartDate: reservationEventStartDate,
          eventEndDate: reservationEventEndDate,
          includedStudents: reservationIncludedStudents,
          excessMonthlyFee: reservationExcessMonthlyFee,
        }),
      } : {}),
    };
    saveInstitutionServiceReservation(institution.id, reservation);
    setServiceReservation(reservation);
    setReservationOpen(false);
    toast({ title: "서비스 변경이 예약되었습니다." });
  };

  const activeAnnualPrepaid = billingType === "이벤트 과금" && eventBillingMethod === "1년 선납" && !getInstitutionBillingSettings(institution).eventEnded;
  const annualPrepaidEarliestDate = activeAnnualPrepaid && eventEndDate ? addDays(parseISO(eventEndDate), 1) : null;
  const reservationMinDate = annualPrepaidEarliestDate || addDays(startOfToday(), 1);
  const reservationDateLocked = !activeAnnualPrepaid && (
    (billingType === "이벤트 과금" && reservationBillingType === "일반 과금")
    || (billingType === "이벤트 과금" && eventBillingMethod === "월별 과금" && reservationServiceType !== displayedServiceType)
  );

  return (
    <>
      <section className="rounded-xl border border-slate-100 bg-white p-7 shadow-sm">
        <SectionTitle title="기관 정보" />

        <div className="mt-6 space-y-4">
          <Field label="기관명" value={institution.name} required />

          <div className="grid gap-4 xl:grid-cols-2">
            <label className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3">
              <span className="text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>지사1</span>
              <select defaultValue={institution.branch1} className="h-9 rounded-md border border-input bg-white px-3 text-xs">
                <option value="">지사1 선택</option>
                {["대구", "부산", "전주", "대전", "화성", "천안", "안산", "울산", "광주", "김포", "평택안성"].map((branch) => <option key={branch}>{branch}</option>)}
              </select>
            </label>
            <label className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3">
              <span className="text-right text-xs text-slate-500">지사2</span>
              <select defaultValue={institution.branch2} className="h-9 rounded-md border border-input bg-white px-3 text-xs">
                <option value="">지사2 선택</option>
                {["강남", "수원", "일산", "해운대"].map((branch) => <option key={branch}>{branch}</option>)}
              </select>
            </label>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Field label="매일국어 기관명" value={institution.everydayKoreanName} />
            <Field label="독도 기관명" value={institution.dokdoName} />
          </div>

          <div className="grid grid-cols-[110px_minmax(0,280px)_auto] items-center gap-3">
            <span className="text-right text-xs text-slate-500">우편번호</span>
            <Input defaultValue={institution.zipCode} className="h-9 bg-slate-50 text-xs" />
            <Button type="button" size="sm" className="justify-self-start bg-lime-500 hover:bg-lime-600">주소검색</Button>
          </div>
          <Field label="주소" value={institution.address} />
          <Field label="상세주소" value={institution.addressDetail} />

          <div className="grid gap-4 xl:grid-cols-3">
            <Field label="담당자명" value={institution.managerName} />
            <Field label="담당자 연락처" value={institution.managerContact} />
            <Field label="담당자 이메일" value={institution.email} placeholder="example@email.com" />
          </div>

          <label className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3">
            <span className="text-right text-xs text-slate-500">최근 계약 갱신일</span>
            <div className="relative">
              <Input defaultValue={institution.lastContractDate} placeholder="날짜 선택" className="h-9 pr-9 text-xs" />
              <CalendarDays className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </label>

          <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3">
            <span className="text-right text-xs text-slate-500">첨부파일</span>
            <Button type="button" variant="secondary" size="sm" className="w-fit"><Upload className="mr-2 h-4 w-4" />파일 선택</Button>
          </div>
        </div>

        <div className="mt-8">
          <SectionTitle
            title="서비스 정보"
            action={displayedServiceStatus !== "미납정지" ? (
              <Button type="button" variant="outline" size="sm" disabled={serviceReservation !== null} onClick={openServiceReservation}>서비스 변경 예약</Button>
            ) : undefined}
          />
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center gap-5">
              <span className="w-28 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>서비스 상태</span>
              <RadioOption name="serviceStatus" label="무료사용" checked={displayedServiceStatus === "무료사용"} disabled={serviceReservation !== null} onChange={() => setDisplayedServiceStatus("무료사용")} />
              <RadioOption name="serviceStatus" label="정상" checked={displayedServiceStatus === "정상"} disabled={serviceReservation !== null} onChange={() => setDisplayedServiceStatus("정상")} />
              <RadioOption name="serviceStatus" label="미납정지" checked={displayedServiceStatus === "미납정지"} disabled={serviceReservation !== null} onChange={() => setDisplayedServiceStatus("미납정지")} />
              <RadioOption name="serviceStatus" label="일시정지" checked={displayedServiceStatus === "일시정지"} disabled={serviceReservation !== null} onChange={() => setDisplayedServiceStatus("일시정지")} />
            </div>
            {serviceReservation && (
              <div className="ml-[132px] space-y-3">
                <div className="flex min-h-12 items-center justify-between rounded-md bg-amber-500 px-5 text-sm font-semibold text-white">
                  <div className="space-y-1 py-3">
                    <p>{serviceReservation.date} 서비스 변경 예약</p>
                    {serviceReservation.changes?.map((change) => (
                      <p key={change.label} className="text-xs font-normal">{change.label}: {change.before} → {change.after}</p>
                    ))}
                    {serviceReservation.reason && <p className="text-xs font-normal">변경 사유: {serviceReservation.reason}</p>}
                  </div>
                  <button type="button" className="rounded p-1 text-white/90 hover:bg-white/15 hover:text-white" onClick={() => setCancelReservationOpen(true)} aria-label="서비스 변경 예약 취소">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">서비스 변경 예약이 있습니다. 현재 서비스 정보를 변경하려면 예약을 취소해 주세요.</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-5">
              <span className="w-28 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>서비스 타입</span>
              <RadioOption name="serviceType" label="리딩수학" checked={displayedServiceType === "리딩수학"} onChange={() => changeServiceType("리딩수학")} />
              <RadioOption name="serviceType" label="리딩과학" checked={displayedServiceType === "리딩과학"} onChange={() => changeServiceType("리딩과학")} />
              <RadioOption name="serviceType" label="리딩수학+과학 통합" checked={displayedServiceType === "리딩수학+과학 통합"} onChange={() => changeServiceType("리딩수학+과학 통합")} />
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <span className="w-28 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>가맹 타입</span>
              <RadioOption name="franchiseType" label="가맹전" checked={institution.franchiseType === "가맹전"} />
              <RadioOption name="franchiseType" label="스탠다드" checked={institution.franchiseType === "스탠다드"} />
              <RadioOption name="franchiseType" label="학교" checked={institution.franchiseType === "학교"} />
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <span className="w-28 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>과금 유형</span>
              <RadioOption name="billingType" label="일반 과금" checked={billingType === "일반 과금"} onChange={() => changeBillingType("일반 과금")} />
              <RadioOption name="billingType" label="이벤트 과금" checked={billingType === "이벤트 과금"} onChange={() => changeBillingType("이벤트 과금")} />
              {billingErrors.billingType && <p className="w-full pl-[132px] text-xs text-rose-500">{billingErrors.billingType}</p>}
            </div>

            <div className="grid gap-4 border-t border-slate-100 pt-5 xl:grid-cols-2">
              <div className="grid grid-cols-[110px_minmax(0,250px)_auto] items-center gap-3">
                <span className="text-right text-xs text-slate-500">가맹비</span>
                <WonInput label="가맹비" value={franchiseFee} onChange={setFranchiseFee} disabled={franchiseFeePaidAt !== null} />
                {!franchiseFeePaidAt && <Button type="button" size="sm" className="h-9 w-auto justify-self-start whitespace-nowrap bg-blue-500 px-5 hover:bg-blue-600" onClick={() => openPaymentDialog("가맹비")}>입금 처리</Button>}
                {franchiseFeePaidAt && <p className="col-span-2 col-start-2 text-xs text-slate-400">입금 처리 일시: {franchiseFeePaidAt}</p>}
              </div>
              <div className="grid grid-cols-[110px_minmax(0,250px)_auto] items-center gap-3">
                <span className="text-right text-xs text-slate-500">교육비</span>
                <WonInput label="교육비" value={trainingFee} onChange={setTrainingFee} disabled={trainingFeePaidAt !== null} />
                {!trainingFeePaidAt && <Button type="button" size="sm" className="h-9 w-auto justify-self-start whitespace-nowrap bg-blue-500 px-5 hover:bg-blue-600" onClick={() => openPaymentDialog("교육비")}>입금 처리</Button>}
                {trainingFeePaidAt && <p className="col-span-2 col-start-2 text-xs text-slate-400">입금 처리 일시: {trainingFeePaidAt}</p>}
              </div>
              {billingType === "일반 과금" && (
                <>
                  <Field label="최소 이용 금액" value={institution.minFee.toLocaleString()} required />
                  {institution.serviceType === "리딩수학+과학 통합" ? (
                    <>
                      <Field label="인당 이용료(1과목)" value={institution.perStudentFeeOneSubject.toLocaleString()} required />
                      <div />
                      <Field label="인당 이용료(2과목)" value={institution.perStudentFeeTwoSubjects.toLocaleString()} required />
                    </>
                  ) : (
                    <Field label="인당 이용료" value={institution.perStudentFeeOneSubject.toLocaleString()} required />
                  )}
                </>
              )}

              {billingType === "이벤트 과금" && (
                <>
                  <div className="flex items-start gap-5 pt-2">
                    <span className="w-28 shrink-0 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>이벤트 과금 방식</span>
                    <div>
                      <div className="flex items-center gap-5">
                        <RadioOption name="eventBillingMethod" label="1년 선납" checked={eventBillingMethod === "1년 선납"} onChange={() => changeEventBillingMethod("1년 선납")} />
                        <RadioOption name="eventBillingMethod" label="월별 과금" checked={eventBillingMethod === "월별 과금"} onChange={() => changeEventBillingMethod("월별 과금")} />
                      </div>
                      {billingErrors.method && <p className="mt-1 text-xs text-rose-500">{billingErrors.method}</p>}
                    </div>
                  </div>
                  {eventBillingMethod === "1년 선납" ? (
                    <label className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3">
                      <span className="pt-2 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>이벤트 1년 선납 이용료</span>
                      <div>
                        <WonInput label="이벤트 1년 선납 이용료" value={eventAnnualPrepaidFee} onChange={(value) => { setEventAnnualPrepaidFee(value); clearBillingError("annualPrepaidFee"); }} />
                        {billingErrors.annualPrepaidFee && <p className="mt-1 text-xs text-rose-500">{billingErrors.annualPrepaidFee}</p>}
                      </div>
                    </label>
                  ) : (
                    <label className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3">
                      <span className="pt-2 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>이벤트 월 이용료</span>
                      <div>
                        <WonInput label="이벤트 월 이용료" value={eventMonthlyFee} onChange={(value) => { setEventMonthlyFee(value); clearBillingError("monthlyFee"); }} />
                        {billingErrors.monthlyFee && <p className="mt-1 text-xs text-rose-500">{billingErrors.monthlyFee}</p>}
                      </div>
                    </label>
                  )}
                  <label className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3">
                    <span className="pt-2 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>이벤트 시작일</span>
                    <div>
                      <ContractDatePicker label="이벤트 시작일" value={eventStartDate} onChange={(value) => { setEventStartDate(value); clearBillingError("startDate"); clearBillingError("endDate"); }} />
                      {billingErrors.startDate && <p className="mt-1 text-xs text-rose-500">{billingErrors.startDate}</p>}
                    </div>
                  </label>
                  <label className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3">
                    <span className="pt-2 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>이벤트 종료일</span>
                    <div>
                      <ContractDatePicker
                        label="이벤트 종료일"
                        value={eventEndDate}
                        disabled={eventBillingMethod === "1년 선납"}
                        minDate={eventStartDate ? addDays(parseISO(eventStartDate), 1) : undefined}
                        onChange={(value) => { setEventEndDate(value); clearBillingError("endDate"); }}
                      />
                      {billingErrors.endDate && <p className="mt-1 text-xs text-rose-500">{billingErrors.endDate}</p>}
                    </div>
                  </label>
                  <label className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3">
                    <span className="pt-2 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>기본 포함 인원</span>
                    <div>
                      <IntegerInput label="기본 포함 인원" value={includedStudents} suffix="명" onChange={(value) => { setIncludedStudents(value); clearBillingError("includedStudents"); }} />
                      {billingErrors.includedStudents && <p className="mt-1 text-xs text-rose-500">{billingErrors.includedStudents}</p>}
                    </div>
                  </label>
                  <label className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3">
                    <span className="pt-2 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>초과 인당 월 이용료</span>
                    <div>
                      <WonInput label="초과 인당 월 이용료" value={excessMonthlyFee} onChange={(value) => { setExcessMonthlyFee(value); clearBillingError("excessMonthlyFee"); }} />
                      {billingErrors.excessMonthlyFee && <p className="mt-1 text-xs text-rose-500">{billingErrors.excessMonthlyFee}</p>}
                    </div>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <SectionTitle title="수수료 정산 비율" action={<Button type="button" variant="outline" size="sm">수수료율 변경 예약</Button>} />
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <Field label="이용료 수수료율" value={institution.usageFeeRate} />
            <Field label="가맹비 수수료율" value={institution.franchiseFeeRate ?? "미입력 시 기본 설정 적용"} />
          </div>
        </div>

        <div className="mt-8">
          <SectionTitle title="메모" />
          <label className="mt-6 grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3">
            <span className="pt-2 text-right text-xs text-slate-500">관리자 메모</span>
            <Textarea defaultValue={institution.memo} className="min-h-32" />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" disabled={isSaving} className="bg-sky-500 px-7 hover:bg-sky-600" onClick={saveBillingSettings}>저장</Button>
        </div>
      </section>

      <Button type="button" variant="outline" onClick={() => router.push("/institutions")}>
        <List className="mr-2 h-4 w-4" />목록
      </Button>

      <Dialog open={reservationOpen} onOpenChange={setReservationOpen}>
        <DialogContent className="max-w-[620px] gap-0 p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-xl font-medium">서비스 변경 예약</DialogTitle>
            <DialogDescription className="sr-only">기관의 서비스 상태와 이용 요금 변경을 예약합니다.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[72vh] space-y-6 overflow-y-auto px-7 py-6">
            <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3">
              <span className="pt-2 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>예약일자</span>
              <div>
                <ContractDatePicker label="예약일자" value={reservationDate} onChange={changeReservationDate} disabled={reservationDateLocked} minDate={reservationMinDate} />
                {reservationErrors.date && <p className="mt-1 text-xs text-rose-500">{reservationErrors.date}</p>}
                {activeAnnualPrepaid && <p className="mt-2 text-xs text-slate-400">1년 선납 이용 기간 중 서비스 정보를 변경할 수 없습니다. 예약일자는 이벤트 종료일 다음 날부터 선택해 주세요.</p>}
              </div>
            </label>

            <div className="space-y-6 border-t pt-6">
              <div className="grid grid-cols-[145px_minmax(0,1fr)] gap-3">
                <span className="pt-0.5 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>서비스 상태</span>
                <div>
                  <div className="flex flex-wrap items-center gap-8">
                    {(["무료사용", "정상", "일시정지"] as const).map((status) => (
                      <label key={status} className={cn("inline-flex items-center gap-2 text-sm", reservationStatus === status ? "font-semibold text-blue-500" : "text-slate-600")}>
                        <input type="radio" name="reservationStatus" checked={reservationStatus === status} onChange={() => changeReservationStatus(status)} className="h-4 w-4 accent-blue-500" />
                        {status}
                      </label>
                    ))}
                  </div>
                  {displayedServiceStatus !== reservationStatus && <p className="mt-3 text-sm text-orange-400">{displayedServiceStatus} → {reservationStatus}</p>}
                  {reservationErrors.status && <p className="mt-1 text-xs text-rose-500">{reservationErrors.status}</p>}
                </div>
              </div>

              {(reservationStatus === "정상" || reservationStatus === "무료사용") && (
                <div className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3">
                  <span className="pt-0.5 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>서비스 타입</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-6">
                      {(["리딩수학", "리딩과학", "리딩수학+과학 통합"] as const).map((type) => (
                        <RadioOption key={type} name="reservationServiceType" label={type} checked={reservationServiceType === type} onChange={() => changeReservationServiceType(type)} />
                      ))}
                    </div>
                    {displayedServiceType !== reservationServiceType && <p className="mt-3 text-sm text-orange-400">{displayedServiceType} → {reservationServiceType}</p>}
                    {reservationErrors.serviceType && <p className="mt-1 text-xs text-rose-500">{reservationErrors.serviceType}</p>}
                  </div>
                </div>
              )}

              {reservationStatus === "정상" && (
                <>
                  <div className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3">
                    <span className="pt-0.5 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>과금 유형</span>
                    <div>
                      <div className="flex items-center gap-8">
                        <RadioOption name="reservationBillingType" label="일반 과금" checked={reservationBillingType === "일반 과금"} onChange={() => changeReservationBillingType("일반 과금")} />
                        <RadioOption name="reservationBillingType" label="이벤트 과금" checked={reservationBillingType === "이벤트 과금"} onChange={() => changeReservationBillingType("이벤트 과금")} />
                      </div>
                      {billingType !== reservationBillingType && <p className="mt-3 text-sm text-orange-400">{billingType} → {reservationBillingType}</p>}
                      {reservationErrors.billingType && <p className="mt-1 text-xs text-rose-500">{reservationErrors.billingType}</p>}
                    </div>
                  </div>

                  {reservationBillingType === "일반 과금" ? (
                    <div className="space-y-4 border-t pt-5">
                      <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3">
                        <span className="pt-2 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>최소 이용 금액</span>
                        <div><WonInput label="예약 최소 이용 금액" value={reservationMinFee} onChange={(value) => { setReservationMinFee(value); clearReservationError("minFee"); }} />{reservationErrors.minFee && <p className="mt-1 text-xs text-rose-500">{reservationErrors.minFee}</p>}</div>
                      </label>
                      <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3">
                        <span className="pt-2 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>{reservationServiceType === "리딩수학+과학 통합" ? "인당 이용료(1과목)" : "인당 이용료"}</span>
                        <div><WonInput label="예약 인당 이용료" value={reservationOneSubjectFee} onChange={(value) => { setReservationOneSubjectFee(value); clearReservationError("oneSubjectFee"); }} />{reservationErrors.oneSubjectFee && <p className="mt-1 text-xs text-rose-500">{reservationErrors.oneSubjectFee}</p>}</div>
                      </label>
                      {reservationServiceType === "리딩수학+과학 통합" && (
                        <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3">
                          <span className="pt-2 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>인당 이용료(2과목)</span>
                          <div><WonInput label="예약 인당 이용료 2과목" value={reservationTwoSubjectFee} onChange={(value) => { setReservationTwoSubjectFee(value); clearReservationError("twoSubjectFee"); }} />{reservationErrors.twoSubjectFee && <p className="mt-1 text-xs text-rose-500">{reservationErrors.twoSubjectFee}</p>}</div>
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 border-t pt-5">
                      <div className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3">
                        <span className="text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>이벤트 과금 방식</span>
                        <div><div className="flex items-center gap-8"><RadioOption name="reservationEventMethod" label="1년 선납" checked={reservationEventMethod === "1년 선납"} onChange={() => changeReservationEventMethod("1년 선납")} /><RadioOption name="reservationEventMethod" label="월별 과금" checked={reservationEventMethod === "월별 과금"} onChange={() => changeReservationEventMethod("월별 과금")} /></div>{reservationErrors.method && <p className="mt-1 text-xs text-rose-500">{reservationErrors.method}</p>}</div>
                      </div>
                      <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3">
                        <span className="pt-2 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>{reservationEventMethod === "1년 선납" ? "이벤트 1년 선납 이용료" : "이벤트 월 이용료"}</span>
                        <div>{reservationEventMethod === "1년 선납" ? <WonInput label="예약 이벤트 1년 선납 이용료" value={reservationAnnualFee} onChange={(value) => { setReservationAnnualFee(value); clearReservationError("annualPrepaidFee"); }} /> : <WonInput label="예약 이벤트 월 이용료" value={reservationMonthlyFee} onChange={(value) => { setReservationMonthlyFee(value); clearReservationError("monthlyFee"); }} />}{reservationErrors.annualPrepaidFee && <p className="mt-1 text-xs text-rose-500">{reservationErrors.annualPrepaidFee}</p>}{reservationErrors.monthlyFee && <p className="mt-1 text-xs text-rose-500">{reservationErrors.monthlyFee}</p>}</div>
                      </label>
                      <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3"><span className="pt-2 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>이벤트 시작일</span><div><ContractDatePicker label="예약 이벤트 시작일" value={reservationEventStartDate} disabled={billingType === "일반 과금"} onChange={(value) => { setReservationEventStartDate(value); clearReservationError("startDate"); }} minDate={reservationDate ? parseISO(reservationDate) : addDays(startOfToday(), 1)} />{reservationErrors.startDate && <p className="mt-1 text-xs text-rose-500">{reservationErrors.startDate}</p>}</div></label>
                      <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3"><span className="pt-2 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>이벤트 종료일</span><div><ContractDatePicker label="예약 이벤트 종료일" value={reservationEventEndDate} disabled={reservationEventMethod === "1년 선납"} onChange={(value) => { setReservationEventEndDate(value); clearReservationError("endDate"); }} minDate={reservationEventStartDate ? addDays(parseISO(reservationEventStartDate), 1) : undefined} />{reservationErrors.endDate && <p className="mt-1 text-xs text-rose-500">{reservationErrors.endDate}</p>}</div></label>
                      <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3"><span className="pt-2 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>기본 포함 인원</span><div><IntegerInput label="예약 기본 포함 인원" value={reservationIncludedStudents} suffix="명" onChange={(value) => { setReservationIncludedStudents(value); clearReservationError("includedStudents"); }} />{reservationErrors.includedStudents && <p className="mt-1 text-xs text-rose-500">{reservationErrors.includedStudents}</p>}</div></label>
                      <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3"><span className="pt-2 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>초과 인당 월 이용료</span><div><WonInput label="예약 초과 인당 월 이용료" value={reservationExcessMonthlyFee} onChange={(value) => { setReservationExcessMonthlyFee(value); clearReservationError("excessMonthlyFee"); }} />{reservationErrors.excessMonthlyFee && <p className="mt-1 text-xs text-rose-500">{reservationErrors.excessMonthlyFee}</p>}</div></label>
                    </div>
                  )}
                </>
              )}
            </div>

            <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3">
              <span className="pt-3 text-right text-sm text-slate-600">사유</span>
              <Textarea value={reservationReason} onChange={(event) => setReservationReason(event.target.value)} placeholder="서비스 변경 사유를 입력하세요." className="min-h-[120px] resize-none text-sm" />
            </label>
          </div>

          <DialogFooter className="border-t px-6 py-5">
            <div className="mr-auto">{reservationErrors.unchanged && <p className="text-xs text-rose-500">{reservationErrors.unchanged}</p>}</div>
            <Button type="button" variant="outline" onClick={() => setReservationOpen(false)}>취소</Button>
            <Button type="button" disabled={!hasReservationChanges} className="bg-blue-500 px-5 hover:bg-blue-600" onClick={saveServiceReservation}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelReservationOpen} onOpenChange={setCancelReservationOpen}>
        <AlertDialogContent className="max-w-[525px] gap-0 p-0">
          <button type="button" className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setCancelReservationOpen(false)} aria-label="예약 취소 확인 닫기">
            <X className="h-5 w-5" />
          </button>
          <AlertDialogHeader className="px-5 pt-5">
            <AlertDialogTitle className="sr-only">서비스 상태 변경 예약 취소</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="flex items-center gap-4 px-5 py-5 text-sm text-slate-600">
            <AlertCircle className="h-7 w-7 shrink-0 fill-amber-400 text-white" />
            서비스 상태 변경 예약을 취소하시겠습니까?
          </AlertDialogDescription>
          <AlertDialogFooter className="px-5 pb-4">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => {
                setServiceReservation(null);
                removeInstitutionServiceReservation(institution.id);
                setCancelReservationOpen(false);
                toast({ title: "서비스 변경 예약이 취소되었습니다." });
              }}
            >확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={paymentAlert !== null} onOpenChange={(open) => !open && setPaymentAlert(null)}>
        <AlertDialogContent className="max-w-[525px] gap-0 p-0">
          <button type="button" className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setPaymentAlert(null)} aria-label="알림 닫기">
            <X className="h-5 w-5" />
          </button>
          <AlertDialogHeader className="border-b px-5 py-4">
            <AlertDialogTitle className="text-lg font-medium">알림</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="flex items-center gap-4 px-5 py-6 text-sm text-slate-600">
            <AlertCircle className="h-7 w-7 shrink-0 fill-amber-400 text-white" />
            {paymentAlert}를 정확히 입력해주세요.
          </AlertDialogDescription>
          <AlertDialogFooter className="px-5 pb-4">
            <AlertDialogAction className="bg-blue-500 hover:bg-blue-600" onClick={() => setPaymentAlert(null)}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={paymentType !== null} onOpenChange={(open) => !open && setPaymentType(null)}>
        <AlertDialogContent className="max-w-[525px] gap-0 p-0">
          <button type="button" className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setPaymentType(null)} aria-label="입금 처리 닫기">
            <X className="h-5 w-5" />
          </button>
          <AlertDialogHeader className="border-b px-5 py-4">
            <AlertDialogTitle className="text-lg font-medium">{paymentType} 입금 처리</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="flex items-center gap-4 px-5 py-6 text-sm text-slate-600">
            <AlertCircle className="h-7 w-7 shrink-0 fill-amber-400 text-white" />
            {paymentType} {paymentAmount}원을 입금 처리하시겠습니까?
          </AlertDialogDescription>
          <AlertDialogFooter className="px-5 pb-4">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-blue-500 hover:bg-blue-600" onClick={completePayment}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
