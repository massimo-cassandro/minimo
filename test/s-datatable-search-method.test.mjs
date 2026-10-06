/*
  Test di non regressione del searchMethod di colonna generato da `_searchValue`
  in s-datatable-component. Esecuzione: node --test test/

  Il searchMethod riceve l'oggetto interno `cellType` di simple-datatables
  ({ data, text?, order?, attributes? }), NON un <td> del DOM: questi test lo chiamano
  con veri oggetti cellType.
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeSearchMethod, normalizeSearchString }
  from '../src/web-components/s-datatable-component/src/search-method.js';

test('searchMethod: reads data-search from the cellType attributes (AND behaviour)', () => {
  const searchMethod = makeSearchMethod({ _searchValue: 'owner.cognome owner.nome' });

  const cell = {
    data: 'Mario Rossi',
    text: 'Mario Rossi',
    order: 'Rossi',
    attributes: { 'data-search': 'Rossi Mario' }
  };

  assert.equal(searchMethod(['rossi'], cell), true);
  assert.equal(searchMethod(['rossi', 'mario'], cell), true);
  assert.equal(searchMethod(['bianchi'], cell), false);
  assert.equal(searchMethod(['rossi', 'bianchi'], cell), false);
});

test('searchMethod: falls back to text, then to data', () => {
  const searchMethod = makeSearchMethod({});

  assert.equal(searchMethod(['rossi'], { data: '<b>Mario Rossi</b>', text: 'Mario Rossi' }), true);
  assert.equal(searchMethod(['rossi'], { data: 'Mario Rossi' }), true);

  // nessuna sorgente utilizzabile → nessuna corrispondenza (ma nemmeno un'eccezione)
  assert.equal(searchMethod(['rossi'], { data: [{ nodeName: 'B' }] }), false);
  assert.equal(searchMethod(['rossi'], undefined), false);
});

test('searchMethod: non-string _searchValue results (numbers, booleans) do not throw', () => {
  const searchMethod = makeSearchMethod({ _searchValue: row => row.id });

  // `_searchValue: row => row.id` scrive un numero in data-search
  const cell = { data: 'Commessa 42', attributes: { 'data-search': 1234 } };

  assert.equal(searchMethod(['123'], cell), true);
  assert.equal(searchMethod(['999'], cell), false);

  const boolCell = { data: 'Sì', attributes: { 'data-search': true } };
  assert.equal(searchMethod(['true'], boolCell), true);
});

test('searchMethod: haystack normalisation matches the one applied to terms', () => {
  const searchMethod = makeSearchMethod({});

  // diacritici: la libreria li rimuove dai termini (sensitivity: 'base')
  assert.equal(searchMethod(['citta'], { data: 'Città di Torino' }), true);
  assert.equal(searchMethod(['citta'], { attributes: { 'data-search': 'Città' } }), true);

  // punteggiatura: ignorePunctuation vale true di default
  assert.equal(searchMethod(['spa'], { data: 'Rossi S.p.A.' }), true);
  assert.equal(searchMethod(['rossispa'], { data: 'Rossi S.p.A.' }), false);

  // maiuscole/minuscole
  assert.equal(searchMethod(['ROSSI'], { data: 'Mario Rossi' }), true);
});

test('searchMethod: honours column sensitivity / ignorePunctuation', () => {
  const accentSensitive = makeSearchMethod({ sensitivity: 'accent' });
  assert.equal(accentSensitive(['citta'], { data: 'Città' }), false);
  assert.equal(accentSensitive(['città'], { data: 'Città' }), true);

  const caseSensitive = makeSearchMethod({ sensitivity: 'variant' });
  assert.equal(caseSensitive(['Rossi'], { data: 'Mario Rossi' }), true);
  assert.equal(caseSensitive(['rossi'], { data: 'Mario Rossi' }), false);

  const keepPunctuation = makeSearchMethod({ ignorePunctuation: false });
  assert.equal(keepPunctuation(['s.p.a.'], { data: 'Rossi S.p.A.' }), true);
  assert.equal(keepPunctuation(['spa'], { data: 'Rossi S.p.A.' }), false);
});

test('normalizeSearchString: default chain (lowercase, NFD, punctuation)', () => {
  assert.equal(normalizeSearchString('Città, S.p.A.'), 'citta spa');
  assert.equal(normalizeSearchString(42), '42');
  assert.equal(normalizeSearchString(null), '');
  assert.equal(normalizeSearchString(undefined), '');
});
