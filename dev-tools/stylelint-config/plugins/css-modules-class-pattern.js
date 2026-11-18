/**
 * Plugin stylelint `minimo/css-modules-class-pattern`
 *
 * Variante di `selector-class-pattern` pensata per i CSS modules: le classi
 * del modulo vengono confrontate con il pattern principale (es. camelCase),
 * mentre le classi racchiuse in `:global(...)` / `:local(...)`, o che seguono
 * le forme senza parentesi `:global` / `:local` (fino alla fine del selettore),
 * vengono confrontate con il pattern secondario `wrappedPattern`.
 * Se `wrappedPattern` non è impostato, le classi racchiuse non vengono controllate.
 *
 * @example
 * // stylelint.config.mjs
 * plugins: ['./plugins/css-modules-class-pattern.js'],
 * rules: {
 *   'minimo/css-modules-class-pattern': [
 *     '^[a-z]+(_?[A-Z]?[a-z0-9]*)*$', // pattern classi del modulo, OBBL
 *     {
 *       wrappedPattern: '^[a-z][a-z0-9\\-]*[a-z0-9]$', // pattern classi in :global()/:local(), FAC
 *     },
 *   ],
 * }
 */

import stylelint from 'stylelint';
import selectorParser from 'postcss-selector-parser';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions }
} = stylelint;

const ruleName = 'minimo/css-modules-class-pattern';

const messages = ruleMessages(ruleName, {
  expected: (selector, pattern) => `Expected "${selector}" to match pattern "${pattern}"`,
  expectedWrapped: (selector, pattern) =>
    `Expected "${selector}" (inside :global/:local) to match pattern "${pattern}"`
});

const meta = {
  url: 'https://github.com/massimo-cassandro/minimo/tree/main/dev-tools/stylelint-config'
};

const MODULE_PSEUDO = /^:(global|local)$/i;

const isStringOrRegExp = value => typeof value === 'string' || value instanceof RegExp;
const toRegExp = value => (typeof value === 'string' ? new RegExp(value) : value);

/**
 * @param {string|RegExp} primary - Pattern delle classi del modulo
 * @param {{wrappedPattern?: string|RegExp}} [secondaryOptions] - Opzioni (default: nessun controllo sulle classi in `:global`/`:local`)
 */
const ruleFunction = (primary, secondaryOptions) => {
  return (root, result) => {
    const validOptions = validateOptions(
      result,
      ruleName,
      { actual: primary, possible: [isStringOrRegExp] },
      {
        actual: secondaryOptions,
        possible: { wrappedPattern: [isStringOrRegExp] },
        optional: true
      }
    );

    if (!validOptions) {
      return;
    }

    const pattern = toRegExp(primary);
    const wrappedPattern = secondaryOptions?.wrappedPattern
      ? toRegExp(secondaryOptions.wrappedPattern)
      : null;

    root.walkRules(ruleNode => {
      const selector = ruleNode.raws.selector?.raw ?? ruleNode.selector;

      // selettori con interpolazioni SCSS/Less o senza classi: ignorati
      if (!selector.includes('.') || /#\{|@\{/.test(selector)) {
        return;
      }

      // selettori dei keyframes (from, to, percentuali)
      if (ruleNode.parent?.type === 'atrule' && /keyframes$/i.test(ruleNode.parent.name)) {
        return;
      }

      const checkClass = (classNode, wrapped) => {
        const currentPattern = wrapped ? wrappedPattern : pattern;

        if (!currentPattern || currentPattern.test(classNode.value)) {
          return;
        }

        const index = classNode.sourceIndex;
        const classString = classNode.toString().trim();

        report({
          result,
          ruleName,
          message: wrapped ? messages.expectedWrapped : messages.expected,
          messageArgs: [classString, wrapped ? secondaryOptions.wrappedPattern : primary],
          node: ruleNode,
          index,
          endIndex: index + classString.length
        });
      };

      /**
       * Analizza in sequenza i nodi di un selettore, tenendo traccia della
       * modalità `:global`/`:local` senza parentesi, che si applica a tutto
       * ciò che segue fino alla fine del selettore.
       */
      const checkSelector = (selectorNode, wrapped) => {
        let mode = wrapped;

        selectorNode.each(node => {
          if (node.type === 'pseudo' && MODULE_PSEUDO.test(node.value)) {
            if (node.nodes.length) {
              // forma con parentesi: :global(.foo) / :local(.foo)
              node.each(inner => checkSelector(inner, true));
            } else {
              // forma senza parentesi: :global .foo .bar
              mode = true;
            }
            return;
          }

          if (node.type === 'class') {
            checkClass(node, mode);

          } else if (node.nodes) {
            // altre pseudo-classi funzionali: :not(), :is(), :where(), :has(), ...
            node.each(inner => checkSelector(inner, mode));
          }
        });
      };

      try {
        selectorParser(selectors => {
          selectors.each(sel => checkSelector(sel, false));
        }).processSync(selector);

      } catch {
        // selettore non analizzabile: la segnalazione spetta ad altre regole
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default createPlugin(ruleName, ruleFunction);
