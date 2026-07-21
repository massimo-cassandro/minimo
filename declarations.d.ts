// Global type declarations for webpack-specific module types.
// Allows tsc --noEmit to run without errors on CSS, CSS Modules, and SVG imports.

declare module '*.css';

declare module '*.module.css' {
  const styles: { readonly [className: string]: string };
  export = styles;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.svg?inline' {
  const content: string;
  export default content;
}

// Optional peer dependencies — not installed in the dev environment.
declare module 'blurhash';
declare module '@tarekraafat/autocomplete.js';
declare module '@massimo-cassandro/modal-alert';

// Global alias for domBuilder's config-object type, so JSDoc across the codebase can
// reference `DomBuilderItem` directly instead of repeating an `import(...)` type query.
// The canonical definition lives in dom-builder.js — this only re-exports it.
type DomBuilderItem = import('./src/utilities/dom-builder/dom-builder.js').DomBuilderItem;

// Sanitizer API (Element.setHTML / getHTML) — not yet in TypeScript's lib.dom.d.ts.
// https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTML
interface Element {
  setHTML?(input: string, options?: { sanitizer?: unknown }): void;
  getHTML?(options?: { serializableShadowRoots?: boolean; shadowRoots?: ShadowRoot[] }): string;
}
