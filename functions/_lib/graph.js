// Microsoft Graph reader — pulls named Excel Tables from a workbook on
// OneDrive/SharePoint using app-only (client credentials) auth.
//
// Each table is returned as a 2-D array of cell values, first row = headers.
// The page "08. Progress Report" maps these tables onto its dashboard data
// (see applyLiveProgress() there) and falls back to its baked-in mock when a
// table is missing or unparsable. Template + column docs: docs/IMA_Progress.xlsx.
//
// Tables (one per sheet in the workbook):
//   KPI, Phase, Sections, Variance, Milestones, Engineering, Procurement, SCurve, WPInfo
//
// Required env (secrets): GRAPH_TENANT, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET
// Required env (vars):    GRAPH_USER, GRAPH_FILE_PATH
// Optional env (var):     GRAPH_TABLES  (comma-separated override of the list above)

const DEFAULT_TABLES = [
  'KPI', 'Phase', 'Sections', 'Variance',
  'Milestones', 'Engineering', 'Procurement', 'SCurve', 'WPInfo',
];

let _token = null, _tokenExp = 0;       // module-scope cache (per warm isolate)
let _cache = null, _cacheExp = 0;
const CACHE_MS = 5 * 60 * 1000;

async function getToken(env) {
  const now = Date.now();
  if (_token && now < _tokenExp) return _token;
  const body = new URLSearchParams({
    client_id: env.GRAPH_CLIENT_ID,
    client_secret: env.GRAPH_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });
  const r = await fetch(`https://login.microsoftonline.com/${env.GRAPH_TENANT}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) throw new Error(`token ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  _token = j.access_token;
  _tokenExp = now + (j.expires_in - 60) * 1000;
  return _token;
}

// Read one table's full range (header row included). Returns null if the table
// does not exist (404) so the caller can keep its mock for that block.
async function fetchTable(env, token, name) {
  const url =
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.GRAPH_USER)}` +
    `/drive/root:${env.GRAPH_FILE_PATH}:/workbook/tables('${encodeURIComponent(name)}')/range`;
  const r = await fetch(url, { headers: { authorization: 'Bearer ' + token } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`graph ${name} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return j.values || [];
}

export async function readProgress(env) {
  const now = Date.now();
  if (_cache && now < _cacheExp) return _cache;

  const token = await getToken(env);
  const names = (env.GRAPH_TABLES || '').trim()
    ? env.GRAPH_TABLES.split(',').map(s => s.trim()).filter(Boolean)
    : DEFAULT_TABLES;

  // Fetch tables concurrently; a single failing table is reported but does not
  // sink the whole response (the page falls back per-block).
  const results = await Promise.all(names.map(async (n) => {
    try { return [n, await fetchTable(env, token, n)]; }
    catch (e) { return [n, { __error: String(e).slice(0, 200) }]; }
  }));

  const tables = {}, errors = {};
  for (const [n, v] of results) {
    if (v && v.__error) errors[n] = v.__error;
    else if (v) tables[n] = v;          // null (404) is silently skipped
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
