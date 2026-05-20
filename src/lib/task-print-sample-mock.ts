export type PrintQuestion = {
  id: string;
  subject: "math" | "science";
  stem: string; // 발문
  passage?: string; // 보기 텍스트
  image?: string; // 이미지 에셋 (영어 파일명 권장)
  table?: { headers?: string[]; rows: string[][] }; // 표
  choices: string[]; // 선지 (1~5번)
  answer: string; // 정답
  explanation: string; // 해설
};

// 수학 샘플 (5문항)
export const MATH_PRINT_SAMPLES: PrintQuestion[] = [
  {
    id: "math-sample-1",
    subject: "math",
    stem: "다음 조건을 모두 만족하는 자연수 x 중에서 가장 큰 수를 구하시오.",
    passage: "x는 10 미만의 자연수이다.\n부등식 4x + 7 > 6x - 3 을 만족한다.",
    choices: ["1", "2", "3", "4", "5"],
    answer: "4",
    explanation: "부등식 4x + 7 > 6x - 3을 풀면 10 > 2x, x < 5입니다. 조건을 만족하는 자연수는 1, 2, 3, 4이므로 가장 큰 수는 4입니다. 따라서 ④가 정답입니다."
  },
  {
    id: "math-sample-2",
    subject: "math",
    stem: "밑면의 넓이가 4π인 원뿔이 있다. 이 원뿔의 부피가 12π 이상이 되기 위한 높이 h의 범위를 구하시오.",
    image: "/print_sample/math-02-cone.png", // 대체 이미지명 (예시)
    choices: ["h ≥ 3", "h ≥ 6", "h ≥ 9", "h ≥ 12", "h ≥ 15"],
    answer: "h ≥ 9",
    explanation: "원뿔의 부피는 (밑면의 넓이 × 높이 ÷ 3)입니다. 밑면의 넓이가 4π이고 부피가 12π 이상이어야 하므로 4π × h ÷ 3 ≥ 12π입니다. 따라서 h ≥ 9입니다."
  },
  {
    id: "math-sample-3",
    subject: "math",
    stem: "다음 그림에서 점 P에서 원에 그은 두 접선의 접점을 각각 A, C라고 하자. 원 O의 원주 위에 점 B가 있고 ∠ABC = 65°일 때, ∠APC의 크기를 구하시오.",
    image: "/print_sample/math-03-circle.png",
    choices: ["40°", "45°", "50°", "55°", "60°"],
    answer: "50°",
    explanation: "호 AC에 대한 원주각이 65°이므로 중심각 ∠AOC = 130°입니다. 원의 접선과 반지름은 접점에서 수직이므로 ∠OAP = ∠OCP = 90°입니다. 사각형 AOPC의 내각의 합은 360°이므로 ∠APC = 360° - 90° - 90° - 130° = 50°입니다."
  },
  {
    id: "math-sample-4",
    subject: "math",
    stem: "삼각형 ABC에서 변 AB의 길이가 12, ∠B = 60°, ∠A = 75°일 때, 점 A에서 변 BC에 내린 수선의 발을 D라고 하자. 선분 AD의 길이 h를 구하시오.",
    image: "/print_sample/math-04-triangle.png",
    choices: ["6", "6√2", "6√3", "12", "12√3"],
    answer: "6√3",
    explanation: "직각삼각형 ABD에서 선분 AD(h)의 길이는 AB × sin60° 입니다. 따라서 12 × (√3 / 2) = 6√3 입니다."
  },
  {
    id: "math-sample-5",
    subject: "math",
    stem: "연속하는 세 자연수가 있다. 이 세 수의 합이 27보다 클 때, 조건을 만족하는 가장 작은 세 자연수 중 가장 큰 수를 구하시오.",
    choices: ["9", "10", "11", "12", "13"],
    answer: "11",
    explanation: "연속하는 세 자연수를 n, n+1, n+2라고 하면 합은 3n + 3입니다. 3n + 3 > 27이므로 3n > 24, n > 8입니다. 가장 작은 자연수는 9이고, 세 수는 9, 10, 11입니다. 가장 큰 수는 11입니다."
  },
  {
    id: "math-sample-6",
    subject: "math",
    stem: "이차방정식 $x^2 + \\frac{4}{3}x + \\frac{4}{9} = 0$ 이 중근 $x = a$ 를 갖고, 이차방정식 $9x^2 - 12x + 4 = 0$ 이 중근 $x = b$ 를 가질 때, $a - b$ 의 값을 구하세요.",
    choices: ["$-\\frac{2}{3}$", "$-\\frac{4}{3}$", "$0$", "$\\frac{4}{3}$", "$\\frac{2}{3}$"],
    answer: "$-\\frac{4}{3}$",
    explanation: "$x^2 + \\frac{4}{3}x + \\frac{4}{9} = 0$ 에서 $(x + \\frac{2}{3})^2 = 0$<br/>$\\therefore x = -\\frac{2}{3}$ (중근)<br/><br/>$9x^2 - 12x + 4 = 0$ 에서 $(3x - 2)^2 = 0$<br/>$\\therefore x = \\frac{2}{3}$ (중근)<br/><br/>따라서 $a = -\\frac{2}{3}$, $b = \\frac{2}{3}$ 이므로 $a - b = -\\frac{4}{3}$"
  },
  {
    id: "math-sample-7",
    subject: "math",
    stem: "다음 이차방정식 중 중근을 가지는 것을 고르세요.",
    choices: ["$x^2 - 2x + 1 = 0$", "$x^2 + 4x - 12 = 0$", "$x^2 - x - 30 = 0$", "$2x^2 + x - 1 = 0$", "$x^2 - 4x = 0$"],
    answer: "$x^2 - 2x + 1 = 0$",
    explanation: "이차방정식이 중근을 가지려면 $(\\text{완전제곱식}) = 0$ 꼴로 나타낼 수 있어야 합니다. 주어진 방정식을 인수분해해 보면<br/>① $(x - 1)^2 = 0$<br/>② $(x + 6)(x - 2) = 0$<br/>③ $(x - 6)(x + 5) = 0$<br/>④ $(2x - 1)(x + 1) = 0$<br/>⑤ $x(x - 4) = 0$<br/><br/>따라서 중근을 가지는 것은 ① $x^2 - 2x + 1 = 0$ 입니다."
  },
  {
    id: "math-sample-8",
    subject: "math",
    stem: "다음 중 두 변량 사이의 상관관계가 나머지 넷과 다른 하나를 고르세요.",
    choices: ["겨울철 평균 기온과 난방비", "운동량과 비만도", "근무 시간과 여가 시간", "키와 몸무게", "전자기기의 가격과 구매량"],
    answer: "키와 몸무게",
    explanation: "④ 키와 몸무게 $\\Rightarrow$ 양의 상관관계<br/>①, ②, ③, ⑤ $\\Rightarrow$ 음의 상관관계<br/><br/>따라서 두 변량 사이의 상관관계가 나머지 넷과 다른 하나는 ④입니다."
  },
  {
    id: "math-sample-9",
    subject: "math",
    stem: "다음 그림은 솔빈이네 반 학생 10명의 음악 점수와 미술 점수에 대한 산점도입니다. 미술 점수가 음악 점수보다 높은 학생 수는 몇 명인지 구하세요.",
    passage: "<img src=\"/images/mock/math-q4-passage.svg\" alt=\"산점도\" style=\"max-width:300px; margin: 0 auto; display: block;\" />",
    choices: [],
    answer: "4",
    explanation: "<img src=\"/images/mock/math-q4-explanation.svg\" alt=\"산점도 해설\" style=\"max-width:300px; margin: 0 auto 10px auto; display: block;\" /><br/>미술 점수가 음악 점수보다 높은 학생 수는 대각선의 위쪽의 점의 개수와 같으므로 4명입니다."
  },
  {
    id: "math-sample-10",
    subject: "math",
    stem: "다음 표는 8명의 학생이 한 농구 경기에서 넣은 2점 슛과 3점 슛의 개수를 조사하여 나타낸 것입니다. 넣은 2점 슛을 x개, 3점 슛을 y개라 할 때, 두 변량 x, y에 대한 산점도를 바르게 나타낸 것을 고르세요.",
    passage: "<img src=\"/images/mock/math-q5-table.svg\" alt=\"표\" style=\"max-width:400px; margin: 0 auto; display: block;\" />",
    choices: [
      "<img src=\"/images/mock/math-q5-choice1.svg\" alt=\"선지1\" style=\"height:75px; width:auto; object-fit:contain; display:inline-block; vertical-align:middle;\" />",
      "<img src=\"/images/mock/math-q5-choice2.svg\" alt=\"선지2\" style=\"height:75px; width:auto; object-fit:contain; display:inline-block; vertical-align:middle;\" />",
      "<img src=\"/images/mock/math-q5-choice3.svg\" alt=\"선지3\" style=\"height:75px; width:auto; object-fit:contain; display:inline-block; vertical-align:middle;\" />",
      "<img src=\"/images/mock/math-q5-choice4.svg\" alt=\"선지4\" style=\"height:75px; width:auto; object-fit:contain; display:inline-block; vertical-align:middle;\" />",
      "<img src=\"/images/mock/math-q5-choice5.svg\" alt=\"선지5\" style=\"height:75px; width:auto; object-fit:contain; display:inline-block; vertical-align:middle;\" />"
    ],
    answer: "<img src=\"/images/mock/math-q5-choice2.svg\" alt=\"선지2\" style=\"height:75px; width:auto; object-fit:contain; display:inline-block; vertical-align:middle;\" />",
    explanation: "두 변량 x, y를 순서쌍 (x, y)로 하는 8개의 점 (5, 4), (2, 2), (4, 3), (3, 3), (4, 5), (5, 5), (4, 3), (2, 3)를 좌표평면 위에 바르게 나타낸 것은 ②입니다."
  }
];


// 과학 샘플 (5문항)
export const SCIENCE_PRINT_SAMPLES: PrintQuestion[] = [
  {
    id: "science-sample-1",
    subject: "science",
    stem: "페니실린 발견 과정에서 플레밍이 세운 가설로 가장 적절한 것은?",
    passage: "플레밍은 푸른곰팡이 주변에서 세균이 자라지 않는 현상을 관찰했다.",
    choices: [
      "푸른곰팡이는 세균의 증식을 돕는 물질을 만들 것이다.",
      "세균은 푸른곰팡이의 성장을 억제할 것이다.",
      "푸른곰팡이에서 나온 어떤 성분이 세균의 증식을 방해할 것이다.",
      "푸른곰팡이와 세균은 공생 관계일 것이다.",
      "세균은 온도에 따라 증식 속도가 다를 것이다."
    ],
    answer: "푸른곰팡이에서 나온 어떤 성분이 세균의 증식을 방해할 것이다.",
    explanation: "페니실린 발견 과정에서는 푸른곰팡이 주변에서 세균이 자라지 않는 현상을 관찰했습니다. 이를 검증하기 위한 가설로는 푸른곰팡이에서 나온 어떤 성분이 세균의 증식을 방해할 것이라는 내용이 가장 적절합니다."
  },
  {
    id: "science-sample-2",
    subject: "science",
    stem: "인공지능(AI) 기술에 대한 설명으로 가장 핵심적인 것은?",
    choices: [
      "센서를 통해 아날로그 데이터를 수집하는 기술",
      "복잡한 데이터를 단순한 표 형태로 압축하는 기술",
      "컴퓨터가 데이터를 학습하여 판단하거나 문제를 해결하도록 하는 기술",
      "인터넷을 통해 원격으로 장치를 제어하는 기술",
      "단순 반복 작업을 로봇으로 대체하는 기술"
    ],
    answer: "컴퓨터가 데이터를 학습하여 판단하거나 문제를 해결하도록 하는 기술",
    explanation: "인공지능은 컴퓨터가 데이터를 학습하여 판단하거나 문제를 해결하도록 하는 기술입니다. 센서 데이터 전송, 빅데이터 분석, 가상 캐릭터 구현, 로봇 작업 수행만으로는 인공지능의 핵심 설명으로 보기 어렵습니다."
  },
  {
    id: "science-sample-3",
    subject: "science",
    stem: "과학 탐구 과정 중 '탐구 설계 및 수행' 단계에 대한 설명으로 옳은 것을 <보기>에서 모두 고른 것은?",
    passage: "<보기>\nㄱ. 가설 검증에 필요한 실험 장치와 재료를 정한다.\nㄴ. 실험 결과에 영향을 줄 수 있는 요인을 확인하여 통제한다.\nㄷ. 예상과 다른 결과가 나와도 관찰한 자료를 그대로 기록한다.",
    choices: ["ㄱ", "ㄷ", "ㄱ, ㄴ", "ㄴ, ㄷ", "ㄱ, ㄴ, ㄷ"],
    answer: "ㄱ, ㄴ, ㄷ",
    explanation: "탐구 설계 및 수행 단계에서는 가설 검증에 필요한 실험 장치와 재료를 정하고, 실험 결과에 영향을 줄 수 있는 요인을 확인하여 통제하며, 예상과 다른 결과가 나와도 관찰한 자료를 그대로 기록해야 합니다. 따라서 ㄱ, ㄴ, ㄷ이 모두 옳습니다."
  },
  {
    id: "science-sample-4",
    subject: "science",
    stem: "빅토리아호에 나일농어가 유입된 후 생태계의 변화에 대한 설명으로 적절한 것을 <보기>에서 모두 고른 것은?",
    image: "/print_sample/science-04-ecosystem.png",
    passage: "<보기>\nㄱ. 생물 종 수가 증가하여 생태계가 복잡해졌다.\nㄴ. 외래종 도입으로 기존 생태계의 평형이 유지되었다.\nㄷ. 특정 생물이 멸종하면 생태계가 파괴될 위험이 커진다.\nㄹ. 인위적인 간섭으로 생물다양성이 급격히 감소하였다.",
    choices: ["ㄱ, ㄴ", "ㄱ, ㄷ", "ㄴ, ㄹ", "ㄷ, ㄹ", "ㄱ, ㄷ, ㄹ"],
    answer: "ㄷ, ㄹ",
    explanation: "나일농어 유입 후 생물 종 수와 먹이 관계가 줄어 생태계가 단순해졌습니다. 특정 생물이 멸종하면 생태계가 파괴될 위험이 커지고, 인위적인 간섭으로 생물다양성이 급격히 감소한 상태입니다. 따라서 ㄷ, ㄹ이 적절합니다."
  },
  {
    id: "science-sample-5",
    subject: "science",
    stem: "생물다양성 보전을 위한 사회적 차원의 노력으로 옳은 것을 <보기>에서 모두 고른 것은?",
    image: "/print_sample/science-05-bird.png",
    passage: "<보기>\nㄱ. 생물다양성 보전 캠페인 활동 전개\nㄴ. 멸종 위기종 보존을 위한 종자 은행 설립\nㄷ. 특정 생물 서식지를 보호 구역으로 지정",
    choices: ["ㄱ", "ㄷ", "ㄱ, ㄴ", "ㄴ, ㄷ", "ㄱ, ㄴ, ㄷ"],
    answer: "ㄱ, ㄴ, ㄷ",
    explanation: "생물다양성 보전을 위해 사회적 차원에서는 캠페인 활동, 종자 은행 설립, 보호 구역 지정 등이 모두 가능합니다. 따라서 ㄱ, ㄴ, ㄷ이 모두 옳습니다."
  },
  {
    id: "science-sample-6",
    subject: "science",
    stem: "서로 섞이지 않는 네 가지 액체 물질 A, B, C, D가 있다. 이들을 같은 크기의 시험관에 넣었을 때 나타난 결과에 대한 설명으로 옳은 것은?",
    passage: "• (가) A와 B를 넣었을 때: A가 위층, B가 아래층<br/>• (나) B와 C를 넣었을 때: B가 위층, C가 아래층<br/>• (다) A와 D를 넣었을 때: D가 위층, A가 아래층",
    choices: [
      "네 물질 중 밀도가 가장 큰 물질은 A이다.",
      "밀도의 크기는 C > B > D > A 순이다.",
      "(나) 시험관에서 질량은 C가 B보다 작다.",
      "A, B, C, D를 모두 한 시험관에 넣으면 층 분리가 일어나지 않는다.",
      "(가)에서 밀도가 큰 B를 먼저 분리해 내려면 분별 깔때기를 사용해야 한다."
    ],
    answer: "(가)에서 밀도가 큰 B를 먼저 분리해 내려면 분별 깔때기를 사용해야 단다.",
    explanation: "이들을 종합하면 밀도 순서는 C > B > A > D 가 됩니다. C의 밀도가 B보다 크므로 같은 부피일 때 질량은 C가 더 큽니다. 네 물질이 서로 섞이지 않으므로 한 시험관에 넣으면 밀도 순서대로 층을 이룹니다. 밀도가 다른 섞이지 않는 액체를 분리하는 데는 분별 깔때기가 가장 적절합니다."
  },
  {
    id: "science-sample-7",
    subject: "science",
    stem: "다음 그림은 서로 잘 섞이지 않는 액체 상태의 혼합물을 분리하기 위한 실험 장치이다. 이에 대한 설명으로 옳지 않은 것은?",
    image: "/images/mock/science-q7-funnel.svg",
    choices: [
      "액체 A는 액체 B보다 밀도가 작다.",
      "이 장치는 물질의 '밀도 차이'를 이용한 분리 방법이다.",
      "A와 B는 물과 식용유의 관계처럼 서로 용해되지 않는 성질을 가진다.",
      "같은 부피일 때 질량은 액체 A가 액체 B보다 더 크다.",
      "꼭지를 열어 먼저 분리해 낼 수 있는 액체는 B이다."
    ],
    answer: "같은 부피일 때 질량은 액체 A가 액체 B보다 더 크다.",
    explanation: "서로 섞이지 않는 액체를 분별 깔때기에 넣으면 밀도가 작은 물질이 위로 뜨고, 밀도가 큰 물질이 아래로 가라앉아 층을 이룹니다. 그림에서 A가 위층, B가 아래층이므로 밀도는 B > A입니다. 밀도가 작다는 것은 같은 부피일 때 질량이 더 작다는 것을 의미합니다. 따라서 A의 밀도가 작으므로 같은 부피일 때 질량은 A가 더 작습니다. 분별 깔때기는 섞이지 않고 밀도가 다른 액체 혼합물을 분리할 때 사용합니다. 꼭지를 열면 아래쪽에 있는 밀도가 큰 액체 B가 먼저 흘러 나옵니다."
  },
  {
    id: "science-sample-8",
    subject: "science",
    stem: "다음 그림은 지각을 구성하는 암석 속 주요 조암 광물의 부피비를 나타낸 것이다. (가) 광물에 대한 설명으로 옳은 것은?",
    image: "/images/mock/science-q8-piechart.svg",
    choices: [
      "조암 광물 중 가장 작은 비중을 차지한다.",
      "주로 어두운색을 띠며 자성을 가지고 있다.",
      "염산과 반응하여 이산화 탄소 기체를 발생시킨다.",
      "조암 광물 중 가장 많은 비중을 차지하며, 주로 밝은색을 띤다.",
      "풍화에 매우 강하여 모래의 주성분이 되는 광물이다."
    ],
    answer: "조암 광물 중 가장 많은 비중을 차지하며, 주로 밝은색을 띤다.",
    explanation: "부피비가 51%로 가장 높은 (가)는 장석입니다. 장석은 조암 광물 중 가장 넓은 면적을 차지하며, 주로 흰색이나 분홍색 등 밝은색을 띱니다. ⑤번 설명은 부피비 약 12%를 차지하는 석영에 대한 설명입니다."
  },
  {
    id: "science-sample-9",
    subject: "science",
    stem: "그림은 구리와 산소가 반응하여 산화 구리(II)가 생성될 때의 질량 관계를 나타낸 것이다. 산화 구리(II) 40 g을 얻기 위해 필요한 구리와 산소의 최소 질량을 옳게 나타낸 것은?",
    image: "/images/mock/science-q9-graph.svg",
    choices: [
      "구리 : 8g 산소 : 32g",
      "구리 : 20g 산소 : 20g",
      "구리 : 24g 산소 : 16g",
      "구리 : 30g 산소 : 10g",
      "구리 : 32g 산소 : 8g"
    ],
    answer: "구리 : 32g 산소 : 8g",
    explanation: "그래프에서 구리 4 g당 산소 1 g이 결합하므로 구리와 산소의 질량비는 4 : 1이다. 따라서 구리 : 산소 : 산화 구리(II) = 4 : 1 : 5이다. 산화 구리(II) 40 g을 생성하려면 구리는 40 × (4/5) = 32 g, 산소는 40 × (1/5) = 8 g이 필요하다."
  },
  {
    id: "science-sample-10",
    subject: "science",
    stem: "그림은 온도와 압력이 일정할 때 수소 기체와 산소 기체가 반응하여 수증기가 생성되는 반응의 부피 관계를 나타낸 모형이다. 이 반응에 대한 설명으로 옳지 않은 것은?",
    image: "/images/mock/science-q10-molecules.svg",
    choices: [
      "반응하는 수소와 산소의 부피비는 2 : 1이다.",
      "수소 10 mL와 산소 10 mL를 반응시키면 산소가 5 mL 남는다.",
      "수소 40 mL가 모두 반응하면 수증기 40 mL가 생성된다.",
      "같은 부피 속에 들어 있는 분자 수의 비는 수소 : 산소 = 2 : 1이다.",
      "이 반응을 화학 반응식으로 나타내면 $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}$이다."
    ],
    answer: "같은 부피 속에 들어 있는 분자 수의 비는 수소 : 산소 = 2 : 1이다.",
    explanation: "아보가드로 법칙에 의해 온도와 압력이 같으면 기체의 종류에 관계없이 같은 부피 속에는 같은 수의 분자가 들어 있습니다. 분자 수의 비가 2 : 1인 것이 아니라, 분자 수가 같기 때문에 부피가 2 : 1인 곳에 들어 있는 분자 수의 비가 2 : 1이 되는 것입니다. 수증기 생성 반응의 부피비는 2 : 1 : 2이며 이는 계수비와 같습니다. 수소와 산소가 2 : 1로 반응하므로 수소 10 mL는 산소 5 mL와만 반응하고 산소 5 mL가 남습니다. 수소와 수증기의 부피비가 2 : 2(= 1 : 1)이므로 수소 40 mL 반응 시 수증기 40 mL가 생성됩니다."
  }
];
