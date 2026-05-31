import { verifyPassword, newToken, json, clientInfo, logAudit, sessionCookie, sessionMaxAgeMs } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json().catch(() => ({}));
  if (!username || !password) return json({ error: 'missing credentials' }, 400);

  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  const ok = user && await verifyPassword(password, user.salt, user.pass_hash);
  const { ip, ua } = clientInfo(request);

  if (!ok) {
    await logAudit(env, user ? user.id : null, 'login_fail', username, ip, ua);
    return json({ error: 'invalid credentials' }, 401);
  }

  const token = newToken();
  const expires = new Date(Date.now() + sessionMaxAgeMs()).toISOString();
  await env.DB.prepare('INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)')
    .bind(token, user.id, expires).run();
  await logAudit(env, user.id, 'login', null, ip, ua);

  return json({ ok: true, username: user.username, role: user.role }, 200, { 'set-cookie': sessionCookie(token) });
}
