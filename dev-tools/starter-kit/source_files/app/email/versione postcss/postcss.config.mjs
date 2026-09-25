// config postcss per le CSS delle email (npm run "postcss email")
// NB: in ESM perché postcss-nested >= 8 è ESM-only
//
// https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-custom-properties#readme

import postcssNested from 'postcss-nested';
import postcssImport from 'postcss-import';
import customProperties from 'postcss-custom-properties';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

// postcss-custom-properties mantiene sempre le dichiarazioni `--*` in :root:
// una volta risolte le var() non servono più (e i client email non le supportano).
// Rimuove anche i commenti (finirebbero nel <style> dell'email) e le regole rimaste vuote.
const cleanup = {
  postcssPlugin: 'email-css-cleanup',
  OnceExit(root) {
    root.walkComments(comment => comment.remove());
    root.walkDecls(/^--/, decl => decl.remove());
    root.walkRules(rule => { if (rule.nodes.length === 0) rule.remove(); });
  }
};

export default () => {
  const plugins = [
    // gli @import vanno risolti prima del nesting e delle custom properties
    postcssImport(),
    postcssNested(),
    // risolve le var(--mail-*) e rimuove il blocco :root
    // (i client email non supportano le custom properties)
    customProperties({ preserve: false }),
    cleanup,
    autoprefixer(),
    // https://cssnano.github.io/cssnano/docs/what-are-optimisations/
    // minifySelectors riscrive `.a td, .a th` in `.a :is(td,th)`,
    // non supportato da Gmail/Outlook
    cssnano({ preset: ['default', { minifySelectors: false }] }),
  ];

  return { plugins };
};
