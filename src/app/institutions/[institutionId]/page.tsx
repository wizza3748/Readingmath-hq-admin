"use client";

import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { addDays, addYears, format, isAfter, parseISO, startOfToday, subDays } from "date-fns";
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
  getMockInstitution,
  saveInstitutionBillingSettings,
  type InstitutionBillingSettings,
  type InstitutionBillingType,
  type InstitutionEventBillingMethod,
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
type ServiceReservation = { date: string; status: ReservationStatus; serviceType: string; reason: string };
type BillingValidationErrors = Partial<Record<"billingType" | "method" | "annualPrepaidFee" | "monthlyFee" | "startDate" | "endDate" | "includedStudents" | "excessMonthlyFee", string>>;

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

export default function InstitutionInfoPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const institution = getMockInstitution(String(params.institutionId));
  const [reservationOpen, setReservationOpen] = React.useState(false);
  const [reservationStatus, setReservationStatus] = React.useState<ReservationStatus>((institution?.serviceStatus === "미납정지" ? "무료사용" : institution?.serviceStatus) || "무료사용");
  const [reservationDate, setReservationDate] = React.useState("");
  const [reservationServiceType, setReservationServiceType] = React.useState(institution?.serviceType || "리딩수학+과학 통합");
  const [reservationReason, setReservationReason] = React.useState("");
  const [franchiseFee, setFranchiseFee] = React.useState("0");
  const [trainingFee, setTrainingFee] = React.useState("0");
  const [paymentType, setPaymentType] = React.useState<PaymentType | null>(null);
  const [paymentAlert, setPaymentAlert] = React.useState<PaymentType | null>(null);
  const [franchiseFeePaidAt, setFranchiseFeePaidAt] = React.useState<string | null>(null);
  const [trainingFeePaidAt, setTrainingFeePaidAt] = React.useState<string | null>(null);
  const [serviceReservation, setServiceReservation] = React.useState<ServiceReservation | null>(null);
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

  React.useEffect(() => {
    if (!institution) return;
    const settings = getInstitutionBillingSettings(institution);
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
          <SectionTitle title="서비스 정보" action={<Button type="button" variant="outline" size="sm" disabled={serviceReservation !== null} onClick={() => setReservationOpen(true)}>서비스 변경 예약</Button>} />
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
                    <p className="text-xs font-normal">서비스 상태: {displayedServiceStatus} → {serviceReservation.status}</p>
                    <p className="text-xs font-normal">서비스 타입: {institution.serviceType} → {serviceReservation.serviceType}</p>
                    {serviceReservation.reason && <p className="text-xs font-normal">변경 사유: {serviceReservation.reason}</p>}
                  </div>
                  <button type="button" className="rounded p-1 text-white/90 hover:bg-white/15 hover:text-white" onClick={() => setCancelReservationOpen(true)} aria-label="서비스 변경 예약 취소">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">상태 변경 예약이 있어 직접 변경할 수 없습니다. 예약을 취소한 후 변경해주세요.</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-5">
              <span className="w-28 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>서비스 타입</span>
              <RadioOption name="serviceType" label="리딩수학" checked={institution.serviceType === "리딩수학"} />
              <RadioOption name="serviceType" label="리딩과학" checked={institution.serviceType === "리딩과학"} />
              <RadioOption name="serviceType" label="리딩수학+과학 통합" checked={institution.serviceType === "리딩수학+과학 통합"} />
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <span className="w-28 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>가맹 타입</span>
              <RadioOption name="franchiseType" label="가맹전" checked={institution.franchiseType === "가맹전"} />
              <RadioOption name="franchiseType" label="스탠다드" checked={institution.franchiseType === "스탠다드"} />
              <RadioOption name="franchiseType" label="학교" checked={institution.franchiseType === "학교"} />
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <span className="w-28 text-right text-xs text-slate-500"><span className="mr-1 text-rose-400">*</span>과금 유형</span>
              <RadioOption name="billingType" label="일반 과금" checked={billingType === "일반 과금"} onChange={() => { setBillingType("일반 과금"); setBillingErrors({}); }} />
              <RadioOption name="billingType" label="이벤트 과금" checked={billingType === "이벤트 과금"} onChange={() => { setBillingType("이벤트 과금"); clearBillingError("billingType"); }} />
              {billingErrors.billingType && <p className="w-full pl-[132px] text-xs text-rose-500">{billingErrors.billingType}</p>}
            </div>

            <div className="grid gap-4 border-t border-slate-100 pt-5 xl:grid-cols-2">
              <div className="grid grid-cols-[110px_minmax(0,250px)_auto] items-center gap-3">
                <span className="text-right text-xs text-slate-500">가맹비</span>
                <WonInput label="가맹비" value={franchiseFee} onChange={setFranchiseFee} disabled={franchiseFeePaidAt !== null} />
                {!franchiseFeePaidAt && <Button type="button" size="sm" className="h-9 bg-blue-500 px-5 hover:bg-blue-600" onClick={() => openPaymentDialog("가맹비")}>입금 처리</Button>}
                {franchiseFeePaidAt && <p className="col-span-2 col-start-2 text-xs text-slate-400">입금 처리 일시: {franchiseFeePaidAt}</p>}
              </div>
              <div className="grid grid-cols-[110px_minmax(0,250px)_auto] items-center gap-3">
                <span className="text-right text-xs text-slate-500">교육비</span>
                <WonInput label="교육비" value={trainingFee} onChange={setTrainingFee} disabled={trainingFeePaidAt !== null} />
                {!trainingFeePaidAt && <Button type="button" size="sm" className="h-9 bg-blue-500 px-5 hover:bg-blue-600" onClick={() => openPaymentDialog("교육비")}>입금 처리</Button>}
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
                        <RadioOption name="eventBillingMethod" label="1년 선납" checked={eventBillingMethod === "1년 선납"} onChange={() => { setEventBillingMethod("1년 선납"); clearBillingError("method"); }} />
                        <RadioOption name="eventBillingMethod" label="월별 과금" checked={eventBillingMethod === "월별 과금"} onChange={() => { setEventBillingMethod("월별 과금"); clearBillingError("method"); }} />
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

          <div className="space-y-6 px-7 py-6">
            <label className="grid grid-cols-[145px_minmax(0,1fr)] items-center gap-3">
              <span className="text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>예약일자</span>
              <ContractDatePicker label="예약일자" value={reservationDate} onChange={setReservationDate} minDate={addDays(startOfToday(), 1)} />
            </label>

            <div className="border-t pt-6">
              <div className="grid grid-cols-[145px_minmax(0,1fr)] gap-3">
                <span className="pt-0.5 text-right text-sm text-slate-600"><span className="mr-1 text-rose-400">*</span>서비스 상태</span>
                <div>
                  <div className="flex flex-wrap items-center gap-8">
                    {(["무료사용", "정상", "일시정지"] as const).map((status) => (
                      <label key={status} className={cn("inline-flex items-center gap-2 text-sm", reservationStatus === status ? "font-semibold text-blue-500" : "text-slate-600")}>
                        <input type="radio" name="reservationStatus" checked={reservationStatus === status} onChange={() => setReservationStatus(status)} className="h-4 w-4 accent-blue-500" />
                        {status}
                      </label>
                    ))}
                  </div>
                  {reservationStatus !== "무료사용" && <p className="mt-3 text-sm text-orange-400">무료사용 → {reservationStatus}</p>}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-[145px_minmax(0,1fr)] items-center gap-3">
                <span className="text-right text-sm text-slate-600">서비스 타입</span>
                <div className="flex flex-wrap items-center gap-6">
                  {(["리딩수학", "리딩과학", "리딩수학+과학 통합"] as const).map((type) => (
                    <RadioOption key={type} name="reservationServiceType" label={type} checked={reservationServiceType === type} onChange={() => setReservationServiceType(type)} />
                  ))}
                </div>
              </div>
            </div>

            <label className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-3">
              <span className="pt-3 text-right text-sm text-slate-600">사유</span>
              <Textarea value={reservationReason} onChange={(event) => setReservationReason(event.target.value)} placeholder="서비스 변경 사유를 입력하세요." className="min-h-[140px] resize-none text-sm" />
            </label>
          </div>

          <DialogFooter className="border-t px-6 py-5">
            <Button type="button" variant="outline" onClick={() => setReservationOpen(false)}>취소</Button>
            <Button
              type="button"
              className="bg-blue-500 px-5 hover:bg-blue-600"
              disabled={!reservationDate}
              onClick={() => {
                setServiceReservation({ date: reservationDate, status: reservationStatus, serviceType: reservationServiceType, reason: reservationReason });
                setReservationOpen(false);
              }}
            >예약</Button>
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
                setCancelReservationOpen(false);
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
