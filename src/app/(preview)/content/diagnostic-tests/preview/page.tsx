'use client';

import dynamic from 'next/dynamic'

const QuestionPreview = dynamic(
  () => import('@/components/app/diagnostic-tests/question-preview'),
  { ssr: false, loading: () => <p>미리보기 데이터를 불러오는 중입니다...</p> }
)

export default function PreviewPage() {
  return <QuestionPreview />
}
