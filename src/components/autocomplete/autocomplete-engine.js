import autoComplete from '@tarekraafat/autocomplete.js';
// import { escapeHTML } from '@massimo-cassandro/js-utilities';

// https://tarekraafat.github.io/autoComplete.js/#/configuration

export const ac_default_params = {
  placeholder: 'Inserisci tre o più caratteri',
  ac_url: null, // search URL; must have leading and trailing slashes

  // when true, the search query string is not appended to the URL (useful with a static JSON)
  test_mode: false,

  /*
      Function that receives the fetch result and returns an array of objects in the form:
      {
        id             <== element id
        val            <== value shown as the selection result
        list_display   <== string shown in the results list
      }

      example:
      data => data.map(item => {
        return {
          id: item.id,
          val: `#${item.id} ${item.agenzia} (${item.network})`,
          list_display: `#${item.id} ${item.agenzia} (${item.network})`+
            (item.ragioneSociale? `<br><small>${item.ragioneSociale}</small>` : '—')

          // optional:
          __xxx__: item (or other custom data)
        };
      });
    */
  // @ts-ignore — parameter type inferred from library callback
  fetch_result_function: data => data,

  // field element or function returning the element
  autocomplete_field: null,

  // selector of the container element that wraps autocomplete_field and related elements
  autocomplete_parent_selector: '.form-group',

  // extra query parameters to append to the search URL (GET mode)
  // values can be a single string/number or an array
  // e.g. {param1: 'val1', param2: ['val2', 'val3']}
  extra_query_params: {},

  // name and id of the hidden input that stores the selected id
  // `name` is ignored if the element already exists
  // if none of hidden_id, hidden_field, or select_id is set, the selected id is not managed
  hidden_name: null,
  hidden_id: null,

  // hidden field element; when set, `hidden_name` and `hidden_id` are ignored
  hidden_field: null,

  // uses an existing <select> element with the given id
  // when set, `hidden_name` and `hidden_id` are ignored
  // treated as multiple if `select_multiple === true`
  // in multiple mode, duplicate ids are not allowed
  select_id: null,
  select_multiple: true,

  // id of the element used to render selected-option badges
  // only applies when `select_id` is set (multiple mode)
  // if absent, badge rendering must be handled externally
  badges_container_id: null,

  // callback invoked when a badge is removed;
  // receives the id and label text of the removed item
  badges_remove_callback: null,

  // custom function for building badge markup
  // receives `event.detail.selection.value` and the `params` object
  // if null, the default markup is used
  // NB: for pre-registered items the first argument only contains `id` and `val`
  // NB: the badge must have class `ac-badge` and attribute `data-id`; must return complete badge HTML
  badges_builder: null,

  // class assigned to the span containing the badge label
  badge_label_class: 'ac-badge-label',

  // class assigned to the badge remove button
  badge_btn_class: 'ac-badge-btn',


  // autocomplete callback
  // when present, called with 5 arguments: id, val, autocomplete field element, list_display (outerHTML), and row
  // NB: row is only available after an option has been selected
  callback: null,

  // optional extra class for the results list
  resultList_extra_class: null,

  // optional extra class for the outer wrapper
  wrapper_extra_class: null
};

/**
 * Initialises an autocomplete field using @tarekraafat/autocomplete.js.
 * @param {Record<string, any>} [params={}]
 * @returns {void}
 */
export default function (params = {}) {

  try {

    params = {...ac_default_params, ...params};

    // @ts-ignore — circular reference: bparams defaults to params
    params.badges_builder ??= (result_obj, bparams = params) => `<span class="ac-badge badge rounded-pill text-bg-secondary" data-id="${result_obj.id}">` +
      `<span class="${bparams.badge_label_class}">${result_obj.val}</span>` +
        `<button type="button" class="${bparams.badge_btn_class}">&times;</button>` +
      '</span>';


    if(params.autocomplete_field && params.ac_url) {

      if(typeof params.autocomplete_field === 'function') {
        params.autocomplete_field = params.autocomplete_field();
      }

      // set autocomplete field attributes
      params.autocomplete_field.type = 'search';
      ['spellcheck=false', 'autocorrect=off', 'autocomplete=off', 'autocapitalize=off'].forEach(item => {
        const [attr, val] = item.split('=');
        params.autocomplete_field.setAttribute(attr, val);
      });

      params.autocomplete_field.dataset.sel = params.autocomplete_field.value;


      params.autocomplete_field.closest(params.autocomplete_parent_selector).classList.add('ac-autocomplete-wrapper');
      if(params.wrapper_extra_class) {
        params.autocomplete_field.closest(params.autocomplete_parent_selector).classList.add(params.wrapper_extra_class);
      }

      let extra_query_params = [];
      for(const i in params.extra_query_params) {
        if(Array.isArray(params.extra_query_params[i])) {
          // @ts-ignore — extra_query_params values are untyped (string, number, or array)
          params.extra_query_params[i].forEach(item => {
            extra_query_params.push(`${i}[]=${item}`);
          });
        } else {
          extra_query_params.push(`${i}=${params.extra_query_params[i]}`);
        }
      }
      const extra_query_params_string = extra_query_params.length? `?${extra_query_params.join('&')}` : '';

      let hidden_field = null, select_field = null, badges_container = null;

      if(params.select_id) {
        select_field = document.getElementById(params.select_id);
        if(!select_field) {
          throw `Elemento '${params.select_id}' non presente`;
        }
        if(params.badges_container_id) {
          badges_container = document.getElementById(params.badges_container_id);
        }

      } else {
        // hidden field — created if not already present
        if(params.hidden_field) {
          hidden_field = params.hidden_field;

        } else if(params.hidden_id) {
          hidden_field = document.getElementById(params.hidden_id);
          if(!hidden_field) {
            params.autocomplete_field.insertAdjacentHTML('afterend',
              `<input type="hidden" id="${params.hidden_id}" name="${params.hidden_name}" value="">`
            );
            hidden_field = document.getElementById(params.hidden_id);
          }
        }
      }

      const autoCompleteJS = new autoComplete({
        selector: '#' + params.autocomplete_field.id,
        placeHolder: params.placeholder,
        diacritics: true,
        threshold: 3,
        data: {
          // @ts-ignore — library callback; query type defined by autoComplete.js
          src: async (query) => {
            const ac_url = params.ac_url +
              (params.test_mode? '' : encodeURIComponent(query)) + extra_query_params_string;


            try {
              // Fetch Data from external Source
              const source = await fetch(ac_url);
              // Data is array of `Objects` | `Strings`
              const data = await source.json();

              return params.fetch_result_function(data);

            } catch (error) {
              return error;
            }
          },
          // Data 'Object' key to be searched
          keys:['list_display'],
          cache: false
        },
        resultsList: {
          class: params.resultList_extra_class,

          destination: '#' + params.autocomplete_field.id,
          // @ts-ignore — library callback; types defined by autoComplete.js
          element: (list, data) => {
            if (!data.results.length) {
              // Create "No Results" message element
              const message = document.createElement('div');
              // Add class to the created element
              message.setAttribute('class', 'no-result');
              // Add message text content
              message.innerHTML = `<span>Nessun risultato per <strong>"${data.query}"</strong></span>`;
              // Append message element to the results list
              list.prepend(message);
            }
          },
          noResults: true,
        },
        resultItem: {
          highlight: true,
        },
        events: {

          input: {
            // @ts-ignore — library event; type defined by autoComplete.js
            selection: (event) => {
              // console.log(event.detail.selection.value);

              const selected_id = event.detail.selection.value.id,
                selected_text = event.detail.selection.value.val;

              autoCompleteJS.input.value = selected_text;

              if(select_field) {
                const option_element = new Option(selected_text, selected_id, true, true);

                if(params.select_multiple) {
                  // prevent duplicate entries
                  const registered_option = select_field.querySelector(`option[value="${selected_id}"]`),
                    new_badge = params.badges_builder(event.detail.selection.value, params);

                  if(!registered_option) {

                    select_field.appendChild(option_element);
                    params.autocomplete_field.value = '';

                    if(badges_container) {
                      badges_container.insertAdjacentHTML('beforeend', new_badge);
                    }

                  // replace the existing badge to always show the latest version
                  } else {
                    registered_option.replaceWith(option_element);
                    if(badges_container) {
                      const prev_badge = badges_container.querySelector(`.ac-badge[data-id="${selected_id}"]`);
                      prev_badge?.replaceWith(
                        new DOMParser().parseFromString(new_badge, 'text/html').body.childNodes[0]
                      );
                    }
                  }

                } else { // single select
                  select_field.innerHTML = '';
                  select_field.appendChild(option_element);
                }

              } else if (hidden_field) {
                hidden_field.value = selected_id;
              }

              autoCompleteJS.input.dataset.sel = selected_text;

              if(params.callback && typeof params.callback === 'function') {
                params.callback(selected_id, selected_text, autoCompleteJS.input, event.detail.selection.value.list_display, event.detail.selection.value.row);
              }
            }
          }
        }
      }); // end autoComplete

      // TODO[epic=autocomplete]
      // improve and make the callback invocation more efficient

      // reset hidden field when the autocomplete value is cleared or mismatched
      const check_ac = () => {
        if(params.autocomplete_field.value === '' ||
          (params.autocomplete_field.dataset.sel !== undefined &&
            params.autocomplete_field.value !== params.autocomplete_field.dataset.sel)
        ) {
          if(hidden_field) {
            hidden_field.value = '';
          }
          if(select_field && !params.select_multiple) {
            select_field.innerHTML = '';
          }
          if(params.callback && typeof params.callback === 'function') {
            params.callback('', '', params.autocomplete_field);
          }
        }
      };

      params.autocomplete_field?.addEventListener('search', () => {
        check_ac();
      }, false);
      params.autocomplete_field?.addEventListener('blur', () => {
        check_ac();
      }, false);
      params.autocomplete_field?.addEventListener('change', () => {
        check_ac();
      }, false);
      params.autocomplete_field?.addEventListener('keydown', () => {
        check_ac();
      }, false);

      // badge click listener
      badges_container?.addEventListener('click', e => {
        const target = /** @type {HTMLElement} */ (e.target);
        const btn = target.closest(`.${params.badge_btn_class}`);

        if(btn) {
          const badge = /** @type {HTMLElement | null} */ (btn.closest('.ac-badge'));
          if (!badge) return;
          const item_id = badge.dataset.id,
            item_text = /** @type {HTMLElement | null} */ (badge.querySelector(':scope > span'))?.innerText ?? '';
          badge.remove();
          select_field?.querySelector(`option[value="${item_id}"]`)?.remove();

          if(params.badges_remove_callback && typeof params.badges_remove_callback === 'function') {

            params.badges_remove_callback(item_id, item_text);
          }
        }
      }, false);

      // render badges for any pre-registered select options
      if(select_field) {

        if(params.select_multiple && badges_container) {
          // any data attributes on the option are forwarded to `badges_builder` under the `dataset` key

          select_field.querySelectorAll('option[selected]').forEach(option => {
            const opt = /** @type {HTMLOptionElement} */ (option);
            badges_container.insertAdjacentHTML('beforeend',

              params.badges_builder({id: opt.value, val: opt.innerHTML, dataset: {...opt.dataset}}, params)
            );
          });
        } else {
          params.autocomplete_field.value = select_field.querySelector('option')?.innerText?? '';
        }

      }


    } // end if params.autocomplete_field...

  } catch(e) {
    console.error( e ); // eslint-disable-line
  }
}
