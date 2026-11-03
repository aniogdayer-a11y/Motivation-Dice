(() => {
  'use strict';
  const groups = window.MOTIVATIONS;
  const categoryNames = Object.keys(groups);
  const moodNames = Object.keys(groups.taglish);
  const storageKey = 'dayer-motivation-deck-v4:';
  const quote = document.getElementById('motivation');
  const stage = document.getElementById('quote-stage');
  const reload = document.getElementById('reload');
  const theme = document.getElementById('theme-toggle');
  const categories = [...document.querySelectorAll('[data-category]')];
  const languageOptions = document.getElementById('motivation-languages');
  const moods = [...document.querySelectorAll('[data-mood]')];
  const moodOptions = document.getElementById('mood-options');
  const changeMood = document.getElementById('change-mood');
  const card = document.getElementById('motivation-card');
  const reasonForm = document.getElementById('reason-form');
  const reasonInput = document.getElementById('reason-input');
  const reasonSubmit = document.getElementById('reason-submit');
  const reasonSkip = document.getElementById('reason-skip');
  const reasonQuestion = document.getElementById('reason-question');
  const answerSummary = document.getElementById('answer-summary');
  const sharedReason = document.getElementById('shared-reason');
  const editReason = document.getElementById('edit-reason');
  const reasons = [...document.querySelectorAll('[data-reason]')];
  let activeReason = null;
  let responseReady = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let activeCategory = 'taglish';
  // Ask again on each visit: yesterday's mood need not be today's mood.
  let activeMood = null;
  const decks = new Map();
  let rolling = false;
  let timers = [];

  try {
    const savedCategory = localStorage.getItem('dayer-category');
    if (categoryNames.includes(savedCategory)) activeCategory = savedCategory;
  } catch {}

  function getDeck(key, quotes) {
    if (decks.has(key)) return decks.get(key);
    const signature = quotes.join('\n');
    let deck = { signature, remaining: [], last: -1 };
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey + key));
      if (saved && saved.signature === signature && Array.isArray(saved.remaining)
        && Number.isInteger(saved.last) && saved.last >= 0 && saved.last < quotes.length
        && saved.remaining.every(i => Number.isInteger(i) && i >= 0 && i < quotes.length && i !== saved.last)
        && new Set(saved.remaining).size === saved.remaining.length) deck = saved;
    } catch { /* Storage is optional; rolling still works without it. */ }
    decks.set(key, deck);
    return deck;
  }

  function draw() {
    if (!activeMood || !responseReady) return;
    const personalized = window.PERSONALIZATION.build(activeCategory, activeMood, activeReason, reasonInput.value);
    const key = activeCategory + ':' + activeMood + ':' + (personalized.reason || 'general');
    const quotes = personalized.responses;
    const deck = getDeck(key, quotes);
    if (!deck.remaining.length) {
      deck.remaining = quotes.map((_, i) => i);
      for (let i = deck.remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck.remaining[i], deck.remaining[j]] = [deck.remaining[j], deck.remaining[i]];
      }
      // The first draw of a new cycle must differ from the previous cycle's last.
      const end = deck.remaining.length - 1;
      if (deck.remaining[end] === deck.last && end > 0) {
        [deck.remaining[0], deck.remaining[end]] = [deck.remaining[end], deck.remaining[0]];
      }
    }
    deck.last = deck.remaining.pop();
    quote.lang = activeCategory === 'english' ? 'en' : 'fil';
    quote.textContent = quotes[deck.last];
    try { localStorage.setItem(storageKey + key, JSON.stringify(deck)); } catch {}
  }

  function finishRoll() {
    timers.forEach(clearTimeout);
    timers = [];
    rolling = false;
    reload.removeAttribute('aria-disabled');
    reload.classList.remove('rolling');
    stage.classList.remove('changing');
  }

  function roll() {
    if (rolling || !activeMood || !responseReady) return;
    if (reducedMotion.matches) { draw(); return; }
    rolling = true;
    reload.setAttribute('aria-disabled', 'true');
    reload.classList.add('rolling');
    stage.classList.add('changing');
    timers.push(setTimeout(() => {
      draw();
      stage.classList.remove('changing');
    }, 180));
    timers.push(setTimeout(finishRoll, 420));
  }

  function syncCategory() {
    categories.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.category === activeCategory));
    });
  }

  function syncMood() {
    const labels = window.MOOD_LABELS;
    moods.forEach(button => {
      button.querySelector('.mood-label').textContent = labels[button.dataset.mood];
      button.setAttribute('aria-pressed', String(button.dataset.mood === activeMood));
    });
    moodOptions.hidden = Boolean(activeMood);
    changeMood.hidden = !activeMood;
    card.hidden = !activeMood || !responseReady;
    reload.hidden = card.hidden;
    languageOptions.hidden = card.hidden;
    reasonForm.hidden = !activeMood || responseReady;
    answerSummary.hidden = !activeMood || !responseReady;
    const copy = window.REASON_COPY.english;
    reasonQuestion.textContent = copy.question;
    document.getElementById('reason-hint').textContent = copy.hint;
    document.getElementById('reason-label').textContent = copy.label;
    reasonInput.placeholder = copy.placeholder;
    reasonSubmit.textContent = copy.submit;
    reasonSkip.textContent = copy.skip;
    const match = window.PERSONALIZATION.resolve(activeReason, reasonInput.value);
    editReason.textContent = (match.reason ? (match.inferred ? 'Possibly ' : '') + copy.labels[match.reason] + ' · ' : '') + copy.edit;
    reasons.forEach(button => {
      button.textContent = copy.labels[button.dataset.reason];
      button.setAttribute('aria-pressed', String(button.dataset.reason === activeReason));
    });
    reasonSubmit.disabled = !activeReason && !reasonInput.value.trim();
    const ownWords = reasonInput.value.trim().slice(0, 300);
    sharedReason.textContent = ownWords ? copy.shared + ': “' + ownWords + '”' : '';
    sharedReason.hidden = !ownWords;
    if (activeMood) {
      const backLabel = responseReady ? 'Back to your answer' : 'Back to moods';
      changeMood.setAttribute('aria-label', backLabel);
      changeMood.title = backLabel;
    }
  }

  function syncTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    theme.setAttribute('aria-label', label);
    theme.setAttribute('aria-pressed', String(dark));
    theme.title = label;
    theme.textContent = dark ? 'Light mode' : 'Dark mode';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#171c19' : '#f5f4ef';
  }

  theme.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('dayer-theme', next); } catch {}
    syncTheme();
  });
  categories.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.category;
    if (next === activeCategory || !categoryNames.includes(next)) return;
    finishRoll();
    activeCategory = next;
    try { localStorage.setItem('dayer-category', next); } catch {}
    syncCategory();
    syncMood();
    draw();
  }));
  moods.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.mood;
    if (!moodNames.includes(next) || next === activeMood) return;
    finishRoll();
    activeMood = next;
    activeReason = null;
    responseReady = false;
    reasonInput.value = '';
    quote.textContent = '';
    syncMood();
    reasonQuestion.focus({ preventScroll: true });
  }));
  changeMood.addEventListener('click', () => {
    if (activeMood && responseReady) {
      finishRoll();
      responseReady = false;
      quote.textContent = '';
      syncMood();
      reasonQuestion.focus({ preventScroll: true });
      return;
    }
    const previous = activeMood;
    finishRoll();
    activeMood = null;
    activeReason = null;
    responseReady = false;
    reasonInput.value = '';
    quote.textContent = '';
    syncMood();
    moods.find(button => button.dataset.mood === previous)?.focus({ preventScroll: true });
  });
  reasons.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.reason;
    if (!activeMood || responseReady || !Object.hasOwn(window.REASON_COPY.english.labels, next)) return;
    activeReason = activeReason === next ? null : next;
    syncMood();
  }));
  reasonInput.addEventListener('input', () => {
    reasonSubmit.disabled = !activeReason && !reasonInput.value.trim();
  });
  function showResponse() {
    if (!activeMood) return;
    finishRoll();
    responseReady = true;
    syncMood();
    draw();
    changeMood.focus({ preventScroll: true });
  }
  reasonForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!activeMood || responseReady || (!activeReason && !reasonInput.value.trim())) return;
    showResponse();
  });
  reasonSkip.addEventListener('click', () => {
    if (!activeMood || responseReady) return;
    activeReason = null;
    reasonInput.value = '';
    showResponse();
  });
  editReason.addEventListener('click', () => {
    if (!activeMood || !responseReady) return;
    finishRoll();
    responseReady = false;
    quote.textContent = '';
    syncMood();
    reasonQuestion.focus({ preventScroll: true });
  });
  reload.addEventListener('click', roll);
  syncCategory();
  syncMood();
  syncTheme();
})();
