import { getSession, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const sess = await getSession(request, env);
  return sess ? json({ user: sess.user }) : json({ error: 'unauthorized' }, 401);
}
