import { getCookie, clearCookie, json, getSession, logAudit, clientInfo } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const sess = await getSession(request, env);
  const token = getCookie(request, 'ima_sess');
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  if (sess) {
    const { ip, ua } = clientInfo(request);
    await logAudit(env, sess.user.id, 'logout', null, ip, ua);
  }
  return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
}
