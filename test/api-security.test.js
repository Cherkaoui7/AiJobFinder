import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import app from '../api/index.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('rejects an untrusted CORS origin without a stack trace', async () => {
  const response = await fetch(`${baseUrl}/api/ai/evaluate`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://attacker.invalid',
      'Access-Control-Request-Method': 'POST',
    },
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'Origine non autorisée.' });
});

test('requires a Mistral key', async () => {
  const response = await fetch(`${baseUrl}/api/ai/evaluate`, {
    method: 'POST',
    headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 401);
});

test('rejects oversized JSON bodies without a stack trace', async () => {
  const response = await fetch(`${baseUrl}/api/ai/evaluate`, {
    method: 'POST',
    headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'a'.repeat(11_000) }),
  });

  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: 'Requête trop volumineuse.' });
});

test('rejects malformed JSON as a client error without a stack trace', async () => {
  const response = await fetch(`${baseUrl}/api/ai/evaluate`, {
    method: 'POST',
    headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json' },
    body: '{"job":',
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'JSON de requête invalide.' });
});

test('rate limits repeated unauthenticated requests', async () => {
  const responses = await Promise.all(
    Array.from({ length: 31 }, () => fetch(`${baseUrl}/api/ai/evaluate`, {
      method: 'POST',
      headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }))
  );

  assert.ok(responses.some((response) => response.status === 429));
});
