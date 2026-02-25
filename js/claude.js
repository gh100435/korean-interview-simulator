// ===================================================
//  Claude API 연동 — 면접관 에이전트 응답 생성
// ===================================================

class ClaudeAgent {
  constructor() {
    this.history = []; // 세션 내 대화 히스토리
  }

  reset() { this.history = []; }

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
    const apiKey = APP.claudeApiKey;
    if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.');

    if (userAnswer) {
      this.history.push({ role: 'user', content: userAnswer });
    }

    const systemPrompt = this.buildSystemPrompt(panel, speaker, difficulty, mode);

    // 히스토리가 비어있으면 더미 메시지 추가
    const messages = this.history.length > 0
      ? this.history
      : [{ role: 'user', content: '면접을 시작해주세요.' }];

    const body = {
      model: APP.claudeModel,
      max_tokens: 512,
      system: systemPrompt,
      messages,
    };

    const res = await fetch(APP.claudeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude API 오류 (${res.status}): ${err}`);
    }

    const data = await res.json();
    const raw = data.content?.[0]?.text || '{}';

    // JSON 파싱
    let parsed;
    try {
      // 마크다운 코드블록 제거 후 파싱
      const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // 파싱 실패 시 raw text를 speech로 처리
      parsed = { speech: raw, expression: 'neutral', action: 'none' };
    }

    // 어시스턴트 응답을 히스토리에 추가
    this.history.push({ role: 'assistant', content: parsed.speech || raw });

    return parsed;
  }

  // ── 종합 피드백 생성 ──────────────────────────
  async generateFeedback(report) {
    const apiKey = APP.claudeApiKey;
    if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.');

    const diffKo = { easy: '하(쉬움)', medium: '중(보통)', hard: '상(어려움)' }[report.difficulty] || '중';
    const answersSummary = (report.answers || []).map((a, i) =>
      `[${i + 1}] Q: ${a.questionText}\n    A: ${a.answerText || '(답변 없음)'}\n    반복어: ${a.fillerCount}회, 답변시간: ${a.duration?.toFixed(1)}초`
    ).join('\n\n');

    const prompt = `다음 면접 세션 기록을 분석하여 한국어로 상세한 피드백 리포트를 작성하세요.
난이도: ${diffKo}, 총 답변 수: ${report.answers?.length || 0}

${answersSummary}

반드시 아래 JSON 형식으로만 반환하세요 (다른 텍스트 없이):
{"overallFeedback":"종합 의견 (2~3문장)","strengths":["강점1","강점2","강점3"],"improvements":["개선점1","개선점2","개선점3"],"contentScore":0.75,"logicScore":0.65,"clarityScore":0.70,"pressureScore":0.60}`;

    const res = await fetch(APP.claudeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: APP.claudeModel,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        system: '당신은 공무원/공기업 면접 전문 코치입니다. 객관적이고 건설적인 피드백을 제공하세요.',
      }),
    });

    if (!res.ok) throw new Error(`피드백 생성 실패 (${res.status})`);

    const data = await res.json();
    const raw = data.content?.[0]?.text || '{}';
    try {
      const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { overallFeedback: raw, strengths: [], improvements: [], contentScore: 0, logicScore: 0, clarityScore: 0, pressureScore: 0 };
    }
  }
}

// 전역 싱글톤
const claudeAgent = new ClaudeAgent();
