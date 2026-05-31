// GET /api/progress  → latest Progress data pulled from Excel 365 (via Graph).
// Session required (enforced by _middleware for all /api/* except /api/login).
import { readProgress } from '../_lib/graph.js';
import { json } from '../_lib/auth.js';

export async function onRequestGet({ env }) {
  if (!env.GRAPH_CLIENT_ID) return json({ error: 'graph_not_configured' }, 503);
  try {
    const { tables, errors, fetchedAt } = await readProgress(env);
    return json({ tables, errors, fetchedAt });
  } catch (e) {
    return json({ error: 'progress_unavailable', detail: String(e).slice(0, 200) }, 502);
  }
}
