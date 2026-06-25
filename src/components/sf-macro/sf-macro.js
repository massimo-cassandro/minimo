// import './sf-macro.css'; // import in the consuming project

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

  document.querySelectorAll(wrapper_selector).forEach(fset => {
    const macro_container = /** @type {HTMLElement | null} */ (fset.querySelector('.sf-macro-container'));
    if (!macro_container) return;
    const macro_template = macro_container.dataset.template ?? '';

    // event listeners
    fset.addEventListener('click', e => {
      const target = /** @type {HTMLElement} */ (e.target);

      if(target.closest('.sf-macro-riga-add')) {

        const righe_macro = macro_container.querySelectorAll(row_selector).length;

        macro_container.insertAdjacentHTML(insertAtTop? 'afterbegin' : 'beforeend',
          macro_template.replace(/__indice\d?__/g, String(righe_macro + 1))
        );

        if(add_callback && typeof add_callback === 'function') {
          add_callback(
            insertAtTop
              ? macro_container.querySelector('.sf-macro-riga:first-child')
              : macro_container.querySelector('.sf-macro-riga:last-child'),
            target.closest('.sf-macro-riga-add')
          );
        }


      } else if(target.closest('.sf-macro-close-btn')) {
        target.closest(row_selector)?.remove();

        if(del_callback && typeof del_callback === 'function') {
          del_callback();
        }
      }

    }, false);
  });
}
