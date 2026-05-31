// Runs on EVERY request before any static file is served.
// Gates protected pages/assets behind a valid session cookie.
import { getSession, json, logAudit, clientInfo } from './_lib/auth.js';

// Paths reachable WITHOUT a session (login page + login API + its assets).
const PUBLIC = [
  /^\/$/,
  /^\/index\.html$/,
  /^\/api\/login$/,
  /^\/favicon\./,
  /^\/assets\/login/,        // put login-page-only images here if any
];

export async function onRequest(context) {
  const { request, env, next, data } = context;
  const path = new URL(request.url).pathname;

  if (PUBLIC.some(re => re.test(path))) return next();

  const sess = await getSession(request, env);
  if (!sess) {
    if (path.startsWith('/api/')) return json({ error: 'unauthorized' }, 401);
    return Response.redirect(new URL('/index.html', request.url).toString(), 302);
  }
  data.user = sess.user;                            // available to downstream functions

  // Audit page views only (skip api/asset noise).
  if (path.endsWith('.html')) {
    const { ip, ua } = clientInfo(request);
    await logAudit(env, sess.user.id, 'view', path, ip, ua);
  }
  return next();
}
