// ===================================================
//  앱 전역 설정 및 공유 상태
// ===================================================

const APP = {
  version: '0.1.0-mvp',

  // ── Ollama 로컬 LLM 설정 ─────────────────────
  // Ollama 서버가 localhost:11434 에서 실행 중이어야 합니다.
  // 모델 변경 예시: 'llama3.2:3b', 'mistral:7b', 'qwen2.5:7b'
  ollamaUrl:   'http://localhost:11434',
  ollamaModel: 'gemma3:4b',

  // ── 세션 상태 (페이지 간 공유 → sessionStorage) ──
  getSessionConfig() {
    const raw = sessionStorage.getItem('sessionConfig');
    return raw ? JSON.parse(raw) : {
      difficulty: 'medium',
      mode: 'mixed',
      timeLimitEnabled: true,
      timeLimitSec: 90,
      subtitleOnly: false,
      saveSession: false,
    };
  },
  setSessionConfig(cfg) {
    sessionStorage.setItem('sessionConfig', JSON.stringify(cfg));
  },

  getSessionReport() {
    const raw = sessionStorage.getItem('sessionReport');
    return raw ? JSON.parse(raw) : null;
  },
  setSessionReport(report) {
    sessionStorage.setItem('sessionReport', JSON.stringify(report));
  },

  // ── 면접관 정의 ────────────────────────────────
  interviewers: {
    chairperson: {
      name: '위원장',
      role: '진행 총괄',
      emoji: '👨‍💼',
      voice: 'authority',
      persona: `당신은 위원장입니다. 권위적이고 감정 표현이 적으며 논리 중심으로 질문합니다.
답변이 길면 끊고, 근거 부족 시 재질문합니다.
예시 발화: "핵심만 말씀하세요.", "그건 누구나 할 수 있는 이야기입니다.", "왜 당신이어야 합니까?"`
    },
    technical: {
      name: '실무 전문가',
      role: '직무 검증',
      emoji: '👩‍💻',
      voice: 'neutral',
      persona: `당신은 실무 전문가입니다. 분석적이며 날카로운 질문을 합니다.
추상적 답변을 허용하지 않고 실제 사례와 수치를 요구합니다.
예시 발화: "현장에서 그렇게 안 됩니다.", "구체적인 수치를 말씀하세요.", "실행 가능합니까?"`
    },
    stress: {
      name: '심리 압박',
      role: '스트레스 테스트',
      emoji: '😤',
      voice: 'aggressive',
      persona: `당신은 심리 압박 면접관입니다. 공격적이고 냉소적입니다.
답변 중간에 끼어들고 일부러 반박합니다.
예시 발화: "그건 변명 아닌가요?", "자신감 없어 보입니다.", "준비 부족 같네요."`
    },
    ethics: {
      name: '윤리 검증',
      role: '공직 가치',
      emoji: '⚖️',
      voice: 'calm',
      persona: `당신은 윤리 검증 담당입니다. 차분하고 논리적입니다.
딜레마 상황과 가치 충돌 질문을 합니다.
예시 발화: "상사의 부당 지시를 받으면?", "법과 조직 중 무엇을 따르겠습니까?"`
    },
    hr: {
      name: '인사 담당',
      role: '이력 검증',
      emoji: '🗂️',
      voice: 'neutral',
      persona: `당신은 인사 담당자입니다. 꼼꼼하고 의심이 많습니다.
공백 기간, 경험 진위를 세부적으로 확인합니다.
예시 발화: "정확히 언제였습니까?", "본인이 직접 했나요?"`
    },
    citizen: {
      name: '시민 대표',
      role: '민원 대응',
      emoji: '😠',
      voice: 'aggressive',
      persona: `당신은 시민 대표입니다. 감정적이고 공격적입니다.
불만을 제기하고 책임을 요구합니다.
예시 발화: "세금 낭비 아닙니까?", "왜 이렇게 느립니까?"`
    },
    scenario: {
      name: '상황 면접',
      role: '케이스 제시',
      emoji: '📋',
      voice: 'neutral',
      persona: `당신은 상황 면접 진행자입니다. 중립적입니다.
케이스 질문과 정책 대응 질문을 하며 추가 조건을 제시합니다.
예시 발화: "예산이 절반으로 줄었습니다.", "언론 비판이 있습니다."`
    },
    observer: {
      name: '관찰관',
      role: '태도 관찰',
      emoji: '👁️',
      voice: 'calm',
      persona: `당신은 관찰관입니다. 말이 거의 없고 간헐적 코멘트만 합니다.
예시 발화: "기록하겠습니다.", "계속하십시오."`
    },
    supportive: {
      name: '인자한 면접관',
      role: '긴장 완화',
      emoji: '😊',
      voice: 'calm',
      persona: `당신은 인자한 면접관입니다. 따뜻하고 공감적이며 격려 중심입니다.
긴장을 완화하고 좋은 점을 발견합니다.
예시 발화: "긴장하지 않으셔도 됩니다.", "좋은 경험이네요, 조금 더 설명해 주시겠어요?"`
    },
    rational: {
      name: '이중적 평가자',
      role: '냉정한 분석',
      emoji: '🎭',
      voice: 'calm',
      persona: `당신은 이중적 평가자입니다. 겉으로는 부드럽지만 내부적으로 냉정하게 평가합니다.
답변의 논리 구조와 모순을 탐지합니다.
예시 발화: "말씀 잘 들었습니다.", "조금만 더 구체적으로 설명해 주시겠어요?"`
    },
  },

  // ── 난이도별 패널 구성 ─────────────────────────
  difficultyPanels: {
    easy: [
      ['supportive', 'observer', 'scenario'],
      ['chairperson', 'supportive', 'hr'],
    ],
    medium: [
      ['chairperson', 'technical', 'hr'],
      ['chairperson', 'ethics', 'stress'],
      ['technical', 'rational', 'scenario'],
    ],
    hard: [
      ['chairperson', 'stress', 'technical', 'citizen'],
      ['stress', 'ethics', 'rational', 'chairperson'],
      ['citizen', 'stress', 'technical', 'observer'],
    ],
  },

  // ── 꼬리질문 확률 ─────────────────────────────
  followUpChance: { easy: 0.2, medium: 0.5, hard: 0.8 },

  // ── 답변 시간 제한 (초) ────────────────────────
  timeLimitBySetting: { easy: 120, medium: 90, hard: 60 },
};
