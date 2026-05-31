// GET /api/audit  → recent login/activity log. Admin only.
import { getSession, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const sess = await getSession(request, env);
  if (!sess) return json({ error: 'unauthorized' }, 401);
  if (sess.user.role !== 'admin') return json({ error: 'forbidden' }, 403);

  const { results } = await env.DB.prepare(
    `SELECT a.id, a.action, a.detail, a.ip, a.created_at, u.username
     FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.id DESC LIMIT 200`
  ).all();
  return json({ logs: results });
}
