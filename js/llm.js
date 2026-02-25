// ===================================================
//  LLM 연동 — Ollama 로컬 모델 기반 면접관 에이전트
//  (기존 claude.js 와 동일한 외부 인터페이스 유지)
// ===================================================

class LLMAgent {
  constructor() {
    this.history = []; // 세션 내 대화 히스토리
  }

  reset() { this.history = []; }

  // ── Ollama API 호출 공통 헬퍼 ─────────────────
  async _chat(systemPrompt, messages, maxTokens = 512) {
    const url = `${APP.ollamaUrl}/api/chat`;

    const body = {
      model: APP.ollamaModel,
      stream: false,
      options: {
        temperature: 0.8,
        num_predict: maxTokens,
      },
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama API 오류 (${res.status}): ${err}`);
    }

    const data = await res.json();
    // Ollama 네이티브 응답: data.message.content
    return data.message?.content || '';
  }

  // ── JSON 파싱 (마크다운 블록 제거 포함) ──────
  _parseJSON(raw, fallback) {
    try {
      const cleaned = raw
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      // JSON 블록만 추출 (앞뒤 텍스트 무시)
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return JSON.parse(cleaned);
    } catch {
      return fallback;
    }
  }

  // ── System Prompt 빌드 ────────────────────────
  buildSystemPrompt(panel, speaker, difficulty, mode) {
    const modeKo = { public_servant: '공무원', public_corp: '공기업', mixed: '혼합' }[mode] || '혼합';
    const diffKo = { easy: '하(쉬움)', medium: '중(보통)', hard: '상(어려움)' }[difficulty] || '중';

    const panelDesc = panel.map(id => {
      const iw = APP.interviewers[id];
      return iw ? `- ${iw.name} (${iw.role})` : '';
    }).join('\n');

    const speakerInfo = APP.interviewers[speaker];

    return `당신은 압박면접 시뮬레이터의 AI 면접관입니다.
면접 모드: ${modeKo}, 난이도: ${diffKo}

## 면접관 패널 구성
${panelDesc}

## 현재 발화 면접관: ${speakerInfo?.name || '면접관'} (${speakerInfo?.role || ''})
${speakerInfo?.persona || ''}

## 응답 규칙
- 반드시 한국어로 답변하세요.
- 질문 또는 반응은 1~3문장 이내로 간결하게 작성하세요.
- 반드시 아래 JSON 형식으로만 반환하세요 (다른 텍스트 없이):
{"speech":"발화 내용","expression":"neutral|smile|suspicious|pressure|nod|frown|bored|note","action":"none|interrupt|followup|conclude"}`;
  }

  // ── 면접관 질문/반응 생성 ─────────────────────
  async generateResponse({ userAnswer, panel, speaker, difficulty, mode }) {
    if (userAnswer) {
      this.history.push({ role: 'user', content: userAnswer });
    }

    const systemPrompt = this.buildSystemPrompt(panel, speaker, difficulty, mode);

    const messages = this.history.length > 0
      ? this.history
      : [{ role: 'user', content: '면접을 시작해주세요.' }];

    const raw = await this._chat(systemPrompt, messages, 512);

    const parsed = this._parseJSON(raw, {
      speech: raw || '다음 질문으로 넘어가겠습니다.',
      expression: 'neutral',
      action: 'none',
    });

    // 어시스턴트 응답을 히스토리에 추가
    this.history.push({ role: 'assistant', content: parsed.speech || raw });

    return parsed;
  }

  // ── 종합 피드백 생성 ──────────────────────────
  async generateFeedback(report) {
    const diffKo = { easy: '하(쉬움)', medium: '중(보통)', hard: '상(어려움)' }[report.difficulty] || '중';
    const answersSummary = (report.answers || []).map((a, i) =>
      `[${i + 1}] Q: ${a.questionText}\n    A: ${a.answerText || '(답변 없음)'}\n    반복어: ${a.fillerCount}회, 답변시간: ${a.duration?.toFixed(1)}초`
    ).join('\n\n');

    const prompt = `다음 면접 세션 기록을 분석하여 한국어로 상세한 피드백 리포트를 작성하세요.
난이도: ${diffKo}, 총 답변 수: ${report.answers?.length || 0}

${answersSummary}

반드시 아래 JSON 형식으로만 반환하세요 (다른 텍스트 없이):
{"overallFeedback":"종합 의견 (2~3문장)","strengths":["강점1","강점2","강점3"],"improvements":["개선점1","개선점2","개선점3"],"contentScore":0.75,"logicScore":0.65,"clarityScore":0.70,"pressureScore":0.60}`;

    const systemPrompt = '당신은 공무원/공기업 면접 전문 코치입니다. 객관적이고 건설적인 피드백을 제공하세요.';

    const raw = await this._chat(systemPrompt, [{ role: 'user', content: prompt }], 1024);

    return this._parseJSON(raw, {
      overallFeedback: raw || 'AI 피드백 생성에 실패했습니다.',
      strengths: [],
      improvements: [],
      contentScore: 0,
      logicScore: 0,
      clarityScore: 0,
      pressureScore: 0,
    });
  }
}

// 전역 싱글톤 (기존 코드와 호환: claudeAgent 이름 유지)
const claudeAgent = new LLMAgent();
