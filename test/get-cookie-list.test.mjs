/*
  Test di getCookieList (src/components/vanilla-cookie-consent/get-cookie-list.js).
  Esecuzione: node --test test/
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { getCookieList } = await import('../src/components/vanilla-cookie-consent/get-cookie-list.js');

test('senza configurazione: solo i necessari, con cc_cookie', () => {
  const list = getCookieList();

  assert.equal(list.length, 1);
  assert.equal(list[0].key, 'necessary');
  assert.equal(list[0].section, 'Cookie strettamente necessari');
  assert.deepEqual(list[0].cookies.map(c => c.name), ['cc_cookie']);
});

test('righe del progetto, moduli e titoli personalizzati', () => {
  const list = getCookieList({
    modules: { googleMaps: { enabled: true, description: 'Mappa' } },
    cookies: { necessary: [{ name: 'pref', type: 'localStorage', domain: 'Questo sito', description: 'Preferita' }] },
    categories: { functionality: { title: 'Mappa (Google Maps)' } },
  });

  assert.deepEqual(list.map(s => s.key), ['necessary', 'functionality']);
  assert.equal(list[1].section, 'Mappa (Google Maps)');
  assert.deepEqual(list[0].cookies[1], {
    name: 'pref', type: 'localStorage', domain: 'Questo sito', description: 'Preferita', expiration: ''
  });
  assert.equal(list[1].cookies[0].name, 'Google Maps');
  assert.equal(list[1].cookies[0].description, 'Mappa');
});

test('type predefinito "cookie" e copie indipendenti dai default', () => {
  const first = getCookieList();

  assert.equal(first[0].cookies[0].type, 'cookie');
  first[0].cookies[0].description = 'modificata';
  assert.equal(getCookieList()[0].cookies[0].description, 'Registra la tua scelta sui cookie');
});
