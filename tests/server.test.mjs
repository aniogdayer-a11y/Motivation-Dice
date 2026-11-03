import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { createApp, validateInput, makeGeminiRequest, parseGeminiResponse } from '../server.mjs';

const config = { apiKey: 'test-only-fake-key', model: 'gemini-3.5-flash-lite' };
const input = { mood: 'tired', reason: 'school', note: 'I have exams tomorrow', previous: '' };
const messages = {
  english: 'Studying while tired can make tomorrow feel heavier. Choose one important topic to review, then allow yourself some rest. Your effort matters even at a gentler pace.',
  tagalog: 'Kapag pagod ka sa pag-aaral, maaaring mas mabigat ang pagharap sa bukas. Pumili ng isang mahalagang aralin, saka maglaan ng pahinga. May halaga ang pagsisikap mo kahit mas banayad ang takbo.',
  taglish: 'Kapag tired ka sa studies, puwedeng mas mabigat isipin ang tomorrow. One important topic muna, tapos give yourself some rest. May value ang effort mo kahit gentler ang pace.'
};
const geminiOutput = value => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] });

async function withServer(options, run) {
  const server = createApp({ configProvider: async () => config, ...options });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  try { await run(base); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
const post = (base, body = input, extra = {}) => fetch(base + '/api/motivation', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...extra.headers }, body: JSON.stringify(body), signal: extra.signal
});

function hostedRequest(base, pathname, headers = {}, body) {
  return new Promise((resolve, reject) => {
    const request = http.request(base + pathname, {
      method: body ? 'POST' : 'GET',
      headers: { Host: 'motivation-test.onrender.com', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }
    }, response => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { text += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, text }));
    });
    request.on('error', reject);
    request.end(body ? JSON.stringify(body) : undefined);
  });
}

test('Render HTTPS origin serves the app and AI while rejecting foreign hosts and origins', async () => {
  let calls = 0;
  await withServer({ publicOrigin: 'https://motivation-test.onrender.com/', fetchImpl: async () => {
    calls++; return Response.json(geminiOutput(messages));
  } }, async base => {
    const page = await hostedRequest(base, '/');
    assert.equal(page.status, 200);
    assert.ok(page.text.includes('mood-options'));
    const response = await hostedRequest(base, '/api/motivation', { Origin: 'https://motivation-test.onrender.com', 'Sec-Fetch-Site': 'same-origin' }, input);
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(response.text).messages, messages);
    assert.equal((await hostedRequest(base, '/api/motivation', { Origin: 'https://other.onrender.com' }, input)).status, 403);
    assert.equal((await hostedRequest(base, '/api/motivation', { 'Sec-Fetch-Site': 'cross-site' }, input)).status, 403);
    assert.equal((await hostedRequest(base, '/', { Host: 'other.onrender.com', 'X-Forwarded-Host': 'motivation-test.onrender.com' })).status, 403);
    assert.equal((await hostedRequest(base, '/.env')).status, 404);
    assert.equal(calls, 1);
  });
  assert.throws(() => createApp({ publicOrigin: 'http://example.com' }));
  assert.throws(() => createApp({ publicOrigin: 'https://example.com/path' }));
});

test('Render health checks need no key or Gemini request, but generation explains missing hosted setup', async () => {
  await withServer({ publicOrigin: 'https://motivation-test.onrender.com',
    configProvider: async () => ({ ...config, apiKey: '' }),
    fetchImpl: async () => { assert.fail('Health and missing-key requests must not call Gemini'); }
  }, async base => {
    const health = await hostedRequest(base, '/healthz');
    assert.equal(health.status, 200);
    assert.deepEqual(JSON.parse(health.text), { status: 'ok' });
    const response = await hostedRequest(base, '/api/motivation', {}, input);
    assert.equal(response.status, 503);
    assert.match(JSON.parse(response.text).error.message, /Render environment/);
  });
});

test('shared links and GitHub redirects can load the public page without allowing cross-site generation', async () => {
  let calls = 0;
  await withServer({ publicOrigin: 'https://motivation-test.onrender.com', fetchImpl: async () => {
    calls++; return Response.json(geminiOutput(messages));
  } }, async base => {
    const navigation = { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document',
      Referer: 'https://aniogdayer-a11y.github.io/Motivation-Dice/' };
    const page = await hostedRequest(base, '/', navigation);
    assert.equal(page.status, 200);
    assert.ok(page.text.includes('mood-options'));
    const fromMessenger = { ...navigation, Origin: 'https://www.facebook.com' };
    assert.equal((await hostedRequest(base, '/', fromMessenger)).status, 200);
    for (const file of ['/app.js', '/style.css']) {
      assert.equal((await hostedRequest(base, file, fromMessenger)).status, 200);
    }
    assert.equal((await hostedRequest(base, '/.env', navigation)).status, 404);
    assert.equal((await hostedRequest(base, '/', { ...navigation, Host: 'other.onrender.com' })).status, 403);
    assert.equal((await hostedRequest(base, '/api/motivation', fromMessenger, input)).status, 403);
    assert.equal(calls, 0);
    const ownOrigin = { Origin: 'https://motivation-test.onrender.com', 'Sec-Fetch-Site': 'same-origin' };
    assert.equal((await hostedRequest(base, '/api/motivation', ownOrigin, input)).status, 200);
    assert.equal(calls, 1);
  });
});

test('input limits and prompt preserve the selected context as data', () => {
  assert.throws(() => validateInput({ mood: 'invalid' }));
  assert.throws(() => validateInput({ ...input, reason: '__proto__' }));
  assert.throws(() => validateInput({ ...input, note: 'x'.repeat(301) }));
  assert.throws(() => validateInput({ ...input, previous: 'x'.repeat(2001) }));
  const body = makeGeminiRequest(validateInput(input), config.model);
  const context = JSON.parse(body.contents[0].parts[0].text);
  assert.equal(context.selected_mood, 'tired');
  assert.equal(context.selected_topic, 'school');
  assert.equal(context.optional_note, input.note);
  assert.deepEqual(body.generationConfig.responseJsonSchema.required, ['english', 'tagalog', 'taglish']);
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
  assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, 'MINIMAL');
  assert.ok(!makeGeminiRequest(input, 'gemini-2.5-flash-lite').generationConfig.thinkingConfig);
});

test('one Gemini call returns all three complete language versions without exposing the key', async () => {
  const calls = [];
  await withServer({ fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return Response.json(geminiOutput(messages));
  } }, async base => {
    const response = await post(base);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result, { source: 'ai', messages });
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith('/models/gemini-3.5-flash-lite:generateContent'));
    assert.ok(!calls[0].url.includes(config.apiKey));
    assert.equal(calls[0].options.headers['x-goog-api-key'], config.apiKey);
    assert.ok(!JSON.stringify(result).includes(config.apiKey));
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
});

test('configuration is reread for the next request without a restart', async () => {
  let current = '';
  const used = [];
  await withServer({ configProvider: async () => ({ ...config, apiKey: current }), fetchImpl: async (_, options) => {
    used.push(options.headers['x-goog-api-key']); return Response.json(geminiOutput(messages));
  } }, async base => {
    assert.equal((await post(base)).status, 503);
    current = 'test-only-new-fake-key';
    assert.equal((await post(base)).status, 200);
    assert.deepEqual(used, [current]);
  });
});

test('missing key is actionable and never calls Gemini', async () => {
  let called = false;
  await withServer({ configProvider: async () => ({ ...config, apiKey: '' }), fetchImpl: async () => { called = true; } }, async base => {
    const response = await post(base);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error.code, 'KEY_MISSING');
    assert.ok(body.error.message.includes('GEMINI_API_KEY'));
    assert.equal(called, false);
    assert.deepEqual(await (await fetch(base + '/api/status')).json(), { provider: 'gemini', configured: false });
  });
});

test('public serving cannot disclose .env, server source, Git metadata, or other files', async () => {
  await withServer({}, async base => {
    for (const file of ['/.env', '/.env.example', '/server.mjs', '/package.json', '/.git/config', '/%2e%2e/.env', '/dist/.env']) {
      assert.equal((await fetch(base + file)).status, 404, file);
    }
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes('ai-loading'));
    assert.ok(page.headers.get('content-security-policy').includes("connect-src 'self'"));
    const status = JSON.stringify(await (await fetch(base + '/api/status')).json());
    assert.ok(!status.includes(config.apiKey));
  });
});

test('cross-site calls, foreign hosts, invalid JSON, and bad inputs are rejected before upstream', async () => {
  let calls = 0;
  await withServer({ fetchImpl: async () => { calls++; } }, async base => {
    assert.equal((await post(base, input, { headers: { Origin: 'https://example.com' } })).status, 403);
    const foreignHostStatus = await new Promise((resolve, reject) => {
      const request = http.request(base + '/api/motivation', { method: 'POST', headers: { Host: 'example.com', 'Content-Type': 'application/json' } }, response => {
        response.resume(); resolve(response.statusCode);
      });
      request.on('error', reject); request.end(JSON.stringify(input));
    });
    assert.equal(foreignHostStatus, 403);
    assert.equal((await post(base, { ...input, mood: 'other' })).status, 400);
    assert.equal((await post(base, { ...input, note: 'a'.repeat(301) })).status, 400);
    assert.equal((await fetch(base + '/api/motivation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' })).status, 400);
    assert.equal((await fetch(base + '/api/motivation', { method: 'POST', body: 'not json' })).status, 415);
    assert.equal(calls, 0);
  });
});

test('upstream failure messages do not leak request data or credentials', async () => {
  for (const [upstreamStatus, expected] of [[400, 502], [401, 502], [403, 502], [404, 502], [429, 429], [500, 502]]) {
    await withServer({ fetchImpl: async () => Response.json({ error: { message: config.apiKey + input.note } }, { status: upstreamStatus }) }, async base => {
      const response = await post(base);
      assert.equal(response.status, expected);
      const body = await response.text();
      assert.ok(!body.includes(config.apiKey));
      assert.ok(!body.includes(input.note));
    });
  }
});

test('partial, refused, malformed, or duplicate-language responses are not shown as ready', () => {
  for (const value of [
    {}, { promptFeedback: { blockReason: 'SAFETY' } },
    { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: JSON.stringify(messages) }] } }] },
    { candidates: [{ content: { parts: [{ text: '{broken' }] } }] },
    geminiOutput({ english: messages.english, tagalog: messages.tagalog }),
    geminiOutput({ english: messages.english, tagalog: messages.english, taglish: messages.english })
  ]) assert.throws(() => parseGeminiResponse(value));
  const withThoughts = geminiOutput(messages);
  withThoughts.candidates[0].content.parts.unshift({ thought: true, text: 'Do not expose this.' });
  assert.deepEqual(parseGeminiResponse(withThoughts), messages);
});

test('timeout exits with a recoverable error', async () => {
  await withServer({ timeoutMs: 20, fetchImpl: async (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('test timeout')), { once: true });
  }) }, async base => {
    const response = await post(base);
    assert.equal(response.status, 504);
    assert.equal((await response.json()).error.code, 'TIMEOUT');
  });
});

test('too many simultaneous generation calls are not sent upstream', async () => {
  const releases = [];
  await withServer({ fetchImpl: async () => new Promise(resolve => releases.push(() => resolve(Response.json(geminiOutput(messages))))) }, async base => {
    const first = post(base);
    const second = post(base);
    for (let i = 0; i < 50 && releases.length < 2; i++) await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(releases.length, 2);
    assert.equal((await post(base)).status, 429);
    releases.forEach(release => release());
    assert.equal((await first).status, 200);
    assert.equal((await second).status, 200);
  });
});
