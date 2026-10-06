/*! minimo - Symfony Macro Manager */
import './sf-macro.css';

// TODO[epic=v2] in una v. 2 di minimo, rinominare wrapper_selector e row_selector in
// wrapperClass e rowClass (NB: classi, non selettori, per uniformità con closeBtnClass/addBtnClass/containerClass
// aggiunti sotto) e rendere tutti i parametri camelCase.
// TODO[epic=v2] valutare se rendere opzionale, tramite parametro, l'importazione statica
// di sf-macro.css qui sopra (questione lasciata in sospeso).

/**
 * Inizializza i campi collection macro di Symfony (fieldset ripetibili).
 * @param {Object} [options={}] (default: {})
 * @param {string} [options.wrapper_selector='.sf-macro-wrapper'] - Selettore dell'elemento wrapper esterno. (default: '.sf-macro-wrapper')
 * @param {string} [options.row_selector='.sf-macro-riga'] - Selettore di ogni riga ripetibile. (default: '.sf-macro-riga')
 * @param {string} [options.closeBtnClass='sf-macro-close-btn'] - Nome della classe del pulsante di rimozione riga. (default: 'sf-macro-close-btn')
 * @param {string} [options.addBtnClass='sf-macro-riga-add'] - Nome della classe del pulsante di aggiunta riga. (default: 'sf-macro-riga-add')
 * @param {string} [options.containerClass='sf-macro-container'] - Nome della classe del contenitore delle righe. (default: 'sf-macro-container')
 * @param {((newRow: Element | null, addBtn: Element | null) => void) | null} [options.add_callback=null] - Chiamata dopo l'aggiunta di una riga; riceve la nuova riga e il pulsante di aggiunta. (default: null)
 * @param {((row: Element | null, closeBtn: Element | null) => boolean | Promise<boolean>) | null} [options.preDelCallback=null] - Chiamata alla pressione del pulsante di rimozione riga, prima che la riga venga rimossa; riceve la riga e il pulsante di chiusura. Può restituire una Promise (ad es. per attendere una finestra di conferma): la riga viene rimossa solo se il valore risolto non è `false`. (default: null)
 * @param {((row: Element | null, closeBtn: Element | null) => void) | null} [options.del_callback=null] - Chiamata dopo la rimozione di una riga; riceve la riga rimossa (ormai scollegata) e il pulsante di chiusura. (default: null)
 * @param {boolean} [options.insertAtTop=false] - Se true, le nuove righe vengono inserite in cima. (default: false)
 * @returns {void}
 */
export function sf_macro({
  wrapper_selector = '.sf-macro-wrapper',
  row_selector = '.sf-macro-riga',
  /*
    Modificare closeBtnClass/addBtnClass/containerClass solo se non si vuole usare
    il file sf-macro.css predefinito: le classi predefinite inutilizzate non vengono rimosse da questo
    componente, la pulizia è delegata a valle a PurgeCSS (o equivalente).
  */
  closeBtnClass = 'sf-macro-close-btn',
  addBtnClass = 'sf-macro-riga-add',
  containerClass = 'sf-macro-container',
  add_callback = null,
  preDelCallback = null,
  del_callback = null,
  insertAtTop = false
}={}) {

  /*
    Singolo listener delegato: risolve al momento del click l'antenato wrapper_selector
    più vicino al target del click, invece di collegare un listener per ogni
    wrapper trovato in fase di init. È necessario perché wrapper_selector possa essere
    condiviso da istanze di wrapper annidate (vince sempre la più vicina, senza
    propagazione a quelle esterne) e perché funzioni sui wrapper creati dinamicamente
    dopo questa chiamata (ad es. un wrapper annidato in una riga appena aggiunta), che
    altrimenti non riceverebbero mai un proprio listener.
  */
  document.addEventListener('click', e => {
    const target = /** @type {HTMLElement} */ (e.target);

    const action_btn = /** @type {HTMLElement | null} */ (
      target.closest(`.${addBtnClass}, .${closeBtnClass}`)
    );
    if (!action_btn) return;

    const fset = /** @type {HTMLElement | null} */ (target.closest(wrapper_selector));
    if (!fset) return;

    const macro_container = /** @type {HTMLElement | null} */ (fset.querySelector(`.${containerClass}`));
    if (!macro_container) return;

    if(action_btn.matches(`.${addBtnClass}`)) {

      const macro_template = macro_container.dataset.template ?? '';
      const righe_macro = macro_container.querySelectorAll(row_selector).length;

      macro_container.insertAdjacentHTML(insertAtTop? 'afterbegin' : 'beforeend',
        macro_template.replace(/__indice\d?__/g, String(righe_macro + 1))
      );

      if(add_callback && typeof add_callback === 'function') {
        add_callback(
          insertAtTop
            ? macro_container.querySelector(`${row_selector}:first-child`)
            : macro_container.querySelector(`${row_selector}:last-child`),
          action_btn
        );
      }

    } else {
      const riga = target.closest(row_selector);

      const remove_row = () => {
        riga?.remove();

        if(del_callback && typeof del_callback === 'function') {
          del_callback(riga, action_btn);
        }
      };

      if(preDelCallback && typeof preDelCallback === 'function') {
        const pre_del_result = preDelCallback(riga, action_btn);

        // Supporta sia un preDelCallback sincrono che restituisce un booleano sia uno asincrono
        // (che restituisce una Promise, ad es. in attesa di una finestra di conferma) senza richiedere
        // che il chiamante gestisca da sé la rimozione della riga.
        if(pre_del_result instanceof Promise) {
          pre_del_result.then(ok => {
            if(ok !== false) remove_row();
          });
          return;
        }

        if(pre_del_result === false) {
          return;
        }
      }

      remove_row();
    }

  }, false);
}
