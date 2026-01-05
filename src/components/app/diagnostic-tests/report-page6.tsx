
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const contentAreaExplanations = [
    {
        area: '물리',
        explanation: '뉴턴의 운동 법칙, 에너지 보존 법칙 등 자연 현상을 관통하는 핵심 원리를 파악하고, 이를 수식과 그래프로 표현된 물리 상황에 적용하여 논리적으로 해결하는 역량을 평가합니다. 학교 시험의 변별력은 주로 여러 변인 간의 상관관계를 파악하여 정확한 수치로 산출하는 정량적 분석 문제에서 결정되므로, 각 단원의 주요 공식이 도출되는 원리적 메커니즘을 명확히 이해해야 합니다. 특히 힘과 에너지, 전자기 등 통합적 사고를 요구하는 단원에서 오개념을 배제하고 수학적 추론 과정을 정교화하는 것이 만점을 결정짓는 핵심 요소입니다.'
    },
    {
        area: '화학',
        explanation: '물질의 성질을 결정하는 원자와 분자의 구조를 이해하고, 화학 반응 시 발생하는 에너지 변화와 양적 관계를 체계적으로 분석하는 역량을 평가합니다. 학교 시험의 고난도 문항은 주로 화학 반응식과 화학 반응 관련 법칙을 이용한 복잡한 계산 능력을 요구하므로, 단위 변환과 비례 식을 활용한 정밀한 문제 해결 능력이 고득점의 핵심입니다. 따라서 물질의 상태 변화와 화학 결합의 원리를 분자 수준에서 시각화하고, 이를 수식으로 변환하여 실전 문제에 적용하는 훈련이 반드시 병행되어야 합니다.'
    },
    {
        area: '생명과학',
        explanation: '생명체를 구성하는 세포 수준의 미시적 원리부터 유전, 항상성 유지 기전 및 생태계의 상호작용까지 유기적 통합 체계를 이해하는 역량을 평가합니다. 학교 시험 고득점을 위해서는 복잡한 유전 가계도 분석이나 자극의 전달 경로와 같은 고난도 추론 문항에서 데이터를 신속하고 정확하게 해석하는 정교한 논리가 필수적입니다. 단순히 개념을 나열하는 수준을 넘어, 각 생명 현상이 발생하는 인과관계를 파악하고 이를 실제 사례에 적용하여 논술할 수 있을 때 완벽한 성취도를 확보할 수 있습니다.'
    },
    {
        area: '지구과학',
        explanation: '지구 시스템을 구성하는 지권, 수권, 기권, 외권의 역동적인 변화와 각 권역 간의 에너지 흐름 및 물질 순환 원리를 체계적으로 평가합니다. 학교 시험의 고득점은 기상 레이더 영상, 해류 순환도, 천체의 겉보기 운동 등 복잡한 공간적 데이터를 논리적으로 분석하여 물리량의 변화를 예측하는 역량에서 결정됩니다. 따라서 지질 시대의 환경 변화부터 우주 팽창에 이르기까지 광범위한 시공간적 현상을 과학적 메커니즘으로 구조화하여 정교한 추론 답안을 도출하는 훈련이 필수적입니다.'
    }
];

const behavioralAreaExplanations = [
    {
        area: '개념이해력',
        explanation: '물리적 현상과 화학적 반응 등 과학적 원리의 핵심 정의를 정확하게 습득하고, 이를 체계적으로 개념을 정립하는 기초 역량입니다. 학교 시험에서 고난도 문항의 함정을 피하고 오개념을 방지하기 위해서는 용어의 정의를 명확히 정립하는 것이 무엇보다 중요합니다. 특히, 생명과학과 지구과학은 개념을 정확히 알지 못하면 문제를 풀 수가 없습니다. 따라서 개념의 단순 암기를 넘어 학습한 개념을 논리적으로 설명할 수 있는 수준에 도달해야 상위권 도약을 위한 탄탄한 발판을 마련할 수 있습니다.'
    },
    {
        area: '문제해결력',
        explanation: '단순히 암기한 지식을 넘어, 습득한 과학적 원리와 법칙을 생소한 상황이나 자료에 적용하여 결론을 도출하는 응용 역량입니다. 학교 시험의 변별력을 결정짓는 킬러 문항들은 주로 여러 가지 물리량의 상관관계를 파악하거나 복합적인 화학 반응식을 완성하는 형태로 출제되므로, 이 영역이 탄탄해야 안정적인 1등급을 확보할 수 있습니다. 주어진 조건 속에서 최적의 과학적 모델을 설정하고 단계별 풀이 과정을 설계하는 훈련을 통해 실전 대응력을 극대화할 수 있습니다.'
    },
    {
        area: '문해력',
        explanation: '복잡한 지문과 그래프, 도표 등 다양한 형태의 데이터 속에 포함된 핵심 과학 정보와 변인 간의 관계를 정확히 추출하고 분석하는 역량입니다. 학교 시험의 서술형 및 논술형 문항에서 감점을 방지하고 고득점을 얻기 위해서는 문제의 요구 사항을 과학적 메커니즘에 근거하여 논리적인 문장으로 기술하는 능력이 필수적입니다. 따라서 출제의도를 파악해 불필요한 서술은 줄이고, 핵심 “키워드(Key-word)”와 과학적 용어를 적재적소에 배치하여 답안의 완결성을 높여야 합니다.'
    },
    {
        area: '추론력',
        explanation: '제시된 실험 데이터나 관찰 자료를 바탕으로 변인 간의 상관관계를 분석하여 일반화된 결론을 도출하거나, 미지의 상황에 대한 과학적 결과를 예측하는 고차원적 사고 역량입니다. 학교 시험에서 고난도 자료 해석 문제나 변별력을 결정짓는 문항들을 해결하기 위해서는 단순 지식 인출을 넘어, 논리적 근거를 바탕으로 가설을 검증하고 새로운 물리적‧화학적 상황에 적용하는 능력이 필수적입니다. 이러한 추론 과정을 정교화함으로써 생소한 유형의 문제에서도 당황하지 않고 정답의 논리적 근거를 명확히 제시하여 만점을 확보할 수 있습니다.'
    }
];

export function ReportPage6() {
    return (
        <div className="bg-white p-12 md:p-16 w-full max-w-4xl shadow-lg relative print:shadow-none page-break" style={{ aspectRatio: '210 / 297' }}>
            <div className="space-y-12">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 border-l-4 border-primary pl-3 mb-4">내용 영역별 평가 설명</h2>
                    <div className="rounded-md border">
                        <Table>
                            <TableBody>
                                {contentAreaExplanations.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="w-[120px] bg-gray-50 font-semibold text-center align-middle">{item.area}</TableCell>
                                        <TableCell className="text-sm leading-relaxed text-gray-700">{item.explanation}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-bold text-gray-800 border-l-4 border-primary pl-3 mb-4">행동 영역별 평가 설명</h2>
                    <div className="rounded-md border">
                        <Table>
                            <TableBody>
                                {behavioralAreaExplanations.map((item, index) => (
                                     <TableRow key={index}>
                                        <TableCell className="w-[120px] bg-gray-50 font-semibold text-center align-middle">{item.area}</TableCell>
                                        <TableCell className="text-sm leading-relaxed text-gray-700">{item.explanation}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
