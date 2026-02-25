// ===================================================
//  공통 유틸리티
// ===================================================

// ── 토스트 알림 ──────────────────────────────────
function showToast(msg, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ── 타이핑 효과 텍스트 ───────────────────────────
function typeText(el, text, speed = 30) {
  return new Promise(resolve => {
    el.textContent = '';
    el.classList.add('typing-cursor');
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) {
        clearInterval(timer);
        el.classList.remove('typing-cursor');
        resolve();
      }
    }, speed);
  });
}

// ── 타이머 링 업데이트 ───────────────────────────
function updateTimerRing(ringEl, remaining, total) {
  if (!ringEl) return;
  const fill = ringEl.querySelector('.fill');
  const textEl = ringEl.querySelector('.timer-text');
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.max(0, remaining / total);
  if (fill) {
    fill.style.strokeDasharray = circumference;
    fill.style.strokeDashoffset = circumference * (1 - ratio);
  }
  if (textEl) textEl.textContent = Math.ceil(remaining) + 's';
  ringEl.className = 'timer-ring' + (ratio < 0.2 ? ' danger' : ratio < 0.4 ? ' warn' : '');
}

// ── 점수 색상 ─────────────────────────────────────
function scoreColor(score) {
  if (score >= 0.75) return 'var(--success)';
  if (score >= 0.5)  return 'var(--warn)';
  return 'var(--danger)';
}

// ── 초 → mm:ss ────────────────────────────────────
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── 마이크 레벨 애니메이션 ───────────────────────
function animateMicBars(containerEl, level) {
  const bars = containerEl?.querySelectorAll('.mic-bar');
  if (!bars) return;
  bars.forEach((bar, i) => {
    const h = Math.max(4, Math.min(28, level * 28 + Math.random() * 6 * level));
    bar.style.height = h + 'px';
    bar.classList.toggle('active', level > 0.05);
  });
}

// ── API 키 확인 다이얼로그 ─────────────────────────
function ensureApiKey() {
  const stored = localStorage.getItem('ANTHROPIC_API_KEY');
  if (stored) { APP.claudeApiKey = stored; return true; }
  return false;
}

function promptApiKey() {
  const key = prompt(
    '🔑 Anthropic API 키를 입력하세요.\n(sk-ant-... 형식)\n\n이 키는 브라우저 로컬스토리지에만 저장됩니다.',
    ''
  );
  if (key?.startsWith('sk-ant-')) {
    localStorage.setItem('ANTHROPIC_API_KEY', key);
    APP.claudeApiKey = key;
    return true;
  }
  if (key) showToast('올바른 API 키 형식이 아닙니다. (sk-ant-...)', 'danger');
  return false;
}

// ── 섹션 이동 ─────────────────────────────────────
function goTo(page) {
  window.location.href = page;
}

// ── 클립보드 복사 ─────────────────────────────────
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('클립보드에 복사되었습니다.', 'success');
  } catch {
    showToast('복사 실패', 'danger');
  }
}

// ── 파일 다운로드 ─────────────────────────────────
function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
