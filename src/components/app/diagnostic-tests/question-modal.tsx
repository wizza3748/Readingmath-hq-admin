
'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
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
import { Plus, Trash2, GripVertical } from 'lucide-react';
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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import QuestionPreview from './question-preview';


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
    // refinement logic
});

type FormValues = z.infer<typeof formSchema> & { questionType: '객관식' | '서술형' };

const generateCircledNumber = (num: number) => {
    return `①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳`[num - 1] || String(num);
};
const generateCircledKorean = (num: number) => {
    return `㉠㉡㉢㉣㉤㉥㉦㉧㉨㉩㉪㉫㉬㉭`[num - 1] || String(num);
};

const DescriptiveAnswerCard = ({ control, index, form, remove: removeAnswerCard }: { control: any, index: number, form: any, remove: (index: number) => void }) => {
    const { fields: subFields, append: subAppend, remove: subRemove, replace: subReplace } = useFieldArray({
        control,
        name: `answers.${index}.answers`
    });

    const answerTypeValue = useWatch({
        control,
        name: `answers.${index}.answerType`,
        defaultValue: '선지형'
    });

    return (
        <div className="p-4 border rounded-md bg-slate-50 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{index + 1}.</span>
                    <FormField
                        control={control}
                        name={`answers.${index}.answerType` as any}
                        render={({ field }) => (
                            <FormItem className="w-40">
                                <Select onValueChange={(val) => {
                                    field.onChange(val);
                                    form.setValue(`answers.${index}.answers`, val === '선지형' ? [{ value: '', isCorrect: true }, { value: '', isCorrect: false }] : val === '입력형' ? [{ value: { val: '' }, type: '기본', symbol: false }] : [{ value: '' }, { value: '' }, { value: '' }]);
                                }} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {['입력형', '선지형', '순서맞추기'].map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {answerTypeValue === '선지형' && (
                        <div className="flex items-center gap-2">
                            <Controller
                                name={`answers.${index}.answers`}
                                control={control}
                                render={({ field: subField }) => (
                                    <RadioGroup
                                        onValueChange={(v) => {
                                            const updated = (subField.value || []).map((a: any, i: number) => ({ ...a, isCorrect: i === parseInt(v) }));
                                            form.setValue(`answers.${index}.answers`, updated);
                                        }}
                                        value={subField.value?.findIndex((v: any) => v.isCorrect)?.toString() ?? '0'}
                                        className="flex items-center space-x-2"
                                    >
                                        {(subField.value || []).map((_: any, i: number) => (
                                            <RadioGroupItem key={i} value={i.toString()} id={`sub-${index}-${i}`} />
                                        ))}
                                    </RadioGroup>
                                )}
                            />
                            <Button type="button" size="sm" onClick={() => {
                                const current = form.getValues(`answers.${index}.answers`) || [];
                                subAppend({ value: '', isCorrect: false });
                            }}>선지 추가</Button>
                        </div>
                    )}
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAnswerCard(index)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
            </div>
            {answerTypeValue === '선지형' && (
                <div className="space-y-2">
                    {subFields.map((subField, subIndex) => (
                        <div key={subField.id} className="flex gap-2 items-start">
                            <span className="pt-2">선지{subIndex + 1}</span>
                            <Controller
                                control={control}
                                name={`answers.${index}.answers.${subIndex}.value`}
                                render={({ field }) => <div className="flex-1"><RichEditor {...field} /></div>}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => subRemove(subIndex)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

function SortableAnswerItem({ id, children }: { id: any, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>{children}</div>;
}

export function QuestionModal({ open, onOpenChange, testId, question, questionType, onClose }: { open: boolean, onOpenChange: (o: boolean) => void, testId: string, question?: Question, questionType: '객관식' | '서술형', onClose: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [curriculumUnits] = React.useState<CurriculumUnit[]>(initialCurriculumUnits);
    const [isReordering, setIsReordering] = React.useState(false);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewData, setPreviewData] = React.useState<any>(null);
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
            questionType,
            answerType: questionType === '객관식' ? '선지형' : undefined,
            answers: [],
        },
    });

    const { fields, append, remove, replace, move } = useFieldArray({ control: form.control, name: "answers" });
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            move(fields.findIndex(f => f.id === active.id), fields.findIndex(f => f.id === over.id));
        }
    };

    const selectedSubUnitId = form.watch('subUnitType');
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
            if (question) {
                form.reset({ ...question, questionType: question.questionType as any });
            } else {
                form.reset({ difficulty: '중', behavioralArea: '개념이해력', isReviewed: false, subUnitType: '', contentArea: '', prompt: '', viewContent: '', solution: '', problemSolving: '', questionType, answerType: questionType === '객관식' ? '선지형' : undefined, answers: [] });
            }
        }
    }, [open, question, form, questionType]);

    const onSubmit = async (data: FormValues) => {
        if (!firestore) return;
        try {
            if (question) await updateQuestion(firestore, testId, question.id, { ...data, questionType });
            else {
                const num = await getNextQuestionNumber(firestore, testId);
                await createQuestion(firestore, testId, { ...data, questionType, questionNumber: num });
            }
            toast({ title: '저장되었습니다.' });
            onClose();
        } catch (e) { toast({ variant: 'destructive', title: '저장 실패' }); }
    };

    const answerType = form.watch('answerType');

    const handleAnswerTypeChange = (value: '입력형' | '선지형' | '순서맞추기') => {
        form.setValue('answerType', value);
        if (value === '선지형') {
            replace([{ value: '', isCorrect: true }, { value: '', isCorrect: false }, { value: '', isCorrect: false }, { value: '', isCorrect: false }, { value: '', isCorrect: false }]);
        } else if (value === '입력형') {
            replace([{ value: { val: '' }, type: '기본', symbol: false }]);
        } else if (value === '순서맞추기') {
            replace([{ value: '' }, { value: '' }, { value: '' }]);
        }
    };

    const handleCorrectAnswerChange = (index: number) => {
        const currentAnswers = form.getValues('answers') || [];
        replace(currentAnswers.map((a, i) => ({ ...a, isCorrect: i === index })));
    };

    const generateOptions = (type: 'korean' | 'circled' | 'ox') => {
        if (type === 'ox') {
            replace([{ value: 'O', isCorrect: true }, { value: 'X', isCorrect: false }]);
        } else {
            const currentAnswers = form.getValues('answers') || [];
            const newAnswers = currentAnswers.map((a, i) => ({
                ...a,
                value: type === 'korean' ? `${generateCircledKorean(i + 1)} ` : `${generateCircledNumber(i + 1)} `
            }));
            replace(newAnswers);
        }
    };

    const handleOXGenerate = () => {
        if (fields.length > 0) setShowOXConfirm(true);
        else generateOptions('ox');
    };

    const handleAddChoice = () => {
        const currentAnswers = form.getValues('answers') || [];
        const nextNum = currentAnswers.length + 1;
        let newValue = '';
        const firstChoice = currentAnswers[0]?.value as string || '';
        if (firstChoice.startsWith('①')) newValue = `${generateCircledNumber(nextNum)} `;
        else if (firstChoice.startsWith('㉠')) newValue = `${generateCircledKorean(nextNum)} `;
        append({ value: newValue, isCorrect: false });
    };

    const handleRemoveChoice = (index: number) => {
        const currentAnswers = form.getValues('answers') || [];
        if (currentAnswers.length <= 1) return;
        const isCorrectRemoved = currentAnswers[index].isCorrect;
        remove(index);
        if (isCorrectRemoved) {
            const newFields = form.getValues('answers') || [];
            if (newFields.length > 0) {
                const updated = [...newFields];
                updated[0].isCorrect = true;
                replace(updated);
            }
        }
    };

    const handleAddInputAnswer = () => {
        append({ value: currentInputAnswerType === '기본' ? { val: '' } : currentInputAnswerType === '분수' ? { num: '', den: '' } : { int: '', num: '', den: '' }, type: currentInputAnswerType, symbol: isSymbolChecked });
    };

    const 서술형Layout = (
        <div className="grid grid-cols-2 flex-1 gap-6 px-6 overflow-hidden">
            <div className="flex flex-col gap-y-4 overflow-y-auto pr-2">
                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="text-lg font-semibold">기본 정보</h3>
                    <FormField control={form.control} name="difficulty" render={({ field }) => (
                        <FormItem><FormLabel>난이도</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                            {['하', '중하', '중', '중상', '상'].map(o => <div key={o} className="flex items-center gap-1"><RadioGroupItem value={o} /><FormLabel>{o}</FormLabel></div>)}
                        </RadioGroup></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="subUnitType" render={({ field }) => (
                            <FormItem><FormLabel>중단원 유형 *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={curriculumUnits.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder="중단원 선택" /></SelectTrigger></FormControl>
                                <SelectContent>{curriculumUnits.map(u => <SelectItem key={u.id} value={u.id}>{`${u.semester} > ${u.largeUnit} > ${u.mediumUnit}`}</SelectItem>)}</SelectContent>
                            </Select></FormItem>
                        )} />
                        <FormField control={form.control} name="contentArea" render={({ field }) => (
                            <FormItem><FormLabel>내용영역 *</FormLabel><FormControl><Input {...field} readOnly placeholder="자동 입력" /></FormControl></FormItem>
                        )} />
                    </div>
                </div>
                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="text-lg font-semibold">문제풀이</h3>
                    <FormField control={form.control} name="problemSolving" render={({ field }) => <FormItem><RichEditor {...field} /></FormItem>} />
                </div>
            </div>
            <div className="flex flex-col gap-y-4 overflow-y-auto pr-2">
                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="text-lg font-semibold">발문</h3>
                    <FormField control={form.control} name="prompt" render={({ field }) => <FormItem><RichEditor {...field} /></FormItem>} />
                </div>
                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="text-lg font-semibold">보기</h3>
                    <FormField control={form.control} name="viewContent" render={({ field }) => <FormItem><RichEditor {...field} placeholder="보조 자료를 입력하세요." /></FormItem>} />
                </div>
                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="text-lg font-semibold">답안</h3>
                    {fields.map((f, i) => <DescriptiveAnswerCard key={f.id} index={i} control={form.control} form={form} remove={remove} />)}
                    <Button type="button" onClick={() => append({ answerType: '선지형', answers: [] } as any)}>답안 추가</Button>
                </div>
                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="text-lg font-semibold">해설</h3>
                    <FormField control={form.control} name="solution" render={({ field }) => <FormItem><RichEditor {...field} /></FormItem>} />
                </div>
            </div>
        </div>
    );

    const 객관식Layout = (
        <div className="flex-1 space-y-4 px-6 overflow-y-auto">
            <div className="p-4 border rounded-md space-y-4">
                <h3 className="text-lg font-semibold">기본 정보</h3>
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                    <FormItem><FormLabel>난이도</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                        {['하', '중하', '중', '중상', '상'].map(o => <div key={o} className="flex items-center gap-1"><RadioGroupItem value={o} /><FormLabel>{o}</FormLabel></div>)}
                    </RadioGroup></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="subUnitType" render={({ field }) => (
                        <FormItem><FormLabel>중단원 유형 *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={curriculumUnits.length === 0}>
                            <FormControl><SelectTrigger><SelectValue placeholder="중단원 선택" /></SelectTrigger></FormControl>
                            <SelectContent>{curriculumUnits.map(u => <SelectItem key={u.id} value={u.id}>{`${u.semester} > ${u.largeUnit} > ${u.mediumUnit}`}</SelectItem>)}</SelectContent>
                        </Select></FormItem>
                    )} />
                    <FormField control={form.control} name="contentArea" render={({ field }) => (
                        <FormItem><FormLabel>내용영역 *</FormLabel><FormControl><Input {...field} readOnly placeholder="자동 입력" /></FormControl></FormItem>
                    )} />
                </div>
            </div>
            <div className="p-4 border rounded-md"><h3 className="text-lg font-semibold">발문</h3><FormField control={form.control} name="prompt" render={({ field }) => <RichEditor {...field} />} /></div>
            <div className="p-4 border rounded-md"><h3 className="text-lg font-semibold">보기</h3><FormField control={form.control} name="viewContent" render={({ field }) => <RichEditor {...field} placeholder="보조 자료를 입력하세요." />} /></div>

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
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>{['입력형', '선지형', '순서맞추기'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                    </Select>
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
                                            <RadioGroup onValueChange={(v) => handleCorrectAnswerChange(parseInt(v))} value={field.value?.findIndex((v: any) => v.isCorrect).toString()} className="flex gap-2">
                                                {fields.map((_, i) => <div key={i} className="flex items-center gap-1"><RadioGroupItem value={i.toString()} /><FormLabel>{i + 1}</FormLabel></div>)}
                                            </RadioGroup>
                                        )}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => generateOptions('korean')}>㉠㉡ 생성</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => generateOptions('circled')}>①② 생성</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={handleOXGenerate}>OX 생성</Button>
                                    <Button type="button" onClick={handleAddChoice} size="sm">선지 추가</Button>
                                </>
                            )}
                            {answerType === '입력형' && (
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={isSymbolChecked} onCheckedChange={(v) => setIsSymbolChecked(!!v)} /> ㉠㉡㉢
                                    <Select value={currentInputAnswerType} onValueChange={setCurrentInputAnswerType}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{['기본', '분수', '대분수'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddInputAnswer}>추가</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {answerType === '선지형' && (
                        <div className="space-y-2">
                            {fields.map((f, i) => (
                                <div key={f.id} className="flex gap-2 items-start">
                                    <span className="pt-2">선지{i + 1}</span>
                                    <Controller control={form.control} name={`answers.${i}.value`} render={({ field }) => <div className="flex-1"><RichEditor {...field} /></div>} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChoice(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            ))}
                        </div>
                    )}
                    {answerType === '입력형' && (
                        <div className="flex flex-wrap gap-4">
                            {fields.map((f, i) => (
                                <div key={f.id} className="relative group p-2 border rounded bg-white">
                                    {f.symbol && <span className="mr-1">{generateCircledKorean(i + 1)}</span>}
                                    <Controller control={form.control} name={`answers.${i}.value`} render={({ field }) => {
                                        const val = field.value || {};
                                        if (f.type === '분수') return <div className="inline-flex flex-col w-12"><Input value={val.num} onChange={e => field.onChange({ ...val, num: e.target.value })} className="h-6 text-center" /><div className="border-t border-black my-0.5" /><Input value={val.den} onChange={e => field.onChange({ ...val, den: e.target.value })} className="h-6 text-center" /></div>;
                                        if (f.type === '대분수') return <div className="inline-flex items-center gap-1"><Input value={val.int} onChange={e => field.onChange({ ...val, int: e.target.value })} className="w-10 h-8 text-center" /><div className="flex flex-col w-12"><Input value={val.num} onChange={e => field.onChange({ ...val, num: e.target.value })} className="h-6 text-center" /><div className="border-t border-black my-0.5" /><Input value={val.den} onChange={e => field.onChange({ ...val, den: e.target.value })} className="h-6 text-center" /></div></div>;
                                        return <Input value={val.val} onChange={e => field.onChange({ val: e.target.value })} className="w-24 h-8 inline-block" />;
                                    }} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3 text-red-500" /></Button>
                                </div>
                            ))}
                        </div>
                    )}
                    {answerType === '순서맞추기' && (
                        <div className="space-y-2">
                            {fields.map((f, i) => (
                                <div key={f.id} className="flex gap-2 items-start">
                                    <Controller control={form.control} name={`answers.${i}.value`} render={({ field }) => <div className="flex-1"><RichEditor {...field} /></div>} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>항목 추가</Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border rounded-md"><h3 className="text-lg font-semibold">해설</h3><FormField control={form.control} name="solution" render={({ field }) => <RichEditor {...field} />} /></div>
        </div>
    );

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-full w-full h-full flex flex-col p-0 text-black">
                    <DialogHeader className="p-6 pb-0"><DialogTitle>문제 상세 ({questionType})</DialogTitle></DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                            {questionType === '서술형' ? 서술형Layout : 객관식Layout}
                            <DialogFooter className="p-6 border-t mt-auto gap-2">
                                <Button type="submit">저장</Button>
                                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>닫기</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <AlertDialog open={showOXConfirm} onOpenChange={setShowOXConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>기존 선지를 삭제하고 OX 선지를 생성하시겠습니까?</AlertDialogTitle><AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction onClick={() => generateOptions('ox')}>확인</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
