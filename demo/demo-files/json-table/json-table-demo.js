/* eslint-disable no-console */
import { JsonTable } from '@src/web-components/json-table/json-table-component.js';
import { domBuilder } from '@src/utilities/dom-builder/dom-builder.js';

import demoData from './demo-data.js';
import * as styles from './json-table-demo.module.css';


/** larger data set for the pagination demos: the 30 demo records repeated with unique ids */
function bigData(times) {
  const rows = [];
  for (let i = 0; i < times; i++) {
    demoData.forEach((row, idx) => {
      rows.push({ ...row, id: i * demoData.length + idx + 1, text: `${row.text} (${i + 1})` });
    });
  }
  return rows;
}


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

    // =>> 1. HTML attributes only (js-free)
    'h2 1. Configurazione solo da attributi HTML (senza JS)',
    'p Tutto da attributi (via domBuilder <code>attrs</code>): <code>data</code>, <code>cols</code>, <code>labels</code>, <code>tfoot</code> e <code>perpage</code> serializzati. Il render della colonna "Testo" usa la sintassi mustache-like <code>[[key]]</code>, la colonna "Importo" ha <code>tfootRender: "@sum"</code>. Ordinamento e ricerca sono lato client; con <code>perpage="5"</code> la navigazione pagine compare nella barra sotto la tabella, a destra della caption.',
    {
      tag: 'json-table',
      attrs: {
        caption: 'Tabella configurata solo da attributi HTML (12 record, 5 per pagina)',
        data: JSON.stringify(demoData.slice(0, 12)),
        tfoot: 'true',
        perpage: '5',
        initialsort: JSON.stringify({ key: 'euro', dir: 'desc' }),
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
    'h2 2. init() da script + jsonUrl: colonne con funzioni, tipi custom, tfoot, nessuna paginazione',
    'p Dati via fetch (<code>jsonUrl</code>, servito dal devServer come file statico: funziona solo in sviluppo), <code>debug: true</code> (vedi console), <code>perPage: 0</code> (tutte le righe, nessuna navigazione). Colonne: <code>rowHeading</code>, <code>render(row, tr, td)</code> che restituisce un array domBuilder, <code>render</code> che decora solo la cella (restituisce <code>undefined</code> → rendering di default), tipo custom <code>km</code> (<code>dataTypes</code> con <code>inheritsFrom</code>), <code>headerClass</code> propagato a <code>cellClass</code>, colonna con <code>condition: false</code>, <code>tfootRender</code> come funzione, aggregato e stringa statica, <code>trCallback</code>, <code>renderZeroAs</code>, <code>infoText</code> da funzione, evento <code>jt:update</code> in console.',
    {
      tag: 'json-table',
      id: 'jt-ajax',
      callback: el => {
        el.addEventListener('jt:ready', e => {
          console.log('[demo] jt:ready', /** @type {CustomEvent} */ (e).detail.jsonTable);
        });
        el.addEventListener('jt:update', e => {
          const { reason, jsonTable } = /** @type {CustomEvent} */ (e).detail;
          console.log(`[demo] jt:update (${reason})`, jsonTable.state);
        });

        /** @type {JsonTable} */ (el).init({
          jsonUrl: '/demo-files/json-table/demo-data.json',
          debug: true,
          perPage: 0,
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

    // =>> 3. custom template + project defaults + reload/destroy + API
    'h2 3. Template personalizzato, default di progetto, reload() / destroy() e API di stato',
    'p <code>template</code> con slot riordinati: ricerca e navigazione pagine sopra la tabella (slot <code>search</code> e <code>pagination</code>), info sotto; la barra sotto la tabella contiene quindi solo la caption. <code>data</code> e <code>cols</code> da attributo, 150 record con <code>perPage: 20</code>, <code>updateFooterOnPageChange: true</code> (subtotali di pagina). Il placeholder dell\'input arriva da <code>JsonTable.setDefaults()</code>. I pulsanti testano <code>reload()</code>, <code>destroy()</code> / <code>init()</code> e i metodi <code>goToPage()</code>, <code>setSort()</code>, <code>setSearch()</code>.',
    {
      className: 'flex flex-wrap gap-2 mbe-sm',
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
          className: 'btn btn-outline-secondary btn-sm',
          attrs: { type: 'button' },
          content: 'goToPage(4)',
          callback: el => el.addEventListener('click', () => reloadableTable.goToPage(4))
        },
        {
          tag: 'button',
          className: 'btn btn-outline-secondary btn-sm',
          attrs: { type: 'button' },
          content: 'setSort("euro", "desc")',
          callback: el => el.addEventListener('click', () => reloadableTable.setSort('euro', 'desc'))
        },
        {
          tag: 'button',
          className: 'btn btn-outline-secondary btn-sm',
          attrs: { type: 'button' },
          content: 'setSearch("lorem")',
          callback: el => el.addEventListener('click', () => reloadableTable.setSearch('lorem'))
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
        data: JSON.stringify(bigData(5)),
        caption: 'Tabella con template personalizzato (150 record, 20 per pagina)',
        cols: JSON.stringify([
          { key: 'id', dataType: 'id' },
          { key: 'text', title: 'Testo' },
          { key: 'date', title: 'Data', dataType: 'date' },
          { key: 'euro', title: 'Importo', dataType: 'euro', tfootRender: '@sum' }
        ])
      },
      callback: el => {
        reloadableTable = /** @type {JsonTable} */ (el);
        reloadableTable.init({
          perPage: 20,
          tfoot: true,
          updateFooterOnPageChange: true,
          template: [
            {
              className: `flex flex-wrap gap-2 mbe-sm ${styles.customInfo}`,
              children: [{ slot: 'search' }, { slot: 'pagination' }]
            },
            { slot: 'table' },
            { slot: 'resultInfo' }
          ]
        });
      }
    },

    // =>> 4. server-side
    'h2 4. Modalità server-side (paginazione, ordinamento e ricerca delegati al server)',
    'p <code>serverSide: true</code>: ogni cambio pagina, ordinamento o ricerca invia una nuova richiesta a <code>jsonUrl</code> con i parametri <code>page</code>, <code>start</code>, <code>perPage</code>, <code>sort</code>, <code>dir</code>, <code>search</code> (nomi configurabili con <code>serverParams</code>); il JSON restituisce le sole righe della pagina più <code>totRec</code> e <code>filteredRec</code>. L\'endpoint <code>/demo-api/json-table</code> è simulato da un middleware del devServer (circa 1.000 record, ritardo artificiale di 300 ms): funziona solo in sviluppo. Il <code>tfoot</code> non è disponibile in questa modalità (richiesto qui apposta: vedi avviso in console). <code>infoText</code> con i segnaposto <code>{page}</code> e <code>{totPages}</code>.',
    {
      tag: 'json-table',
      callback: el => /** @type {JsonTable} */ (el).init({
        jsonUrl: '/demo-api/json-table',
        serverSide: true,
        perPage: 15,
        tfoot: true, // ignored in server-side mode (console warning)
        caption: 'Tabella server-side',
        infoText: 'Righe {start}–{end} di {filteredRec} ({totRec} totali) — pagina {page} di {totPages}',
        initialSort: { key: 'id', dir: 'asc' },
        cols: [
          { key: 'id', title: 'ID', dataType: 'id' },
          { key: 'text', title: 'Testo' },
          { key: 'sfDatetime', title: 'Data/ora', dataType: 'datetime' },
          { key: 'number1', title: 'Numero', dataType: 'num' },
          { key: 'euro', title: 'Importo', dataType: 'euro' },
          { key: 'bool', title: 'Attivo', dataType: 'bool' }
        ]
      })
    },

    // =>> 5. errors
    'h2 5. Gestione errori (vedi console)',
    'p Attributo <code>data</code> con JSON malformato (ignorato: nessuna sorgente dati e nessun errore perché non è stato chiamato <code>init()</code>), <code>jsonUrl</code> inesistente (errore HTTP in console, componente vuoto), <code>cols</code> mancante (errore di configurazione in console, componente vuoto), <code>cols</code> con <code>dataType</code> sconosciuto (idem).',
    {
      tag: 'json-table',
      attrs: { data: '[{"id": 1,}' }
    },
    {
      tag: 'json-table',
      callback: el => /** @type {JsonTable} */ (el).init({ jsonUrl: '/demo-files/json-table/missing.json', cols: [{ key: 'id' }] })
    },
    {
      tag: 'json-table',
      callback: el => /** @type {JsonTable} */ (el).init({ data: demoData.slice(0, 2) })
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
