// Shared auth helpers for Cloudflare Pages Functions.
// Zero dependencies — Web Crypto only.

const enc = new TextEncoder();
const hex = b => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
const unhex = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));

const PBKDF2_ITERATIONS = 100000;

// Returns { salt, hash } as hex strings. Pass saltHex to verify against an existing salt.
export async function hashPassword(password, saltHex) {
  const salt = saltHex ? unhex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key, 256
  );
  return { salt: hex(salt), hash: hex(new Uint8Array(bits)) };
}

export async function verifyPassword(password, saltHex, hashHex) {
  const { hash } = await hashPassword(password, saltHex);
  if (hash.length !== hashHex.length) return false;
  let diff = 0;                                    // constant-time compare
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}

export const newToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));

export const json = (obj, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...extraHeaders } });

export const clientInfo = req => ({
  ip: req.headers.get('cf-connecting-ip') || '',
  ua: req.headers.get('user-agent') || '',
});

export function getCookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

const COOKIE = 'ima_sess';
const MAX_AGE = 8 * 3600;                          // 8 hours

export function sessionCookie(token) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`;
}
export const clearCookie = () =>
  `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
export const sessionMaxAgeMs = () => MAX_AGE * 1000;

export async function logAudit(env, userId, action, detail, ip, ua) {
  try {
    await env.DB.prepare('INSERT INTO audit_log(user_id,action,detail,ip,ua) VALUES(?,?,?,?,?)')
      .bind(userId, action, detail || null, ip || '', ua || '').run();
  } catch (_) { /* never let audit failure break a request */ }
}

// Returns { token, user:{id,username,role} } or null. Deletes expired sessions.
export async function getSession(req, env) {
  const token = getCookie(req, COOKIE);
  if (!token) return null;
  const row = await env.DB.prepare(
    'SELECT s.token, s.expires_at, u.id, u.username, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?'
  ).bind(token).first();
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }
  return { token: row.token, user: { id: row.id, username: row.username, role: row.role } };
}
