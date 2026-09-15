// Type declarations for webpack-specific module types used by the demo.
// The root `declarations.d.ts` is not visible here (the root jsconfig excludes `demo/`
// and the demo jsconfig does not include it), so the needed declarations are repeated.

declare module '*.html' {
  const content: string;
  export default content;
}

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

// Global alias for domBuilder's config-object type, same as the root `types/global.d.ts`
// (referenced by the JSDoc of several minimo modules imported by the demos).
type DomBuilderItem = import('../src/utilities/dom-builder/dom-builder.js').DomBuilderItem;

// `<json-table>` tag name map augmentation, same as the root `types/global.d.ts`:
// `document.querySelector('json-table')` is typed as the component class.
interface HTMLElementTagNameMap {
  'json-table': import('../src/web-components/json-table/json-table-component.js').JsonTable;
}

// Sanitizer API (Element.setHTML / getHTML). Same augmentation as the root `types/global.d.ts`
// (used by domBuilder and json-table); required members, see the note there.
interface Element {
  setHTML(input: string, options?: { sanitizer?: unknown }): void;
  getHTML(options?: { serializableShadowRoots?: boolean; shadowRoots?: ShadowRoot[] }): string;
}
