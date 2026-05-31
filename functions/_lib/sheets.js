// Google Sheets reader — pulls named tabs from a PUBLIC Google Spreadsheet as
// CSV (the gviz endpoint, no API key / OAuth needed) and returns each tab as a
// 2-D array of strings, first row = headers.
//
// The page "08. Progress Report" maps these onto its dashboard data
// (applyLiveProgress()) and falls back to its baked-in mock when a tab is
// missing or unparsable. Seed/template: docs/IMA_Progress.xlsx (import into
// Google Sheets). Each tab must have its headers in row 1.
//
// Tabs (one per dashboard block):
//   KPI, Phase, Sections, Variance, Milestones, Engineering, Procurement, SCurve, WPInfo
//
// Required env (var): SHEETS_ID    — the spreadsheet id (the long token in its URL)
// Optional env (var): SHEETS_TABLES — comma-separated tab-name override
//
// The spreadsheet must be shared "Anyone with the link → Viewer" for gviz to read it.

const DEFAULT_TABLES = [
  'KPI', 'Phase', 'Sections', 'Variance',
  'Milestones', 'Engineering', 'Procurement', 'SCurve', 'WPInfo',
];

let _cache = null, _cacheExp = 0;
const CACHE_MS = 5 * 60 * 1000;

// Minimal RFC-4180 CSV parser: handles quoted fields, escaped quotes ("") and
// newlines inside quotes. Returns an array of string rows.
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else q = false;
      } else field += c;
    } else if (c === '"') {
      q = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  // drop fully-empty trailing rows, then pad short rows to the header width
  while (rows.length && rows[rows.length - 1].every(c => c === '')) rows.pop();
  const w = rows.length ? rows[0].length : 0;
  for (const r of rows) while (r.length < w) r.push('');
  return rows;
}

// Fetch one tab as CSV. Returns a 2-D array, or null when the tab/sheet is not
// readable (so the caller keeps its mock for that block).
async function fetchTab(id, name) {
  const url =
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq` +
    `?tqx=out:csv&headers=1&sheet=${encodeURIComponent(name)}`;
  const r = await fetch(url, { headers: { accept: 'text/csv' } });
  if (!r.ok) return null;
  const ct = r.headers.get('content-type') || '';
  const body = await r.text();
  // A wrong id / unshared sheet redirects to an HTML login page — reject that.
  if (ct.includes('text/html') || body.slice(0, 15).toLowerCase().includes('<!doctype')) return null;
  const rows = parseCSV(body);
  return rows.length ? rows : null;
}

export async function readProgress(env) {
  const now = Date.now();
  if (_cache && now < _cacheExp) return _cache;

  const id = env.SHEETS_ID;
  const names = (env.SHEETS_TABLES || '').trim()
    ? env.SHEETS_TABLES.split(',').map(s => s.trim()).filter(Boolean)
    : DEFAULT_TABLES;

  const results = await Promise.all(names.map(async (n) => {
    try { return [n, await fetchTab(id, n)]; }
    catch (e) { return [n, { __error: String(e).slice(0, 200) }]; }
  }));

  const tables = {}, errors = {};
  for (const [n, v] of results) {
    if (v && v.__error) errors[n] = v.__error;
    else if (v) tables[n] = v;          // null (missing/unshared) is silently skipped
  }

  _cache = {
    tables,
    errors: Object.keys(errors).length ? errors : undefined,
    fetchedAt: new Date().toISOString(),
  };
  _cacheExp = now + CACHE_MS;
  return _cache;
}

// Force-refresh (admin "sync now").
export function invalidateProgressCache() { _cache = null; _cacheExp = 0; }
