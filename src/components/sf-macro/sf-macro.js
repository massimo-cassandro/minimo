import './sf-macro.css';

export function sf_macro({
  wrapper_selector = '.sf-macro-wrapper',
  row_selector = '.sf-macro-riga',
  add_callback = null,
  del_callback = null
}={}) {

  document.querySelectorAll(wrapper_selector).forEach(fset => {
    const macro_container = fset.querySelector('.sf-macro-container')
      ,macro_template = macro_container.dataset.template
    ;

    // listeners
    fset.addEventListener('click', e => {

      if(e.target.closest('.sf-macro-riga-add')) {

        const righe_macro = macro_container.querySelectorAll(row_selector).length;

        macro_container.insertAdjacentHTML('beforeend',
          macro_template.replace(/__indice\d?__/g, righe_macro + 1)
        );

        if(add_callback && typeof add_callback === 'function') {
          add_callback(
            macro_container.querySelector('.sf-macro-riga:last-child'),
            e.target.closest('.sf-macro-riga-add')
          );
        }


      } else if(e.target.closest('.sf-macro-close-btn')) {
        e.target.closest(row_selector).remove();

        if(del_callback && typeof del_callback === 'function') {
          del_callback();
        }
      }

    }, false);
  }); // end foreach wrapper_selector
}
