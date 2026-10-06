/*
  Alias globale del tipo dell'oggetto di configurazione di domBuilder, così che il JSDoc in tutto il codice possa
  referenziare direttamente `DomBuilderItem` invece di ripetere una type query `import(...)`.
  La definizione canonica si trova in dom-builder.js — qui viene solo riesportata.
*/
type DomBuilderItem = import('../src/utilities/dom-builder/dom-builder.js').DomBuilderItem;

/*
  Alias globale della classe del web component `<json-table>`, così che gli script dei consumer possano scrivere
  un'annotazione JSDoc `@type {JsonTable}` senza importare il tipo. L'augmentation della tag name map fa sì che
  `document.querySelector('json-table')` / `document.createElement('json-table')` restituiscano un'istanza
  `JsonTable` senza cast. I consumer ottengono entrambi aggiungendo questo file all'`include` del proprio
  jsconfig/tsconfig (es. "node_modules/@massimo-cassandro/minimo/types/global.d.ts").
*/
type JsonTable = import('../src/web-components/json-table/json-table-component.js').JsonTable;

interface HTMLElementTagNameMap {
  'json-table': JsonTable;
}

/*
  Sanitizer API (Element.setHTML / getHTML). Dichiarate come membri obbligatori (non opzionali) così che
  l'augmentation resti compatibile con le versioni di lib.dom che già le includono
  (le firme in overload devono essere tutte opzionali o tutte obbligatorie); il codice a runtime controlla comunque
  `typeof el.setHTML === 'function'` prima di usarle.
*/
// https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
interface Element {
  setHTML(input: string, options?: { sanitizer?: unknown }): void;
  getHTML(options?: { serializableShadowRoots?: boolean; shadowRoots?: ShadowRoot[] }): string;
}
