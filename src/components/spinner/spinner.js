import * as styles from './spinner.module.css';
import { classnames } from '../../utilities/classnames.js';

/** @typedef {import('../../utilities/dom-builder/dom-builder.js').DomBuilderItem} DomBuilderItem */

// La classe dello spinner dipende dal tipo di spinner in uso; deve essere incluso il file CSS corrispondente.
// TODO: sistema per configurare il tipo di spinner, così da consentire più tipi di spinner nello stesso progetto

// overload: il tipo restituito dipende dal valore di `output`
/**
 * @overload
 * @param {{spinnerExtraClass?: string|null, output?: 'html'}} [options]
 * @returns {string}
 */
/**
 * @overload
 * @param {{spinnerExtraClass?: string|null, output: 'element'}} options
 * @returns {HTMLDivElement}
 */
/**
 * @overload
 * @param {{spinnerExtraClass?: string|null, output: 'domBuilder'}} options
 * @returns {DomBuilderItem}
 */
/**
 * Restituisce uno spinner di caricamento come stringa HTML (default), elemento DOM o oggetto `domBuilder`.
 * @param {Object} [options={}] - Opzioni (default: {})
 * @param {string|null} [options.spinnerExtraClass=null] - Classi aggiuntive per l'elemento `.spinner`, che si sommano a quella di default (default: null)
 * @param {'html'|'element'|'domBuilder'} [options.output='html'] - Formato di uscita: stringa HTML, elemento wrapper o `DomBuilderItem`. Un valore non valido produce un `console.error` e ripiega su `'html'` (default: 'html')
 * @returns {string|HTMLDivElement|DomBuilderItem} Lo spinner nel formato richiesto
 * @example
 * spinner({
 *   spinnerExtraClass: null,
 *   output: 'html'
 * });
 */
export function spinner({spinnerExtraClass = null, output = 'html'} = {}) {
  const spinnerClass = classnames('spinner', spinnerExtraClass);

  // NB: la struttura domBuilder va tenuta allineata manualmente al markup HTML sottostante
  if(output === 'domBuilder') {
    return {
      className: styles.spinnerWrapper,
      children: [
        { className: spinnerClass, content: 'Loading...' }
      ]
    };
  }

  const html = `<div class="${styles.spinnerWrapper}">
    <div class="${spinnerClass}">Loading...</div>
  </div>`;

  if(output === 'element') {
    const template = document.createElement('template');
    template.innerHTML = html;
    return /** @type {HTMLDivElement} */ (template.content.firstElementChild);
  }

  if(output !== 'html') {
    // eslint-disable-next-line no-console
    console.error(`[spinner] valore di output non valido: "${output}", uso "html"`);
  }

  return html;
}
