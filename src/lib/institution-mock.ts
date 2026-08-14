export type MockInstitutionServiceType =
  | "리딩수학"
  | "리딩과학"
  | "리딩수학+과학 통합";

export type MockInstitutionServiceStatus =
  | "무료사용"
  | "정상"
  | "일시정지"
  | "미납정지";

export type InstitutionBillingType = "일반 과금" | "이벤트 과금";
export type InstitutionEventBillingMethod = "1년 선납" | "월별 과금";

export type InstitutionServiceReservation = {
  version: 1;
  date: string;
  status: Exclude<MockInstitutionServiceStatus, "미납정지">;
  serviceType?: MockInstitutionServiceType;
  billingType?: InstitutionBillingType;
  eventBillingMethod?: InstitutionEventBillingMethod;
  minFee?: string;
  perStudentFeeOneSubject?: string;
  perStudentFeeTwoSubjects?: string;
  eventAnnualPrepaidFee?: string;
  eventMonthlyFee?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  includedStudents?: string;
  excessMonthlyFee?: string;
  reason: string;
  beforeStatus: MockInstitutionServiceStatus;
  beforeServiceType: MockInstitutionServiceType;
  beforeBillingType: InstitutionBillingType;
  beforeContractSummary?: string;
  afterContractSummary?: string;
  changes?: Array<{
    label: string;
    before: string;
    after: string;
  }>;
};

export type InstitutionServiceState = {
  status: MockInstitutionServiceStatus;
  serviceType: MockInstitutionServiceType;
};

export type InstitutionBillingSettings = {
  version: 3;
  billingType: InstitutionBillingType;
  eventBillingMethod: InstitutionEventBillingMethod;
  eventAnnualPrepaidFee: string;
  eventMonthlyFee: string;
  eventStartDate: string;
  eventEndDate: string;
  includedStudents: string;
  excessMonthlyFee: string;
  eventEnded?: boolean;
  studentsPaused?: boolean;
  serviceStatusAfterEvent?: "일시정지";
};

export type MockInstitution = {
  id: string;
  branch1: string;
  branch2: string;
  name: string;
  ownerName: string;
  loginId: string;
  ownerContact: string;
  email: string;
  serviceType: MockInstitutionServiceType;
  serviceStatus: MockInstitutionServiceStatus;
  franchiseType: "가맹전" | "스탠다드" | "학교";
  automaticPayment: "등록" | "미등록";
  paidPoints: number;
  freePoints: number;
  minFee: number;
  perStudentFee: number;
  perStudentFeeOneSubject: number;
  perStudentFeeTwoSubjects: number;
  billingType: InstitutionBillingType;
  eventBillingMethod: InstitutionEventBillingMethod;
  eventAnnualPrepaidFee: number;
  eventMonthlyFee: number;
  eventStartDate: string;
  eventEndDate: string;
  includedStudents: number;
  excessMonthlyFee: number;
  teacherCount: number;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
  institutionCode: string;
  everydayKoreanName: string;
  dokdoName: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  managerName: string;
  managerContact: string;
  lastContractDate: string;
  usageFeeRate: number;
  franchiseFeeRate: number | null;
  memo: string;
};

const featuredInstitutions: Array<
  Pick<MockInstitution, "id" | "branch1" | "branch2" | "name" | "serviceStatus" | "studentCount" | "createdAt">
> = [
  { id: "1238", branch1: "", branch2: "", name: "리딩수학과학 QA학원", serviceStatus: "정상", studentCount: 22, createdAt: "2026-06-24 20:10:58" },
  { id: "1235", branch1: "전주", branch2: "", name: "ARA(에이알에이)학원", serviceStatus: "일시정지", studentCount: 0, createdAt: "2026-06-15 11:26:09" },
  { id: "1233", branch1: "평택안성", branch2: "", name: "탑브레인수학과학학원", serviceStatus: "일시정지", studentCount: 0, createdAt: "2026-06-15 09:18:15" },
  { id: "1232", branch1: "평택안성", branch2: "", name: "에이플러스학원", serviceStatus: "일시정지", studentCount: 0, createdAt: "2026-06-15 09:15:26" },
  { id: "1231", branch1: "김포", branch2: "", name: "씨앤디영재아카데미", serviceStatus: "무료사용", studentCount: 1, createdAt: "2026-06-11 17:17:29" },
  { id: "1230", branch1: "광주", branch2: "", name: "수학여우학원", serviceStatus: "일시정지", studentCount: 0, createdAt: "2026-06-10 17:31:36" },
  { id: "1229", branch1: "평택안성", branch2: "", name: "지혜의수학", serviceStatus: "일시정지", studentCount: 0, createdAt: "2026-06-10 14:13:21" },
  { id: "1228", branch1: "평택안성", branch2: "", name: "유앤아이수학과학학원", serviceStatus: "일시정지", studentCount: 0, createdAt: "2026-06-10 14:08:55" },
  { id: "1227", branch1: "광주", branch2: "", name: "티아이디영수학원", serviceStatus: "일시정지", studentCount: 0, createdAt: "2026-06-08 09:09:07" },
  { id: "1226", branch1: "대구", branch2: "", name: "폴리아수학", serviceStatus: "무료사용", studentCount: 1, createdAt: "2026-06-05 16:08:06" },
  { id: "1225", branch1: "부산", branch2: "해운대", name: "생각이커는팩토수학학원", serviceStatus: "정상", studentCount: 18, createdAt: "2026-06-04 15:21:13" },
  { id: "1224", branch1: "천안", branch2: "", name: "상상수학", serviceStatus: "정상", studentCount: 14, createdAt: "2026-06-03 13:42:11" },
];

const branchNames = ["대구", "부산", "전주", "대전", "화성", "천안", "안산", "울산", "광주", "김포", "평택안성"];
const branch2Names = ["", "강남", "수원", "일산", "해운대"];
const institutionNames = [
  "답브레인수학과학학원",
  "에듀플러스학원",
  "매쓰온수학학원",
  "리딩클래스학원",
  "스마트과학학원",
  "올림피아드수학원",
  "뉴턴과학학원",
  "하이매쓰학원",
];
const serviceTypes: MockInstitutionServiceType[] = ["리딩수학+과학 통합", "리딩수학", "리딩과학"];
const serviceStatuses: MockInstitutionServiceStatus[] = ["무료사용", "정상", "일시정지", "미납정지"];

function createInstitution(
  seed: Pick<MockInstitution, "id" | "branch1" | "branch2" | "name" | "serviceStatus" | "studentCount" | "createdAt">,
  index: number,
): MockInstitution {
  const isQa = seed.id === "1238";
  const serviceType = isQa ? "리딩수학+과학 통합" : serviceTypes[index % serviceTypes.length];
  const perStudentFee = serviceType === "리딩수학+과학 통합" ? 15_000 : 10_000;
  const billingType: InstitutionBillingType = isQa || index % 4 === 0 ? "이벤트 과금" : "일반 과금";

  return {
    ...seed,
    serviceStatus: billingType === "이벤트 과금" ? "정상" : seed.serviceStatus,
    ownerName: isQa ? "김대표" : `${seed.name.slice(0, 2)} 원장`,
    loginId: isQa ? "qa_owner" : `academy_${seed.id}`,
    ownerContact: isQa ? "01000000001" : `010-${String(2300 + index).padStart(4, "0")}-${String(5100 + index).padStart(4, "0")}`,
    email: isQa ? "qa_owner@readingmath.co.kr" : `academy${seed.id}@example.com`,
    serviceType,
    franchiseType: "가맹전",
    automaticPayment: "미등록",
    paidPoints: 0,
    freePoints: 0,
    minFee: isQa ? 0 : 50_000,
    perStudentFee,
    perStudentFeeOneSubject: 10_000,
    perStudentFeeTwoSubjects: 15_000,
    billingType,
    eventBillingMethod: index % 2 === 0 ? "1년 선납" : "월별 과금",
    eventAnnualPrepaidFee: serviceType === "리딩수학+과학 통합" ? 1_200_000 : 840_000,
    eventMonthlyFee: serviceType === "리딩수학+과학 통합" ? 100_000 : 70_000,
    eventStartDate: "2026-09-01",
    eventEndDate: "2027-08-31",
    includedStudents: 20,
    excessMonthlyFee: 5_000,
    teacherCount: isQa ? 3 : Math.max(1, index % 5),
    updatedAt: seed.createdAt,
    institutionCode: isQa ? "999787" : String(998000 - index),
    everydayKoreanName: "",
    dokdoName: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    managerName: "",
    managerContact: "",
    lastContractDate: "",
    usageFeeRate: 30,
    franchiseFeeRate: null,
    memo: "",
  };
}

const generatedInstitutions = Array.from({ length: 200 }, (_, index) => {
  const id = String(1223 - index);
  const month = String(5 - Math.floor(index / 45)).padStart(2, "0");
  const day = String(28 - (index % 24)).padStart(2, "0");
  return {
    id,
    branch1: branchNames[index % branchNames.length],
    branch2: branch2Names[index % branch2Names.length],
    name: `${institutionNames[index % institutionNames.length]} ${Math.floor(index / institutionNames.length) + 1}`,
    serviceStatus: serviceStatuses[index % serviceStatuses.length],
    studentCount: index % 6 === 0 ? 0 : 5 + (index % 34),
    createdAt: `2026-${month}-${day} ${String(9 + (index % 9)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}:00`,
  } satisfies Pick<MockInstitution, "id" | "branch1" | "branch2" | "name" | "serviceStatus" | "studentCount" | "createdAt">;
});

export const MOCK_INSTITUTIONS: MockInstitution[] = [...featuredInstitutions, ...generatedInstitutions].map(
  createInstitution,
);

export const INSTITUTION_BRANCH1_OPTIONS = ["대구", "부산", "전주", "대전", "화성", "천안", "안산", "울산", "광주", "김포", "평택안성"];
export const INSTITUTION_BRANCH2_OPTIONS = ["강남", "수원", "일산", "해운대"];
export const INSTITUTION_SERVICE_TYPE_OPTIONS: MockInstitutionServiceType[] = ["리딩수학", "리딩과학", "리딩수학+과학 통합"];

export function getMockInstitution(id: string) {
  if (id === "zhQ9cSA29ExPK4FlcSDH") return MOCK_INSTITUTIONS[0];
  return MOCK_INSTITUTIONS.find((institution) => institution.id === id) ?? null;
}

const runtimeBillingSettings = new Map<string, InstitutionBillingSettings>();
const runtimeServiceReservations = new Map<string, InstitutionServiceReservation>();
const runtimeServiceStates = new Map<string, InstitutionServiceState>();

export function getInstitutionBillingSettings(institution: MockInstitution): InstitutionBillingSettings {
  const fallback: InstitutionBillingSettings = {
    version: 3,
    billingType: institution.billingType,
    eventBillingMethod: institution.eventBillingMethod,
    eventAnnualPrepaidFee: institution.eventAnnualPrepaidFee.toLocaleString("ko-KR"),
    eventMonthlyFee: institution.eventMonthlyFee.toLocaleString("ko-KR"),
    eventStartDate: institution.eventStartDate,
    eventEndDate: institution.eventEndDate,
    includedStudents: institution.includedStudents.toLocaleString("ko-KR"),
    excessMonthlyFee: institution.excessMonthlyFee.toLocaleString("ko-KR"),
  };

  if (typeof window === "undefined") return fallback;
  return runtimeBillingSettings.get(institution.id) ?? fallback;
}

export function saveInstitutionBillingSettings(institutionId: string, settings: InstitutionBillingSettings) {
  if (typeof window !== "undefined") {
    runtimeBillingSettings.set(institutionId, { ...settings });
  }
}

export function getInstitutionServiceReservation(institutionId: string): InstitutionServiceReservation | null {
  if (typeof window === "undefined") return null;
  return runtimeServiceReservations.get(institutionId) ?? null;
}

export function saveInstitutionServiceReservation(institutionId: string, reservation: InstitutionServiceReservation) {
  if (typeof window !== "undefined") {
    runtimeServiceReservations.set(institutionId, { ...reservation });
  }
}

export function removeInstitutionServiceReservation(institutionId: string) {
  if (typeof window !== "undefined") {
    runtimeServiceReservations.delete(institutionId);
  }
}

export function getInstitutionServiceState(institution: MockInstitution): InstitutionServiceState {
  const fallback = { status: institution.serviceStatus, serviceType: institution.serviceType };
  if (typeof window === "undefined") return fallback;
  return runtimeServiceStates.get(institution.id) ?? fallback;
}

export function saveInstitutionServiceState(institutionId: string, state: InstitutionServiceState) {
  if (typeof window !== "undefined") {
    runtimeServiceStates.set(institutionId, { ...state });
  }
}
