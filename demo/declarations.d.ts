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

// Sanitizer API (Element.setHTML / getHTML) — not yet in TypeScript's lib.dom.d.ts.
// Same augmentation as the root `types/global.d.ts` (used by domBuilder and json-table).
interface Element {
  setHTML?(input: string, options?: { sanitizer?: unknown }): void;
  getHTML?(options?: { serializableShadowRoots?: boolean; shadowRoots?: ShadowRoot[] }): string;
}
