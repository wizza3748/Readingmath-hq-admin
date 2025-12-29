
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuestionData {
  prompt?: string;
  viewContent?: string;
  solution?: string;
  answerType?: '선지형' | '입력형' | '순서맞추기';
  answers?: any[];
}

const generateCircledNumber = (num: number) => {
    return `①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳`[num-1] || String(num);
};

export default function QuestionPreviewPage() {
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('questionPreviewData');
    if (data) {
      setQuestionData(JSON.parse(data));
    }
  }, []);

  const renderHTML = (htmlString: string | undefined) => {
    if (!htmlString) return null;
    return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
  };

  if (!questionData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>미리보기 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const { prompt, viewContent, solution, answerType, answers } = questionData;

  const renderAnswerSection = () => {
    switch (answerType) {
      case '선지형':
        return (
          <div className="space-y-2">
            {answers?.map((_, index) => (
              <Button key={index} variant="outline" className="w-full justify-start text-lg p-6">
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
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="prose max-w-none prose-lg">
                {renderHTML(prompt)}
                {renderHTML(viewContent)}
              </div>
            </CardContent>
          </Card>

          {answerType === '선지형' && answers && (
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
