"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Save, Trash2, ChevronDown, X, ShieldAlert, Sparkles, User, RefreshCw, Calendar, Key, Phone, MapPin, Building, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/admin/task-center/confirm-dialog";
import {
  Student,
  StudentServiceStatus,
  StudentServiceType,
  getStudentStatusLabel,
  getStudentServiceTypeLabel,
  getStudentStopReservationStatus,
  getStoredStudents,
  saveStoredStudents,
  getAssignedTeacherMap,
  appendStudentServiceActivity,
} from "@/lib/student-mock";
import { getStoredTeachers, Teacher, ClassInfo, getStoredClasses } from "@/lib/teacher-mock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import AdminExamPrepTab from "./AdminExamPrepTab";

interface StudentDetailPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function StudentDetailPage({ params }: StudentDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");
  const { toast } = useToast();

  // ── Route parameters unwrapping ─────────────────────────────
  const [studentId, setStudentId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setStudentId(p.id));
    } else if (params && params.id) {
      setStudentId(params.id);
    }
  }, [params]);

  // ── 데이터 상태 ──────────────────────────────────────────────
  const [studentsList, setStudentsList] = React.useState<Student[]>([]);
  const [teachersList, setTeachersList] = React.useState<Teacher[]>([]);
  const [classesList, setClassesList] = React.useState<ClassInfo[]>([]);
  const [currentStudent, setCurrentStudent] = React.useState<Student | null>(null);

  // ── 폼 입력 상태 ───────────────────────────────────────────
  const [loginId, setLoginId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pinNumber, setPinNumber] = React.useState("");
  const [name, setName] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("2016-01-01");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [parentName, setParentName] = React.useState("");
  const [parentPhone, setParentPhone] = React.useState("");
  const [serviceType, setServiceType] = React.useState<StudentServiceType>("combo");
  const [grade, setGrade] = React.useState("초등 4");
  const [semester, setSemester] = React.useState("1학기");
  const [mathGradeTerm, setMathGradeTerm] = React.useState("중1-1");
  const [scienceGradeTerm, setScienceGradeTerm] = React.useState("중1-1");
  const [classId, setClassId] = React.useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = React.useState<StudentServiceStatus>("in_use");
  const [memo, setMemo] = React.useState("");

  // ── UI 상태 ──────────────────────────────────────────────
  const [isNotFound, setIsNotFound] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [stopReservationConfirmOpen, setStopReservationConfirmOpen] = React.useState(false);

  // 탭 상태 (학생정보 | 시험 대비)
  const [activeTab, setActiveTab] = React.useState<"info" | "exam-prep">("info");

  // URL tab 파라미터가 변경되면 activeTab 상태에 반영
  React.useEffect(() => {
    if (tabParam === "exam-prep" || tabParam === "info") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: "info" | "exam-prep") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // 정지 / 시작 모달 상태
  const [suspendModalOpen, setSuspendModalOpen] = React.useState(false);
  const [resumeModalOpen, setResumeModalOpen] = React.useState(false);

  // ── 최초 바인딩 ────────────────────────────────────────────
  React.useEffect(() => {
    if (!studentId) return;

    const students = getStoredStudents();
    const teachers = getStoredTeachers();
    const classes = getStoredClasses();

    setStudentsList(students);
    setTeachersList(teachers);
    setClassesList(classes);

    const target = students.find((s) => s.id === studentId);
    if (!target) {
      setIsNotFound(true);
      return;
    }

    setCurrentStudent(target);
    setLoginId(target.loginId || "");
    setPinNumber(target.pinNumber || "");
    setName(target.name || "");
    setParentPhone(target.parentPhone || "");
    setServiceType(target.serviceType || "combo");
    setGrade(target.grade || "초등 4");
    setSemester(target.semester || "1학기");
    setMathGradeTerm(target.mathGradeTerm || "중1-1");
    setScienceGradeTerm(target.scienceGradeTerm || "중1-1");
    setClassId(target.classId);
    setServiceStatus(target.serviceStatus || "in_use");
    
    // 추가 더미 필드 매핑 (오리지널 이미지 기반)
    setPhone(target.parentPhone ? target.parentPhone.replace("3698", "1234") : "01012345678");
    setAddress("서울특별시 강남구 테헤란로 123");
    setParentName("홍길동");
    setMemo("성실하고 수학 연산에 흥미를 느끼는 편입니다.");
  }, [studentId]);

  // ── 실시간 담당 선생님 매핑 연산 ───────────────────────────
  const teacherMap = React.useMemo(() => {
    return getAssignedTeacherMap(teachersList);
  }, [teachersList]);

  const assignedTeacherName = React.useMemo(() => {
    if (!classId) return "-";
    return teacherMap[classId] || "-";
  }, [classId, teacherMap]);

  const nextMonthFirstDate = React.useMemo(() => {
    const date = new Date();
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  }, []);

  const todayText = React.useMemo(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }, []);

  const isStopReservationEligible = Boolean(
    currentStudent && getStudentStopReservationStatus(
      { ...currentStudent, serviceStatus },
      todayText,
    ) === "available"
  );

  const updateStudentService = (nextStatus: StudentServiceStatus, scheduledAt: string | null, activity: string) => {
    if (!currentStudent) return;
    const nextStudents = studentsList.map((student) => student.id === currentStudent.id
      ? { ...student, serviceStatus: nextStatus, serviceStopScheduledAt: scheduledAt }
      : student);
    const nextStudent = nextStudents.find((student) => student.id === currentStudent.id)!;
    saveStoredStudents(nextStudents);
    setStudentsList(nextStudents);
    setCurrentStudent(nextStudent);
    setServiceStatus(nextStatus);
    appendStudentServiceActivity(nextStudent, activity, scheduledAt || new Date().toISOString().slice(0, 10));
  };

  const reserveServiceStop = () => {
    updateStudentService("in_use", nextMonthFirstDate, "서비스 정지 예약");
    setStopReservationConfirmOpen(false);
    toast({ title: `${nextMonthFirstDate.replaceAll("-", ".")} 서비스 정지가 예약되었습니다.` });
  };

  const cancelServiceStopReservation = () => {
    updateStudentService("in_use", null, "서비스 정지 예약 취소");
    toast({ title: "서비스 정지 예약이 취소되었습니다." });
  };

  // ── 저장 핸들러 ───────────────────────────────────────────
  const handleSave = () => {
    if (!currentStudent) return;

    if (!name.trim()) {
      toast({ title: "학생 이름을 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!parentPhone.trim()) {
      toast({ title: "학부모 전화번호를 입력해주세요.", variant: "destructive" });
      return;
    }

    const updatedStudents = studentsList.map((s) => {
      if (s.id === currentStudent.id) {
        return {
          ...s,
          name: name.trim(),
          pinNumber: pinNumber.trim(),
          loginId: loginId.trim(),
          parentPhone: parentPhone.trim(),
          serviceType,
          grade,
          semester,
          mathGradeTerm,
          scienceGradeTerm,
          classId,
          serviceStatus,
        };
      }
      return s;
    });

    saveStoredStudents(updatedStudents);

    // 반 정보 변경 시, 반 소속 인원 수 갱신 동기화 처리
    const nextClasses = classesList.map(cls => {
      // 기존에 이 학생이 소속되었던 반의 카운트 차감, 새로 이동한 반 카운트 가산
      const wasInThisClass = currentStudent.classId === cls.id;
      const isInThisClass = classId === cls.id;
      let count = cls.studentCount;
      if (wasInThisClass && !isInThisClass) count = Math.max(0, count - 1);
      if (!wasInThisClass && isInThisClass) count = count + 1;
      return { ...cls, studentCount: count };
    });
    setClassesList(nextClasses);
    if (typeof window !== "undefined") {
      localStorage.setItem("readingmath_classes_data", JSON.stringify(nextClasses));

      // 선생님관리(assignedClasses) 반 인원수 실시간 동기화
      const storedTeachers = localStorage.getItem("readingmath_teachers_data");
      if (storedTeachers) {
        try {
          const teachers = JSON.parse(storedTeachers) as Teacher[];
          const nextTeachers = teachers.map((t) => {
            const nextAssigned = t.assignedClasses.map((c) => {
              const matched = nextClasses.find((nc) => nc.id === c.id);
              return matched ? { ...c, studentCount: matched.studentCount } : c;
            });
            return { ...t, assignedClasses: nextAssigned };
          });
          localStorage.setItem("readingmath_teachers_data", JSON.stringify(nextTeachers));
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 저장 후 상세 페이지에 머무르기 위해 currentStudent 상태 업데이트
    const updatedTarget = updatedStudents.find((s) => s.id === currentStudent.id);
    if (updatedTarget) {
      setCurrentStudent(updatedTarget);
    }

    toast({ title: "수정사항이 성공적으로 저장되었습니다." });
  };

  // ── 삭제 핸들러 ───────────────────────────────────────────
  const handleDeleteConfirm = () => {
    if (!currentStudent) return;
    const nextStudents = studentsList.filter((s) => s.id !== currentStudent.id);
    saveStoredStudents(nextStudents);

    // 반 인원 카운트 차감 처리
    if (currentStudent.classId) {
      const nextClasses = classesList.map(cls => {
        if (cls.id === currentStudent.classId) {
          return { ...cls, studentCount: Math.max(0, cls.studentCount - 1) };
        }
        return cls;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("readingmath_classes_data", JSON.stringify(nextClasses));

        // 선생님관리(assignedClasses) 반 인원수 실시간 동기화
        const storedTeachers = localStorage.getItem("readingmath_teachers_data");
        if (storedTeachers) {
          try {
            const teachers = JSON.parse(storedTeachers) as Teacher[];
            const nextTeachers = teachers.map((t) => {
              const nextAssigned = t.assignedClasses.map((c) => {
                const matched = nextClasses.find((nc) => nc.id === c.id);
                return matched ? { ...c, studentCount: matched.studentCount } : c;
              });
              return { ...t, assignedClasses: nextAssigned };
            });
            localStorage.setItem("readingmath_teachers_data", JSON.stringify(nextTeachers));
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    toast({ title: "학생 정보가 삭제되었습니다." });
    router.push("/admin/student-list");
  };

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-lg text-slate-500 font-semibold mb-4">존재하지 않는 학생 정보입니다.</p>
        <Button onClick={() => router.push("/admin/student-list")}>학생 목록으로 이동</Button>
      </div>
    );
  }

  if (!currentStudent) {
    return <div className="min-h-screen bg-[#f4f6f9]" />;
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#f4f6f9] px-6 pt-5 pb-20 relative">
      
      {/* ── 헤더 타이틀 ───────────────────────────────────────── */}
      <div className="mb-5">
        <h1 className="text-[1.5rem] font-bold text-foreground">학생상세</h1>
        <p className="text-xs text-slate-400 mt-1">Home - 학생관리 - 학생상세</p>
      </div>

      <div className="w-full space-y-5">
        
        {/* ── 상단 프로필 요약 요약 정보 카드 ─────────────────────── */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm px-6 pt-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex items-start gap-6">
              <div className="w-36 h-36 shrink-0 rounded-md bg-slate-200 flex items-center justify-center border border-slate-200 overflow-hidden">
                <User className="h-20 w-20 text-slate-400" strokeWidth={1.4} />
              </div>
              <div className="pt-1">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-lg font-bold text-slate-800">{name}</span>
                {/* 서비스상태 배지 */}
                <span className={`text-xs px-2.5 py-0.5 rounded font-bold border ${
                  serviceStatus === "in_use"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : serviceStatus === "suspended"
                    ? "bg-orange-50 text-orange-700 border-orange-100"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  {getStudentStatusLabel(serviceStatus)}
                </span>
                {/* 서비스타입 배지 */}
                <span className={`text-xs px-2.5 py-0.5 rounded font-bold border ${
                  serviceType === "math"
                    ? "bg-orange-50 text-orange-700 border-orange-100"
                    : serviceType === "science"
                    ? "bg-blue-50 text-blue-700 border-blue-100"
                    : "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {getStudentServiceTypeLabel(serviceType)}
                </span>
              </div>
              
                <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-xs text-slate-400">
                  <div>아이디: <span className="font-medium text-slate-500">{loginId || "-"}</span></div>
                  <div>학년: <span className="font-medium text-slate-500">{grade} {semester}</span></div>
                  <div>부모님 연락처: <span className="font-medium text-slate-500">{parentPhone || "-"}</span></div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-7 gap-y-2 text-xs text-slate-400">
                  <div>시작일: <span className="font-medium text-slate-500">-</span></div>
                  <div>종료일: <span className="font-medium text-slate-500">-</span></div>
                  <div>가입일시: <span className="font-medium text-slate-500">{currentStudent.createdAt} 08:47:20</span></div>
                </div>
                <div className="mt-4 text-xs text-slate-400">
                  기관: <span className="font-medium text-slate-500">개발연구소</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 self-stretch lg:self-auto justify-end pt-1">
            <Button
              variant="outline"
              className="h-9 px-4 text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/80 hover:text-emerald-700 font-bold"
              onClick={() => router.push("/content/math-home")}
            >
              학생 로그인
            </Button>
            <Button
              variant="destructive"
              className="h-9 px-4 font-bold"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              학생 삭제
            </Button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1 overflow-x-auto">
          {/* 학생정보 — activeTab 변경 */}
          <button
            onClick={() => handleTabChange("info")}
            className={`px-5 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "info"
                ? "text-sky-500 border-sky-500"
                : "text-slate-400 border-transparent hover:text-slate-600"
            }`}
          >
            학생정보
          </button>
          {/* 학습내역 — toast만, activeTab 불변 */}
          <button
            onClick={() => toast({ title: "'학습내역' 탭은 다음 프롬프트에서 순차 구현될 예정입니다." })}
            className="px-5 py-3 font-semibold text-sm whitespace-nowrap text-slate-400 border-b-2 border-transparent hover:text-slate-600 transition-colors"
          >
            학습내역
          </button>
          {/* 시험 대비 — activeTab 변경 */}
          <button
            onClick={() => handleTabChange("exam-prep")}
            className={`px-5 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "exam-prep"
                ? "text-sky-500 border-sky-500"
                : "text-slate-400 border-transparent hover:text-slate-600"
            }`}
          >
            시험 대비
          </button>
          {/* 주간알림장, 월간보고서, 진단평가 보고서 — toast만, activeTab 불변 */}
          {["주간알림장", "월간보고서", "진단평가 보고서"].map((tab) => (
            <button
              key={tab}
              onClick={() => toast({ title: `'${tab}' 탭은 다음 프롬프트에서 순차 구현될 예정입니다.` })}
              className="px-5 py-3 font-semibold text-sm whitespace-nowrap text-slate-400 border-b-2 border-transparent hover:text-slate-600 transition-colors"
            >
              {tab}
            </button>
          ))}
          </div>
        </div>

        {/* ── 시험 대비 탭 콘텐츠 ──────────────────────────────────── */}
        {activeTab === "exam-prep" && studentId && (
          <AdminExamPrepTab
            studentId={studentId}
            studentName={name}
            serviceType={serviceType}
            grade={grade}
            semester={semester}
          />
        )}

        {/* ── 계정 / 개인 / 학부모 / 서비스 정보 ─────────────────── */}
        {activeTab === "info" && (
          <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-10">
            <section>
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-4 mb-5">계정 정보</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">아이디</label>
                  <Input value={loginId} disabled className="h-9 text-sm bg-slate-50 border-slate-200 text-slate-500" />
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">비밀번호</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="입력 후 저장 시 비밀번호가 변경 저장됩니다" className="h-9 text-sm border-slate-200" />
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">PIN번호</label>
                  <Input value={pinNumber} onChange={(e) => setPinNumber(e.target.value)} placeholder="PIN 번호" className="h-9 text-sm border-slate-200" />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-4 mb-5">개인 정보</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-4">
                  <label className="pt-2 text-sm text-right text-slate-500">대표이미지</label>
                  <div>
                    <div className="w-28 h-28 rounded-md bg-slate-200 border border-slate-200 flex items-center justify-center">
                      <User className="h-16 w-16 text-slate-400" strokeWidth={1.4} />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">허용이미지 타입: .png, .jpg, .jpeg</p>
                  </div>
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500"><span className="mr-1 text-red-500">*</span>학생 이름</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="학생 이름" className="h-9 text-sm border-slate-200" />
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500"><span className="mr-1 text-red-500">*</span>생년월일</label>
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="h-9 text-sm border-slate-200" />
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">기관명</label>
                  <Input value="개발연구소" disabled className="h-9 text-sm bg-slate-50 border-slate-200 text-slate-500" />
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">전화번호</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="전화번호" className="h-9 text-sm border-slate-200" />
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">주소</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소" className="h-9 text-sm border-slate-200" />
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">마지막 로그인</label>
                  <Input value="2026-05-28 17:34:00" disabled className="h-9 text-sm bg-slate-50 border-slate-200 text-slate-500" />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-4 mb-5">학부모 정보</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">학부모 이름</label>
                  <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="학부모 이름" className="h-9 text-sm border-slate-200" />
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500"><span className="mr-1 text-red-500">*</span>학부모 전화번호</label>
                  <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="학부모 전화번호" className="h-9 text-sm border-slate-200" />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-4 mb-5">서비스 정보</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500"><span className="mr-1 text-red-500">*</span>서비스 타입</label>
                  <div className="flex flex-wrap items-center gap-6">
                    <select value={serviceType} onChange={(e) => setServiceType(e.target.value as StudentServiceType)} className="h-9 min-w-[190px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
                      {(["math", "science", "combo"] as StudentServiceType[]).map((type) => <option key={type} value={type}>{getStudentServiceTypeLabel(type)}</option>)}
                    </select>
                    <label className="text-sm text-slate-500"><span className="mr-1 text-red-500">*</span>학년</label>
                    <select value={grade} onChange={(e) => setGrade(e.target.value)} className="h-9 w-[150px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
                      {["초등 3", "초등 4", "초등 5", "초등 6", "중등 1", "중등 2", "중등 3", "고등 1", "미지정"].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <label className="text-sm text-slate-500"><span className="mr-1 text-red-500">*</span>학기</label>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)} className="h-9 w-[120px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
                      {["1학기", "2학기", "미지정"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">학습 학기</label>
                  <div className="flex flex-wrap items-center gap-4">
                    {(serviceType === "math" || serviceType === "combo") && (
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-violet-50 px-2 py-1 text-xs font-bold text-violet-500">수학</span>
                        <select value={mathGradeTerm} onChange={(e) => setMathGradeTerm(e.target.value)} className="h-9 w-[150px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
                          {["초3-1","초3-2","초4-1","초4-2","초5-1","초5-2","초6-1","초6-2","중1-1","중1-2","중2-1","중2-2","중3-1","중3-2","고1-1","고1-2"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    )}
                    {(serviceType === "science" || serviceType === "combo") && (
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-sky-50 px-2 py-1 text-xs font-bold text-sky-500">과학</span>
                        <select value={scienceGradeTerm} onChange={(e) => setScienceGradeTerm(e.target.value)} className="h-9 w-[150px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
                          {["초3-1","초3-2","초4-1","초4-2","초5-1","초5-2","초6-1","초6-2","중1-1","중1-2","중2-1","중2-2","중3-1","중3-2","고1-1","고1-2"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">반</label>
                  <select value={classId || "all"} onChange={(e) => setClassId(e.target.value === "all" ? null : e.target.value)} className="h-9 w-[190px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
                    <option value="all">미지정 (-)</option>
                    {classesList.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">담당 선생님</label>
                  <Input value={assignedTeacherName} readOnly disabled className="h-9 w-[190px] bg-slate-50 border-slate-200 text-sm text-slate-500" />
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">서비스 상태</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex h-9 items-center rounded-md px-3 text-xs font-bold ${serviceStatus === "in_use" ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-600"}`}>
                      {serviceStatus === "in_use" ? "사용중" : "서비스 정지"}
                    </span>
                    {serviceStatus === "in_use" ? (
                      <Button type="button" onClick={() => setSuspendModalOpen(true)} className="h-9 bg-red-400 px-4 text-xs font-bold text-white hover:bg-red-500">서비스 정지</Button>
                    ) : (
                        <Button type="button" onClick={() => setResumeModalOpen(true)} className="h-9 bg-blue-500 px-4 text-xs font-bold text-white hover:bg-blue-600">서비스 시작</Button>
                    )}
                    {serviceStatus === "in_use" && (
                      currentStudent.serviceStopScheduledAt ? (
                        <Button type="button" variant="outline" onClick={cancelServiceStopReservation} className="h-9 border-slate-300 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50">정지 예약 취소</Button>
                      ) : isStopReservationEligible ? (
                        <Button type="button" variant="outline" onClick={() => setStopReservationConfirmOpen(true)} className="h-9 border-blue-300 px-4 text-xs font-bold text-blue-500 hover:bg-blue-50 hover:text-blue-600">서비스 정지 예약</Button>
                      ) : null
                    )}
                    {serviceStatus === "in_use" && currentStudent.serviceStopScheduledAt && (
                      <span className="text-xs font-semibold text-orange-500">{currentStudent.serviceStopScheduledAt.replaceAll("-", ".")} 정지 예정</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm text-right text-slate-500">가입일</label>
                  <div className="text-sm font-semibold text-slate-500">{currentStudent.createdAt} 08:47:20</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-4 mb-5">메모</h2>
              <div className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-4">
                <label className="pt-2 text-sm text-right text-slate-500">관리자 메모</label>
                <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="내용을 입력해 주세요." rows={3} className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ── 하단 액션 ─────────────────────────────────────────── */}
      {activeTab === "info" && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/student-list")}
            className="h-9 px-3.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm flex items-center gap-2.5 transition-colors"
          >
            <div className="flex flex-col gap-1 w-3.5">
              <span className="h-0.5 w-full bg-slate-500 rounded-full" />
              <span className="h-0.5 w-full bg-slate-500 rounded-full" />
              <span className="h-0.5 w-full bg-slate-500 rounded-full" />
            </div>
            목록
          </button>

          <Button
            className="h-9 px-5 bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-sm rounded-md"
            onClick={handleSave}
          >
            저장
          </Button>
        </div>
      )}

      {/* ── 삭제 확인 다이얼로그 ───────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="학생 삭제"
        description={`'${name}' 학생을 삭제하시겠습니까?\n삭제된 정보는 복구할 수 없습니다.`}
        confirmLabel="삭제"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={stopReservationConfirmOpen}
        onOpenChange={setStopReservationConfirmOpen}
        title="서비스 정지 예약"
        description={`서비스 정지를 예약하시겠습니까?\n\n학생은 이번 달 말일까지 서비스를 이용할 수 있으며,\n${nextMonthFirstDate.replaceAll("-", ".")}부터 서비스가 정지됩니다.`}
        confirmLabel="예약"
        onConfirm={reserveServiceStop}
      />

      {/* ── 서비스 정지 모달 팝업 ─────────────────────────────── */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="max-w-md rounded-xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">서비스를 정지할까요?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2.5 text-sm text-slate-600">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span>이용 기간</span>
              <span className="font-semibold text-slate-800">2026-05-01 ~ 2026-05-29</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span>사용일수</span>
              <span className="font-semibold text-slate-800">29일</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span>잔여일수</span>
              <span className="font-semibold text-slate-800">2일</span>
            </div>
            <div className="flex justify-between">
              <span>환불 예정 포인트</span>
              <span className="font-bold text-rose-500">966P</span>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuspendModalOpen(false)}
              className="h-9 px-4 text-xs font-semibold bg-white border-slate-200 text-slate-600"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={() => {
                updateStudentService("suspended", null, "서비스 정지");
                setSuspendModalOpen(false);
                toast({ title: "서비스가 정지 처리되었습니다." });
              }}
              className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 서비스 다시 시작 모달 팝업 ───────────────────────────── */}
      <Dialog open={resumeModalOpen} onOpenChange={setResumeModalOpen}>
        <DialogContent className="max-w-md rounded-xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">서비스를 다시 시작할까요?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2.5 text-sm text-slate-600">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span>서비스</span>
              <span className="font-semibold text-slate-800">리딩수학+과학 통합</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span>이용 기간</span>
              <span className="font-semibold text-slate-800">2026-05-29 ~ 2026-06-31</span>
            </div>
            <div className="flex justify-between">
              <span>예상 차감 포인트</span>
              <span className="font-bold text-blue-600">1,449P</span>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResumeModalOpen(false)}
              className="h-9 px-4 text-xs font-semibold bg-white border-slate-200 text-slate-600"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setServiceStatus("in_use");
                setResumeModalOpen(false);
                toast({ title: "서비스가 시작 처리되었습니다." });
              }}
              className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              시작
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
