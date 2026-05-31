// Generate an admin INSERT (PBKDF2-SHA256, matches functions/_lib/auth.js).
// Usage:
//   node seed.mjs admin "YourStrongPassword" admin   > seed.sql
//   node seed.mjs john  "AnotherPassword"    viewer  >> seed.sql
// Then:
//   npx wrangler d1 execute ima_db --remote --file=./seed.sql
import { webcrypto as crypto } from 'node:crypto';

const [username, password, role = 'viewer'] = process.argv.slice(2);
if (!username || !password) {
  console.error('Usage: node seed.mjs <username> <password> [admin|viewer]');
  process.exit(1);
}

const enc = new TextEncoder();
const hex = b => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);

const r = role === 'admin' ? 'admin' : 'viewer';
console.log(
  `INSERT INTO users(username,pass_hash,salt,role) VALUES('${username.replace(/'/g, "''")}','${hex(new Uint8Array(bits))}','${hex(salt)}','${r}');`
);
