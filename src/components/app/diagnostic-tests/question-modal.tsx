
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  difficulty: z.enum(['하', '중하', '중', '중상', '상']),
  subUnitType: z.string().min(1, '중단원 유형을 선택해주세요.'),
  contentArea: z.string().min(1, '내용영역을 선택해주세요.'),
  behavioralArea: z.enum(['개념이해력', '문제해결력', '문해력', '추론력']),
  prompt: z.string().min(1, '발문을 입력해주세요.'),
  viewContent: z.string().optional(),
  answerType: z.enum(['입력형', '선지형', '순서맞추기']).optional(),
  answers: z.array(z.any()).optional(),
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

// Mock Rich Editor
const RichEditor = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(({ ...props }, ref) => (
    <Textarea {...props} ref={ref} rows={5} className="bg-gray-50" />
));
RichEditor.displayName = 'RichEditor';


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
      answerType: questionType === '유형' ? '입력형' : undefined,
      answers: [],
      videoUrl: '',
    },
  });
  
  const selectedSubUnitId = form.watch('subUnitType');

  React.useEffect(() => {
    if (selectedSubUnitId) {
        const selectedUnit = curriculumUnits.find(unit => unit.id === selectedSubUnitId);
        const largeUnitKey = Object.keys(contentAreaMapping).find(key => key === selectedUnit?.largeUnit);
        
        if (largeUnitKey && contentAreaMapping[largeUnitKey]) {
            form.setValue('contentArea', contentAreaMapping[largeUnitKey]);
        } else {
            // If no mapping found, maybe clear the field or set a default
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
          answerType: questionType === '유형' ? '입력형' : undefined,
          answers: [],
          videoUrl: '',
        };

        if (question) {
             const selectedUnit = curriculumUnits.find(unit => unit.id === question.subUnitType);
             const contentArea = question.contentArea || (selectedUnit?.largeUnit && contentAreaMapping[selectedUnit.largeUnit]) || '';
            form.reset({
                ...defaultValues,
                ...question,
                answerType: question.answerType || (question.questionType === '유형' ? '입력형' : undefined),
                contentArea,
            });
        } else {
            form.reset(defaultValues);
        }
    }
  }, [open, question, form, questionType, curriculumUnits]);

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

  const difficultyOptions: ('하' | '중하' | '중' | '중상' | '상')[] = ['하', '중하', '중', '중상', '상'];
  const behavioralAreaOptions: ('개념이해력' | '문제해결력' | '문해력' | '추론력')[] = ['개념이해력', '문제해결력', '문해력', '추론력'];
  const answerTypeOptions: ('입력형' | '선지형' | '순서맞추기')[] = ['입력형', '선지형', '순서맞추기'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            문제 상세 ({questionType})
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-y-auto pr-4 pl-1">
            <div className="flex-1 space-y-4">
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
                        <h4 className="font-semibold">답안</h4>
                         <FormField
                            control={form.control}
                            name="answerType"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>답안 유형 *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="답안 유형 선택" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {answerTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {/* 답안 유형별 상세 구현은 여기에 추가 */}
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
            
            <div className="pt-4 border-t sticky bottom-0 bg-white z-10">
              <div className='flex justify-between w-full'>
                  <FormField
                  control={form.control}
                  name="isReviewed"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                      <FormControl>
                          <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          />
                      </FormControl>
                      <FormLabel className="!mt-0">검수완료</FormLabel>
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    