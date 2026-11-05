import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

// Browser API calls are intercepted with clearly synthetic fixtures. No live key
// is needed, and no requests from this test are sent to Google.
const profile = await mkdtemp(path.join(tmpdir(), 'dayer-ai-qa-'));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', '--user-data-dir=' + profile, 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
let socket;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  assert.ok(port, 'Chrome did not start');
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const pending = new Map();
  const errors = [];
  let nextId = 0;
  let mode = 'success';
  let responseDelay = 300;
  const calls = [];
  const held = [];
  const fixtures = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Fetch.requestPaused') { void intercept(message.params); return; }
    const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timeout); pending.delete(message.id);
    message.error ? request.reject(Error(message.error.message)) : request.resolve(message.result);
  };
  function cdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timeout = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 10000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async function waitFor(expression) {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(50); }
    throw Error('Browser state timed out: ' + expression);
  }
  async function fulfill(requestId, status, body) {
    await cdp('Fetch.fulfillRequest', { requestId, responseCode: status,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
      body: Buffer.from(JSON.stringify(body)).toString('base64') }).catch(() => {});
  }
  async function intercept({ requestId, request }) {
    const input = JSON.parse(request.postData);
    calls.push(input);
    const n = calls.length;
    const messages = {
      english: `English test fixture ${n}. Feeling ${input.mood} about ${input.reason || 'your day'} deserves some understanding. Take one manageable step and leave room for your needs.`,
      tagalog: `Tagalog na halimbawang mensahe ${n}. May puwang para sa nararamdaman mo ngayon. Pumili ng isang munting hakbang at bigyan ang sarili ng pagkakataong magpahinga.`,
      taglish: `Taglish test fixture ${n}. May space para sa feeling mo today. One manageable step muna, tapos give yourself a little care habang hinaharap ang sitwasyon.`
    };
    fixtures.set(n, messages);
    const responseMode = mode;
    if (responseMode === 'hold') { held.push({ requestId, messages }); return; }
    await delay(responseDelay);
    if (responseMode === 'missing') return fulfill(requestId, 503, { error: { code: 'KEY_MISSING', message: 'Gemini is not connected yet. Add GEMINI_API_KEY to the local .env file, save it, then try again.' } });
    if (responseMode === 'quota') return fulfill(requestId, 429, { error: { code: 'QUOTA_LIMIT', message: 'Gemini has reached a rate or quota limit. Wait a little and try again, or use saved messages.' } });
    if (responseMode === 'malformed') return fulfill(requestId, 200, { source: 'ai', messages: { english: messages.english } });
    return fulfill(requestId, 200, { source: 'ai', messages });
  }
  async function screenshot(name) {
    const { cssContentSize: size } = await cdp('Page.getLayoutMetrics');
    const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 } });
    await writeFile(path.resolve('..', name), Buffer.from(result.data, 'base64'));
  }

  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*://*/api/motivation', requestStage: 'Request' }] });
  await cdp('Page.navigate', { url: 'http://127.0.0.1:8000' });
  await waitFor("document.readyState === 'complete' && Boolean(window.MOTIVATIONS) && document.getElementById('mood-options')?.hidden === false");
  assert.equal(await evaluate("document.getElementById('mood-question').textContent"), 'how was your mood today?');
  assert.equal(await evaluate("[...document.querySelectorAll('.mood-label')].map(n=>n.textContent).join(',')"), 'Happy,Okay,Sad,Anxious,Tired,Overwhelmed,Unmotivated,Lonely');
  await evaluate("document.querySelector('[data-mood=tired]').click(); document.querySelector('[data-reason=school]').click(); document.getElementById('reason-input').value='Exam stress test note'; document.getElementById('reason-form').requestSubmit()");
  await waitFor("!document.getElementById('ai-loading').hidden");
  assert.equal(await evaluate("document.getElementById('motivation-card').hidden && document.getElementById('motivation-languages').hidden"), true);
  await screenshot('preview-ai-loading.png');
  await waitFor("!document.getElementById('motivation-card').hidden");
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { mood: 'tired', reason: 'school', note: 'Exam stress test note', previous: '' });
  for (const language of ['english', 'tagalog', 'taglish']) {
    await evaluate(`document.querySelector('[data-category=${language}]').click()`);
    assert.equal(await evaluate("document.getElementById('motivation').textContent"), fixtures.get(1)[language]);
    assert.equal(await evaluate("document.getElementById('reason-question').textContent"), 'What made you feel this way?');
  }
  assert.equal(calls.length, 1, 'Switching language sent an API call');
  assert.equal(await evaluate("JSON.stringify(Object.entries(localStorage)).includes('Exam stress test note')"), false);
  assert.equal(await evaluate("JSON.stringify(Object.entries(localStorage)).includes('test fixture')"), false);

  responseDelay = 500;
  await evaluate("document.getElementById('reload').click()");
  await waitFor("!document.getElementById('ai-loading').hidden");
  await evaluate("document.getElementById('change-mood').click()");
  await delay(650);
  assert.equal(await evaluate("!document.getElementById('reason-form').hidden && document.getElementById('motivation-card').hidden"), true, 'Cancelled response replaced the reason screen');
  assert.equal(await evaluate("document.getElementById('reason-input').value"), 'Exam stress test note');
  assert.equal(calls[1].previous, fixtures.get(1).english, 'Reload did not pass the previous message');

  mode = 'missing'; responseDelay = 60;
  await evaluate("document.getElementById('reason-form').requestSubmit()");
  await waitFor("!document.getElementById('ai-error').hidden");
  assert.ok((await evaluate("document.getElementById('ai-error-message').textContent")).includes('GEMINI_API_KEY'));
  assert.equal(await evaluate("document.getElementById('motivation-card').hidden"), true);
  mode = 'success';
  await evaluate("document.getElementById('ai-retry').click()");
  await waitFor("!document.getElementById('motivation-card').hidden");
  assert.equal(await evaluate("document.getElementById('response-source').hidden"), true);

  mode = 'malformed';
  await evaluate("document.getElementById('reload').click()");
  await waitFor("!document.getElementById('ai-error').hidden");
  assert.equal(await evaluate("document.getElementById('motivation-languages').hidden"), true, 'Displayed partial languages');
  await evaluate("document.getElementById('use-saved').click(); document.querySelector('[data-category=english]').click()");
  assert.equal(await evaluate("document.getElementById('response-source').textContent"), 'Saved message');
  const callsBeforeSaved = calls.length;
  const seen = new Set();
  for (let i = 0; i < 10; i++) {
    const text = await evaluate("document.getElementById('motivation').textContent");
    assert.ok(!seen.has(text), 'Saved response repeated within a cycle'); seen.add(text);
    await evaluate("document.getElementById('reload').click()");
  }
  assert.equal(calls.length, callsBeforeSaved, 'Saved reload called Gemini');
  mode = 'quota';
  await evaluate("document.getElementById('try-ai').click()");
  await waitFor("!document.getElementById('ai-error').hidden");
  assert.ok((await evaluate("document.getElementById('ai-error-message').textContent")).includes('quota'));

  mode = 'hold';
  await evaluate("document.getElementById('ai-retry').click()");
  await waitFor("!document.getElementById('ai-loading').hidden");
  for (let i = 0; i < 20 && !held.length; i++) await delay(25);
  await evaluate("document.getElementById('change-mood').click(); document.getElementById('change-mood').click()");
  for (const item of held) await fulfill(item.requestId, 200, { source: 'ai', messages: item.messages });
  await delay(80);
  assert.equal(await evaluate("!document.getElementById('mood-options').hidden && document.getElementById('motivation-card').hidden"), true);

  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  mode = 'success'; responseDelay = 400;
  await evaluate("document.getElementById('theme-toggle').click()");
  await delay(400); // Capture the settled dark theme, not its color transition.
  await evaluate("document.querySelector('[data-mood=lonely]').click(); document.querySelector('[data-reason=relationships]').click(); document.getElementById('reason-form').requestSubmit()");
  await waitFor("!document.getElementById('ai-loading').hidden");
  await screenshot('preview-ai-mobile-loading.png');
  await waitFor("!document.getElementById('motivation-card').hidden");
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'Mobile overflow');
  assert.equal(await evaluate("(() => { const r=document.getElementById('change-mood').getBoundingClientRect(); return r.left<=24 && r.width===r.height; })()"), true);
  const beforeSwitch = calls.length;
  await evaluate("document.querySelector('[data-category=tagalog]').click(); document.querySelector('[data-category=taglish]').click()");
  assert.equal(calls.length, beforeSwitch);
  assert.deepEqual(errors, []);
  console.log('PASS: browser with mocked Gemini; loading waits for all 3 languages; instant language switching with no extra calls; retry/missing-key/quota/partial-output states; cancellation; saved fallback cycles; mobile/dark mode. No live Gemini calls made.');
  await cdp('Browser.close').catch(() => {});
} finally {
  socket?.close(); chrome.kill();
}
