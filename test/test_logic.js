// ===================================================
//  Node.js 단위 테스트 (브라우저 API 없이 실행)
//  eval 대신 Function scope를 이용해 전역 주입
// ===================================================

const fs   = require('fs');
const path = require('path');

// ── 브라우저 전역 Mock 설정 ─────────────────────────
const mockGlobal = {
  window: {
    speechSynthesis: null,
    SpeechRecognition: undefined,
    webkitSpeechRecognition: undefined,
  },
  navigator: {},
  localStorage: (() => {
    const store = {};
    return {
      getItem:    (k) => store[k] ?? null,
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  })(),
  sessionStorage: (() => {
    const store = {};
    return {
      getItem:    (k) => store[k] ?? null,
      setItem:    (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  })(),
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  Math, JSON, Date, Array, Object, String, Number, Boolean,
  Promise, Error,
};

// 전역에 mock 주입 (Node global) — undefined 제외
for (const [k, v] of Object.entries(mockGlobal)) {
  try { global[k] = v; } catch {}
}

// ── JS 파일을 global 스코프에 로드하는 헬퍼 ──────────
const BASE = path.resolve(__dirname, '../js');
function loadJs(filename) {
  const code = fs.readFileSync(path.join(BASE, filename), 'utf8');
  const fn = new Function(...Object.keys(mockGlobal), code);
  // 모든 선언이 global에 올라가도록 indirect eval 사용
  // → 실제로는 global object에 수동 할당 방식으로 처리
  try {
    // Node global에서 직접 실행 (global scope trick)
    const wrappedCode = `(function() { ${code} })()`;
    // eslint-disable-next-line no-new-func
    new Function(wrappedCode)();
  } catch {}
  // global에 선언된 변수 확인이 어려우므로 직접 require-like 방식 사용
}

// ── 더 단순한 방식: vm 모듈 사용 ──────────────────────
const vm = require('vm');

const ctx = { ...mockGlobal };
vm.createContext(ctx);

function runInCtx(filename) {
  const code = fs.readFileSync(path.join(BASE, filename), 'utf8');
  vm.runInContext(code, ctx);
}

runInCtx('config.js');
runInCtx('questions.js');
runInCtx('speech.js');
runInCtx('utils.js');

// ctx에서 참조 (vm context에서는 const로 선언된 변수가 ctx 프로퍼티로 노출되지 않으므로
// 파일 내부에서 명시적으로 ctx에 할당하도록 래핑)
const BASE2 = path.resolve(__dirname, '../js');
function runInCtxWrapped(filename) {
  const code = fs.readFileSync(path.join(BASE2, filename), 'utf8');
  // const/let 선언을 ctx 프로퍼티로 노출되도록 var로 래핑
  const wrapped = `(function() {
    ${code}
    // 주요 전역 변수 ctx에 노출
    if (typeof APP !== 'undefined')          { __ctx__.APP = APP; }
    if (typeof QUESTIONS !== 'undefined')    { __ctx__.QUESTIONS = QUESTIONS; }
    if (typeof getQuestions !== 'undefined') { __ctx__.getQuestions = getQuestions; }
    if (typeof countFillerWords !== 'undefined') { __ctx__.countFillerWords = countFillerWords; }
    if (typeof analyzeAnswerStructure !== 'undefined') { __ctx__.analyzeAnswerStructure = analyzeAnswerStructure; }
    if (typeof FILLER_WORDS !== 'undefined') { __ctx__.FILLER_WORDS = FILLER_WORDS; }
    if (typeof formatTime !== 'undefined')   { __ctx__.formatTime = formatTime; }
    if (typeof scoreColor !== 'undefined')   { __ctx__.scoreColor = scoreColor; }
    if (typeof SpeechService !== 'undefined') { __ctx__.SpeechService = SpeechService; }
    if (typeof speechService !== 'undefined') { __ctx__.speechService = speechService; }
  })();`;
  ctx.__ctx__ = ctx;
  vm.runInContext(wrapped, ctx);
}

runInCtxWrapped('config.js');
runInCtxWrapped('questions.js');
runInCtxWrapped('speech.js');
runInCtxWrapped('utils.js');

const APP          = ctx.APP;
const QUESTIONS    = ctx.QUESTIONS;
const getQuestions = ctx.getQuestions;
const countFillerWords       = ctx.countFillerWords;
const analyzeAnswerStructure = ctx.analyzeAnswerStructure;
const formatTime   = ctx.formatTime;
const scoreColor   = ctx.scoreColor;
const SpeechService = ctx.SpeechService;

// ===================================================
//  테스트 러너
// ===================================================
let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}: ${e.message}`); failed++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b) {
  if (a !== b) throw new Error(`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ===================================================
console.log('\n[1] APP Config 테스트');

test('APP 객체 존재', () => assert(APP, 'APP 없음'));

test('APP.interviewers - 10종 모두 존재', () => {
  const keys = Object.keys(APP.interviewers);
  assertEqual(keys.length, 10);
});

test('면접관 각각 name, role, emoji, voice, persona 보유', () => {
  Object.entries(APP.interviewers).forEach(([id, iw]) => {
    assert(iw.name,    `${id}: name 없음`);
    assert(iw.role,    `${id}: role 없음`);
    assert(iw.emoji,   `${id}: emoji 없음`);
    assert(iw.voice,   `${id}: voice 없음`);
    assert(iw.persona, `${id}: persona 없음`);
  });
});

test('APP.difficultyPanels - easy/medium/hard 존재', () => {
  assert(APP.difficultyPanels.easy,   'easy 없음');
  assert(APP.difficultyPanels.medium, 'medium 없음');
  assert(APP.difficultyPanels.hard,   'hard 없음');
});

test('APP.difficultyPanels.hard - stress 또는 citizen 포함', () => {
  const allHard = APP.difficultyPanels.hard.flat();
  assert(allHard.includes('stress') || allHard.includes('citizen'));
});

test('APP.followUpChance 값 범위 0~1', () => {
  Object.values(APP.followUpChance).forEach(v =>
    assert(v >= 0 && v <= 1, `followUpChance 범위 초과: ${v}`)
  );
});

test('APP.getSessionConfig / setSessionConfig 왕복', () => {
  const cfg = { difficulty: 'hard', mode: 'mixed', timeLimitEnabled: true, timeLimitSec: 60 };
  APP.setSessionConfig(cfg);
  const loaded = APP.getSessionConfig();
  assertEqual(loaded.difficulty, 'hard');
  assertEqual(loaded.timeLimitSec, 60);
});

test('APP.getSessionReport / setSessionReport 왕복', () => {
  const rep = { sessionId: 'abc', contentScore: 0.8 };
  APP.setSessionReport(rep);
  const loaded = APP.getSessionReport();
  assertEqual(loaded.sessionId, 'abc');
  assertEqual(loaded.contentScore, 0.8);
});

// ===================================================
console.log('\n[2] 질문 데이터셋 테스트');

test('QUESTIONS 배열이 15개', () => {
  assertEqual(QUESTIONS.length, 15);
});

test('각 질문에 id, text, preferred 필드 존재', () => {
  QUESTIONS.forEach(q => {
    assert(q.id,        `id 없음`);
    assert(q.text,      `text 없음: ${q.id}`);
    assert(q.preferred, `preferred 없음: ${q.id}`);
  });
});

test('getQuestions(easy) - minDifficulty=0 질문만 반환', () => {
  const qs = getQuestions('easy', 20);
  qs.forEach(q => assert(q.minDifficulty === 0, `easy 필터 실패: ${q.id}`));
});

test('getQuestions(medium) - minDifficulty<=1 질문만 반환', () => {
  const qs = getQuestions('medium', 20);
  qs.forEach(q => assert(q.minDifficulty <= 1, `medium 필터 실패: ${q.id}`));
});

test('getQuestions(hard) - 모든 난이도 질문 반환', () => {
  const qs = getQuestions('hard', 20);
  assert(qs.length === 15, `hard는 15개여야 함. 실제: ${qs.length}`);
});

test('getQuestions maxCount 제한', () => {
  const qs = getQuestions('hard', 5);
  assert(qs.length <= 5, `maxCount 초과: ${qs.length}`);
});

test('getQuestions - preferred 면접관이 APP.interviewers에 존재', () => {
  const validIds = new Set(Object.keys(APP.interviewers));
  QUESTIONS.forEach(q =>
    assert(validIds.has(q.preferred), `알 수 없는 preferred: ${q.preferred} (${q.id})`)
  );
});

// ===================================================
console.log('\n[3] 반복어/구조 분석 테스트');

test('countFillerWords - 반복어 포함 텍스트', () => {
  const cnt = countFillerWords('음 그 저는 약간 준비했습니다 어 네');
  assert(cnt >= 4, `반복어 ${cnt}개 (예상 >=4)`);
});

test('countFillerWords - 반복어 없는 텍스트', () => {
  const cnt = countFillerWords('저는 5년간 행정 업무를 담당했습니다.');
  assertEqual(cnt, 0);
});

test('countFillerWords - 빈/null 처리', () => {
  assertEqual(countFillerWords(''), 0);
  assertEqual(countFillerWords(null), 0);
  assertEqual(countFillerWords(undefined), 0);
});

test('analyzeAnswerStructure - 두괄식 (첫 문장 길이)', () => {
  const r = analyzeAnswerStructure('저의 강점은 팀워크와 의사소통 능력입니다. 이를 바탕으로 업무를 수행했습니다.');
  assert(r.hasConclusion, '두괄식 미감지');
});

test('analyzeAnswerStructure - 근거 포함', () => {
  const r = analyzeAnswerStructure('왜냐하면 제가 경험한 사례가 있기 때문입니다.');
  assert(r.hasEvidence, '근거 미감지');
});

test('analyzeAnswerStructure - 예시 포함', () => {
  const r = analyzeAnswerStructure('예를 들어 당시 팀장님과 협의했습니다.');
  assert(r.hasExample, '예시 미감지');
});

test('analyzeAnswerStructure - 빈 텍스트 폴백', () => {
  const r = analyzeAnswerStructure('');
  assert(!r.hasConclusion && !r.hasEvidence && !r.hasExample);
});

// ===================================================
console.log('\n[4] 유틸리티 테스트');

test('formatTime(0) = "0:00"',   () => assertEqual(formatTime(0),    '0:00'));
test('formatTime(65) = "1:05"',  () => assertEqual(formatTime(65),   '1:05'));
test('formatTime(3600) = "60:00"', () => assertEqual(formatTime(3600), '60:00'));
test('formatTime(90) = "1:30"',  () => assertEqual(formatTime(90),   '1:30'));

test('scoreColor(1.0) = success', () => assert(scoreColor(1.0).includes('success')));
test('scoreColor(0.75) = success', () => assert(scoreColor(0.75).includes('success')));
test('scoreColor(0.6) = warn',    () => assert(scoreColor(0.6).includes('warn')));
test('scoreColor(0.3) = danger',  () => assert(scoreColor(0.3).includes('danger')));
test('scoreColor(0.0) = danger',  () => assert(scoreColor(0.0).includes('danger')));

// ===================================================
console.log('\n[5] 난이도별 패널 구성 테스트');

test('easy 패널에 stress/citizen 없음', () => {
  APP.difficultyPanels.easy.forEach(panel => {
    assert(!panel.includes('stress'),  'easy에 stress 포함됨');
    assert(!panel.includes('citizen'), 'easy에 citizen 포함됨');
  });
});

test('hard 패널에 stress 또는 citizen 반드시 존재', () => {
  const found = APP.difficultyPanels.hard.every(panel =>
    panel.includes('stress') || panel.includes('citizen')
  );
  assert(found, 'hard 패널 일부에 압박 면접관 없음');
});

test('각 패널에 유효한 면접관 id만 존재', () => {
  const validIds = new Set(Object.keys(APP.interviewers));
  ['easy', 'medium', 'hard'].forEach(diff => {
    APP.difficultyPanels[diff].forEach(panel => {
      panel.forEach(id =>
        assert(validIds.has(id), `알 수 없는 면접관 id: "${id}" in ${diff}`)
      );
    });
  });
});

test('timeLimitBySetting - hard < medium < easy', () => {
  const tl = APP.timeLimitBySetting;
  assert(tl.hard < tl.medium, 'hard 시간제한이 medium보다 길어선 안됨');
  assert(tl.medium < tl.easy, 'medium 시간제한이 easy보다 길어선 안됨');
});

// ===================================================
console.log('\n[6] SpeechService 테스트 (브라우저 API Mock)');

test('SpeechService 인스턴스 생성', () => {
  const s = new SpeechService();
  assert(s, 'SpeechService 생성 실패');
});

test('SpeechService.isAvailable = false (Node 환경)', () => {
  const s = new SpeechService();
  assert(!s.isAvailable, 'Node 환경에서 isAvailable이 true가 되어선 안됨');
});

test('SpeechService._rateByProfile 각 프로필 값', () => {
  const s = new SpeechService();
  assertEqual(s._rateByProfile('authority'),  0.90);
  assertEqual(s._rateByProfile('aggressive'), 1.05);
  assertEqual(s._rateByProfile('calm'),       0.85);
  assertEqual(s._rateByProfile('neutral'),    0.95);
});

test('SpeechService._pitchByProfile 각 프로필 값', () => {
  const s = new SpeechService();
  assertEqual(s._pitchByProfile('authority'),  0.85);
  assertEqual(s._pitchByProfile('aggressive'), 1.10);
  assertEqual(s._pitchByProfile('calm'),       0.90);
  assertEqual(s._pitchByProfile('neutral'),    1.00);
});

test('SpeechService.stopListening - 미시작 시 크래시 없음', () => {
  const s = new SpeechService();
  const result = s.stopListening();
  assertEqual(result, '');
});

// ===================================================
console.log('\n─────────────────────────────────────────');
const total = passed + failed;
console.log(`결과: ${passed} 통과 / ${failed} 실패 / 총 ${total}개`);

if (failed > 0) {
  console.error('\n일부 테스트 실패!');
  process.exit(1);
} else {
  console.log('\n모든 테스트 통과! ✓');
  process.exit(0);
}
