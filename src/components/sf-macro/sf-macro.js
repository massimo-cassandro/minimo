/*! minimo - Symfony Macro Manager */
import './sf-macro.css';

// TODO[epic=v2] in una v. 2 di minimo, rinominare wrapper_selector e row_selector in
// wrapperClass e rowClass (NB: classi, non selettori, per uniformità con closeBtnClass/addBtnClass/containerClass
// aggiunti sotto) e rendere tutti i parametri camelCase.
// TODO[epic=v2] valutare se rendere opzionale, tramite parametro, l'importazione statica
// di sf-macro.css qui sopra (questione lasciata in sospeso).

/**
 * Initialises Symfony macro collection fields (repeatable fieldsets).
 * @param {Object} [options={}] (default: {})
 * @param {string} [options.wrapper_selector='.sf-macro-wrapper'] - Selector for the outer wrapper element. (default: '.sf-macro-wrapper')
 * @param {string} [options.row_selector='.sf-macro-riga'] - Selector for each repeatable row. (default: '.sf-macro-riga')
 * @param {string} [options.closeBtnClass='sf-macro-close-btn'] - Class name of the row-remove button. (default: 'sf-macro-close-btn')
 * @param {string} [options.addBtnClass='sf-macro-riga-add'] - Class name of the row-add button. (default: 'sf-macro-riga-add')
 * @param {string} [options.containerClass='sf-macro-container'] - Class name of the rows container. (default: 'sf-macro-container')
 * @param {((newRow: Element | null, addBtn: Element | null) => void) | null} [options.add_callback=null] - Called after a row is added; receives the new row and the add button. (default: null)
 * @param {((row: Element | null, closeBtn: Element | null) => boolean | Promise<boolean>) | null} [options.preDelCallback=null] - Called when the row-remove button is pressed, before the row is removed; receives the row and the close button. May return a Promise (e.g. to await a confirm dialog): the row is removed only if the resolved value is not `false`. (default: null)
 * @param {((row: Element | null, closeBtn: Element | null) => void) | null} [options.del_callback=null] - Called after a row is removed; receives the removed row (now detached) and the close button. (default: null)
 * @param {boolean} [options.insertAtTop=false] - When true, new rows are inserted at the top. (default: false)
 * @returns {void}
 */
export function sf_macro({
  wrapper_selector = '.sf-macro-wrapper',
  row_selector = '.sf-macro-riga',
  // Change closeBtnClass/addBtnClass/containerClass only if you don't want to use
  // the default sf-macro.css: unused default classes are not stripped by this
  // component, that cleanup is delegated to PurgeCSS (or equivalent) downstream.
  closeBtnClass = 'sf-macro-close-btn',
  addBtnClass = 'sf-macro-riga-add',
  containerClass = 'sf-macro-container',
  add_callback = null,
  preDelCallback = null,
  del_callback = null,
  insertAtTop = false
}={}) {

  // Single delegated listener: resolves the nearest wrapper_selector ancestor
  // of the click target at click time, instead of binding one listener per
  // wrapper found at init time. This is required for wrapper_selector to be
  // shared by nested wrapper instances (the nearest one always wins, with no
  // propagation to outer ones) and to work on wrappers created dynamically
  // after this call (e.g. a nested wrapper inside a newly added row), which
  // would otherwise never get their own listener.
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

        // Supports both a sync boolean and an async (Promise-returning)
        // preDelCallback (e.g. awaiting a confirm dialog) without requiring
        // the caller to manage the row removal itself.
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
