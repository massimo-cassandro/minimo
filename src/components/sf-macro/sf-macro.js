/*! minimo - Symfony Macro Manager */
import './sf-macro.css';

/**
 * Initialises Symfony macro collection fields (repeatable fieldsets).
 * @param {Object} [options={}]
 * @param {string} [options.wrapper_selector='.sf-macro-wrapper'] - Selector for the outer wrapper element.
 * @param {string} [options.row_selector='.sf-macro-riga'] - Selector for each repeatable row.
 * @param {((newRow: Element | null, addBtn: Element | null) => void) | null} [options.add_callback=null] - Called after a row is added; receives the new row and the add button.
 * @param {(() => void) | null} [options.del_callback=null] - Called after a row is removed.
 * @param {boolean} [options.insertAtTop=false] - When true, new rows are inserted at the top.
 * @returns {void}
 */
export function sf_macro({
  wrapper_selector = '.sf-macro-wrapper',
  row_selector = '.sf-macro-riga',
  add_callback = null,
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
      target.closest('.sf-macro-riga-add, .sf-macro-close-btn')
    );
    if (!action_btn) return;

    const fset = /** @type {HTMLElement | null} */ (target.closest(wrapper_selector));
    if (!fset) return;

    const macro_container = /** @type {HTMLElement | null} */ (fset.querySelector('.sf-macro-container'));
    if (!macro_container) return;

    if(action_btn.matches('.sf-macro-riga-add')) {

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
      target.closest(row_selector)?.remove();

      if(del_callback && typeof del_callback === 'function') {
        del_callback();
      }
    }

  }, false);
}
