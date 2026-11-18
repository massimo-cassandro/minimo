/*
  Test del collegamento del form di filtro di json-table (`filterForm`, src/web-components/json-table/src/filter-form.js):
  al submit la lettura dei valori è rimandata a un task successivo, dopo i listener della pagina.
  Esecuzione: node --test test/

  Usa jsdom per form, `FormData` e `SubmitEvent`.
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLFormElement = dom.window.HTMLFormElement;
globalThis.FormData = dom.window.FormData;
globalThis.AbortController = dom.window.AbortController;

const { bindFilterForm } = await import('../src/web-components/json-table/src/filter-form.js');

/** Form con un campo `q` e due pulsanti di submit con nome. */
function createForm() {
  document.body.innerHTML = `
    <form>
      <input name="q" value="iniziale">
      <input type="hidden" name="id" value="">
      <button name="azione" value="cerca">Cerca</button>
      <button name="azione" value="esporta">Esporta</button>
    </form>`;
  return document.querySelector('form');
}

/** Istanza fittizia del componente: registra le chiamate a `_applyFilters`. */
function createJt(form) {
  const calls = [];
  const jt = {
    params: { filterForm: form, serverSide: false },
    _applyFilters: filters => calls.push(filters.toString()),
    clearState: () => {}
  };
  return { jt, calls };
}

const submit = (form, submitter) => form.dispatchEvent(
  new dom.window.SubmitEvent('submit', { submitter, cancelable: true, bubbles: true })
);


test('submit: preventDefault sincrono, lettura rimandata dopo i listener della pagina', async () => {
  const form = createForm();
  const { jt, calls } = createJt(form);

  bindFilterForm(jt);

  // listener della pagina registrato dopo quello del componente (es. autocomplete che valorizza un campo nascosto)
  form.addEventListener('submit', () => {
    form.elements.id.value = '42';
    form.elements.q.value = 'aggiornato';
  });

  const notCanceled = submit(form, form.querySelector('[value="esporta"]'));

  assert.equal(notCanceled, false, 'preventDefault deve essere sincrono');
  assert.equal(calls.length, 0, 'nessuna lettura sincrona');

  await Promise.resolve();
  assert.equal(calls.length, 0, 'nessuna lettura in un microtask');

  await delay(0);
  assert.deepEqual(calls, ['q=aggiornato&id=42&azione=esporta']);
});

test('submit: senza submitter vengono letti solo i campi', async () => {
  const form = createForm();
  const { jt, calls } = createJt(form);
  bindFilterForm(jt);

  submit(form, null);
  await delay(0);
  assert.deepEqual(calls, ['q=iniziale']);
});

test('submit: nessuna lettura se il collegamento viene rimosso prima del task', async () => {
  const form = createForm();
  const { jt, calls } = createJt(form);
  bindFilterForm(jt);

  submit(form, null);
  jt._filterFormController.abort();

  await delay(0);
  assert.equal(calls.length, 0);
});

test('submit: un submitter rimosso dal form nel frattempo viene ignorato', async () => {
  const form = createForm();
  const { jt, calls } = createJt(form);
  bindFilterForm(jt);

  const btn = form.querySelector('[value="cerca"]');
  submit(form, btn);
  btn.remove();

  await delay(0);
  assert.deepEqual(calls, ['q=iniziale']);
});
