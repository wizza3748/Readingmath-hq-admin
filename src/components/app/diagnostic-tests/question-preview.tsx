
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Question } from '@/lib/db';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type QuestionData = Partial<Question> & {
    questionType?: '객관식' | '서술형' | '유형';
};

export default function QuestionPreview({ questionData }: { questionData: QuestionData | null }) {
  const [activePopover, setActivePopover] = React.useState<number | null>(null);

  const renderHTML = (htmlString: string | undefined) => {
    if (!htmlString) return null;
    
    let processedHtml = htmlString.replace(/\n/g, '<br />');

    processedHtml = processedHtml.replace(
      /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp|svg))/g,
      '<img src="$1" alt="image" style="max-width: 100%; height: auto; border-radius: 0.5rem; margin-top: 1rem; margin-bottom: 1rem;" />'
    );
    return <div dangerouslySetInnerHTML={{ __html: processedHtml }} />;
  };

  if (!questionData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>미리보기 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const { prompt, viewContent, solution, answerType, answers, questionType, problemSolving } = questionData;
  
  const renderAnswerPopover = (answerIndex: number, triggerContent: React.ReactNode) => {
    const answerSet = answers?.[answerIndex];
    const isChoiceQuestion = answerSet?.answerType === '선지형';
  
    return (
      <Popover
        key={`popover-${answerIndex}`}
        open={activePopover === answerIndex}
        onOpenChange={(isOpen) => {
            console.log(`[Popover State Changed] Index: ${answerIndex}, IsOpen: ${isOpen}`);
            setActivePopover(isOpen ? answerIndex : null)
        }}
      >
        <PopoverTrigger asChild>{triggerContent}</PopoverTrigger>
        <PopoverContent className="w-80 z-[9999]">
          {isChoiceQuestion && answerSet.answers && answerSet.answers.length > 0 ? (
            <div className="grid gap-2">
              <div className="space-y-2">
                {answerSet.answers.map((choice: any, choiceIndex: number) => (
                  <Button
                    key={choiceIndex}
                    variant="outline"
                    className="w-full justify-start text-left h-auto min-h-[2.5rem]"
                  >
                    <div className="flex gap-2 items-start">
                      <span className='font-bold'>{choiceIndex + 1}</span>
                      <div className="flex-shrink whitespace-normal" dangerouslySetInnerHTML={{ __html: choice.value }} />
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">선지 정보가 없습니다.</div>
          )}
        </PopoverContent>
      </Popover>
    );
  };


  if (questionType === '서술형') {
    const handleProblemSolvingClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const blank = target.closest('[data-answer-index]');
      if (blank) {
        const index = parseInt(blank.getAttribute('data-answer-index')!, 10);
         if (!isNaN(index)) {
            setActivePopover(prev => prev === index ? null : index);
        }
      }
    };

    const parseProblemSolving = (text: string | undefined) => {
        if (!text) return null;

        let blankIndex = 0;
        const parts = text.split(/(\${[^}]+})/g).map((part, i) => {
            if (part.match(/\${[^}]+}/g)) {
                const currentIndex = blankIndex;
                blankIndex++;
                return `<span
                    class="${cn("inline-block bg-gray-200 rounded-md h-8 w-24 mx-1 p-0 align-middle cursor-pointer hover:bg-gray-300")}"
                    data-answer-index="${currentIndex}"
                  ></span>`;
            }
            return part.replace(/\n/g, '<br />');
        });
        return <div onClick={handleProblemSolvingClick} dangerouslySetInnerHTML={{ __html: parts.join('') }} />;
    };

    return (
      <div className="bg-gray-50 min-h-full p-4 sm:p-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-10 gap-8">
            <div className="lg:col-span-7 space-y-6">
                {prompt && (
                    <Card>
                        <CardHeader>
                        <CardTitle className="text-xl">발문</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className="prose max-w-none prose-xl font-semibold">
                            {renderHTML(prompt)}
                        </div>
                        </CardContent>
                    </Card>
                )}

                {problemSolving && (
                    <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">문제 풀이</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none prose-lg">
                           {answers && answers.length > 0 ? (
                                <div className="relative">
                                    {parseProblemSolving(problemSolving)}
                                    {answers.map((answer, index) => {
                                        const isChoiceQuestion = answer?.answerType === '선지형';
                                        return (
                                            <Popover
                                                key={index}
                                                open={activePopover === index}
                                                onOpenChange={(isOpen) => setActivePopover(isOpen ? index : null)}
                                            >
                                                <PopoverTrigger asChild>
                                                    <div></div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 z-[9999]">
                                                     {isChoiceQuestion && answer.answers && answer.answers.length > 0 ? (
                                                        <div className="grid gap-2">
                                                            <div className="space-y-2">
                                                                {answer.answers.map((choice: any, choiceIndex: number) => (
                                                                <Button
                                                                    key={choiceIndex}
                                                                    variant="outline"
                                                                    className="w-full justify-start text-left h-auto min-h-[2.5rem]"
                                                                >
                                                                    <div className="flex gap-2 items-start">
                                                                    <span className='font-bold'>{choiceIndex + 1}</span>
                                                                    <div className="flex-shrink whitespace-normal" dangerouslySetInnerHTML={{ __html: choice.value }} />
                                                                    </div>
                                                                </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                     ) : (
                                                        <div className="text-sm text-muted-foreground">선지 정보가 없습니다.</div>
                                                     )}
                                                </PopoverContent>
                                            </Popover>
                                        )
                                    })}
                                </div>
                            ) : renderHTML(problemSolving) }
                        </div>
                    </CardContent>
                    </Card>
                )}


                {viewContent && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">보기</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose max-w-none prose-lg">
                                {renderHTML(viewContent)}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {solution && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">오답 해설</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose max-w-none prose-lg">{renderHTML(solution)}</div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">답안</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {answers?.map((_, index) => {
                          const triggerButton = (
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left h-auto min-h-[2.5rem]",
                                activePopover === index && "ring-2 ring-primary"
                              )}
                            >
                              답안 {index + 1}
                            </Button>
                          );
                          return renderAnswerPopover(index, triggerButton);
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    )
  }

  // 객관식 미리보기
  const renderAnswerSection = () => {
    switch (answerType) {
      case '선지형':
        return (
          <div className="space-y-2">
            {answers?.map((ans, index) => (
              <Button key={index} variant="outline" className="w-full justify-start text-left text-lg p-6 h-auto min-h-[4rem]">
                 <div className="flex gap-4 items-start w-full">
                    <span className="font-bold mt-1">{index + 1}</span>
                    <div className="flex-1 flex-shrink min-w-0 whitespace-normal break-words">{renderHTML(ans.value)}</div>
                 </div>
              </Button>
            ))}
          </div>
        );
      case '입력형':
        return (
          <div className="space-y-4">
            {answers?.map((ans, index) => {
                const circledNumber = `①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳`[index] || String(index + 1);
                if (ans.type === '분수') {
                    return <div key={index} className="flex items-center gap-2">
                                <span className="font-bold text-lg">{ans.symbol ? `${circledNumber}` : `${index+1}.`}</span>
                                <div className="flex flex-col w-24">
                                    <Input className="text-center h-10 rounded-b-none border-b-0 text-lg"/>
                                    <div className="border-t-2 border-black"></div>
                                    <Input className="text-center h-10 rounded-t-none text-lg"/>
                                </div>
                           </div>
                }
                if (ans.type === '대분수') {
                    return <div key={index} className="flex items-center gap-2">
                                <span className="font-bold text-lg">{ans.symbol ? `${circledNumber}` : `${index+1}.`}</span>
                                <Input className="w-20 h-12 text-center text-lg" />
                                <div className="flex flex-col w-24">
                                    <Input className="text-center h-10 rounded-b-none border-b-0 text-lg"/>
                                    <div className="border-t-2 border-black"></div>
                                    <Input className="text-center h-10 rounded-t-none text-lg"/>
                                </div>
                           </div>
                }
                return (
                    <div key={index} className="flex items-center gap-2">
                        <span className="font-bold text-lg">{ans.symbol ? `${circledNumber}` : `${index+1}.`}</span>
                        <Input className="w-48 h-12 text-lg" />
                    </div>
                )
            })}
          </div>
        );
      case '순서맞추기':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">순서에 맞게 항목을 드래그하세요.</p>
            {answers?.map((ans, index) => (
              <div key={index} className="border p-4 rounded-md bg-gray-100 cursor-grab">
                {renderHTML(ans.value)}
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-full p-4 sm:p-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-10 gap-8">
            <div className="lg:col-span-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">발문</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none prose-xl font-semibold">
                            {renderHTML(prompt)}
                        </div>
                    </CardContent>
                </Card>

                {viewContent && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">보기</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="prose max-w-none prose-lg">
                                {renderHTML(viewContent)}
                             </div>
                        </CardContent>
                    </Card>
                )}

                {solution && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">오답 해설</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose max-w-none prose-lg">{renderHTML(solution)}</div>
                        </CardContent>
                    </Card>
                )}
            </div>
            
            <div className="lg:col-span-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">답안</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderAnswerSection()}
                    </CardContent>
                </Card>
            </div>

        </div>
    </div>
  );
}
