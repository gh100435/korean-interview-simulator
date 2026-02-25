// ===================================================
//  Web Speech API — STT + TTS
// ===================================================

class SpeechService {
  constructor() {
    // STT
    this.recognition  = null;
    this.isListening  = false;
    this.transcript   = '';
    this.onPartial    = null; // (text) => void
    this.onFinal      = null; // (text) => void
    this.onSilence    = null; // () => void  — 침묵 감지 후 자동 완료

    // TTS
    this.synth        = window.speechSynthesis;
    this.isSpeaking   = false;
    this.onSpeakStart = null;
    this.onSpeakEnd   = null;

    this._initSTT();
  }

  // ── STT 초기화 ────────────────────────────────
  _initSTT() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.warn('Web Speech API가 지원되지 않습니다.'); return; }

    this.recognition = new SR();
    this.recognition.lang = 'ko-KR';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (interim) this.onPartial?.(interim);
      if (final) {
        this.transcript += final;
        this.onFinal?.(this.transcript);
      }
    };

    this.recognition.onerror = (e) => {
      console.warn('STT 오류:', e.error);
      if (e.error === 'no-speech') this.onSilence?.();
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // 자동 재시작 (continuous가 끊기는 경우 대비)
        try { this.recognition.start(); } catch {}
      }
    };
  }

  startListening() {
    if (!this.recognition) return false;
    this.transcript = '';
    this.isListening = true;
    try { this.recognition.start(); } catch {}
    return true;
  }

  stopListening() {
    this.isListening = false;
    try { this.recognition?.stop(); } catch {}
    return this.transcript;
  }

  // ── TTS ───────────────────────────────────────
  speak(text, voiceProfile = 'neutral') {
    return new Promise((resolve) => {
      if (!this.synth || !text) { resolve(); return; }

      this.synth.cancel(); // 이전 발화 중단

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'ko-KR';
      utt.rate  = this._rateByProfile(voiceProfile);
      utt.pitch = this._pitchByProfile(voiceProfile);
      utt.volume = 1;

      // 한국어 음성 선택
      const voices = this.synth.getVoices();
      const koVoice = voices.find(v => v.lang.startsWith('ko')) || null;
      if (koVoice) utt.voice = koVoice;

      utt.onstart = () => { this.isSpeaking = true; this.onSpeakStart?.(); };
      utt.onend   = () => { this.isSpeaking = false; this.onSpeakEnd?.(); resolve(); };
      utt.onerror = () => { this.isSpeaking = false; resolve(); };

      this.synth.speak(utt);
    });
  }

  stopSpeaking() {
    this.synth?.cancel();
    this.isSpeaking = false;
  }

  _rateByProfile(profile) {
    return { authority: 0.90, aggressive: 1.05, calm: 0.85, neutral: 0.95 }[profile] ?? 0.95;
  }
  _pitchByProfile(profile) {
    return { authority: 0.85, aggressive: 1.1, calm: 0.9, neutral: 1.0 }[profile] ?? 1.0;
  }

  get isAvailable() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  get isTTSAvailable() {
    return !!window.speechSynthesis;
  }
}

// ── 반복어/발화 습관 분석 ───────────────────────
const FILLER_WORDS = ['음', '어', '그', '약간', '뭐랄까', '사실', '그냥', '좀', '이제'];

function countFillerWords(text) {
  if (!text) return 0;
  return FILLER_WORDS.reduce((cnt, w) => {
    const re = new RegExp(w, 'g');
    return cnt + (text.match(re) || []).length;
  }, 0);
}

function analyzeAnswerStructure(text) {
  if (!text) return { hasConclusion: false, hasEvidence: false, hasExample: false };
  const sentences = text.split(/[.!?。]/);
  return {
    hasConclusion: sentences.length > 0 && sentences[0].length > 8,
    hasEvidence:   /왜냐하면|이유는|근거|데이터|통계|사례|경험/.test(text),
    hasExample:    /예를 들면|예를 들어|예컨대|실제로|당시/.test(text),
  };
}

const speechService = new SpeechService();
