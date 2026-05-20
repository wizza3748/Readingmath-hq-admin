"use client";
import * as React from "react";
import { PrintColor } from "./task-print-view";
import { TaskItem, StudentAssignment } from "@/lib/task-center-mock";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Props {
  task: TaskItem;
  printType: "student" | "teacher";
  setPrintType: (v: "student" | "teacher") => void;
  printTarget: "all" | "selected";
  setPrintTarget: (v: "all" | "selected") => void;
  selectedStudentIds: string[];
  previewStudentId: string;
  setPreviewStudentId: (v: string) => void;
  color: PrintColor;
  setColor: (v: PrintColor) => void;
  split: "1" | "2" | "4" | "6";
  setSplit: (v: "1" | "2" | "4" | "6") => void;
  pageMargin: number;
  setPageMargin: (v: number) => void;
  problemGap: number;
  setProblemGap: (v: number) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  showName: boolean;
  setShowName: (v: boolean) => void;
  showDate: boolean;
  setShowDate: (v: boolean) => void;
  showLogo: boolean;
  setShowLogo: (v: boolean) => void;
  onOpenStudentModal: () => void;
  activeStudents: StudentAssignment[];
}

const COLORS: { value: PrintColor; label: string }[] = [
  { value: "#002775", label: "네이비" },
  { value: "#4BC8DC", label: "스카이" },
  { value: "#FF9B4E", label: "오렌지" },
  { value: "#64C947", label: "그린" },
  { value: "#F7417A", label: "핑크" },
  { value: "#242424", label: "흑백" },
];

export default function PrintSettingPanel({
  task,
  printType, setPrintType,
  printTarget, setPrintTarget,
  selectedStudentIds,
  previewStudentId, setPreviewStudentId,
  color, setColor,
  split, setSplit,
  pageMargin, setPageMargin,
  problemGap, setProblemGap,
  fontSize, setFontSize,
  showName, setShowName,
  showDate, setShowDate,
  showLogo, setShowLogo,
  onOpenStudentModal,
  activeStudents
}: Props) {
  
  const isIndividual = task.problemMode === "individual";
  const showPrintTarget = isIndividual;
  const showStudentSelect = showPrintTarget && printTarget === "selected";
  const showPreviewStudent = isIndividual;

  const getStudentSummary = () => {
    if (selectedStudentIds.length === 0) return "선택된 학생이 없습니다.";
    const firstStudent = activeStudents.find(s => s.studentId === selectedStudentIds[0]);
    if (selectedStudentIds.length === 1) return firstStudent?.studentName || "";
    return `${firstStudent?.studentName || "학생"} 외 ${selectedStudentIds.length - 1}명`;
  };

  const previewStudentOptions = showPreviewStudent 
    ? (printTarget === "all" ? activeStudents : activeStudents.filter(s => selectedStudentIds.includes(s.studentId)))
    : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-6">
      <h2 className="text-lg font-bold text-slate-800">출력 설정</h2>

      {/* 출력물 유형 */}
      <div className="flex flex-col gap-3">
        <Label className="text-gray-700 font-semibold">출력물 유형</Label>
        <RadioGroup value={printType} onValueChange={(v: "student" | "teacher") => setPrintType(v)} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="student" id="pt-student" />
            <Label htmlFor="pt-student" className="font-normal cursor-pointer">학생용</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="teacher" id="pt-teacher" />
            <Label htmlFor="pt-teacher" className="font-normal cursor-pointer">교사용</Label>
          </div>
        </RadioGroup>
      </div>

      {/* 출력 대상 */}
      {showPrintTarget && (
        <div className="flex flex-col gap-3">
          <Label className="text-gray-700 font-semibold">출력 대상</Label>
          <RadioGroup value={printTarget} onValueChange={(v: "all" | "selected") => setPrintTarget(v)} className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="ptar-all" />
              <Label htmlFor="ptar-all" className="font-normal cursor-pointer">전체 학생</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="selected" id="ptar-sel" />
              <Label htmlFor="ptar-sel" className="font-normal cursor-pointer">선택 학생</Label>
            </div>
          </RadioGroup>

          {showStudentSelect && (
            <div className="flex items-center gap-3 mt-1 ml-6">
              <Button variant="outline" size="sm" onClick={onOpenStudentModal}>학생 선택</Button>
              <span className="text-sm text-gray-500">{getStudentSummary()}</span>
            </div>
          )}
        </div>
      )}

      {/* 미리보기 학생 */}
      {showPreviewStudent && previewStudentOptions.length > 0 && (
        <div className="flex flex-col gap-3">
          <Label className="text-gray-700 font-semibold">미리보기 학생</Label>
          <Select value={previewStudentId} onValueChange={setPreviewStudentId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="학생 선택" />
            </SelectTrigger>
            <SelectContent>
              {previewStudentOptions.map(s => (
                <SelectItem key={s.studentId} value={s.studentId}>{s.studentName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 색상 */}
      <div className="flex flex-col gap-3">
        <Label className="text-gray-700 font-semibold">테마 색상</Label>
        <div className="flex gap-3">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              title={c.label}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${color === c.value ? 'ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200'}`}
              style={{ backgroundColor: c.value }}
            >
              {color === c.value && <div className="w-3 h-3 bg-white rounded-full opacity-90" />}
            </button>
          ))}
        </div>
      </div>

      {/* 분할 */}
      <div className="flex flex-col gap-3">
        <Label className="text-gray-700 font-semibold">페이지 분할</Label>
        <RadioGroup value={split} onValueChange={(v: any) => setSplit(v)} className="grid grid-cols-4 gap-2">
          {[{v:"1", l:"기본"}, {v:"2", l:"2분할"}, {v:"4", l:"4분할"}, {v:"6", l:"6분할"}].map(item => (
            <div key={item.v}>
              <RadioGroupItem value={item.v} id={`split-${item.v}`} className="peer sr-only" />
              <Label 
                htmlFor={`split-${item.v}`}
                className="flex flex-col items-center justify-center py-2.5 px-1 border border-slate-200 rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 text-xs font-semibold text-slate-600 transition-all duration-150"
              >
                {item.l}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* 슬라이더: 페이지 여백, 문제 여백, 폰트 크기 */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <Label className="text-gray-700 font-semibold">페이지 여백</Label>
            <span className="text-sm text-gray-500">{pageMargin}mm</span>
          </div>
          <Slider value={[pageMargin]} min={5} max={20} step={1} onValueChange={([v]) => setPageMargin(v)} />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <Label className="text-gray-700 font-semibold">문제 사이 여백</Label>
            <span className="text-sm text-gray-500">{problemGap}mm</span>
          </div>
          <Slider value={[problemGap]} min={8} max={32} step={1} onValueChange={([v]) => setProblemGap(v)} />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <Label className="text-gray-700 font-semibold">폰트 크기</Label>
            <span className="text-sm text-gray-500">{fontSize}pt</span>
          </div>
          <Slider value={[fontSize]} min={11} max={18} step={1} onValueChange={([v]) => setFontSize(v)} />
        </div>
      </div>

      {/* 표시 옵션 */}
      <div className="flex flex-col gap-3">
        <Label className="text-gray-700 font-semibold">추가 표시</Label>
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="opt-name" checked={showName} onCheckedChange={(c) => setShowName(!!c)} />
            <Label htmlFor="opt-name" className="font-normal cursor-pointer">이름 표시</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="opt-date" checked={showDate} onCheckedChange={(c) => setShowDate(!!c)} />
            <Label htmlFor="opt-date" className="font-normal cursor-pointer">오늘 날짜 표시</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="opt-logo" checked={showLogo} onCheckedChange={(c) => setShowLogo(!!c)} />
            <Label htmlFor="opt-logo" className="font-normal cursor-pointer">로고 표시</Label>
          </div>
        </div>
      </div>
    </div>
  );
}
