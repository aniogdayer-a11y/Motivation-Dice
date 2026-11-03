import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
for (const name of ['mood-responses', 'response-closings', 'reasons', 'personalization']) {
  vm.runInNewContext(readFileSync(new URL('../dist/' + name + '.js', import.meta.url), 'utf8'), context);
}
const { MOTIVATIONS, PERSONALIZATION, REASON_COPY } = context.window;

test('saved messages cover every mood, topic, and language with distinct responses', () => {
  const all = Object.values(MOTIVATIONS).flatMap(group => Object.values(group).flat());
  assert.equal(all.length, 240);
  assert.equal(new Set(all).size, 240);
  let combinations = 0;
  for (const language of ['english', 'tagalog', 'taglish']) {
    for (const mood of Object.keys(MOTIVATIONS[language])) {
      for (const topic of Object.keys(REASON_COPY.english.labels)) {
        const pool = PERSONALIZATION.build(language, mood, topic).responses;
        assert.equal(pool.length, 10);
        assert.equal(new Set(pool).size, 10);
        assert.ok(pool.every(message => message.length > 100));
        combinations++;
      }
    }
  }
  assert.equal(combinations, 168);
});

test('saved mode follows explicit choices and does not interpret private notes', () => {
  assert.equal(PERSONALIZATION.resolve(null, 'I have exams tomorrow').reason, null);
  assert.equal(PERSONALIZATION.resolve('family', 'I have exams tomorrow').reason, 'family');
  const school = PERSONALIZATION.build('english', 'tired', 'school').responses;
  const family = PERSONALIZATION.build('english', 'tired', 'family').responses;
  assert.ok(school.every(text => text.includes('Schoolwork') && !text.includes('Family matters')));
  assert.ok(family.every(text => text.includes('Family matters') && !text.includes('Schoolwork')));
});
