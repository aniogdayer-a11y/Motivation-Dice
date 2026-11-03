(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const languages = ['taglish', 'english', 'tagalog'];
  const quote = byId('motivation');
  const card = byId('motivation-card');
  const back = byId('change-mood');
  const reload = byId('reload');
  const theme = byId('theme-toggle');
  const reasonInput = byId('reason-input');
  const reasonForm = byId('reason-form');
  const reasonSubmit = byId('reason-submit');
  const reasonQuestion = byId('reason-question');
  const loading = byId('ai-loading');
  const errorPanel = byId('ai-error');
  const errorMessage = byId('ai-error-message');
  const categories = [...document.querySelectorAll('[data-category]')];
  const moods = [...document.querySelectorAll('[data-mood]')];
  const reasons = [...document.querySelectorAll('[data-reason]')];
  const copy = window.REASON_COPY.english;
  let activeCategory = 'taglish';
  let activeMood = null;
  let activeReason = null;
  let view = 'moods';
  let bundle = null;
  let savedMode = false;
  let controller = null;
  let requestVersion = 0;
  const decks = new Map();

  try {
    const saved = localStorage.getItem('dayer-category');
    if (languages.includes(saved)) activeCategory = saved;
  } catch {}

  function render() {
    byId('mood-options').hidden = view !== 'moods';
    back.hidden = view === 'moods';
    reasonForm.hidden = view !== 'reason';
    loading.hidden = view !== 'loading';
    errorPanel.hidden = view !== 'error';
    card.hidden = view !== 'response';
    reload.hidden = view !== 'response';
    byId('motivation-languages').hidden = view !== 'response';
    byId('answer-summary').hidden = ['moods', 'reason'].includes(view);
    byId('try-ai').hidden = view !== 'response' || !savedMode;
    card.setAttribute('aria-busy', String(view === 'loading'));
    back.setAttribute('aria-label', view === 'reason' ? 'Back to moods' : 'Back to your answer');
    back.title = back.getAttribute('aria-label');
    categories.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === activeCategory)));
    moods.forEach(button => {
      button.querySelector('.mood-label').textContent = window.MOOD_LABELS[button.dataset.mood];
      button.setAttribute('aria-pressed', String(button.dataset.mood === activeMood));
    });
    reasons.forEach(button => {
      button.textContent = copy.labels[button.dataset.reason];
      button.setAttribute('aria-pressed', String(button.dataset.reason === activeReason));
    });
    reasonQuestion.textContent = copy.question;
    byId('reason-hint').textContent = copy.hint;
    byId('reason-label').textContent = copy.label;
    reasonInput.placeholder = copy.placeholder;
    reasonSubmit.textContent = copy.submit;
    byId('reason-skip').textContent = copy.skip;
    byId('edit-reason').textContent = (activeReason ? copy.labels[activeReason] + ' · ' : '') + copy.edit;
    reasonSubmit.disabled = !activeReason && !reasonInput.value.trim();
    const note = reasonInput.value.trim().slice(0, 300);
    byId('shared-reason').textContent = note ? copy.shared + ': “' + note + '”' : '';
    byId('shared-reason').hidden = !note;
    if (view === 'response' && bundle) {
      quote.lang = activeCategory === 'english' ? 'en' : 'fil';
      quote.textContent = bundle[activeCategory];
      byId('response-source').textContent = savedMode ? 'Saved message' : 'AI-generated · All 3 languages ready';
    } else {
      quote.textContent = '';
    }
  }

  function cancelRequest() {
    requestVersion++;
    controller?.abort();
    controller = null;
  }

  async function prepareAI() {
    if (!activeMood || view === 'loading') return;
    cancelRequest();
    const version = requestVersion;
    const previous = savedMode ? '' : bundle?.english || '';
    controller = new AbortController();
    const signal = controller.signal;
    savedMode = false;
    view = 'loading';
    render();
    loading.focus({ preventScroll: true });
    try {
      const response = await fetch('/api/motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: activeMood, reason: activeReason, note: reasonInput.value.trim().slice(0, 300), previous }),
        signal
      });
      const data = await response.json();
      if (version !== requestVersion || signal.aborted) return;
      if (!response.ok) {
        const message = typeof data?.error?.message === 'string' ? data.error.message : 'The message could not be prepared. Please try again.';
        throw new Error(message);
      }
      if (data.source !== 'ai' || !data.messages || languages.some(language => typeof data.messages[language] !== 'string'
        || data.messages[language].trim().length < 30 || data.messages[language].length > 2000)) {
        throw new Error('All three language versions were not ready. Please try again.');
      }
      bundle = Object.fromEntries(languages.map(language => [language, data.messages[language].trim()]));
      view = 'response';
      render();
      card.focus({ preventScroll: true });
    } catch (error) {
      if (version !== requestVersion || signal.aborted) return;
      errorMessage.textContent = error instanceof TypeError || error instanceof SyntaxError
        ? 'The local server could not be reached. Make sure it is running, then try again.'
        : error.message;
      view = 'error';
      render();
      byId('ai-retry').focus({ preventScroll: true });
    } finally {
      if (version === requestVersion) controller = null;
    }
  }

  function prepareSaved() {
    if (!activeMood) return;
    cancelRequest();
    const pools = Object.fromEntries(languages.map(language => [language,
      window.PERSONALIZATION.build(language, activeMood, activeReason).responses]));
    const key = 'dayer-saved-bundle-v1:' + activeMood + ':' + (activeReason || 'general');
    const signature = languages.map(language => pools[language].join('\n')).join('\n---\n');
    const count = Math.min(...languages.map(language => pools[language].length));
    let deck = decks.get(key);
    if (!deck) {
      deck = { signature, remaining: [], last: -1 };
      try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (saved?.signature === signature && Number.isInteger(saved.last) && saved.last >= 0 && saved.last < count
          && Array.isArray(saved.remaining) && saved.remaining.every(i => Number.isInteger(i) && i >= 0 && i < count && i !== saved.last)
          && new Set(saved.remaining).size === saved.remaining.length) deck = saved;
      } catch {}
      decks.set(key, deck);
    }
    if (!deck.remaining.length) {
      deck.remaining = Array.from({ length: count }, (_, index) => index);
      for (let i = count - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck.remaining[i], deck.remaining[j]] = [deck.remaining[j], deck.remaining[i]];
      }
      if (count > 1 && deck.remaining.at(-1) === deck.last) {
        [deck.remaining[0], deck.remaining[count - 1]] = [deck.remaining[count - 1], deck.remaining[0]];
      }
    }
    deck.last = deck.remaining.pop();
    try { localStorage.setItem(key, JSON.stringify(deck)); } catch {}
    bundle = Object.fromEntries(languages.map(language => [language, pools[language][deck.last]]));
    savedMode = true;
    view = 'response';
    render();
    card.focus({ preventScroll: true });
  }

  function returnToReason() {
    cancelRequest();
    bundle = null;
    savedMode = false;
    view = 'reason';
    render();
    reasonQuestion.focus({ preventScroll: true });
  }

  moods.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.mood;
    if (!Object.hasOwn(window.MOOD_LABELS, next) || view !== 'moods') return;
    activeMood = next;
    activeReason = null;
    reasonInput.value = '';
    returnToReason();
  }));
  reasons.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.reason;
    if (view !== 'reason' || !Object.hasOwn(copy.labels, next)) return;
    activeReason = activeReason === next ? null : next;
    render();
  }));
  reasonInput.addEventListener('input', () => {
    reasonSubmit.disabled = !activeReason && !reasonInput.value.trim();
  });
  reasonForm.addEventListener('submit', event => {
    event.preventDefault();
    if (view !== 'reason' || (!activeReason && !reasonInput.value.trim())) return;
    void prepareAI();
  });
  byId('reason-skip').addEventListener('click', () => {
    if (view !== 'reason') return;
    activeReason = null;
    reasonInput.value = '';
    void prepareAI();
  });
  back.addEventListener('click', () => {
    if (view === 'moods') return;
    if (view !== 'reason') { returnToReason(); return; }
    const previous = activeMood;
    cancelRequest();
    activeMood = null;
    activeReason = null;
    reasonInput.value = '';
    bundle = null;
    view = 'moods';
    render();
    moods.find(button => button.dataset.mood === previous)?.focus({ preventScroll: true });
  });
  byId('edit-reason').addEventListener('click', () => { if (activeMood) returnToReason(); });
  byId('ai-retry').addEventListener('click', () => { if (view === 'error') void prepareAI(); });
  byId('use-saved').addEventListener('click', () => { if (view === 'error') prepareSaved(); });
  byId('try-ai').addEventListener('click', () => { if (view === 'response' && savedMode) void prepareAI(); });
  reload.addEventListener('click', () => {
    if (view !== 'response') return;
    if (savedMode) prepareSaved(); else void prepareAI();
  });
  categories.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.category;
    if (view !== 'response' || !languages.includes(next) || next === activeCategory) return;
    activeCategory = next;
    try { localStorage.setItem('dayer-category', next); } catch {}
    render(); // All three versions already exist; switching never sends a request.
  }));
  function syncTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    theme.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    theme.setAttribute('aria-pressed', String(dark));
    theme.title = theme.getAttribute('aria-label');
    theme.textContent = dark ? 'Light mode' : 'Dark mode';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#171c19' : '#f5f4ef';
  }
  theme.addEventListener('click', () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('dayer-theme', document.documentElement.dataset.theme); } catch {}
    syncTheme();
  });
  window.addEventListener('pagehide', cancelRequest);
  render();
  syncTheme();
})();
