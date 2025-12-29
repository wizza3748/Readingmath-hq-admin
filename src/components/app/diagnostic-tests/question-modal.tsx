
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
import { Plus, Trash2 } from 'lucide-react';
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
    answerType: z.string().optional(), // for 서술형's nested answer
    answers: z.array(z.any()).optional(), // for 서술형's nested answer
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
  problemSolving: z.string().optional(),
  isReviewed: z.boolean().default(false),
}).superRefine((data, ctx) => {
    if ((data as any).questionType === '서술형' && (!data.problemSolving || data.problemSolving.trim() === '')) {
      // Temporarily disable this validation to allow saving without problemSolving
      /*
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '문제풀이 내용을 입력해 주세요.',
        path: ['problemSolving'],
      });
      */
    }
});

type FormValues = z.infer<typeof formSchema> & { questionType: '유형' | '서술형' };

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
  const [isSymbolChecked, setIsSymbolChecked] = React.useState(false);
  const [currentInputAnswerType, setCurrentInputAnswerType] = React.useState('기본');

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
      questionType: questionType,
      answerType: questionType === '유형' ? '선지형' : undefined,
      answers: [],
    },
  });
  
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "answers"
  });

  const selectedSubUnitId = form.watch('subUnitType');
  const answerType = form.watch('answerType');

  React.useEffect(() => {
    if (selectedSubUnitId) {
        const selectedUnit = curriculumUnits.find(unit => unit.id === selectedSubUnitId);
        if (selectedUnit) {
            form.setValue('contentArea', selectedUnit.contentArea);
        } else {
             form.setValue('contentArea', '');
        }
    }
  }, [selectedSubUnitId, form, curriculumUnits]);


  React.useEffect(() => {
    if (open) {
        const defaultValues = {
          difficulty: '중' as const,
          behavioralArea: '개념이해력' as const,
          isReviewed: false,
          subUnitType: '',
          contentArea: '',
          prompt: '',
          viewContent: '',
          solution: '',
          problemSolving: '',
          questionType: questionType,
          answerType: questionType === '유형' ? '선지형' as const : undefined,
          answers: [],
        };

        if (question) {
            const selectedUnit = curriculumUnits.find(unit => unit.id === question.subUnitType);
            const contentArea = question.contentArea || (selectedUnit && selectedUnit.contentArea) || '';
            
            form.reset({
                ...defaultValues,
                ...question,
                questionType: questionType,
                isReviewed: question.isReviewed || false,
                subUnitType: question.subUnitType || '',
                contentArea,
                answerType: question.answerType || (question.questionType === '유형' ? '선지형' as const : undefined),
                answers: question.answers || [],
            });
        } else {
            form.reset(defaultValues);
             if (questionType === '유형') {
              replace([
                { value: '', isCorrect: true },
                { value: '', isCorrect: false },
              ]);
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
        append({ value: '', isCorrect: true });
        append({ value: '', isCorrect: false });
    } else if (value === '순서맞추기') {
        append({ value: ''});
        append({ value: ''});
        append({ value: ''});
    }
  }

  const generateOptions = (type: 'circled' | 'korean' | 'ox') => {
    let newAnswers: any[];

    if (type === 'ox') {
      replace([{ value: 'O', isCorrect: true }, { value: 'X', isCorrect: false }]);
      setShowOXConfirm(false);
      return;
    }
    
    newAnswers = Array.from({ length: 2 }, (_, index) => ({
      value: type === 'circled' ? `${generateCircledNumber(index + 1)} ` : `${generateCircledKorean(index + 1)} `,
      isCorrect: index === 0 // Default first to correct
    }));
    replace(newAnswers);
  };

  const handleOXGenerate = () => {
    if (fields.some(f => f.value && !['O', 'X'].includes(f.value as string))) {
      setShowOXConfirm(true);
    } else {
      generateOptions('ox');
    }
  }
  
  const handleAddChoice = () => {
    const nextNum = fields.length + 1;
    let newValue = '';
    
    const firstChoice = fields[0]?.value as string || '';
    if (firstChoice.startsWith('①')) {
      newValue = `${generateCircledNumber(nextNum)} `;
    } else if (firstChoice.startsWith('㉠')) {
      newValue = `${generateCircledKorean(nextNum)} `;
    }
    
    append({ value: newValue, isCorrect: false });
  };
  
  const handleRemoveChoice = (index: number) => {
    const currentValues = form.getValues('answers') || [];
    if (currentValues.length <= 1) {
        toast({ variant: 'destructive', title: '최소 1개의 선지가 필요합니다.' });
        return;
    }
    const isCorrectRemoved = currentValues[index].isCorrect;
    
    remove(index);
    
    const newValues = form.getValues('answers') || [];
    const firstChoice = newValues[0]?.value as string || '';
    
    let needsReordering = false;
    if (firstChoice.startsWith('①') || firstChoice.startsWith('㉠')) {
        needsReordering = true;
    }

    if(needsReordering && newValues.length > 0) {
        const reorderedAnswers = newValues.map((answer, i) => {
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
        replace(reorderedAnswers);
    }

    if (isCorrectRemoved && newValues.length > 0) {
        const updatedAnswers = form.getValues('answers')!.map((ans, i) => ({ ...ans, isCorrect: i === 0 }));
        form.setValue('answers', updatedAnswers);
    } else if (newValues.length === 0) {
        form.setValue('answers', []);
    }
};

  const handleCorrectAnswerChange = (changedIndex: number) => {
    const currentAnswers = form.getValues('answers') || [];
    const newAnswers = currentAnswers.map((answer, index) => {
        return { ...answer, isCorrect: index === changedIndex };
    });
    form.setValue('answers', newAnswers, { shouldDirty: true });
  };
  
  const handleAddInputAnswer = () => {
    append({ value: { val: '' }, type: currentInputAnswerType, symbol: isSymbolChecked });
  };

  const handleGenerateAnswersFromMarkup = () => {
    const problemSolvingText = form.getValues('problemSolving');
    if (!problemSolvingText) {
      toast({ variant: 'destructive', title: '마크업이 입력되지 않았습니다' });
      return;
    }
    
    const markupRegex = /\$\{.*?\}|#\{.*?\}/g;
    const matches = problemSolvingText.match(markupRegex);

    if (!matches || matches.length === 0) {
      toast({ variant: 'destructive', title: '마크업이 입력되지 않았습니다' });
      return;
    }

    const newAnswerSets = matches.map(() => ({
      answerType: '선지형',
      answers: [
        { value: '', isCorrect: true },
        { value: '', isCorrect: false },
      ]
    }));
    
    replace(newAnswerSets as any);

    toast({ title: `${matches.length}개의 답안 카드가 생성되었습니다.`});
  };

  const difficultyOptions: ('하' | '중하' | '중' | '중상' | '상')[] = ['하', '중하', '중', '중상', '상'];
  const behavioralAreaOptions: ('개념이해력' | '문제해결력' | '문해력' | '추론력')[] = ['개념이해력', '문제해결력', '문해력', '추론력'];
  const answerTypeOptions: ('입력형' | '선지형' | '순서맞추기')[] = ['입력형', '선지형', '순서맞추기'];
  const inputTypeOptions = ['기본', '분수', '대분수'];

  const 서술형Layout = (
    <div className="grid grid-cols-2 flex-1 gap-6 px-6 overflow-hidden">
        {/* Left Column */}
        <div className="flex flex-col gap-y-4 overflow-y-auto pr-2">
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
                                        {`${unit.semester} > ${unit.largeUnit} > ${unit.mediumUnit}`}
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
            
            <div className='space-y-4 p-4 border rounded-md'>
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">문제풀이</h3>
                    <Button type="button" size="sm" onClick={handleGenerateAnswersFromMarkup}>풀이 답안 생성</Button>
                </div>
                <div className='bg-gray-100 p-2 text-xs text-muted-foreground rounded-md'>
                ${'[n]'}빈칸길이 기본 (alt + 1) &nbsp; ${'[n-]'}빈칸길이 2배 (alt + 2) &nbsp; ${'[n--]'}빈칸길이 3배 (alt + 3) &nbsp; ${'[n---]'}빈칸길이 4배 (alt + 4) &nbsp; ${'[n----]'}빈칸길이 5배 (alt + 5) &nbsp; ${'[n-----]'}빈칸길이 6배 (alt + 6) &nbsp; ${'[n]/[n]'}진분수 (alt + 7) &nbsp; ${'[n]/[n]/[n]'}대분수 (alt + 8) &nbsp; #{'[n-n]'}빈칸 문제 복사 (alt + 9) &nbsp; //끊어 읽기
                </div>
                <FormField
                    control={form.control}
                    name="problemSolving"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <RichEditor {...field} placeholder="전체 문항 설명 및 풀이를 입력하세요." />
                            </FormControl>
                             {form.formState.errors.problemSolving && <FormMessage />}
                        </FormItem>
                    )}
                />
            </div>
        </div>
        {/* Right Column */}
        <div className="flex flex-col gap-y-4 overflow-y-auto pr-2">
            <div className="space-y-2 p-4 border rounded-md">
                <h3 className="text-lg font-semibold">발문</h3>
                <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <RichEditor {...field} placeholder="문제 질문 문장을 입력하세요."/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <div className="space-y-2 p-4 border rounded-md">
                <h3 className="text-lg font-semibold">보기</h3>
                <FormField
                    control={form.control}
                    name="viewContent"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <RichEditor {...field} placeholder="보조 자료를 입력하세요."/>
                        </FormControl>
                    </FormItem>
                    )}
                />
            </div>

            <div className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-semibold">답안</h3>
                {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md bg-slate-50 space-y-4">
                     <div className="flex items-start justify-between">
                        <FormField
                            control={form.control}
                            name={`answers.${index}.answerType` as any}
                            render={({ field: answerTypeField }) => (
                            <FormItem className="w-40">
                                <Select onValueChange={(value) => {
                                  const currentAnswers = form.getValues('answers') || [];
                                  currentAnswers[index].answerType = value;
                                  form.setValue('answers', currentAnswers);
                                }} 
                                value={answerTypeField.value || '선지형'}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="답안 유형 선택" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {answerTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="flex items-center gap-2">
                            {form.getValues(`answers.${index}.answerType`) === '선지형' && (
                            <>
                                <Controller
                                    name={`answers.${index}.answers` as any}
                                    control={form.control}
                                    render={({ field: subField }) => (
                                    <FormItem className="flex items-center space-x-4">
                                        <FormLabel className="shrink-0">정답</FormLabel>
                                        <RadioGroup
                                        onValueChange={(value) => handleCorrectAnswerChange(parseInt(value))}
                                        value={subField.value?.findIndex((v:any) => v.isCorrect).toString()}
                                        className="flex items-center space-x-2"
                                        >
                                        {(subField.value || []).map((item:any, subIndex:number) => (
                                            <FormItem key={item.id || subIndex} className="flex items-center space-x-1">
                                            <FormControl>
                                                <RadioGroupItem value={subIndex.toString()} id={`correct-opt-${index}-${subIndex}`} />
                                            </FormControl>
                                            <FormLabel htmlFor={`correct-opt-${index}-${subIndex}`} className="font-normal">{subIndex + 1}</FormLabel>
                                            </FormItem>
                                        ))}
                                        </RadioGroup>
                                    </FormItem>
                                    )}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => generateOptions('korean')}>㉠㉡ 생성</Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => generateOptions('circled')}>①② 생성</Button>
                                <Button type="button" variant="outline" size="sm" onClick={handleOXGenerate}>OX 생성</Button>
                                <Button type="button" variant="default" size="sm" onClick={handleAddChoice}><Plus className="mr-2 h-4 w-4" />선지 추가</Button>
                            </>
                            )}
                            {form.getValues(`answers.${index}.answerType`) === '입력형' && (
                                <div className="flex items-center gap-2">
                                    <FormItem className="flex items-center space-x-2">
                                        <Checkbox id="symbol-check" checked={isSymbolChecked} onCheckedChange={(checked) => setIsSymbolChecked(!!checked)} />
                                        <label htmlFor="symbol-check" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">㉠㉡㉢</label>
                                    </FormItem>
                                    <Select value={currentInputAnswerType} onValueChange={setCurrentInputAnswerType}>
                                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{inputTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Button type="button" variant="outline" onClick={handleAddInputAnswer}><Plus className="mr-2 h-4 w-4" />추가</Button>
                                </div>
                            )}
                             {form.getValues(`answers.${index}.answerType`) === '순서맞추기' && (
                                <Button type="button" variant="outline" onClick={() => append({ value: ''})}><Plus className="mr-2 h-4 w-4" />항목 추가</Button>
                            )}
                        </div>
                    </div>
                
                    {form.getValues(`answers.${index}.answerType`) === '입력형' && (
                        <div className="flex flex-wrap gap-4 pt-2">
                            {/* ... (입력형 렌더링 로직) */}
                        </div>
                    )}


                    {form.getValues(`answers.${index}.answerType`) === '선지형' && (
                    <div className="space-y-2">
                        {/* ... (선지형 렌더링 로직) */}
                    </div>
                    )}

                    {form.getValues(`answers.${index}.answerType`) === '순서맞추기' && (
                    <div className="space-y-2">
                        {/* ... (순서맞추기 렌더링 로직) */}
                    </div>
                    )}

                </div>
                ))}
            </div>
            
            <div className="space-y-2 p-4 border rounded-md">
                <h3 className="text-lg font-semibold">해설</h3>
                <FormField
                    control={form.control}
                    name="solution"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <RichEditor {...field} placeholder="해설 자료를 입력하세요."/>
                        </FormControl>
                    </FormItem>
                    )}
                />
            </div>
        </div>
    </div>
  );

  const 유형Layout = (
    <div className="flex-1 space-y-4 px-6 overflow-y-auto">
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
                                    {`${unit.semester} > ${unit.largeUnit} > ${unit.mediumUnit}`}
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
        
        <div className="space-y-2 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">발문</h3>
            <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <RichEditor {...field} placeholder="문제 질문 문장을 입력하세요."/>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        
        <div className="space-y-2 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">보기</h3>
            <FormField
                control={form.control}
                name="viewContent"
                render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <RichEditor {...field} placeholder="보조 자료를 입력하세요."/>
                    </FormControl>
                </FormItem>
                )}
            />
        </div>

        <div className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">답안</h3>
            <div className="p-4 border rounded-md bg-slate-50 space-y-4">
                <div className="flex items-start justify-between">
                    <FormField
                        control={form.control}
                        name="answerType"
                        render={({ field }) => (
                        <FormItem className="w-40">
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
                    <div className="flex items-center gap-2">
                        {answerType === '선지형' && (
                        <>
                            <Controller
                                name="answers"
                                control={form.control}
                                render={({ field }) => (
                                <FormItem className="flex items-center space-x-4">
                                    <FormLabel className="shrink-0">정답</FormLabel>
                                    <RadioGroup
                                    onValueChange={(value) => handleCorrectAnswerChange(parseInt(value))}
                                    value={field.value?.findIndex(v => v.isCorrect).toString()}
                                    className="flex items-center space-x-2"
                                    >
                                    {fields.map((item, index) => (
                                        <FormItem key={item.id} className="flex items-center space-x-1">
                                        <FormControl>
                                            <RadioGroupItem value={index.toString()} id={`correct-opt-${index}`} />
                                        </FormControl>
                                        <FormLabel htmlFor={`correct-opt-${index}`} className="font-normal">{index + 1}</FormLabel>
                                        </FormItem>
                                    ))}
                                    </RadioGroup>
                                </FormItem>
                                )}
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => generateOptions('korean')}>㉠㉡ 생성</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => generateOptions('circled')}>①② 생성</Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleOXGenerate}>OX 생성</Button>
                            <Button type="button" variant="default" size="sm" onClick={handleAddChoice}><Plus className="mr-2 h-4 w-4" />선지 추가</Button>
                        </>
                        )}
                        {answerType === '입력형' && (
                            <div className="flex items-center gap-2">
                                <FormItem className="flex items-center space-x-2">
                                    <Checkbox id="symbol-check" checked={isSymbolChecked} onCheckedChange={(checked) => setIsSymbolChecked(!!checked)} />
                                    <label htmlFor="symbol-check" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">㉠㉡㉢</label>
                                </FormItem>
                                <Select value={currentInputAnswerType} onValueChange={setCurrentInputAnswerType}>
                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{inputTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button type="button" variant="outline" onClick={handleAddInputAnswer}><Plus className="mr-2 h-4 w-4" />추가</Button>
                            </div>
                        )}
                        {answerType === '순서맞추기' && (
                            <Button type="button" variant="outline" onClick={() => append({ value: ''})}><Plus className="mr-2 h-4 w-4" />항목 추가</Button>
                        )}
                    </div>
                </div>
            
                {answerType === '입력형' && (
                    <div className="flex flex-wrap gap-4 pt-2">
                        {fields.map((field, index) => (
                        <div key={field.id} className="group relative flex items-start gap-2 p-2">
                            {isSymbolChecked ? (
                            <FormLabel className="pt-2 shrink-0">
                                {generateCircledKorean(index + 1)}
                            </FormLabel>
                            ) : null}
                            <Controller
                                    control={form.control}
                                    name={`answers.${index}.value`}
                                    render={({ field: valueField }) => {
                                        const currentAnswerType = form.getValues(`answers.${index}.type`);
                                        const value = valueField.value || {};
                                        if (currentAnswerType === '분수') {
                                            return <div className="flex items-center gap-1">
                                                <div className="flex flex-col w-20">
                                                    <Input placeholder={`1-${index + 1}`} className="text-center h-8 rounded-b-none border-b-0" defaultValue={value.num} onChange={(e) => valueField.onChange({...value, num: e.target.value })}/>
                                                    <div className="border-t border-black"></div>
                                                    <Input placeholder={`1-${index + 1}`} className="text-center h-8 rounded-t-none" defaultValue={value.den} onChange={(e) => valueField.onChange({...value, den: e.target.value })}/>
                                                </div>
                                            </div>
                                        }
                                        if (currentAnswerType === '대분수') {
                                            return <div className="flex items-center gap-1">
                                                <Input className="w-16 h-10 text-center" placeholder={`1-${index + 1}`} defaultValue={value.int} onChange={(e) => valueField.onChange({...value, int: e.target.value })}/>
                                                <div className="flex flex-col w-20">
                                                    <Input placeholder={`1-${index + 1}`} className="text-center h-8 rounded-b-none border-b-0" defaultValue={value.num} onChange={(e) => valueField.onChange({...value, num: e.target.value })}/>
                                                    <div className="border-t border-black"></div>
                                                    <Input placeholder={`1-${index + 1}`} className="text-center h-8 rounded-t-none" defaultValue={value.den} onChange={(e) => valueField.onChange({...value, den: e.target.value })}/>
                                                </div>
                                            </div>
                                        }
                                        return <Input 
                                        className="w-32" 
                                        placeholder={`1-${index+1}`}
                                        defaultValue={value.val} 
                                        onChange={(e) => valueField.onChange({val: e.target.value})}
                                        />
                                    }}
                                />
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute -right-2 -top-2 h-6 w-6 opacity-0 group-hover:opacity-100">
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                        ))}
                    </div>
                )}


                {answerType === '선지형' && (
                <div className="space-y-2">
                    {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 group">
                            <div className="flex flex-col items-center gap-1 pt-1">
                            <FormLabel>선지{index + 1}</FormLabel>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChoice(index)} className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100">
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
                        <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md bg-white group">
                            <Controller
                            control={form.control}
                            name={`answers.${index}.value`}
                            render={({ field: valueField }) => (
                                <div className="flex-1">
                                <RichEditor {...valueField} />
                                </div>
                            )}
                            />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    ))}
                </div>
                )}

            </div>
        </div>
        
        <div className="space-y-2 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">해설</h3>
            <FormField
                control={form.control}
                name="solution"
                render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <RichEditor {...field} placeholder="해설 자료를 입력하세요."/>
                    </FormControl>
                </FormItem>
                )}
            />
        </div>
    </div>
  );

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
            {questionType === '서술형' ? 서술형Layout : 유형Layout}
            
            <DialogFooter className="p-6 pt-4 border-t sticky bottom-0 bg-background z-10">
                <div className="flex justify-end items-center gap-4 w-full">
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
                                  {form.watch('isReviewed') ? '검수완료' : '검수전'}
                              </span>
                          </FormItem>
                      )}
                    />
                    <Button type="button" variant="outline">미리보기</Button>
                    <Button type="submit">문제 저장</Button>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">닫기</Button>
                    </DialogClose>
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
