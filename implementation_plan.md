# 과제 센터 결과 화면에서 시험 대비 반영 상태 확인 및 이동 기능 구현 계획서

본 계획서는 과제 센터 결과 화면 하단 버튼 영역에 [시험 대비 반영 확인] 버튼을 추가하고, 이를 클릭했을 때 시험 대비 홈으로 이동하여 관련 단원을 펼치고, 해당 유형칩으로 스크롤한 뒤 3초 강조 애니메이션을 적용하는 기능을 수학/과학 과목에 공통 구현하기 위한 상세 작업 계획서입니다.

---

## 1. 작업 대상 파일

| 파일 | 작업 내용 | 신규/수정 여부 |
| -- | ----- | -------- |
| [math-task-center/[taskId]/result/page.tsx](file:///d:/wizza_work/Readingmath-hq-admin/src/app/content/math-task-center/[taskId]/result/page.tsx) | 하단 버튼 영역에 `시험 대비 반영 확인` 버튼을 추가하고, 클릭 시 문항별 유형 ID 목록을 파라미터로 실어 수학 시험 대비 홈으로 라우팅하는 기능 구현 | 수정 |
| [science-task-center/[taskId]/result/page.tsx](file:///d:/wizza_work/Readingmath-hq-admin/src/app/content/science-task-center/[taskId]/result/page.tsx) | 하단 버튼 영역에 `시험 대비 반영 확인` 버튼을 추가하고, 클릭 시 문항별 유형 ID 목록을 파라미터로 실어 과학 시험 대비 홈으로 라우팅하는 기능 구현 | 수정 |
| [math-exam-prep/page.tsx](file:///d:/wizza_work/Readingmath-hq-admin/src/app/content/math-exam-prep/page.tsx) | URL 파라미터(fromTaskResult, highlightTypeIds 등) 감지 로직, 해당 학년-학기 필터 설정, 필터 초기화, 대상 유형칩이 있는 단원만 펼침/외 단원 닫힘 처리, 스크롤 이동, 3초 강조 애니메이션(CSS & State 제어) 구현 | 수정 |
| [science-exam-prep/page.tsx](file:///d:/wizza_work/Readingmath-hq-admin/src/app/content/science-exam-prep/page.tsx) | URL 파라미터(fromTaskResult, highlightTypeIds 등) 감지 로직, 해당 학년-학기 필터 설정, 필터 초기화, 대상 유형칩이 있는 단원만 펼침/외 단원 닫힘 처리, 스크롤 이동, 3초 강조 애니메이션(CSS & State 제어) 구현 | 수정 |

---

## 2. 참고 파일

| 파일 | 참고할 내용 | 수정 여부 |
| -- | ------ | ----- |
| [task-solve-mock.ts](file:///d:/wizza_work/Readingmath-hq-admin/src/lib/task-solve-mock.ts) | 과제 문항 구조(`Question` 인터페이스 및 `typeId` 속성 유무) 파악 | 수정 안 함 |
| [examPrepStorage.ts](file:///d:/wizza_work/Readingmath-hq-admin/src/utils/examPrepStorage.ts) | 과제 센터 풀이 결과가 시험 대비 성취도 판정에 통합되는 기존 정책 및 로직 재확인 | 수정 안 함 |

---

## 3. 구현 흐름

| 순서 | 작업 내용 | 영향 범위 |
| -- | ----- | ----- |
| 1 | **과제 결과 화면 내 버튼 추가 및 라우팅**: 과제 결과 화면의 하단 GNB `footer` 영역에 `시험 대비 반영 확인` 버튼을 추가하고, 클릭 시 해당 과제 문항들의 중복 제거된 `typeId` 목록과 부가 정보를 파라미터에 담아 시험 대비 화면으로 이동시킵니다. | 과제 센터 결과 화면 |
| 2 | **시험 대비 진입 및 URL 파라미터 수집**: 시험 대비 화면 진입 시 `useSearchParams`를 통해 과제 센터에서 전달된 파라미터들을 분석합니다. | 시험 대비 홈 화면 |
| 3 | **필터 설정 및 리셋**: 학년-학기 필터는 전달받은 과제 정보의 학년-학기로 지정하고, 교과서/성취도 필터는 초기화(전체), 중요 유형 보기 필터는 `OFF`로 설정합니다. | 시험 대비 홈 화면 |
| 4 | **단원 펼침/닫힘 동적 제어**: 전체 대단원 및 소단원(중단원) 중, 반영 대상 유형 ID가 포함된 단원만 펼치고(`Set`에 추가), 포함되지 않은 단원은 닫힌 상태(`Set`에서 제외)로 전환합니다. | 시험 대비 홈 화면 |
| 5 | **최초 타겟 스크롤 및 강조**: 렌더링 완료 시점(약 150ms 딜레이)에 정렬 순서상 첫 번째 매칭 유형칩이 있는 곳으로 부드럽게 스크롤을 이동하고, 대상 유형칩들에 3초 동안 강조용 CSS 애니메이션 클래스를 바인딩한 뒤 3초 타이머가 끝나면 원래의 칩 상태로 자동 복구합니다. | 시험 대비 홈 화면 |

---

## 4. 과제 센터 결과 화면 적용 계획

| 과목 | 결과 화면 | 추가 버튼 | 이동 대상 |
| -- | ----- | ----- | ----- |
| **수학** | `/content/math-task-center/[taskId]/result` | `시험 대비 반영 확인` | `/content/math-exam-prep` |
| **과학** | `/content/science-task-center/[taskId]/result` | `시험 대비 반영 확인` | `/content/science-exam-prep` |

* **버튼 활성화/노출 조건**: 과제 결과 화면 진입 상태 && 제출 완료 상태 (제출 완료 시에만 진입 가능하므로 상시 노출)
* **동작 세부 내용**: 
  1. `questions` 배열에서 각 문항의 `typeId`를 추출하고, 빈 값 제거 및 `Set`을 통한 중복 제거 처리합니다.
  2. 추출된 `typeId` 목록을 쉼표(`,`)로 구분된 문자열로 결합합니다.
  3. `router.push()`를 통해 지정된 URL 파라미터를 담아 시험 대비 화면으로 라우팅합니다.

---

## 5. 시험 대비 화면 적용 계획

| 과목 | 적용 화면 | 단원 펼침/닫힘 | 스크롤 이동 | 유형칩 강조 |
| -- | ----- | -------- | ------ | ------ |
| **수학** | `/content/math-exam-prep` | 대상 유형 ID가 있는 대단원/소단원 펼침, 그 외 대단원/소단원 닫힘 | 첫 번째 매칭 유형칩의 DOM 요소(ID: `type-chip-[id]`) 위치로 smooth 스크롤 | 3초간 CSS Pulse & Border 테두리 강조 애니메이션 적용 |
| **과학** | `/content/science-exam-prep` | 대상 유형 ID가 있는 대단원/중단원 펼침, 그 외 대단원/중단원 닫힘 | 첫 번째 매칭 유형칩의 DOM 요소(ID: `type-chip-[id]`) 위치로 smooth 스크롤 | 3초간 CSS Pulse & Border 테두리 강조 애니메이션 적용 |

---

## 6. URL 파라미터 전달 계획

과제 센터 결과 화면에서 시험 대비 홈으로 이동할 때 다음과 같은 URL 쿼리 파라미터를 사용합니다.

| 파라미터 | 전달값 | 사용 위치 |
| ---- | --- | ----- |
| `fromTaskResult` | `"true"` | 과제 결과 화면으로부터의 유입 여부를 구분하여 필터 초기화 및 단원 제어를 활성화하는 키로 활용 |
| `highlightTypeIds` | `typeId1,typeId2,...` | 과제 문항에 포함되어 강조 표시 및 단원 펼침의 기준이 될 유형 ID들의 쉼표 구분 목록 |
| `gradeSemester` | `task.course` | 과제 문항이 속한 학년-학기 필터 설정값 (예: `"초3-1"`, `"중1-1"`) |
| `sourceTaskId` | `taskId` | 유입 정보 추적 및 필요시 과제 정보 매칭을 위한 원본 과제 ID |
| `source` | `"task-center"` | 유입 채널 식별자 |

---

## 7. 유형칩 강조 애니메이션 계획

| 항목 | 기준 및 사양 |
| -- | -- |
| **강조 대상** | 전달받은 `highlightTypeIds` 목록과 일치하는 모든 유형칩 (중복 제거된 유형 ID 기준 매칭) |
| **강조 시간** | 화면 진입 후 **정확히 3초** (setTimeout을 통해 React 상태 `highlightingIds`를 비워 원상 복귀) |
| **강조 방식** | - 유형칩의 테두리를 원본 테두리와 대비되는 보라색/인디고 컬러로 강조<br>- 유형칩 외곽에 `pulse-highlight` keyframe 애니메이션을 통한 번짐/pulse 효과 적용<br>- 3초 동안 2~3회 반복해서 반짝이는 시각적 효과 제공 |
| **기존 상태 보존** | - 강조 애니메이션 중에도 유형칩 고유의 성취도 색상(배경색)을 투명하게 덮어쓰지 않고 투과 유지<br>- 유형칩 내부 아이콘(`?`, `Check`, `Crown` 등)과 중요 표시인 별(`Star`) 아이콘을 그대로 유지 |
| **강조 복구** | 3초 타이머 만료 시, 추가된 CSS 클래스를 제거하고 원래의 성취도 기반 스타일로 완전 복귀 |

---

## 8. 성취도 반영 기준 준수 계획

| 항목 | 준수 방식 |
| -- | ----- |
| **성취도 반영 시점** | 과제 풀이 결과는 이미 제출 시점에 `examPrepStorage`의 성취도 로직에 자동 통합되어 있습니다. [시험 대비 반영 확인] 버튼은 단순히 반영 상태를 시각적으로 확인하기 위해 화면을 열어주는 것이므로, **이동 시점에 성취도를 새로 판정하거나 수정하는 가벼운 로직의 위반 행동은 절대 수행하지 않습니다.** |
| **유형 매칭 규칙** | 과제 문항과 시험 대비 유형칩은 오직 **유형 ID(typeId)**를 기준으로만 1:1 매칭합니다. 유형명, 난이도, 중요 여부가 유사하더라도 **매칭 실패 시 대체 매칭이나 판정 정책 변경을 시도하지 않습니다.** |

---

## 9. 금지 범위 준수 계획

| 금지 항목 | 준수 방식 |
| ----- | ----- |
| **과제 센터 풀이 화면 및 데이터 수정 금지** | 과제 풀이 화면(`solve/page.tsx`), 과제 문항 데이터 원본, 과제 저장 로직은 절대 변경하지 않고 오직 제출이 완료된 `TaskResult`와 문항의 `typeId` 정보만을 읽기 전용으로 사용합니다. |
| **정규/훈련/오답노트 데이터 변경 금지** | 정규 학습 및 훈련 데이터, 학습 보고서, 오답노트 등과 연동된 타 서비스 영역의 데이터 모델 및 상태에 영향을 주지 않도록 기능의 바운더리를 시험 대비 메인 홈으로 엄격히 한정합니다. |
| **강조 효과 중 상태 임의 변경 금지** | 강조 애니메이션은 단순한 시각 효과이며, 이로 인해 유형칩의 성취도 상태가 변하거나 필터 조건(교과서 필터 등)이 깨지는 현상이 발생하지 않도록 CSS 및 로컬 React State로만 분리하여 격리합니다. |

---

## 10. 검수 계획

| 검수 항목 | 확인 방법 |
| ----- | ----- |
| **수학 과제 센터 버튼 추가 및 라우팅** | [수학 과제 센터 결과](http://localhost:9002/content/math-task-center/math-task-002/result)로 진입하여 하단 GNB 영역에 [시험 대비 반영 확인] 버튼이 예시와 동일하게 렌더링되는지 확인하고, 클릭 시 수학 시험 대비 홈으로 정상 라우팅되는지 확인합니다. |
| **과학 과제 센터 버튼 추가 및 라우팅** | [과학 과제 센터 결과](http://localhost:9002/content/science-task-center/sci-task-002/result) (또는 기존에 모킹된 과학 과제 결과 라우트)로 진입하여 동일한 [시험 대비 반영 확인] 버튼이 활성화되는지 확인하고, 클릭 시 과학 시험 대비 홈으로 이동하는지 확인합니다. |
| **학년-학기 필터 및 필터 리셋 검수** | 이동 후 시험 대비 홈의 학년-학기 필터가 과제에 기술된 학년-학기(수학: `초3-1`, 과학: `중1-1` 등)로 자동 변경되며, 타 교과서/성취도 필터가 초기화되고 중요 유형 보기가 OFF로 해제되는지 확인합니다. |
| **단원 펼침/닫힘 및 스크롤 작동** | 반영할 유형 ID가 있는 대단원과 소단원(중단원)만 확장되어 열린 상태로 표시되고 나머지는 닫히는지 확인하며, 해당 유형칩 위치로 부드럽게 스크롤링되는지 확인합니다. |
| **유형칩 3초 강조 및 복구** | 스크롤링 직후 대상 유형칩 주위에 테두리 및 pulse 애니메이션이 정상 동작하며, 3초 후 애니메이션 클래스가 제거되면서 원래의 성취도 색상과 아이콘을 유지한 상태로 되돌아가는지 확인합니다. |

---

## 11. 구현상 핵심 디테일 (코드 디자인)

### (1) 유형칩 강조를 위한 CSS 추가 계획 (`math-exam-prep/page.tsx`, `science-exam-prep/page.tsx` 내부)
```tsx
// 컴포넌트 JSX 내부에 style 태그를 주입하여 전용 pulse 애니메이션 제공
<style dangerouslySetInnerHTML={{ __html: `
  @keyframes pulse-exam-highlight {
    0%, 100% {
      box-shadow: 0 0 0 2px white, 0 0 0 4px #8b5cf6;
      transform: scale(1.1);
    }
    50% {
      box-shadow: 0 0 0 4px white, 0 0 0 8px #8b5cf6, 0 0 16px rgba(139, 92, 246, 0.6);
      transform: scale(1.15);
    }
  }
  .exam-prep-highlight-active {
    animation: pulse-exam-highlight 1.5s ease-in-out infinite;
    z-index: 30 !important;
  }
`}} />
```

### (2) 스크롤 스크립트 실행 지연 처리
단원이 렌더링되고 펼쳐지는 시간(React State 변경 및 DOM 마운트)을 보장하기 위해 `setTimeout`을 사용하여 `150ms` 정도의 타이밍 보정을 둡니다.

```typescript
const el = document.getElementById(`type-chip-${firstTargetId}`);
if (el) {
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}
```
