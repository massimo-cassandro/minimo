/* eslint-disable no-console */
import { JsonTable } from '@src/web-components/json-table/json-table-component.js';
import { domBuilder } from '@src/utilities/dom-builder/dom-builder.js';

import demoData from './demo-data.js';
import * as styles from './json-table-demo.module.css';


/*
  WORK IN PROGRESS (step 2): <json-table> renders the outer structure (info section, search
  input, layout template), columns (`cols`), data types, body rows, tfoot and info text.
  The sort buttons are rendered but inactive: sorting, search and pagination will follow
  in the next steps.
*/

export function jsonTableDemo(){

  const root = /** @type {HTMLElement} */ (document.getElementById('root'));

  // project-wide defaults: must be set before the instances are created.
  // Precedence: init() > HTML attribute > setDefaults() > built-in default.
  // `classes` and `labels` are merged with the built-in ones: only the keys to override are needed
  JsonTable.setDefaults({
    labels: { searchPlaceholder: 'Cerca… (placeholder impostato con JsonTable.setDefaults)' },
    classes: { searchInput: 'form-control' }
  });

  /** @type {JsonTable} */
  let reloadableTable;

  domBuilder([

    'p.text-muted Work in progress (step 2): colonne, tipi di dato, righe, tfoot, testo info e template di layout. I pulsanti di ordinamento sono generati ma non attivi: ordinamento, ricerca e paginazione arriveranno negli step successivi.',

    // =>> 1. HTML attributes only (js-free)
    'h2 1. Configurazione solo da attributi HTML (senza JS)',
    'p Tutto da attributi (via domBuilder <code>attrs</code>): <code>data</code>, <code>cols</code>, <code>labels</code> e <code>tfoot</code> serializzati in JSON. Il render della colonna "Testo" usa la sintassi mustache-like <code>[[key]]</code>, la colonna "Importo" ha <code>tfootRender: "@sum"</code>.',
    {
      tag: 'json-table',
      attrs: {
        caption: 'Tabella configurata solo da attributi HTML (5 record)',
        data: JSON.stringify(demoData.slice(0, 5)),
        tfoot: 'true',
        cols: JSON.stringify([
          { key: 'id', dataType: 'id' },
          { key: 'text', title: 'Testo (render mustache-like)', render: '<a href="#/json-table?id=[[id]]">[[text]]</a>' },
          { key: 'date', title: 'Data', type: 'date' },
          { key: 'euro', title: 'Importo', dataType: 'euro', tfootRender: '@sum' },
          { key: 'perc', title: 'Percentuale', dataType: 'perc', tfootRender: '@avg' },
          { key: 'bool', title: 'Attivo', dataType: 'bool' }
        ]),
        labels: JSON.stringify({ searchPlaceholder: 'Placeholder da attributo labels (prevale su setDefaults)' })
      }
    },

    // =>> 2. init() + jsonUrl + cols with functions
    'h2 2. init() da script + jsonUrl: colonne con funzioni, tipi custom, tfoot',
    'p Dati via fetch (<code>jsonUrl</code>, servito dal devServer come file statico: funziona solo in sviluppo), <code>debug: true</code> (vedi console). Colonne: <code>rowHeading</code>, <code>render(row, tr, td)</code> che restituisce un array domBuilder, <code>render</code> che decora solo la cella (restituisce <code>undefined</code> → rendering di default), tipo custom <code>km</code> (<code>dataTypes</code> con <code>inheritsFrom</code>), <code>headerClass</code> propagato a <code>cellClass</code>, colonna con <code>condition: false</code>, <code>tfootRender</code> come funzione, aggregato e stringa statica, <code>trCallback</code>, <code>renderZeroAs</code>, <code>infoText</code> da funzione.',
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
          tableId: 'demo-ajax-table',
          tfoot: true,
          renderZeroAs: '0 (renderZeroAs)',
          classes: { table: 'table', wrapper: 'demo-wrapper' },
          infoText: (start, end, totRec, filteredRec) =>
            `<strong>${filteredRec}</strong> record visualizzati (righe ${start}–${end} di ${totRec}, infoText da init)`,
          dataTypes: {
            // new type based on the built-in `num`: same classes, sort/search values and NaN/zero handling
            km: {
              inheritsFrom: 'num',
              render: (value, row, params) => `${Number(value).toLocaleString(params.locale, params.numbersLocaleOpts)} km`
            }
          },
          cols: [
            { key: 'id', title: 'ID', dataType: 'id', rowHeading: true },
            {
              key: 'text',
              title: 'Testo (render → domBuilder array)',
              render: row => {
                const [first, ...rest] = String(row.text).split(' ');
                return [{ tag: 'strong', content: first }, { text: ` ${rest.join(' ')}` }];
              }
            },
            { key: 'number1', title: 'Numero', dataType: 'num', tfootRender: '@sum' },
            { key: 'number2', title: 'Distanza (tipo custom)', dataType: 'km', tfootRender: '@max' },
            { key: 'sfDatetime', title: 'Data/ora (oggetto Symfony)', dataType: 'datetime', headerClass: 'text-center' },
            { key: 'percDecimal', title: '% decimale', dataType: 'percDecimal', tfootRender: '@avg' },
            { key: 'euro', title: 'Importo', dataType: 'euro', tfootRender: rows => `${rows.length} righe (tfootRender fn)` },
            { key: 'bool', title: 'Bool', dataType: 'bool' },
            {
              key: 'boolCustomized',
              title: 'Bool con null',
              dataType: 'bool',
              // decorates the cell only: returning `undefined` keeps the data type rendering
              render: (row, tr, td) => {
                if (row.boolCustomized === null && td) {
                  td.title = 'Valore null (render → renderNullAs)';
                }
              }
            },
            { key: 'text', title: 'Colonna nascosta', condition: false }
          ],
          trCallback: (tr, row) => {
            tr.title = `Record #${row.id} (title impostato da trCallback)`;
          }
        });
      }
    },

    // =>> 3. custom template + project defaults + reload/destroy
    'h2 3. Template personalizzato, default di progetto, reload() e destroy()',
    'p <code>template</code> con slot riordinati (ricerca e info sotto la tabella), <code>data</code> e <code>cols</code> da attributo; il placeholder dell\'input arriva da <code>JsonTable.setDefaults()</code>. I pulsanti testano <code>reload()</code> e <code>destroy()</code> / <code>init()</code>.',
    {
      className: 'flex gap-2 mbe-sm',
      children: [
        {
          tag: 'button',
          className: 'btn btn-secondary btn-sm',
          attrs: { type: 'button' },
          content: 'reload() con 3 record',
          callback: el => el.addEventListener('click', () => {
            reloadableTable.reload({ data: demoData.slice(0, 3), caption: 'Dopo reload() con 3 record' });
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
          className: 'btn btn-secondary btn-sm',
          attrs: { type: 'button' },
          content: 'reload() senza record',
          callback: el => el.addEventListener('click', () => {
            reloadableTable.reload({ data: [], caption: 'Dopo reload() senza record (labels.noRows)' });
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
            reloadableTable.init({ caption: 'Dopo destroy() + init()' }); // data and cols from the attributes
          })
        }
      ]
    },
    {
      tag: 'json-table',
      attrs: {
        data: JSON.stringify(demoData),
        caption: 'Tabella con template personalizzato',
        cols: JSON.stringify([
          { key: 'id', dataType: 'id' },
          { key: 'text', title: 'Testo' },
          { key: 'date', title: 'Data', dataType: 'date' },
          { key: 'euro', title: 'Importo', dataType: 'euro' }
        ])
      },
      callback: el => {
        reloadableTable = /** @type {JsonTable} */ (el);
        reloadableTable.init({
          template: [
            { slot: 'table' },
            {
              className: `flex gap-2 mbs-sm ${styles.customInfo}`,
              children: [{ slot: 'search' }, { slot: 'resultInfo' }]
            }
          ]
        });
      }
    },

    // =>> 4. automatic columns
    'h2 4. Colonne generate automaticamente',
    'p Senza <code>cols</code> viene generata una colonna di tipo <code>string</code> per ogni chiave del primo record (titolo = chiave); <code>search="false"</code>.',
    {
      tag: 'json-table',
      attrs: {
        caption: 'Colonne da chiavi del primo record',
        search: 'false',
        data: JSON.stringify(demoData.slice(0, 3).map(({ id, text, date, euro }) => ({ id, text, date, euro })))
      }
    },

    // =>> 5. errors
    'h2 5. Gestione errori (vedi console)',
    'p Attributo <code>data</code> con JSON malformato (ignorato: nessuna sorgente dati e nessun errore perché non è stato chiamato <code>init()</code>), <code>jsonUrl</code> inesistente (errore HTTP in console, componente vuoto), <code>cols</code> con <code>dataType</code> sconosciuto (errore di configurazione in console, componente vuoto).',
    {
      tag: 'json-table',
      attrs: { data: '[{"id": 1,}' }
    },
    {
      tag: 'json-table',
      callback: el => /** @type {JsonTable} */ (el).init({ jsonUrl: '/demo-files/json-table/missing.json' })
    },
    {
      tag: 'json-table',
      callback: el => /** @type {JsonTable} */ (el).init({
        data: demoData.slice(0, 2),
        cols: [{ key: 'id', dataType: 'unknownType' }]
      })
    }

  ], root);

}
