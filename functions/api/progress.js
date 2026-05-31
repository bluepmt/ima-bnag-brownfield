// GET /api/progress  → latest Progress data pulled from a public Google Sheet.
// Session required (enforced by _middleware for all /api/* except /api/login).
import { readProgress } from '../_lib/sheets.js';
import { json } from '../_lib/auth.js';

export async function onRequestGet({ env }) {
  if (!env.SHEETS_ID) return json({ error: 'sheets_not_configured' }, 503);
  try {
    const { tables, errors, fetchedAt } = await readProgress(env);
    return json({ tables, errors, fetchedAt });
  } catch (e) {
    return json({ error: 'progress_unavailable', detail: String(e).slice(0, 200) }, 502);
  }
}
