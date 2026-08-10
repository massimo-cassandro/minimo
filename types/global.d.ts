// Global alias for domBuilder's config-object type, so JSDoc across the codebase can
// reference `DomBuilderItem` directly instead of repeating an `import(...)` type query.
// The canonical definition lives in dom-builder.js — this only re-exports it.
type DomBuilderItem = import('../src/utilities/dom-builder/dom-builder.js').DomBuilderItem;

// Sanitizer API (Element.setHTML / getHTML) — not yet in TypeScript's lib.dom.d.ts.
// https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
interface Element {
  setHTML?(input: string, options?: { sanitizer?: unknown }): void;
  getHTML?(options?: { serializableShadowRoots?: boolean; shadowRoots?: ShadowRoot[] }): string;
}
