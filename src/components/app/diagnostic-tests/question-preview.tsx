
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Question } from '@/lib/db';

type QuestionData = Partial<Question> & {
    questionType?: '유형' | '서술형';
};


const generateCircledNumber = (num: number) => {
    return `①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳`[num-1] || String(num);
};

export default function QuestionPreview({ questionData }: { questionData: QuestionData | null }) {

  const renderHTML = (htmlString: string | undefined) => {
    if (!htmlString) return null;
    return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
  };

  if (!questionData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>미리보기 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const { prompt, viewContent, solution, answerType, answers, questionType, problemSolving } = questionData;

  const renderAnswerSection = () => {
    if (questionType === '서술형') {
        return (
            <div className="space-y-4">
                {answers?.map((ans, index) => {
                    if (ans.answerType === '선지형') {
                        return (
                             <div key={index} className="space-y-2">
                                <p className="font-semibold">{index + 1}번 답안</p>
                                {ans.answers?.map((choice: any, choiceIndex: number) => (
                                    <Button key={choiceIndex} variant="outline" className="w-full justify-start text-lg p-6">
                                        <span className='font-bold mr-4'>{choiceIndex + 1}</span>
                                        <div dangerouslySetInnerHTML={{ __html: choice.value }} />
                                    </Button>
                                ))}
                            </div>
                        )
                    }
                    if (ans.answerType === '입력형') {
                       return <div key={index} className="space-y-2">
                                <p className="font-semibold">{index + 1}번 답안</p>
                                {ans.answers?.map((inputAns: any, inputIndex: number) => {
                                    if (inputAns.type === '분수') {
                                        return <div key={inputIndex} className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{inputAns.symbol ? `${generateCircledNumber(inputIndex + 1)}` : `${inputIndex+1}.`}</span>
                                            <div className="flex flex-col w-24">
                                                <Input className="text-center h-10 rounded-b-none border-b-0 text-lg"/>
                                                <div className="border-t-2 border-black"></div>
                                                <Input className="text-center h-10 rounded-t-none text-lg"/>
                                            </div>
                                       </div>
                                    }
                                     if (inputAns.type === '대분수') {
                                        return <div key={inputIndex} className="flex items-center gap-2">
                                                    <span className="font-bold text-lg">{inputAns.symbol ? `${generateCircledNumber(inputIndex + 1)}` : `${inputIndex+1}.`}</span>
                                                    <Input className="w-20 h-12 text-center text-lg" />
                                                    <div className="flex flex-col w-24">
                                                        <Input className="text-center h-10 rounded-b-none border-b-0 text-lg"/>
                                                        <div className="border-t-2 border-black"></div>
                                                        <Input className="text-center h-10 rounded-t-none text-lg"/>
                                                    </div>
                                            </div>
                                    }
                                    return (
                                        <div key={inputIndex} className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{inputAns.symbol ? `${generateCircledNumber(inputIndex + 1)}` : `${inputIndex+1}.`}</span>
                                            <Input className="w-48 h-12 text-lg" />
                                        </div>
                                    )
                                })}
                            </div>
                    }
                     if (ans.answerType === '순서맞추기') {
                        return (
                            <div key={index} className="space-y-2">
                                <p className="font-semibold">{index + 1}번 답안</p>
                                {ans.answers?.map((item: any, itemIndex: number) => (
                                     <div key={itemIndex} className="border p-4 rounded-md bg-gray-100">
                                        <div dangerouslySetInnerHTML={{ __html: item.value }} />
                                    </div>
                                ))}
                            </div>
                        )
                    }
                    return null;
                })}
            </div>
        )
    }

    switch (answerType) {
      case '선지형':
        return (
          <div className="space-y-2">
            {answers?.map((_, index) => (
              <Button key={index} variant="outline" className="w-full justify-start text-left text-lg p-6 h-auto min-h-[4rem]">
                 <span className='font-bold mr-4'>{index + 1}</span>
              </Button>
            ))}
          </div>
        );
      case '입력형':
        return (
          <div className="space-y-4">
            {answers?.map((ans, index) => {
                if (ans.type === '분수') {
                    return <div key={index} className="flex items-center gap-2">
                                <span className="font-bold text-lg">{ans.symbol ? `${generateCircledNumber(index + 1)}` : `${index+1}.`}</span>
                                <div className="flex flex-col w-24">
                                    <Input className="text-center h-10 rounded-b-none border-b-0 text-lg"/>
                                    <div className="border-t-2 border-black"></div>
                                    <Input className="text-center h-10 rounded-t-none text-lg"/>
                                </div>
                           </div>
                }
                if (ans.type === '대분수') {
                    return <div key={index} className="flex items-center gap-2">
                                <span className="font-bold text-lg">{ans.symbol ? `${generateCircledNumber(index + 1)}` : `${index+1}.`}</span>
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
                        <span className="font-bold text-lg">{ans.symbol ? `${generateCircledNumber(index + 1)}` : `${index+1}.`}</span>
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
                <div dangerouslySetInnerHTML={{ __html: ans.value }} />
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
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="prose max-w-none prose-lg">
                {questionType === '서술형' ? renderHTML(problemSolving) : renderHTML(prompt)}
                {questionType !== '서술형' && viewContent && renderHTML(viewContent)}
              </div>
            </CardContent>
          </Card>

          {questionType === '유형' && answerType === '선지형' && answers && answers.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-xl mb-4">≡ 보기</h3>
                <div className="prose max-w-none prose-lg space-y-4">
                  {answers.map((ans, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <span className="font-bold">{generateCircledNumber(index + 1)}</span>
                      <div>{renderHTML(ans.value)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {solution && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-xl mb-4">Ω 오답 해설</h3>
                <div className="prose max-w-none prose-lg">{renderHTML(solution)}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-xl mb-4">답안</h3>
              {renderAnswerSection()}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

