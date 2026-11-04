// דף הקיצורים האישי של חן: מפתח אישי מהקישור (#k=), שמירה בדפדפן, שליחה לתיבת קלוד (ויקס) ופענוח נתונים מוצפנים
const CLIENT_ID = '058da38e-a911-4b84-876e-e5efedfa9ae9', COL = 'HenInbox';
const store = { get(k, d) { try { return localStorage.getItem(k) || d } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, v) } catch (e) {} } };
export const $ = id => document.getElementById(id);
export function getSecret() {
  let s = (location.hash.match(/k=([\w-]+)/) || [])[1] || store.get('henlinks-k', '');
  if (s) { store.set('henlinks-k', s); if (location.hash) history.replaceState(null, '', location.pathname + location.search); }
  return s;
}
export function needKey(main) { main.innerHTML = '<div class="lock">הדף נפתח רק מהקישור האישי ששלחתי לך.</div>'; }
let wix = null;
async function client() {
  if (wix) return wix;
  const [{ createClient, OAuthStrategy }, { items }] = await Promise.all([import('https://esm.sh/@wix/sdk@1.21.16'), import('https://esm.sh/@wix/data@1.0.525')]);
  wix = createClient({ auth: OAuthStrategy({ clientId: CLIENT_ID }), modules: { items } }); return wix;
}
export async function send(secret, row) {
  const c = await client();
  for (let t = 0; ; t++) { try { return await c.items.insert(COL, { title: secret, synced: false, ...row }); } catch (e) { if (t >= 2) throw e; await new Promise(r => setTimeout(r, 1500)); } }
}
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
export async function loadEnc(secret, name) {
  const r = await fetch(name + '?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw new Error('אין נתונים עדיין');
  const j = await r.json();
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: unb64(j.salt), iterations: 100000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(j.iv) }, key, unb64(j.ct));
  const text = await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  return JSON.parse(text);
}
export const fileToB64 = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(f); });
export function setSt(el, msg, cls) { el.textContent = msg; el.className = 'st ' + (cls || ''); }
