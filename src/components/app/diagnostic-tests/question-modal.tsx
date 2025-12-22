
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { createQuestion, updateQuestion, type Question, getNextQuestionNumber } from '@/lib/db';
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
  contentArea: z.string(), // 자동 노출
  behavioralArea: z.enum(['개념이해력', '문제해결력', '문해력', '추론력']),
  prompt: z.string().min(1, '발문을 입력해주세요.'),
  viewContent: z.string().optional(),
  answerType: z.enum(['입력형', '선지형', '순서맞추기']).optional(),
  // answers: z.any().optional(), // 복잡한 구조이므로 나중에 추가
  solution: z.string().optional(),
  videoUrl: z.string().optional(),
  problemSolving: z.string().optional(),
  isReviewed: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const subUnitOptions = [
    "1-1. 물질의 규칙성과 결합", "1-2. 자연의 구성 물질",
    "2-1. 역학적 시스템", "2-2. 지구 시스템",
    "3-1. 생명 시스템", "3-2. 화학 변화",
    "4-1. 변화와 다양성", "4-2. 환경과 에너지"
];
const contentAreaMapping: { [key: string]: string } = {
    "1-1. 물질의 규칙성과 결합": "화학",
    "1-2. 자연의 구성 물질": "화학",
    "2-1. 역학적 시스템": "물리",
    "2-2. 지구 시스템": "지구과학",
    "3-1. 생명 시스템": "생명과학",
    "3-2. 화학 변화": "화학",
    "4-1. 변화와 다양성": "생명과학",
    "4-2. 환경과 에너지": "통합과학"
};

// Mock Rich Editor
const RichEditor = ({ field, placeholder }: { field: any, placeholder?: string }) => (
    <Textarea {...field} placeholder={placeholder} rows={5} className="bg-gray-50" />
);


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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: question
      ? {
          ...question,
          isReviewed: question.isReviewed || false,
        }
      : {
          difficulty: '중',
          behavioralArea: '개념이해력',
          isReviewed: false,
        },
  });
  
  const selectedSubUnit = form.watch('subUnitType');

  React.useEffect(() => {
    if (selectedSubUnit && contentAreaMapping[selectedSubUnit]) {
        form.setValue('contentArea', contentAreaMapping[selectedSubUnit]);
    }
  }, [selectedSubUnit, form]);


  React.useEffect(() => {
    if (open) {
      form.reset(
        question
          ? {
              ...question
            }
          : {
              difficulty: '중',
              subUnitType: '',
              contentArea: '',
              behavioralArea: '개념이해력',
              prompt: '',
              viewContent: '',
              solution: '',
              problemSolving: '',
              isReviewed: false,
            }
      );
    }
  }, [open, question, form]);

  const onSubmit = async (data: FormValues) => {
    if (!firestore) return;
    try {
      if (question) {
        // Update existing question
        await updateQuestion(firestore, testId, question.id, data);
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {question ? '문제 수정' : '문제 등록'} ({questionType})
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-y-auto pr-2">
            
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="중단원 선택" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {subUnitOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
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
                            <FormLabel>내용영역</FormLabel>
                            <FormControl><Input {...field} readOnly placeholder="중단원 유형 선택 시 자동 입력" /></FormControl>
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
                                    <RichEditor field={field} placeholder="전체 문항 설명 및 풀이를 입력하세요." />
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
                        <RichEditor field={field} placeholder="문제 질문 문장을 입력하세요."/>
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
                        <RichEditor field={field} placeholder="보조 자료를 입력하세요."/>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <RichEditor field={field} placeholder="해설 자료를 입력하세요."/>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
          </form>
        </Form>
        <DialogFooter className="pt-4 border-t">
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
                    <Button type="button" onClick={form.handleSubmit(onSubmit)} className='mr-2'>문제 저장</Button>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">닫기</Button>
                    </DialogClose>
                </div>
              </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
