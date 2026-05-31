// Microsoft Graph reader — pulls a 2-column Excel Table (Key | Value) from
// OneDrive/SharePoint using app-only (client credentials) auth.
//
// Excel layout expected (a Table named per env.GRAPH_TABLE, default "Progress"):
//   | Key            | Value      |
//   | overall_pct    | 42         |
//   | data_date      | 2027-09-30 |
//   | reporting_week | 65         |
//   ...add as many rows as you like; each becomes data[key] = value
//
// Required env (secrets): GRAPH_TENANT, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET
// Required env (vars):    GRAPH_USER, GRAPH_FILE_PATH, GRAPH_TABLE

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

export async function readProgress(env) {
  const now = Date.now();
  if (_cache && now < _cacheExp) return _cache;

  const token = await getToken(env);
  const url =
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.GRAPH_USER)}` +
    `/drive/root:${env.GRAPH_FILE_PATH}:/workbook/tables('${env.GRAPH_TABLE}')/rows`;

  const r = await fetch(url, { headers: { authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error(`graph ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();

  const data = {};
  for (const row of (j.value || [])) {
    const cells = (row.values && row.values[0]) || [];
    const key = (cells[0] ?? '').toString().trim();
    if (key) data[key] = cells[1];
  }

  _cache = { data, fetchedAt: new Date().toISOString() };
  _cacheExp = now + CACHE_MS;
  return _cache;
}

// Force-refresh (admin "sync now").
export function invalidateProgressCache() { _cache = null; _cacheExp = 0; }
