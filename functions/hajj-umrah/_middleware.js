// Logio · Saudia Hajj & Umrah demo — access gate (Cloudflare Pages Functions).
//
// Everything under /hajj-umrah/ is private. A visitor unlocks it with a personal 4-digit code;
// each code belongs to one named person, so a leaked code can be traced back.
//
// Settings (Cloudflare Pages → turbotech → Settings → Variables and secrets):
//   HU_SESSION_SECRET  random string used to sign the session cookie            (required)
//   HU_SHEET_URL       Apps Script web-app URL of the access-code Google Sheet   (recommended)
//   HU_SHEET_TOKEN     shared token, also saved as LOGIO_TOKEN in the Apps Script
//   HU_CODES           fallback when the sheet is not connected, JSON {"1567":"Sanjay"}
// Binding: HU_KV (KV namespace) — failed-attempt limiter and a backup access log.

const PREFIX = '/hajj-umrah';
const COOKIE = 'hu_session';
const SESSION_HOURS = 12;
const MAX_FAILS = 5;          // per IP …
const FAIL_WINDOW = 15 * 60;  // … per 15 minutes

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (!env.HU_SESSION_SECRET) return new Response('Demo gate is not configured.', { status: 503 });

  // Public files the code screen needs (logo, font, styles).
  if (path.startsWith(`${PREFIX}/gate/`)) return next();

  if (path === `${PREFIX}/api/unlock`) return unlock(context);
  if (path === `${PREFIX}/api/logout`) {
    return new Response(null, { status: 303, headers: { Location: `${PREFIX}/`, 'Set-Cookie': clearCookie() } });
  }

  const session = await readSession(request, env);
  if (!session) {
    if (wantsHtml(request)) return gatePage();
    return new Response('Locked', { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  // Who is signed in (for the "Hayyakum, <Name>" greeting). Everyone invited is shown as VVIP.
  if (path === `${PREFIX}/api/me`) return json({ name: session.n, tier: 'VVIP Member' });

  // Count page views (one per load of the app page) without slowing the response.
  if (wantsHtml(request) && (path === `${PREFIX}/` || path === `${PREFIX}/index.html` || path === PREFIX)) {
    context.waitUntil(record(context, 'view', session.c).catch(() => {}));
  }

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', 'private, no-store');
  out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return out;
}

// ---------- unlock ----------

async function unlock(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return json({ ok: false }, 405);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const failKey = `fail:${ip}`;
  const fails = env.HU_KV ? Number(await env.HU_KV.get(failKey)) || 0 : 0;
  if (fails >= MAX_FAILS) return json({ ok: false, error: 'locked', retryMinutes: FAIL_WINDOW / 60 }, 429);

  let code = '';
  try { code = String((await request.json()).code || '').trim(); } catch (e) { /* empty */ }

  const result = /^\d{4}$/.test(code) ? await record(context, 'unlock', code) : { ok: false };

  if (!result.ok) {
    if (env.HU_KV) await env.HU_KV.put(failKey, String(fails + 1), { expirationTtl: FAIL_WINDOW });
    await new Promise(r => setTimeout(r, 600)); // slow down guessing
    return json({ ok: false, error: result.revoked ? 'revoked' : 'invalid', left: Math.max(0, MAX_FAILS - fails - 1) }, 401);
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const token = await sign({ c: code, n: result.name, exp }, env.HU_SESSION_SECRET);
  return json({ ok: true, name: result.name }, 200, {
    'Set-Cookie': `${COOKIE}=${token}; Path=${PREFIX}/; Max-Age=${SESSION_HOURS * 3600}; HttpOnly; Secure; SameSite=Lax`
  });
}

// Validates the code and writes the visit to the Google Sheet (or the fallback list).
async function record(context, action, code) {
  const { request, env } = context;
  const cf = request.cf || {};
  const ua = request.headers.get('User-Agent') || '';
  const visit = {
    action, code,
    ip: request.headers.get('CF-Connecting-IP') || '',
    city: cf.city || '', country: cf.country || '',
    device: deviceOf(ua), browser: browserOf(ua),
    at: new Date().toISOString()
  };

  let result = { ok: false };
  if (env.HU_SHEET_URL && env.HU_SHEET_TOKEN) {
    try {
      const r = await fetch(env.HU_SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: env.HU_SHEET_TOKEN, ...visit }),
        redirect: 'follow'
      });
      result = await r.json();
    } catch (e) {
      result = fallback(env, code); // sheet unreachable: don't lock people out
    }
  } else {
    result = fallback(env, code);
  }

  // Backup log in KV (kept 90 days), so nothing is lost if the sheet is down.
  if (env.HU_KV && result.ok) {
    const key = `log:${code}:${visit.at}`;
    context.waitUntil(env.HU_KV.put(key, JSON.stringify({ ...visit, name: result.name }), { expirationTtl: 90 * 86400 }));
  }
  return result;
}

function fallback(env, code) {
  try {
    const codes = JSON.parse(env.HU_CODES || '{}');
    return codes[code] ? { ok: true, name: codes[code] } : { ok: false };
  } catch (e) {
    return { ok: false };
  }
}

// ---------- session cookie (HMAC-SHA256) ----------

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

async function sign(payload, secret) {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body, secret)}`;
}

async function readSession(request, env) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return null;
  const [body, sig] = m[1].split('.');
  if (!body || !sig) return null;
  const expected = await hmac(body, env.HU_SESSION_SECRET);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(fromB64u(body)));
    return p.exp > Date.now() / 1000 ? p : null;
  } catch (e) {
    return null;
  }
}

const clearCookie = () => `${COOKIE}=; Path=${PREFIX}/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

// ---------- helpers ----------

function wantsHtml(request) {
  return request.method === 'GET' && (request.headers.get('Accept') || '').includes('text/html');
}

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }
  });
}

function deviceOf(ua) {
  if (/iPad/.test(ua)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Linux/.test(ua)) return 'Linux PC';
  return 'Unknown';
}

function browserOf(ua) {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/CriOS|Chrome\//.test(ua)) return 'Chrome';
  if (/FxiOS|Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}

function gatePage() {
  return new Response(GATE_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
  });
}

const GATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#ffffff">
<title>Saudia Hajj &amp; Umrah · Private preview</title>
<link rel="icon" href="${PREFIX}/gate/favicon-32.png">
<link rel="stylesheet" href="${PREFIX}/gate/gate.css">
</head>
<body>
<main class="gate">
  <img class="gate__logo" src="${PREFIX}/gate/hu-en-green.png" alt="Saudia Hajj &amp; Umrah" width="220" height="80">
  <p class="gate__eyebrow">Private preview</p>
  <h1 class="gate__title">Enter your access code</h1>
  <p class="gate__lead">This preview is shared by invitation. Your 4-digit code is personal to you.</p>
  <form class="gate__form" id="f" autocomplete="off" novalidate>
    <div class="pin" id="pin">
      <input inputmode="numeric" pattern="[0-9]*" aria-label="Digit 1" autofocus>
      <input inputmode="numeric" pattern="[0-9]*" aria-label="Digit 2">
      <input inputmode="numeric" pattern="[0-9]*" aria-label="Digit 3">
      <input inputmode="numeric" pattern="[0-9]*" aria-label="Digit 4">
    </div>
    <p class="gate__msg" id="msg" role="status" aria-live="polite"></p>
    <button class="btn" id="go" type="submit" disabled>Let's go</button>
  </form>
  <p class="gate__fine">Powered by Logio · Demo — no bookings or payments are made.</p>
</main>
<script>
(() => {
  const boxes = [...document.querySelectorAll('#pin input')];
  const go = document.getElementById('go'), msg = document.getElementById('msg'), pin = document.getElementById('pin');
  const code = () => boxes.map(b => b.value).join('');
  const sync = () => { go.disabled = !/^\\d{4}$/.test(code()); };
  boxes.forEach((b, i) => {
    b.addEventListener('input', () => {
      const d = b.value.replace(/\\D/g, '');
      if (d.length > 1) { d.split('').slice(0, 4 - i).forEach((c, k) => boxes[i + k].value = c); boxes[Math.min(3, i + d.length - 1)].focus(); }
      else { b.value = d; if (d && i < 3) boxes[i + 1].focus(); }
      sync(); if (/^\\d{4}$/.test(code())) submit();
    });
    b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && i) boxes[i - 1].focus(); });
  });
  let busy = false;
  async function submit(e) {
    if (e) e.preventDefault();
    if (busy || !/^\\d{4}$/.test(code())) return;
    busy = true; go.disabled = true; go.textContent = 'Checking…'; msg.textContent = '';
    try {
      const r = await fetch('${PREFIX}/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code() }) });
      const j = await r.json();
      if (j.ok) { msg.textContent = 'Welcome, ' + j.name + '.'; pin.classList.add('ok'); location.reload(); return; }
      pin.classList.add('shake'); setTimeout(() => pin.classList.remove('shake'), 500);
      msg.textContent = j.error === 'locked' ? 'Too many attempts. Please try again in 15 minutes.'
        : j.error === 'revoked' ? 'This code is no longer active.'
        : 'That code didn\\u2019t work.' + (j.left !== undefined ? ' ' + j.left + ' attempt' + (j.left === 1 ? '' : 's') + ' left.' : '');
      boxes.forEach(b => b.value = ''); boxes[0].focus();
    } catch (err) { msg.textContent = 'Connection problem. Please try again.'; }
    busy = false; go.textContent = "Let's go"; sync();
  }
  document.getElementById('f').addEventListener('submit', submit);
})();
</script>
</body>
</html>`;
