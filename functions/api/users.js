// Admin user management.
//   GET  /api/users            → list users (no hashes)
//   POST /api/users {username,password,role}  → create user
import { getSession, json, hashPassword, logAudit, clientInfo } from '../_lib/auth.js';

async function requireAdmin(request, env) {
  const sess = await getSession(request, env);
  if (!sess) return { error: json({ error: 'unauthorized' }, 401) };
  if (sess.user.role !== 'admin') return { error: json({ error: 'forbidden' }, 403) };
  return { sess };
}

export async function onRequestGet({ request, env }) {
  const { error } = await requireAdmin(request, env);
  if (error) return error;
  const { results } = await env.DB.prepare(
    'SELECT id, username, role, created_at FROM users ORDER BY id'
  ).all();
  return json({ users: results });
}

export async function onRequestPost({ request, env }) {
  const { sess, error } = await requireAdmin(request, env);
  if (error) return error;

  const { username, password, role } = await request.json().catch(() => ({}));
  if (!username || !password) return json({ error: 'missing username/password' }, 400);
  if (password.length < 8) return json({ error: 'password too short (min 8)' }, 400);

  const { salt, hash } = await hashPassword(password);
  try {
    await env.DB.prepare('INSERT INTO users(username,pass_hash,salt,role) VALUES(?,?,?,?)')
      .bind(username, hash, salt, role === 'admin' ? 'admin' : 'viewer').run();
  } catch (_) {
    return json({ error: 'username already exists' }, 409);
  }
  const { ip, ua } = clientInfo(request);
  await logAudit(env, sess.user.id, 'create_user', username, ip, ua);
  return json({ ok: true });
}
