// ===================================================
//  질문 데이터셋
// ===================================================

const QUESTIONS = [
  {
    id: 'q001', text: '간단하게 자기소개를 해주세요.',
    category: 'SelfIntroduction', minDifficulty: 0,
    preferred: 'chairperson',
    followUps: ['방금 말씀하신 경험을 좀 더 구체적으로 설명해 주시겠어요?', '그 경험이 이 직무에 어떻게 도움이 될까요?']
  },
  {
    id: 'q002', text: '공무원(공기업)에 지원한 이유가 무엇입니까?',
    category: 'Motivation', minDifficulty: 0,
    preferred: 'chairperson',
    followUps: ['민간기업이 아닌 공직을 선택한 이유가 다른 이유도 있습니까?', '왜 당신이어야 합니까? 다른 지원자와 다른 점은?']
  },
  {
    id: 'q003', text: '본인의 강점과 약점을 솔직하게 말씀해 주세요.',
    category: 'SelfIntroduction', minDifficulty: 0,
    preferred: 'hr',
    followUps: ['약점을 극복하기 위해 구체적으로 어떤 노력을 했습니까?', '그 강점이 실제 업무에서 발휘된 사례를 말씀해 주세요.']
  },
  {
    id: 'q004', text: '최근 공공 분야에서 주목되는 정책 이슈 하나를 선택하고 개선 방안을 제시하세요.',
    category: 'PolicyValue', minDifficulty: 1,
    preferred: 'technical',
    followUps: ['그 방안의 예산 규모를 어떻게 추정하셨습니까?', '현장에서 반대 의견이 나온다면 어떻게 설득하겠습니까?']
  },
  {
    id: 'q005', text: '상사가 위법하거나 비윤리적인 지시를 한다면 어떻게 하겠습니까?',
    category: 'EthicsDilemma', minDifficulty: 1,
    preferred: 'ethics',
    followUps: ['내부 고발을 선택할 경우 조직 내 불이익을 감수할 수 있습니까?', '법과 조직의 이익이 충돌할 때 무엇을 우선시하겠습니까?']
  },
  {
    id: 'q006', text: '민원인이 과도한 요구를 하며 소리를 지른다면 어떻게 대응하겠습니까?',
    category: 'SituationalInterview', minDifficulty: 1,
    preferred: 'citizen',
    followUps: ['그 민원인이 SNS에 공무원 비위를 올린다고 협박하면?', '해결이 안 될 경우 민원인에게 어떻게 마무리하겠습니까?']
  },
  {
    id: 'q007', text: '이력서에 공백 기간이 있는데, 그 기간에 무엇을 했습니까?',
    category: 'ExperienceVerification', minDifficulty: 1,
    preferred: 'hr',
    followUps: ['정확히 몇 월부터 몇 월까지입니까?', '그 기간의 활동을 증빙할 수 있는 자료가 있습니까?']
  },
  {
    id: 'q008', text: '팀 내 갈등 상황을 경험한 적이 있습니까? 어떻게 해결했습니까?',
    category: 'SituationalInterview', minDifficulty: 0,
    preferred: 'supportive',
    followUps: ['상대방 입장에서는 어떻게 느꼈을 것 같습니까?', '같은 상황이 다시 발생하면 다르게 행동할 부분이 있습니까?']
  },
  {
    id: 'q009', text: '예산이 50% 삭감된 상황에서 기존 사업을 어떻게 유지하겠습니까?',
    category: 'SituationalInterview', minDifficulty: 2,
    preferred: 'scenario',
    followUps: ['이해관계자 반발을 최소화하려면 누구부터 설득하겠습니까?', '삭감이 불가피한 사업이 있다면 어떤 기준으로 선택하겠습니까?']
  },
  {
    id: 'q010', text: '당신의 답변은 이상적이지만 현실에서는 불가능합니다. 다시 답변해 보세요.',
    category: 'PressureVerification', minDifficulty: 2,
    preferred: 'stress',
    followUps: ['방금 전과 다른 말씀을 하시는 것 같은데, 어느 쪽이 본심입니까?', '근거 없이 주장만 하시는 것 아닙니까?']
  },
  {
    id: 'q011', text: '세금이 낭비되고 있다는 언론 보도가 나온 사업의 담당자로 배치된다면?',
    category: 'SituationalInterview', minDifficulty: 2,
    preferred: 'citizen',
    followUps: ['언론과의 소통은 어떻게 하겠습니까?', '사업 책임자로서 개인적 책임을 어디까지 지겠습니까?']
  },
  {
    id: 'q012', text: '직무 관련 법령이나 정책 중 최근에 공부한 것을 설명해 보세요.',
    category: 'JobUnderstanding', minDifficulty: 1,
    preferred: 'technical',
    followUps: ['그 정책의 문제점은 무엇이라고 생각합니까?', '실무에서 그 법령을 적용하면 어떤 어려움이 있을까요?']
  },
  {
    id: 'q013', text: '5년 후 본인이 어떤 공무원이 되고 싶은지 말씀해 주세요.',
    category: 'Motivation', minDifficulty: 0,
    preferred: 'rational',
    followUps: ['그 목표를 위해 현재 무엇을 하고 있습니까?', '원하는 포지션에 가지 못한다면 어떻게 하겠습니까?']
  },
  {
    id: 'q014', text: '공공서비스 디지털 전환에서 소외계층 문제를 어떻게 해결하겠습니까?',
    category: 'PolicyValue', minDifficulty: 2,
    preferred: 'technical',
    followUps: ['구체적인 예산 투입 방안은?', '민간 기업과 협력 시 데이터 보안은 어떻게 보장합니까?']
  },
  {
    id: 'q015', text: '본인이 옳다고 생각하는 의견을 상사가 반대할 때 어떻게 하겠습니까?',
    category: 'EthicsDilemma', minDifficulty: 1,
    preferred: 'ethics',
    followUps: ['끝까지 관철시키려 한다면 어떤 방법을 쓰겠습니까?', '결국 상사의 뜻대로 되었을 때 어떻게 받아들이겠습니까?']
  },
];

function getQuestions(difficulty, maxCount = 8) {
  const diffLevel = { easy: 0, medium: 1, hard: 2 }[difficulty] ?? 1;
  const filtered = QUESTIONS.filter(q => q.minDifficulty <= diffLevel);
  // 셔플
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }
  return filtered.slice(0, maxCount);
}
