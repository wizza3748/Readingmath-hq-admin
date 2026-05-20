"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudentAssignment } from "@/lib/task-center-mock";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentAssignment[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
}

export default function PrintStudentModal({ open, onOpenChange, students, selectedIds, onConfirm }: Props) {
  const [internalSelected, setInternalSelected] = React.useState<string[]>(selectedIds);
  const [searchName, setSearchName] = React.useState("");
  const [filterClass, setFilterClass] = React.useState("all");

  React.useEffect(() => {
    if (open) {
      setInternalSelected(selectedIds);
      setSearchName("");
      setFilterClass("all");
    }
  }, [open, selectedIds]);

  const classes = React.useMemo(() => {
    const set = new Set(students.map(s => s.classGroup));
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = React.useMemo(() => {
    return students.filter(s => {
      const matchName = searchName ? s.studentName.includes(searchName) : true;
      const matchClass = filterClass !== "all" ? s.classGroup === filterClass : true;
      return matchName && matchClass;
    });
  }, [students, searchName, filterClass]);

  const handleToggle = (id: string, checked: boolean) => {
    if (checked) setInternalSelected(prev => [...prev, id]);
    else setInternalSelected(prev => prev.filter(v => v !== id));
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setInternalSelected(filteredStudents.map(s => s.studentId));
    } else {
      setInternalSelected([]);
    }
  };

  const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => internalSelected.includes(s.studentId));

  const handleConfirm = () => {
    onConfirm(internalSelected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col max-h-[90vh] rounded-2xl border border-slate-200 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-lg font-bold text-slate-800">출력 학생 선택</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="반 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 반</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Input 
                placeholder="학생명 검색" 
                value={searchName} 
                onChange={(e) => setSearchName(e.target.value)} 
                className="w-[200px] focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            선택 학생 <strong className="text-blue-600">{internalSelected.length}</strong>명
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl mt-4 flex flex-col min-h-0 flex-1 overflow-hidden bg-white shadow-sm">
          <div className="flex items-center px-4 py-2.5 bg-slate-50 border-b border-slate-100 font-bold text-xs text-slate-500">
            <div className="w-[50px] text-center">
              <Checkbox checked={allSelected} onCheckedChange={(c) => handleToggleAll(!!c)} />
            </div>
            <div className="flex-1">학생명</div>
            <div className="w-[150px]">반</div>
            <div className="w-[120px] text-center">과제 상태</div>
          </div>
          <ScrollArea className="flex-1 max-h-[400px]">
            {filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">검색 결과가 없습니다.</div>
            ) : (
              <div className="flex flex-col">
                {filteredStudents.map((s, i) => {
                  const isChecked = internalSelected.includes(s.studentId);
                  return (
                    <div key={s.studentId} className={`flex items-center px-4 py-2.5 text-sm border-b border-slate-100 last:border-0 ${isChecked ? 'bg-indigo-50/30' : 'bg-white'} hover:bg-slate-50/50 transition-all duration-150`}>
                      <div className="w-[50px] text-center">
                        <Checkbox checked={isChecked} onCheckedChange={(c) => handleToggle(s.studentId, !!c)} />
                      </div>
                      <div className="flex-1 font-medium text-gray-900">{s.studentName}</div>
                      <div className="w-[150px] text-gray-600">{s.classGroup}</div>
                      <div className="w-[120px] text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          s.status === "not_started" ? "bg-gray-100 text-gray-600" :
                          s.status === "in_progress" ? "bg-blue-100 text-blue-600" :
                          s.status === "submitted" ? "bg-green-100 text-green-600" :
                          s.status === "timeout" ? "bg-red-100 text-red-600" : ""
                        }`}>
                          {s.status === "not_started" ? "시작 전" :
                           s.status === "in_progress" ? "진행 중" :
                           s.status === "submitted" ? "제출 완료" :
                           s.status === "timeout" ? "시간 초과" : s.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleConfirm} disabled={internalSelected.length === 0}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
