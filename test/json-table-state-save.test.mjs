/*
  Test della persistenza dello stato di json-table (`stateSave`, src/web-components/json-table/src/state-save.js).
  Esecuzione: node --test test/

  `fillForm` viene verificato con oggetti che simulano i controlli del form (in node non c'è un DOM).
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

const {
  STATE_VERSION, buildStateKey, colsSignature, normalizeReferrers, isReferrerAllowed, parseSavedState,
  restoreSort, restorePage, fillForm
} = await import('../src/web-components/json-table/src/state-save.js');

const HREF = 'https://intranet.it/clienti/elenco';


test('buildStateKey: stateKey esplicita, altrimenti pathname + id, altrimenti null', () => {
  assert.equal(buildStateKey('elenco-clienti', 'x', '/a'), 'elenco-clienti');
  assert.equal(buildStateKey(null, 'clienti', '/clienti/elenco'), 'json-table:/clienti/elenco:clienti');
  assert.equal(buildStateKey('  ', 'clienti', '/a'), 'json-table:/a:clienti');
  assert.equal(buildStateKey(null, '', '/a'), null);
  assert.equal(buildStateKey(null, null, '/a'), null);
});

test('colsSignature: chiavi delle colonne nell\'ordine', () => {
  assert.equal(colsSignature([{ key: 'id' }, { key: 'name' }]), 'id,name');
});

test('normalizeReferrers: stringa separata da virgole, array con voci non valide scartate', () => {
  assert.equal(normalizeReferrers(null), null);
  assert.deepEqual(normalizeReferrers('/a/scheda, /b '), ['/a/scheda', '/b']);
  const re = /scheda/;
  const fn = () => true;
  /* eslint-disable no-console */
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.deepEqual(normalizeReferrers(['/a', '', 3, re, fn]), ['/a', re, fn]);
    assert.equal(normalizeReferrers(42), null);
  } finally {
    console.warn = warn;
    /* eslint-enable no-console */
  }
});

test('isReferrerAllowed: null, referrer vuoto, reload e back_forward sono sempre ammessi', () => {
  assert.equal(isReferrerAllowed(null, 'https://intranet.it/home', HREF), true);
  assert.equal(isReferrerAllowed(['/clienti/scheda'], '', HREF), true);
  assert.equal(isReferrerAllowed(['/clienti/scheda'], 'https://intranet.it/home', HREF, 'reload'), true);
  assert.equal(isReferrerAllowed(['/clienti/scheda'], 'https://intranet.it/home', HREF, 'back_forward'), true);
});

test('isReferrerAllowed: prefisso di path, RegExp, funzione, origine diversa', () => {
  const refs = ['/clienti/scheda'];
  assert.equal(isReferrerAllowed(refs, 'https://intranet.it/clienti/scheda/12', HREF, 'navigate'), true);
  assert.equal(isReferrerAllowed(refs, 'https://intranet.it/clienti/scheda?id=12', HREF), true);
  assert.equal(isReferrerAllowed(refs, 'https://intranet.it/home', HREF), false);
  assert.equal(isReferrerAllowed(refs, 'https://intranet.it/x/clienti/scheda', HREF), false);
  assert.equal(isReferrerAllowed(refs, 'https://altro.it/clienti/scheda', HREF), false);
  assert.equal(isReferrerAllowed([], 'https://intranet.it/clienti/scheda', HREF), false);

  assert.equal(isReferrerAllowed([/^\/clienti\/\d+\/scheda/g], 'https://intranet.it/clienti/12/scheda', HREF), true);
  assert.equal(isReferrerAllowed([/^\/clienti\/\d+\/scheda/g], 'https://intranet.it/clienti/12/scheda', HREF), true); // lastIndex azzerato
  assert.equal(isReferrerAllowed([/id=\d+/], 'https://intranet.it/scheda?id=5', HREF), true);

  assert.equal(isReferrerAllowed([url => url.searchParams.has('id')], 'https://intranet.it/scheda?id=5', HREF), true);
  assert.equal(isReferrerAllowed([url => url.searchParams.has('id')], 'https://intranet.it/scheda', HREF), false);
});

test('parseSavedState: stato valido normalizzato', () => {
  const raw = JSON.stringify({
    v: STATE_VERSION, sig: 'id,name', savedAt: 1000, page: 3, perPage: 25,
    sort: [{ key: 'name', dir: 'desc' }, { key: 'x', dir: 'up' }, null],
    search: 'mar', filters: [['anno', '2025'], ['stato[]', '1'], ['stato[]', '2'], ['bad']], extra: { ac: 'Rossi' }
  });
  const { state, reason } = parseSavedState(raw, { sig: 'id,name', now: 2000 });
  assert.equal(reason, null);
  assert.deepEqual(state, {
    v: STATE_VERSION, sig: 'id,name', savedAt: 1000, page: 3, perPage: 25,
    sort: [{ key: 'name', dir: 'desc' }],
    search: 'mar', filters: [['anno', '2025'], ['stato[]', '1'], ['stato[]', '2']], extra: { ac: 'Rossi' }
  });
});

test('parseSavedState: assente, JSON non valido, versione o colonne diverse, scaduto', () => {
  const base = { v: STATE_VERSION, sig: 'id', savedAt: 0, page: 1, perPage: 25, sort: [], search: '', filters: null };
  assert.deepEqual(parseSavedState(null, { sig: 'id' }), { state: null, reason: null });
  assert.equal(parseSavedState('{', { sig: 'id' }).reason, 'JSON non valido');
  assert.ok(parseSavedState(JSON.stringify({ ...base, v: 0 }), { sig: 'id' }).reason);
  assert.ok(parseSavedState(JSON.stringify(base), { sig: 'id,name' }).reason);
  assert.equal(parseSavedState(JSON.stringify(base), { sig: 'id', maxAge: 60, now: 61_000 }).reason, 'stato scaduto');
  assert.ok(parseSavedState(JSON.stringify(base), { sig: 'id', maxAge: 60, now: 59_000 }).state);
  assert.ok(parseSavedState(JSON.stringify(base), { sig: 'id', maxAge: 0, now: 1e12 }).state);
});

test('restoreSort: solo colonne esistenti e ordinabili, senza ripetizioni', () => {
  const cols = [{ key: 'id', sortable: true }, { key: 'name', sortable: true }, { key: 'note', sortable: false }];
  assert.deepEqual(
    restoreSort([{ key: 'name', dir: 'desc' }, { key: 'note', dir: 'asc' }, { key: 'old', dir: 'asc' }, { key: 'name', dir: 'asc' }], cols),
    [{ key: 'name', dir: 'desc' }]
  );
  assert.deepEqual(restoreSort([], cols), []);
});

test('restorePage: ricalcolo quando cambiano le righe per pagina', () => {
  assert.equal(restorePage(3, 25, 25), 3);
  assert.equal(restorePage(3, 25, 10), 6);
  assert.equal(restorePage(6, 10, 25), 3);
  assert.equal(restorePage(3, 25, 0), 1);
  assert.equal(restorePage(3, 0, 25), 1);
  assert.equal(restorePage(0, 25, 25), 1);
});


/** Simula un controllo di un form */
const input = (name, props = {}) => ({ tagName: 'INPUT', type: 'text', name, value: '', disabled: false, ...props });
const option = (value, selected = false) => ({ value, selected });
const select = (name, options, multiple = false) => ({ tagName: 'SELECT', type: multiple ? 'select-multiple' : 'select-one', name, multiple, disabled: false, options });

test('fillForm: testo, checkbox e select multiple con nomi ripetuti, campi assenti svuotati', () => {
  const anno = input('anno', { value: '2024' });
  const nota = input('nota', { value: 'vecchia' });
  const ripetuto1 = input('tag[]');
  const ripetuto2 = input('tag[]');
  const chk1 = input('stato[]', { type: 'checkbox', value: '1', checked: false });
  const chk2 = input('stato[]', { type: 'checkbox', value: '2', checked: true });
  const chk3 = input('stato[]', { type: 'checkbox', value: '3', checked: false });
  const radioA = input('tipo', { type: 'radio', value: 'a', checked: true });
  const radioB = input('tipo', { type: 'radio', value: 'b', checked: false });
  const multi = select('zone[]', [option('n'), option('s', true), option('c')], true);
  const single = select('cliente', [option(''), option('7', true), option('9')]);
  const disabled = input('bloccato', { value: 'x', disabled: true });
  const file = input('allegato', { type: 'file', value: '' });
  const btn = { tagName: 'BUTTON', type: 'submit', name: 'invia', value: '1', disabled: false };

  const form = { elements: [anno, nota, ripetuto1, ripetuto2, chk1, chk2, chk3, radioA, radioB, multi, single, disabled, file, btn] };

  fillForm(form, [
    ['anno', '2025'], ['tag[]', 'x'], ['tag[]', 'y'], ['stato[]', '1'], ['stato[]', '3'], ['tipo', 'b'],
    ['zone[]', 'n'], ['zone[]', 'c'], ['cliente', '9']
  ]);

  assert.equal(anno.value, '2025');
  assert.equal(nota.value, '');
  assert.deepEqual([ripetuto1.value, ripetuto2.value], ['x', 'y']);
  assert.deepEqual([chk1.checked, chk2.checked, chk3.checked], [true, false, true]);
  assert.deepEqual([radioA.checked, radioB.checked], [false, true]);
  assert.deepEqual(multi.options.map(o => o.selected), [true, false, true]);
  assert.equal(single.options[2].selected, true);
  assert.equal(disabled.value, 'x');
  assert.equal(btn.value, '1');
});

test('fillForm: select singola senza valore salvato → opzione vuota, se esiste', () => {
  const withEmpty = select('a', [option(''), option('7', true)]);
  const withoutEmpty = select('b', [option('1', true), option('2')]);
  fillForm({ elements: [withEmpty, withoutEmpty] }, []);
  assert.equal(withEmpty.options[0].selected, true);
  assert.deepEqual(withoutEmpty.options.map(o => o.selected), [true, false]);
});
