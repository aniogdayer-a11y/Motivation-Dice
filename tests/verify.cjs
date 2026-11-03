const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = ['mood-responses.js', 'reasons.js', 'personalization.js', 'app.js'].map(file => fs.readFileSync(require('node:path').join(__dirname, '..', file), 'utf8')).join('\n');
const languages = ['taglish', 'english', 'tagalog'];
const moodNames = ['happy', 'okay', 'sad', 'anxious', 'tired', 'overwhelmed', 'unmotivated', 'lonely'];
function start(storage = new Map(), blocked = false, reduced = true) {
  const timers = new Map();
  let timerId = 0;
  function node(dataset = {}) {
    const classes = new Set();
    const label = { textContent: '' };
    return { textContent: '', value: '', hidden: false, dataset, attrs: {}, events: {},
      classList: { add(c) { classes.add(c); }, remove(c) { classes.delete(c); }, contains(c) { return classes.has(c); } },
      setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; },
      addEventListener(k, v) { this.events[k] = v; }, querySelector() { return label; },
      focus() { document.activeElement = this; } };
  }
  const nodes = Object.fromEntries(['motivation', 'quote-stage', 'reload', 'theme-toggle', 'mood-options', 'change-mood',
    'motivation-card', 'motivation-languages', 'reason-form', 'reason-input', 'reason-submit',
    'reason-skip', 'reason-question', 'answer-summary', 'shared-reason', 'edit-reason', 'reason-hint', 'reason-label'].map(id => [id, node()]));
  const categories = languages.map(category => node({ category }));
  const moods = moodNames.map(mood => node({ mood }));
  const reasons = ['school', 'work', 'family', 'relationships', 'self', 'change', 'unsure'].map(reason => node({ reason }));
  const document = { documentElement: { dataset: { theme: 'light' } },
    getElementById: id => nodes[id], querySelector: () => ({ content: '' }),
    querySelectorAll: selector => selector === '[data-category]' ? categories : selector === '[data-mood]' ? moods : reasons };
  const localStorage = { getItem(k) { if (blocked) throw Error('Blocked'); return storage.get(k) || null; },
    setItem(k, v) { if (blocked) throw Error('Blocked'); storage.set(k, v); } };
  const context = { window: {}, document, localStorage, matchMedia: () => ({ matches: reduced }),
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); } };
  vm.runInNewContext(source, context);
  return { nodes, document, storage, timers, categories, moods, reasons, copy: context.window.REASON_COPY, groups: context.window.MOTIVATIONS, personalization: context.window.PERSONALIZATION,
    choose: category => categories.find(b => b.dataset.category === category).events.click(),
    pick(mood, skip = true) { for (let i = 0; i < 2 && !nodes['change-mood'].hidden; i++) nodes['change-mood'].events.click(); moods.find(b => b.dataset.mood === mood).events.click(); if (skip) nodes['reason-skip'].events.click(); },
    reason: reason => reasons.find(b => b.dataset.reason === reason).events.click(),
    submit: () => nodes['reason-form'].events.submit({ preventDefault() {} }),
    edit() { for (let i = 0; i < 2 && !nodes['change-mood'].hidden; i++) nodes['change-mood'].events.click(); },
    read: () => nodes.motivation.textContent, roll: () => nodes.reload.events.click(),
    flush() { for (const [id, fn] of timers) { timers.delete(id); fn(); } } };
}

const app = start();
assert.equal(app.read(), '', 'A response appeared before choosing a mood');
assert.equal(app.nodes['motivation-card'].hidden, true);
assert.equal(app.nodes.reload.hidden, true);
app.choose('english'); app.roll();
assert.equal(app.read(), '', 'Language switching or reload skipped the mood question');
assert.equal([...app.storage.keys()].filter(k => k.includes('deck')).length, 0, 'Consumed a response before choosing a mood');

const allResponses = Object.values(app.groups).flatMap(group => Object.values(group).flat());
assert.ok(allResponses.length >= 240, 'Expected at least 240 responses');
assert.equal(new Set(allResponses.map(q => q.trim().toLowerCase())).size, allResponses.length, 'Duplicate response');
assert.ok(allResponses.every(q => q.length >= 140 && q.split(/[.!?](?:\s|$)/).length >= 3), 'Expected explanatory responses, not short quotes');

for (const language of languages) {
  assert.equal(Object.keys(app.groups[language]).length, 8, 'Missing a mood');
  for (const mood of moodNames) {
    const quotes = app.groups[language][mood];
    assert.ok(quotes.length >= 10, `Too few responses in ${language}/${mood}`);
    const session = start(new Map([['dayer-category', language]]));
    session.pick(mood);
    assert.equal(session.nodes.motivation.lang, language === 'english' ? 'en' : 'fil');
    assert.equal(session.nodes['mood-options'].hidden, true);
    assert.equal(session.nodes['motivation-card'].hidden, false);
    assert.equal(session.nodes.reload.hidden, false);
    assert.equal(session.document.activeElement, session.nodes['change-mood'], 'Focus left on hidden mood choice');
    assert.equal(session.moods.filter(b => b.attrs['aria-pressed'] === 'true').length, 1);
    for (let cycle = 0; cycle < 3; cycle++) {
      const seen = new Set([session.read()]);
      for (let i = 1; i < quotes.length; i++) {
        session.roll();
        assert.ok(quotes.includes(session.read()), `Wrong mood or language in ${language}/${mood}`);
        assert.ok(!seen.has(session.read()), `Repeated within ${language}/${mood} cycle`);
        seen.add(session.read());
      }
      const last = session.read(); session.roll(); assert.notEqual(session.read(), last, 'Repeated at cycle boundary');
    }
    const storage = new Map([['dayer-category', language]]);
    const acrossReloads = new Set();
    for (let i = 0; i < quotes.length; i++) {
      const visit = start(storage);
      assert.equal(visit.read(), '', 'Reused a stale mood on a new visit');
      visit.pick(mood);
      assert.ok(quotes.includes(visit.read()), 'Lost language preference');
      assert.ok(!acrossReloads.has(visit.read()), 'Lost mood history after refresh');
      acrossReloads.add(visit.read());
    }
  }
}

// Switching either dimension must continue its own deck.
const switching = start();
const seen = new Map();
for (let round = 0; round < 4; round++) {
  for (const language of languages) {
    switching.edit(); switching.choose(language);
    for (const mood of moodNames) {
      switching.pick(mood);
      const key = language + ':' + mood;
      if (!seen.has(key)) seen.set(key, new Set());
      assert.ok(!seen.get(key).has(switching.read()), 'Switching reset a mood deck');
      seen.get(key).add(switching.read());
      const before = switching.read(); switching.choose(language); assert.equal(switching.read(), before);
    }
  }
}
switching.edit();
assert.equal(switching.read(), '');
assert.equal(switching.nodes.reload.hidden, true);
assert.equal(switching.nodes['mood-options'].hidden, false);
assert.equal(switching.document.activeElement.dataset.mood, 'lonely');

const denied = start(new Map(), true); denied.choose('english'); denied.pick('sad'); denied.roll();
assert.ok(denied.groups.english.sad.includes(denied.read()));
const corrupt = start(new Map([['dayer-motivation-deck-v4:taglish:tired:general', '{bad json'], ['dayer-category', '__proto__']]));
corrupt.pick('tired'); assert.ok(corrupt.groups.taglish.tired.includes(corrupt.read()));
const invalid = start(new Map([['dayer-motivation-deck-v4:taglish:tired:general', JSON.stringify({
  signature: app.groups.taglish.tired.join('\n'), last: 0, remaining: [9999, 9999]
})]])); invalid.pick('tired'); assert.ok(invalid.groups.taglish.tired.includes(invalid.read()));
app.nodes['theme-toggle'].events.click(); assert.equal(app.document.documentElement.dataset.theme, 'dark');
assert.equal(app.storage.get('dayer-theme'), 'dark');
app.nodes['theme-toggle'].events.click(); assert.equal(app.document.documentElement.dataset.theme, 'light');

const animated = start(new Map(), false, false); animated.pick('sad');
const before = animated.read(); animated.roll(); animated.roll(); assert.equal(animated.timers.size, 2);
animated.flush(); assert.notEqual(animated.read(), before);
assert.equal(animated.nodes.reload.attrs['aria-disabled'], undefined);
animated.roll(); animated.choose('english');
assert.equal(animated.timers.size, 0, 'Language switch did not cancel pending roll');
const switched = animated.read(); animated.flush(); assert.equal(animated.read(), switched);
assert.ok(animated.groups.english.sad.includes(switched));
animated.roll(); animated.edit(); animated.flush();
assert.equal(animated.read(), '', 'An old animation wrote into the mood picker');
assert.equal(animated.nodes['quote-stage'].classList.contains('changing'), false);
animated.pick('tired'); assert.ok(animated.groups.english.tired.includes(animated.read()));
const why = start();
why.pick('sad', false);
assert.equal(why.nodes['reason-form'].hidden, false);
assert.equal(why.nodes['motivation-card'].hidden, true);
assert.equal(why.document.activeElement, why.nodes['reason-question']);
why.submit(); why.roll(); assert.equal(why.read(), '', 'Empty reason bypassed the form');
why.choose('english'); assert.equal(why.nodes['reason-question'].textContent, 'What made you feel this way?');
why.nodes['reason-input'].value = '   '; why.nodes['reason-input'].events.input();
assert.equal(why.nodes['reason-submit'].disabled, true);
const personal = '<img src=x onerror=alert(1)> My own words';
why.nodes['reason-input'].value = personal; why.nodes['reason-input'].events.input();
assert.equal(why.nodes['reason-submit'].disabled, false);
why.reason('school'); why.submit();
assert.ok(why.read().includes('school') && why.read().includes('grade'), 'School situation missing from the main message');
assert.ok(why.nodes['shared-reason'].textContent.includes(personal));
assert.ok(!JSON.stringify([...why.storage]).includes(personal), 'Personal explanation was persisted');
const previous = why.read(); why.roll(); assert.notEqual(why.read(), previous);
assert.ok(why.nodes['shared-reason'].textContent.includes(personal));
why.nodes['edit-reason'].events.click();
assert.equal(why.nodes['reason-input'].value, personal);
assert.equal(why.nodes['motivation-card'].hidden, true);
why.nodes['reason-skip'].events.click();
assert.ok(why.groups.english.sad.includes(why.read()), 'Skipping left the old reason in the response');
assert.equal(why.nodes['shared-reason'].hidden, true);
why.pick('happy', false); assert.equal(why.nodes['reason-input'].value, '');
why.nodes['reason-input'].value = 'A little good news'; why.submit();
assert.ok(why.groups.english.happy.includes(why.read()), 'Invented a reason from ambiguous free text');
for (const language of languages) {
  for (const mood of moodNames) {
    for (const reason of ['school', 'work', 'family', 'relationships', 'self', 'change', 'unsure']) {
      const check = start(new Map([['dayer-category', language]]));
      check.pick(mood, false); check.reason(reason); check.submit();
      const seen = new Set();
      for (let i = 0; i < 10; i++) {
        const response = check.read();
        assert.ok(!check.groups[language][mood].includes(response), 'Reason was not integrated into the main message');
        assert.ok(check.groups[language][mood].some(base => response.startsWith(base.slice(0, base.search(/[.!?]\s/) + 1))), 'Wrong mood or language');
        assert.ok(!seen.has(response), 'Personalized response repeated within a cycle');
        seen.add(response); check.roll();
      }
      assert.notEqual(check.read(), [...seen].at(-1), 'Personalized response repeated at the cycle boundary');
      check.choose(language === 'english' ? 'tagalog' : 'english');
      check.choose(language);
      assert.ok(check.read());
    }
  }
}
const navigation = start();
navigation.pick('overwhelmed', false);
navigation.reason('work'); navigation.nodes['reason-input'].value = 'A busy workday'; navigation.submit();
navigation.nodes['change-mood'].events.click();
assert.equal(navigation.nodes['reason-form'].hidden, false, 'Back did not return to the reason step');
assert.equal(navigation.nodes['reason-input'].value, 'A busy workday', 'Back discarded the answer');
assert.equal(navigation.nodes['motivation-card'].hidden, true);
navigation.nodes['change-mood'].events.click();
assert.equal(navigation.nodes['mood-options'].hidden, false, 'Second Back did not return to moods');
assert.equal(navigation.document.activeElement.dataset.mood, 'overwhelmed');
for (const language of languages) {
  navigation.choose(language);
  assert.deepEqual(navigation.moods.map(button => button.querySelector('.mood-label').textContent),
    ['Happy', 'Okay', 'Sad', 'Anxious', 'Tired', 'Overwhelmed', 'Unmotivated', 'Lonely']);
  assert.equal(navigation.nodes['motivation-languages'].hidden, true, 'Language selector appeared before the motivation step');
  navigation.pick('tired', false);
  assert.equal(navigation.nodes['motivation-languages'].hidden, true);
  assert.equal(navigation.nodes['reason-question'].textContent, 'What made you feel this way?');
  assert.equal(navigation.nodes['reason-hint'].textContent, navigation.copy.english.hint);
  assert.equal(navigation.nodes['reason-label'].textContent, 'Anything you want to share? (optional)');
  assert.equal(navigation.nodes['reason-input'].placeholder, 'I feel this way because…');
  assert.equal(navigation.nodes['reason-submit'].textContent, 'Show my encouragement');
  assert.equal(navigation.nodes['reason-skip'].textContent, 'Skip for now');
  assert.deepEqual(navigation.reasons.map(button => button.textContent),
    ['School / studies', 'Work', 'Family', 'Friends / relationships', 'Myself', 'A change in my life', 'Not sure yet']);
  navigation.reason('work'); navigation.submit();
  assert.equal(navigation.nodes['motivation-languages'].hidden, false);
  assert.equal(navigation.nodes['edit-reason'].textContent, 'Work · Edit my answer');
  assert.ok(navigation.personalization.build(language, 'tired', 'work', '').responses.includes(navigation.read()), 'Motivation language was not applied');
  navigation.edit();
}
const inferred = start(new Map([['dayer-category', 'english']]));
inferred.pick('tired', false);
inferred.nodes['reason-input'].value = 'I have exams tomorrow and I am not ready'; inferred.submit();
assert.ok(inferred.read().includes('Schoolwork'), 'Exam context did not affect the main message');
assert.equal(inferred.nodes['edit-reason'].textContent, 'Possibly School / studies · Edit my answer');
assert.ok(!JSON.stringify([...inferred.storage]).includes('I have exams tomorrow'), 'Stored personal writing');
inferred.nodes['edit-reason'].events.click(); inferred.reason('family'); inferred.submit();
assert.ok(inferred.read().includes('family responsibilities'), 'Explicit reason did not override inferred topic');
inferred.nodes['edit-reason'].events.click(); inferred.reason('unsure'); inferred.submit();
assert.ok(!inferred.read().includes('Schoolwork'), 'Ignored explicit Not sure yet choice');
for (const [text, expected] of [
  ['Pagod ako sa trabaho', 'work'], ['I am worried about my exam', 'school'],
  ['I miss my friends', 'relationships'], ['My parents are moving', null],
  ['This is not about school', null], ['Purple clouds and a long day', null]
]) assert.equal(inferred.personalization.resolve(null, text).reason, expected, 'Unreliable free-text matching');
const topicStorage = new Map([['dayer-category', 'english']]);
const topicSeen = new Map([['work', new Set()], ['school', new Set()]]);
for (let visit = 0; visit < 10; visit++) {
  for (const topic of topicSeen.keys()) {
    const session = start(topicStorage); session.pick('tired', false); session.reason(topic); session.submit();
    assert.ok(!topicSeen.get(topic).has(session.read()), 'Lost separate mood/reason history after refresh');
    topicSeen.get(topic).add(session.read());
  }
}
console.log('PASS: all 168 mood/reason/language combinations; ten distinct responses each; integrated messages; cautious bilingual topic matching; explicit choices override inference; separate history; English guides; Back; safe custom text; themes.');
