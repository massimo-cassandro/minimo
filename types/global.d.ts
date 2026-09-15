// Global alias for domBuilder's config-object type, so JSDoc across the codebase can
// reference `DomBuilderItem` directly instead of repeating an `import(...)` type query.
// The canonical definition lives in dom-builder.js — this only re-exports it.
type DomBuilderItem = import('../src/utilities/dom-builder/dom-builder.js').DomBuilderItem;

// Global alias for the `<json-table>` web component class, so consumer scripts can write
// `/** @type {JsonTable} */` without importing the type. The tag name map augmentation makes
// `document.querySelector('json-table')` / `document.createElement('json-table')` return a
// `JsonTable` instance without casts. Consumers get both by adding this file to their
// jsconfig/tsconfig `include` (e.g. "node_modules/@massimo-cassandro/minimo/types/global.d.ts").
type JsonTable = import('../src/web-components/json-table/json-table-component.js').JsonTable;

interface HTMLElementTagNameMap {
  'json-table': JsonTable;
}

// Sanitizer API (Element.setHTML / getHTML). Declared as required members (not optional) so
// the augmentation stays compatible with the lib.dom versions that already include them
// (overload signatures must all be optional or all required); the runtime code still checks
// `typeof el.setHTML === 'function'` before using it.
// https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
interface Element {
  setHTML(input: string, options?: { sanitizer?: unknown }): void;
  getHTML(options?: { serializableShadowRoots?: boolean; shadowRoots?: ShadowRoot[] }): string;
}
