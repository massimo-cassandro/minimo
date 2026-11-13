import autoComplete from '@tarekraafat/autocomplete.js';
// import { escapeHTML } from '@massimo-cassandro/js-utilities';

// https://tarekraafat.github.io/autoComplete.js/#/configuration

export const ac_default_params = {
  placeholder: 'Inserisci tre o più caratteri',
  ac_url: null, // URL di ricerca; deve avere slash iniziale e finale

  // se true, la stringa di ricerca non viene accodata all'URL (utile con un JSON statico)
  test_mode: false,

  /*
      Funzione che riceve il risultato del fetch e restituisce un array di oggetti nella forma:
      {
        id             <== id dell'elemento
        val            <== valore mostrato come risultato della selezione
        list_display   <== stringa mostrata nell'elenco dei risultati
      }

      esempio:
      data => data.map(item => {
        return {
          id: item.id,
          val: `#${item.id} ${item.agenzia} (${item.network})`,
          list_display: `#${item.id} ${item.agenzia} (${item.network})`+
            (item.ragioneSociale? `<br><small>${item.ragioneSociale}</small>` : '—')

          // opzionale:
          __xxx__: item (o altri dati personalizzati)
        };
      });
    */
  // @ts-ignore — tipo del parametro dedotto dalla callback della libreria
  fetch_result_function: data => data,

  // elemento del campo o funzione che restituisce l'elemento
  autocomplete_field: null,

  // selettore dell'elemento contenitore che racchiude autocomplete_field e gli elementi correlati
  autocomplete_parent_selector: '.form-group',

  /*
    parametri di query extra da accodare all'URL di ricerca (modalità GET)
    i valori possono essere una singola stringa/numero oppure un array
    es. {param1: 'val1', param2: ['val2', 'val3']}
  */
  extra_query_params: {},

  /*
    name e id dell'input hidden che memorizza l'id selezionato
    `name` viene ignorato se l'elemento esiste già
    se non è impostato nessuno tra hidden_id, hidden_field o select_id, l'id selezionato non viene gestito
  */
  hidden_name: null,
  hidden_id: null,

  // elemento del campo hidden; se impostato, `hidden_name` e `hidden_id` vengono ignorati
  hidden_field: null,

  /*
    usa un elemento <select> esistente con l'id indicato
    se impostato, `hidden_name` e `hidden_id` vengono ignorati
    trattato come multiplo se `select_multiple === true`
    in modalità multipla non sono ammessi id duplicati
  */
  select_id: null,
  select_multiple: true,

  /*
    id dell'elemento usato per mostrare i badge delle opzioni selezionate
    si applica solo quando `select_id` è impostato (modalità multipla)
    se assente, il rendering dei badge va gestito esternamente
  */
  badges_container_id: null,

  // callback invocata quando un badge viene rimosso;
  // riceve l'id e il testo dell'etichetta dell'elemento rimosso
  badges_remove_callback: null,

  /*
    funzione personalizzata per costruire il markup dei badge
    riceve `event.detail.selection.value` e l'oggetto `params`
    se null, viene usato il markup predefinito
    NB: per gli elementi preregistrati il primo argomento contiene solo `id` e `val`
    NB: il badge deve avere la classe `ac-badge` e l'attributo `data-id`; deve restituire l'HTML completo del badge
  */
  badges_builder: null,

  // classe assegnata allo span che contiene l'etichetta del badge
  badge_label_class: 'ac-badge-label',

  // classe assegnata al pulsante di rimozione del badge
  badge_btn_class: 'ac-badge-btn',


  /*
    callback dell'autocomplete
    se presente, viene chiamata con 5 argomenti: id, val, elemento del campo autocomplete, list_display (outerHTML) e row
    NB: row è disponibile solo dopo la selezione di un'opzione
  */
  callback: null,

  // classe extra opzionale per l'elenco dei risultati
  resultList_extra_class: null,

  // classe extra opzionale per il wrapper esterno
  wrapper_extra_class: null
};

/**
 * Inizializza un campo autocomplete usando @tarekraafat/autocomplete.js.
 * @param {Record<string, any>} [params={}] (default: {})
 * @returns {void}
 */
export default function (params = {}) {

  try {

    params = {...ac_default_params, ...params};

    // @ts-ignore — riferimento circolare: il default di bparams è params
    params.badges_builder ??= (result_obj, bparams = params) => `<span class="ac-badge badge rounded-pill text-bg-secondary" data-id="${result_obj.id}">` +
      `<span class="${bparams.badge_label_class}">${result_obj.val}</span>` +
        `<button type="button" class="${bparams.badge_btn_class}">&times;</button>` +
      '</span>';


    if(params.autocomplete_field && params.ac_url) {

      if(typeof params.autocomplete_field === 'function') {
        params.autocomplete_field = params.autocomplete_field();
      }

      // imposta gli attributi del campo autocomplete
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
          // @ts-ignore — i valori di extra_query_params non sono tipizzati (stringa, numero o array)
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
        // campo hidden — creato se non già presente
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
          // @ts-ignore — callback della libreria; tipo di query definito da autoComplete.js
          src: async (query) => {
            const ac_url = params.ac_url +
              (params.test_mode? '' : encodeURIComponent(query)) + extra_query_params_string;


            try {
              // Recupera i dati da una sorgente esterna
              const source = await fetch(ac_url);
              // I dati sono un array di `Objects` | `Strings`
              const data = await source.json();

              return params.fetch_result_function(data);

            } catch (error) {
              return error;
            }
          },
          // Chiave dell'oggetto dati in cui cercare
          keys:['list_display'],
          cache: false
        },
        resultsList: {
          class: params.resultList_extra_class,

          destination: '#' + params.autocomplete_field.id,
          // @ts-ignore — callback della libreria; tipi definiti da autoComplete.js
          element: (list, data) => {
            if (!data.results.length) {
              // Crea l'elemento del messaggio "Nessun risultato"
              const message = document.createElement('div');
              // Aggiunge la classe all'elemento creato
              message.setAttribute('class', 'no-result');
              // Aggiunge il testo del messaggio
              message.innerHTML = `<span>Nessun risultato per <strong>"${data.query}"</strong></span>`;
              // Accoda l'elemento del messaggio all'elenco dei risultati
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
            // @ts-ignore — evento della libreria; tipo definito da autoComplete.js
            selection: (event) => {
              // console.log(event.detail.selection.value);

              const selected_id = event.detail.selection.value.id,
                selected_text = event.detail.selection.value.val;

              autoCompleteJS.input.value = selected_text;

              if(select_field) {
                const option_element = new Option(selected_text, selected_id, true, true);

                if(params.select_multiple) {
                  // evita le voci duplicate
                  const registered_option = select_field.querySelector(`option[value="${selected_id}"]`),
                    new_badge = params.badges_builder(event.detail.selection.value, params);

                  if(!registered_option) {

                    select_field.appendChild(option_element);
                    params.autocomplete_field.value = '';

                    if(badges_container) {
                      badges_container.insertAdjacentHTML('beforeend', new_badge);
                    }

                  // sostituisce il badge esistente per mostrare sempre l'ultima versione
                  } else {
                    registered_option.replaceWith(option_element);
                    if(badges_container) {
                      const prev_badge = badges_container.querySelector(`.ac-badge[data-id="${selected_id}"]`);
                      prev_badge?.replaceWith(
                        new DOMParser().parseFromString(new_badge, 'text/html').body.childNodes[0]
                      );
                    }
                  }

                } else { // select singola
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

      // TODO migliorare e rendere più efficiente l'invocazione della callback

      // azzera il campo hidden quando il valore dell'autocomplete viene cancellato o non corrisponde
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

      // listener click dei badge
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

      // mostra i badge per le eventuali opzioni preregistrate della select
      if(select_field) {

        if(params.select_multiple && badges_container) {
          // gli eventuali attributi data dell'option vengono passati a `badges_builder` sotto la chiave `dataset`

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
