
'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { createQuestion, updateQuestion, type Question, getNextQuestionNumber, initialCurriculumUnits, type CurriculumUnit } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Minus } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { RichEditor } from '@/components/ui/rich-editor';
import { Switch } from '@/components/ui/switch';

const answerSchema = z.object({
    id: z.string().optional(),
    isCorrect: z.boolean().optional(),
    value: z.any(),
    type: z.string().optional(), // for 입력형
    symbol: z.boolean().optional(), // for 입력형
});

const formSchema = z.object({
  difficulty: z.enum(['하', '중하', '중', '중상', '상']),
  subUnitType: z.string().min(1, '중단원 유형을 선택해주세요.'),
  contentArea: z.string().min(1, '내용영역을 선택해주세요.'),
  behavioralArea: z.enum(['개념이해력', '문제해결력', '문해력', '추론력']),
  prompt: z.string().min(1, '발문을 입력해주세요.'),
  viewContent: z.string().optional(),
  answerType: z.enum(['입력형', '선지형', '순서맞추기']).optional(),
  answers: z.array(answerSchema).optional(),
  solution: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  problemSolving: z.string().optional(),
  isReviewed: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const contentAreaMapping: { [key: string]: string } = {
    '1. 물질의 성질': '화학',
    '2. 자석의 이용': '물리',
    '3. 동물의 한살이': '생명과학',
    '4. 지표의 변화': '지구과학',
    '1. 무게와 수평': '물리',
    '2. 식물의 한살이': '생명과학',
    '3. 액체와 기체': '화학',
    '4. 화산과 암석': '지구과학',
    '1. 혼합물의 분리': '화학',
    '2. 용액의 진하기': '화학',
    '3. 물체의 운동': '물리',
    '4. 식물의 구조와 기능': '생명과학',
    '5. 동물의 구조와 기능': '탐구활동',
    '1. 생물과 환경': '생명과학',
    '2. 렌즈의 이용': '물리',
    '3. 산과 염기': '화학',
    '4. 지구와 달의 운동': '지구과학',
    '1. 여러 가지 기체': '화학',
    '2. 우리 몸의 구조와 기능': '생명과학',
    '3. 빛과 파동': '물리',
    '4. 지권의 변화': '지구과학',
    '1. 날씨의 변화': '지구과학',
    '2. 식물과 에너지': '생명과학',
    '3. 전기와 자기': '물리',
    '4. 화학 반응의 규칙': '화학',
    '1. 물질의 구성': '화학',
    '2. 힘과 운동': '물리',
    '3. 자극과 반응': '생명과학',
    '4. 식물과 에너지': '생명과학',
    '5. 동물과 에너지': '생명과학',
    '1. 전기와 자기': '물리',
    '2. 화학 반응의 규칙과 에너지 변화': '화학',
    '3. 생식과 발생': '생명과학',
    '4. 별과 우주': '지구과학',
    '1. 화학 반응의 규칙성과 에너지 변화': '화학',
    '2. 기권과 날씨': '지구과학',
    '3. 운동과 에너지': '물리',
    '4. 자극과 반응': '생명과학',
    '1. 운동과 에너지': '물리',
    '2. 화학 변화와 이온': '화학',
    '3. 지구와 우주': '지구과학',
    '4. 과학 기술과 인류 문명': '통합과학',
    '1. 물질의 특성': '화학',
    '2. 빛과 파동': '물리',
    '3. 기권과 날씨': '지구과학',
    '4. 소화, 순환, 호흡, 배설': '생명과학',
};

const generateCircledNumber = (num: number) => {
    return `①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳`[num-1] || String(num);
};
const generateCircledKorean = (num: number) => {
    return `㉠㉡㉢㉣㉤㉥㉦㉧㉨㉩㉪㉫㉬㉭`[num-1] || String(num);
};

export function QuestionModal({
  children,
  testId,
  question,
  questionType,
}: {
  children: React.ReactNode;
  testId: string;
  question?: Question;
  questionType: '유형' | '서술형';
}) {
  const [open, setOpen] = React.useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [curriculumUnits, setCurriculumUnits] = React.useState<CurriculumUnit[]>(initialCurriculumUnits);
  const [showOXConfirm, setShowOXConfirm] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      difficulty: '중',
      behavioralArea: '개념이해력',
      isReviewed: false,
      subUnitType: '',
      contentArea: '',
      prompt: '',
      viewContent: '',
      solution: '',
      problemSolving: '',
      answerType: questionType === '유형' ? '선지형' : undefined,
      answers: [],
      videoUrl: '',
    },
  });
  
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "answers"
  });

  const selectedSubUnitId = form.watch('subUnitType');
  const answerType = form.watch('answerType');
  const isReviewed = form.watch('isReviewed');

  React.useEffect(() => {
    if (selectedSubUnitId) {
        const selectedUnit = curriculumUnits.find(unit => unit.id === selectedSubUnitId);
        const largeUnitKey = Object.keys(contentAreaMapping).find(key => key === selectedUnit?.largeUnit);
        
        if (largeUnitKey && contentAreaMapping[largeUnitKey]) {
            form.setValue('contentArea', contentAreaMapping[largeUnitKey]);
        } else {
             form.setValue('contentArea', '');
        }
    }
  }, [selectedSubUnitId, form, curriculumUnits]);


  React.useEffect(() => {
    if (open) {
        const defaultValues = {
          difficulty: '중',
          behavioralArea: '개념이해력',
          isReviewed: false,
          subUnitType: '',
          contentArea: '',
          prompt: '',
          viewContent: '',
          solution: '',
          problemSolving: '',
          answerType: questionType === '유형' ? '선지형' : undefined,
          answers: [],
          videoUrl: '',
        };

        if (question) {
             const selectedUnit = curriculumUnits.find(unit => unit.id === question.subUnitType);
             const contentArea = question.contentArea || (selectedUnit?.largeUnit && contentAreaMapping[selectedUnit.largeUnit]) || '';
            form.reset({
                ...defaultValues,
                ...question,
                answerType: question.answerType || (question.questionType === '유형' ? '선지형' : undefined),
                answers: question.answers || [],
                contentArea,
            });
        } else {
            form.reset(defaultValues);
            if (questionType === '유형') {
              replace([{ value: '', isCorrect: false }, { value: '', isCorrect: false }]);
            }
        }
    }
  }, [open, question, form, questionType, curriculumUnits, replace]);

  const onSubmit = async (data: FormValues) => {
    if (!firestore) return;
    try {
      if (question) {
        // Update existing question
        await updateQuestion(firestore, testId, question.id, {
            ...data,
            questionType,
        });
        toast({ title: '문제가 수정되었습니다.' });
      } else {
        // Create new question
        const questionNumber = await getNextQuestionNumber(firestore, testId);
        await createQuestion(firestore, testId, {
          ...data,
          questionType,
          questionNumber,
        });
        toast({ title: '신규 문제가 등록되었습니다.' });
      }
      setOpen(false);
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '오류가 발생했습니다.',
      });
    }
  };

  const handleAnswerTypeChange = (value: string) => {
    form.setValue('answerType', value as '입력형' | '선지형' | '순서맞추기');
    replace([]); 
    if (value === '입력형') {
        append({ value: { val: '' }, type: '기본', symbol: false });
    } else if (value === '선지형') {
        append({ value: '', isCorrect: false });
        append({ value: '', isCorrect: false });
    } else if (value === '순서맞추기') {
        append({ value: ''});
    }
  }

  const generateOptions = (type: 'circled' | 'korean' | 'ox') => {
    let newAnswers: any[];

    if (type === 'ox') {
      replace([{ value: 'O', isCorrect: false }, { value: 'X', isCorrect: false }]);
      setShowOXConfirm(false);
      return;
    }
    
    newAnswers = Array.from({ length: 2 }, (_, index) => ({
      value: type === 'circled' ? `${generateCircledNumber(index + 1)} ` : `${generateCircledKorean(index + 1)} `,
      isCorrect: false
    }));
    replace(newAnswers);
  };

  const handleOXGenerate = () => {
    if (fields.some(f => f.value !== '' && f.value !== 'O' && f.value !== 'X')) {
      setShowOXConfirm(true);
    } else {
      generateOptions('ox');
    }
  }
  
  const handleAddChoice = () => {
    const nextNum = fields.length + 1;
    let newValue = '';
    
    // Check if the current choices are numbered or lettered
    const firstChoice = fields[0]?.value as string || '';
    if (firstChoice.startsWith('①')) {
      newValue = `${generateCircledNumber(nextNum)} `;
    } else if (firstChoice.startsWith('㉠')) {
      newValue = `${generateCircledKorean(nextNum)} `;
    }
    
    append({ value: newValue, isCorrect: false });
  };
  
  const handleRemoveChoice = (index: number) => {
    remove(index);
    // After removing, re-number/re-letter the remaining choices
    const currentValues = form.getValues('answers') || [];
    const firstChoice = currentValues[0]?.value as string || '';
    
    let needsReordering = false;
    if (firstChoice.startsWith('①') || firstChoice.startsWith('㉠')) {
        needsReordering = true;
    }

    if(needsReordering && currentValues.length > 1) {
        const newAnswers = currentValues.filter((_, i) => i !== index).map((answer, i) => {
            let newPrefix = '';
            if (firstChoice.startsWith('①')) {
                newPrefix = `${generateCircledNumber(i + 1)} `;
            } else if (firstChoice.startsWith('㉠')) {
                newPrefix = `${generateCircledKorean(i + 1)} `;
            }
            const existingValue = (answer.value as string).replace(/^[①-⑳㉠-㉭]\s/, '');
            return {
                ...answer,
                value: `${newPrefix}${existingValue}`
            }
        });
        replace(newAnswers);
    }
};

  const handleCorrectAnswerChange = (changedIndex: number, isChecked: boolean) => {
    const currentAnswers = form.getValues('answers') || [];
    const newAnswers = currentAnswers.map((answer, index) => {
      if (index === changedIndex) {
        return { ...answer, isCorrect: isChecked };
      }
      return answer;
    });
    form.setValue('answers', newAnswers, { shouldDirty: true });
  };


  const difficultyOptions: ('하' | '중하' | '중' | '중상' | '상')[] = ['하', '중하', '중', '중상', '상'];
  const behavioralAreaOptions: ('개념이해력' | '문제해결력' | '문해력' | '추론력')[] = ['개념이해력', '문제해결력', '문해력', '추론력'];
  const answerTypeOptions: ('입력형' | '선지형' | '순서맞추기')[] = ['입력형', '선지형', '순서맞추기'];
  const inputTypeOptions = ['기본', '분수', '대분수'];

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-full w-full h-full flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            문제 상세 ({questionType})
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-y-hidden">
            <div className="flex-1 space-y-4 px-6 overflow-y-auto">
                {/* 기본 정보 영역 */}
                <div className='space-y-4 p-4 border rounded-md'>
                    <h3 className="text-lg font-semibold">기본 정보</h3>
                    <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>난이도 *</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                                        {difficultyOptions.map(opt => (
                                            <FormItem key={opt} className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value={opt} /></FormControl>
                                                <FormLabel className="font-normal">{opt}</FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="subUnitType"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>중단원 유형 *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={curriculumUnits.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder="중단원 선택" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {curriculumUnits.map(unit => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                            {`${unit.semester} > ${unit.largeUnit} > ${unit.mediumUnit} > ${unit.subUnit}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="contentArea"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>내용영역 *</FormLabel>
                                <FormControl><Input {...field} readOnly placeholder="중단원 유형 선택 시 자동 입력" /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="behavioralArea"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>행동영역 *</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                                        {behavioralAreaOptions.map(opt => (
                                            <FormItem key={opt} className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value={opt} /></FormControl>
                                                <FormLabel className="font-normal">{opt}</FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />
                
                {/* 문제 입력 영역 */}
                <div className='space-y-4 p-4 border rounded-md'>
                  <h3 className="text-lg font-semibold">문제 입력</h3>
                  {questionType === '서술형' && (
                    <>
                        <div className='bg-gray-100 p-2 text-xs text-muted-foreground rounded-md'>
                        ${'[n]'}빈칸길이 기본 (alt + 1) &nbsp; ${'[n-]'}빈칸길이 2배 (alt + 2) &nbsp; ${'[n--]'}빈칸길이 3배 (alt + 3) &nbsp; ${'[n---]'}빈칸길이 4배 (alt + 4) &nbsp; ${'[n----]'}빈칸길이 5배 (alt + 5) &nbsp; ${'[n-----]'}빈칸길이 6배 (alt + 6) &nbsp; ${'[n]/[n]'}진분수 (alt + 7) &nbsp; ${'[n]/[n]/[n]'}대분수 (alt + 8) &nbsp; #{'[n-n]'}빈칸 문제 복사 (alt + 9) &nbsp; //끊어 읽기
                        </div>
                         <FormField
                            control={form.control}
                            name="problemSolving"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>문제풀이 *</FormLabel>
                                    <FormControl>
                                        <RichEditor {...field} placeholder="전체 문항 설명 및 풀이를 입력하세요." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button">풀이 답안 생성</Button>
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>발문 *</FormLabel>
                        <FormControl>
                            <RichEditor {...field} placeholder="문제 질문 문장을 입력하세요."/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="viewContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>보기</FormLabel>
                        <FormControl>
                            <RichEditor {...field} placeholder="보조 자료를 입력하세요."/>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {questionType === '유형' && (
                    <div className="p-4 border rounded-md bg-slate-50 space-y-4">
                         <h3 className="text-lg font-semibold">답안</h3>
                         <FormField
                            control={form.control}
                            name="answerType"
                            render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={handleAnswerTypeChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="답안 유형 선택" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {answerTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        
                        {answerType === '입력형' && (
                          <div className="space-y-4">
                            {fields.map((field, index) => (
                              <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md bg-white">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`answers.${index}.type`}
                                            render={({ field: typeField }) => (
                                                <FormItem>
                                                <Select onValueChange={typeField.onChange} value={typeField.value}>
                                                    <FormControl><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>{inputTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                                </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`answers.${index}.symbol`}
                                            render={({ field: symbolField }) => (
                                                <FormItem className="flex items-center space-x-2 pt-2">
                                                <Checkbox checked={symbolField.value} onCheckedChange={symbolField.onChange} />
                                                <FormLabel>기호</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Controller
                                        control={form.control}
                                        name={`answers.${index}.value`}
                                        render={({ field: valueField }) => {
                                            const currentAnswerType = form.getValues(`answers.${index}.type`);
                                            const value = valueField.value || {};
                                            if (currentAnswerType === '분수') {
                                                return <div className="flex items-center gap-1">
                                                    <Input placeholder="분자" className="text-center" defaultValue={value.num} onChange={(e) => valueField.onChange({...value, num: e.target.value })}/> / 
                                                    <Input placeholder="분모" className="text-center" defaultValue={value.den} onChange={(e) => valueField.onChange({...value, den: e.target.value })}/>
                                                </div>
                                            }
                                            if (currentAnswerType === '대분수') {
                                                return <div className="flex items-center gap-1">
                                                    <Input className="w-16 text-center" placeholder="자연수" defaultValue={value.int} onChange={(e) => valueField.onChange({...value, int: e.target.value })}/>
                                                    <div className="flex flex-col">
                                                        <Input placeholder="분자" className="text-center h-8" defaultValue={value.num} onChange={(e) => valueField.onChange({...value, num: e.target.value })}/>
                                                        <div className="border-t border-black my-1"></div>
                                                        <Input placeholder="분모" className="text-center h-8" defaultValue={value.den} onChange={(e) => valueField.onChange({...value, den: e.target.value })}/>
                                                    </div>
                                                </div>
                                            }
                                            return <Input {...valueField} placeholder="정답 입력" defaultValue={value.val} onChange={(e) => valueField.onChange({val: e.target.value})}/>
                                        }}
                                    />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="ml-auto shrink-0">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ value: { val: '' }, type: '기본', symbol: false })}><Plus className="mr-2 h-4 w-4" /> 정답 추가</Button>
                          </div>
                        )}

                        {answerType === '선지형' && (
                          <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <FormLabel className="shrink-0">정답</FormLabel>
                                  {fields.map((field, index) => (
                                    <FormField
                                      key={field.id}
                                      control={form.control}
                                      name={`answers.${index}.isCorrect`}
                                      render={({ field: checkField }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={checkField.value}
                                              onCheckedChange={(checked) => handleCorrectAnswerChange(index, !!checked)}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">{index + 1}</FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => generateOptions('korean')}>㉠㉡ 생성</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => generateOptions('circled')}>①② 생성</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={handleOXGenerate}>OX 생성</Button>
                                    <Button type="button" variant="default" size="sm" onClick={handleAddChoice}><Plus className="mr-2 h-4 w-4" />선지 추가</Button>
                                </div>
                            </div>
                            {fields.map((field, index) => (
                               <div key={field.id} className="flex items-start gap-2">
                                  <div className="flex flex-col items-center gap-1 pt-1">
                                    <FormLabel>선지{index + 1}</FormLabel>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChoice(index)} className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                   <Controller
                                      control={form.control}
                                      name={`answers.${index}.value`}
                                      render={({ field: valueField }) => (
                                        <div className="flex-1">
                                          <RichEditor {...valueField} />
                                        </div>
                                      )}
                                    />
                               </div>
                            ))}
                          </div>
                        )}

                        {answerType === '순서맞추기' && (
                           <div className="space-y-2">
                             {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md bg-white">
                                  <div className="font-bold text-lg">{generateCircledKorean(index+1)}</div>
                                    <Controller
                                      control={form.control}
                                      name={`answers.${index}.value`}
                                      render={({ field: valueField }) => (
                                        <div className="flex-1">
                                          <RichEditor {...valueField} />
                                        </div>
                                      )}
                                    />
                                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Minus className="h-4 w-4" /></Button>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => append({ value: ''})}><Plus className="h-4 w-4" /></Button>
                                </div>
                             ))}
                              {fields.length === 0 && <Button type="button" variant="outline" size="sm" onClick={() => append({ value: ''})}><Plus className="mr-2 h-4 w-4" /> 항목 추가</Button>}
                           </div>
                        )}

                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="solution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>해설</FormLabel>
                        <FormControl>
                            <RichEditor {...field} placeholder="해설 자료를 입력하세요."/>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>풀이 동영상 URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://www.youtube.com/watch?v=..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
            </div>
            
            <DialogFooter className="p-6 pt-4 border-t sticky bottom-0 bg-background z-10">
              <div className='flex justify-between w-full'>
                  <FormField
                    control={form.control}
                    name="isReviewed"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormLabel>검수 여부</FormLabel>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <span className="text-sm text-muted-foreground">
                                {isReviewed ? '검수완료' : '검수전'}
                            </span>
                        </FormItem>
                    )}
                  />
                  <div>
                      <Button type="button" variant="outline" className='mr-2'>미리보기</Button>
                      <Button type="submit" className='mr-2'>문제 저장</Button>
                      <DialogClose asChild>
                          <Button type="button" variant="secondary">닫기</Button>
                      </DialogClose>
                  </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
     <AlertDialog open={showOXConfirm} onOpenChange={setShowOXConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>기존 선지를 삭제하고 OX 선지를 생성하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. 기존에 입력된 선지 내용은 모두 사라집니다.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={() => generateOptions('ox')}>확인</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

