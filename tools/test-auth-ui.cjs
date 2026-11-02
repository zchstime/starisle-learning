const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const scripts = ['profile', 'auth'].map(name => fs.readFileSync(require.resolve('../web/auth/' + name + '.js'), 'utf8'));

async function check(search, account = null) {
 const dom = new JSDOM('<!doctype html><body></body>', { url: 'http://127.0.0.1:7456/' + search, runScripts: 'outside-only' });
 const w = dom.window, requests = [], cloudUsers = [];
 w.fetch = async url => {
  requests.push(url);
  return { ok: true, json: async () => url.endsWith('/config') ? { mode: 'demo' } : { user: account } };
 };
 w.starisleCloud = { start: async user => cloudUsers.push(user.id) };
 try {
  for (const script of scripts) w.eval(script);
  const settle = () => new Promise(resolve => setImmediate(resolve));
  await settle();
  const panel = w.document.getElementById('account-screen');
  const preview = !!search;
  if (preview) {
   await w.starisleAuthReady;
   assert.equal(panel.hidden, true);
   assert.deepEqual(requests, [], 'preview startup must not load an account');
  } else if (!account) {
   assert.equal(panel.hidden, false);
   w.document.getElementById('guest').click();
  }
  await w.starisleAuthReady;
  w.dispatchEvent(new w.CustomEvent('starisle:game-screen', { detail: 'map' }));
  const entry = w.document.getElementById('personal-entry');
  assert.equal(entry.hidden, false);
  entry.click();
  await settle();
  assert.equal(panel.hidden, false, 'personal center must open');
  assert.equal(w.document.body.classList.contains('auth-open'), true);
  assert.equal(entry.hidden, true);
  assert.equal(w.document.getElementById('phone-form').hidden, !!account);
  assert.equal(w.document.getElementById('profile').hidden, !account);
  assert.deepEqual(cloudUsers, account ? [account.id] : []);
  if (preview) assert.deepEqual(requests, ['/api/auth/config']);
  w.document.getElementById(account ? 'resume' : 'guest').click();
  await settle();
  assert.equal(panel.hidden, true, 'continue must return to the map');
  assert.equal(entry.hidden, false);
 } finally { w.close(); }
}

(async () => {
 await check('?localPreview=1');
 await check('?contentPreview=1');
 await check('');
 await check('', { id: 'test-account', masked: '138****0001' });
 console.log('PASS auth UI: preview and normal personal center, guest return, signed-in profile, cloud isolation');
})().catch(error => { console.error(error); process.exitCode = 1; });
