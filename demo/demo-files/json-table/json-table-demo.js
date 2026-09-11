/* eslint-disable no-console */
import { JsonTable } from '@src/web-components/json-table/json-table-component.js';
import { domBuilder } from '@src/utilities/dom-builder/dom-builder.js';

import demoData from './demo-data.js';

/*
  WORK IN PROGRESS: at this stage <json-table> only builds the outer structure
  (info section, search input, empty table with caption). Columns, rows, sorting,
  search and pagination are not implemented yet.
*/

export function jsonTableDemo(){

  const root = /** @type {HTMLElement} */ (document.getElementById('root'));

  // project-wide defaults: must be set before the instances are created.
  // Precedence: init() > HTML attribute > setDefaults() > built-in default
  JsonTable.setDefaults({
    searchInputPlaceholder: 'Cerca… (placeholder impostato con JsonTable.setDefaults)',
    infoText: (shown, total) => `${shown} di ${total} record (infoText da setDefaults)`
  });

  /** @type {JsonTable} */
  let reloadableTable;

  domBuilder([

    'p.text-muted Work in progress: viene generata solo la struttura esterna (info, ricerca, wrapper con tabella vuota). Colonne e righe arriveranno negli step successivi.',

    // =>> 1. HTML attributes
    'h2 1. Parametri da attributi HTML',
    'p Tutti i parametri passati come attributi (via domBuilder <code>attrs</code>): <code>data</code> serializzato in JSON, <code>caption</code>, <code>searchInputPlaceholder</code> (che prevale sul default di progetto).',
    {
      tag: 'json-table',
      attrs: {
        caption: 'Tabella da attributi HTML (10 record inline)',
        data: JSON.stringify(demoData.slice(0, 10)),
        searchInputPlaceholder: 'Placeholder da attributo'
      }
    },

    // =>> 2. init() + jsonUrl
    'h2 2. init() da script + jsonUrl',
    'p Dati caricati via fetch (<code>jsonUrl</code>, servito dal devServer come file statico: funziona solo in sviluppo), <code>debug: true</code> (vedi console), classi extra, caption da funzione, listener <code>jt:ready</code> registrato prima di <code>init()</code>.',
    {
      tag: 'json-table',
      id: 'jt-ajax',
      callback: el => {
        el.addEventListener('jt:ready', e => {
          console.log('[demo] jt:ready', /** @type {CustomEvent} */ (e).detail.jsonTable);
        });

        /** @type {JsonTable} */ (el).init({
          jsonUrl: '/demo-files/json-table/demo-data.json',
          debug: true,
          caption: () => `Tabella da jsonUrl (caption da funzione, ${new Date().toLocaleTimeString('it-IT')})`,
          infoExtraClass: 'alert alert-info',
          tableClass: 'table',
          tableId: 'demo-ajax-table',
          infoText: (shown, total) => `<strong>${shown}</strong> righe su <strong>${total}</strong> (infoText da init)`
        });
      }
    },

    // =>> 3. project defaults + reload/destroy
    'h2 3. Default di progetto, reload() e destroy()',
    'p Solo <code>data</code> e <code>search="false"</code> da attributo: placeholder e <code>infoText</code> arrivano da <code>JsonTable.setDefaults()</code> (il placeholder non è visibile perché la ricerca è disattivata). I pulsanti testano <code>reload()</code> e <code>destroy()</code> / <code>init()</code>.',
    {
      className: 'flex gap-2 mbe-sm',
      children: [
        {
          tag: 'button',
          className: 'btn btn-secondary btn-sm',
          attrs: { type: 'button' },
          content: 'reload() con 3 record e ricerca',
          callback: el => el.addEventListener('click', () => {
            reloadableTable.reload({ data: demoData.slice(0, 3), search: true, caption: 'Dopo reload()' });
          })
        },
        {
          tag: 'button',
          className: 'btn btn-secondary btn-sm',
          attrs: { type: 'button' },
          content: 'reload() da jsonUrl',
          callback: el => el.addEventListener('click', () => {
            reloadableTable.reload({ data: null, jsonUrl: '/demo-files/json-table/demo-data.json', caption: 'Dopo reload() da jsonUrl' });
          })
        },
        {
          tag: 'button',
          className: 'btn btn-danger btn-sm',
          attrs: { type: 'button' },
          content: 'destroy()',
          callback: el => el.addEventListener('click', () => reloadableTable.destroy())
        },
        {
          tag: 'button',
          className: 'btn btn-success btn-sm',
          attrs: { type: 'button' },
          content: 'init() dopo destroy()',
          callback: el => el.addEventListener('click', () => {
            reloadableTable.init({ caption: 'Dopo destroy() + init()' }); // data from the attribute
          })
        }
      ]
    },
    {
      tag: 'json-table',
      attrs: {
        data: JSON.stringify(demoData),
        search: 'false',
        caption: 'Tabella con default di progetto'
      },
      callback: el => { reloadableTable = /** @type {JsonTable} */ (el); }
    },

    // =>> 4. errors
    'h2 4. Gestione errori (vedi console)',
    'p Attributo <code>data</code> con JSON malformato (ignorato, viene usato il default → nessuna sorgente dati → nessun errore perché non è stato chiamato <code>init()</code>) e <code>jsonUrl</code> inesistente (errore HTTP in console, componente vuoto).',
    {
      tag: 'json-table',
      attrs: { data: '[{"id": 1,}' }
    },
    {
      tag: 'json-table',
      callback: el => /** @type {JsonTable} */ (el).init({ jsonUrl: '/demo-files/json-table/missing.json' })
    }

  ], root);

}
