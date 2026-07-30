/**
 * Multi-select web component.
 *
 * Arranges a series of radio buttons, checkboxes, or a `select[multiple]` element so that items
 * appear within a popup window, similar to a `select` element.
 * `select[multiple]` elements are rendered as a list of checkboxes.
 *
 * @example
 * Checkboxes:
 * ```html
 * <multi-select [attributes]>
 *   <input type="checkbox" [attributes]>
 *   <input type="checkbox" [attributes]>
 *   <input type="checkbox" [attributes]>
 * </multi-select>
 * ```
 *
 * @example
 * Radio buttons:
 * ```html
 * <multi-select [attributes]>
 *   <input type="radio" [attributes]>
 *   <input type="radio" [attributes]>
 *   <input type="radio" [attributes]>
 * </multi-select>
 * ```
 *
 * @example
 * Select multiple:
 * ```html
 * <multi-select [attributes]>
 *   <select multiple [attributes]>
 *     <option value="...">...</option>
 *     <option value="...">...</option>
 *   </select>
 * </multi-select>
 * ```
 */


class MultiSelectComponent extends HTMLElement {
  constructor() {
    super();

  }

}

if (!customElements.get('multi-select')) {
  customElements.define('multi-select', MultiSelectComponent);
}


/*
export function formMultiselect(container=document) {

  const multiselects = container.querySelectorAll('.form-multiselect'),
    setMultiselectPlaceholder = multiselect_item => {
      let selected_labels = [];
      multiselect_item.querySelectorAll('[type="checkbox"]:checked, [type="radio"]:checked')
        .forEach( checked_el => {
          selected_labels.push(
            checked_el.closest ('.form-check').querySelector('label').innerText.trim()
          );
        });
      multiselect_item
        .querySelector('.form-multiselect-placeholder').innerText =
          selected_labels.length? selected_labels.join(', ') : '—';
    };

  multiselects.forEach( item => {

    const btn = item.querySelector('.btn'),
      drpdown = item.querySelector('.dropdown-menu'),
      closeOnClick = item.hasAttribute('data-close-on-click');

    item.addEventListener('click', e => {

      if(['checkbox', 'radio'].indexOf(e.target.type) !== -1) {
        setMultiselectPlaceholder(item);
        if(closeOnClick) {
          btn.click();
        }
      }

    }, false);


    btn.addEventListener('click', () => {
      drpdown.classList.toggle('show');
      let menu_on = drpdown.classList.contains('show');
      btn.classList.toggle('show', menu_on);
      btn.setAttribute('aria-expanded', menu_on);
    }, false);

    // click outside
    document.body.addEventListener('click', e => {

      if(drpdown.classList.contains('show') && e.target.closest('.form-multiselect') !== item) {
        btn.click();
        setMultiselectPlaceholder(item);
      }

    }, false);


    // createPopper(btn, drpdown, {
    //   // placement: 'bottom',
    //   modifiers: [flip, preventOverflow]
    // });

    setMultiselectPlaceholder(item);
  });

}
*/
