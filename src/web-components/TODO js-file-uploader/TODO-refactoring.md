# file-uploader — piano di riscrittura

Proposta per riscrivere `js-file-uploader` (v. 4.0.7) come web component `<file-uploader>` di minimo. Nessuna compatibilità con la versione precedente, ma continuità dove non costa nulla: nomi dei parametri (passati a camelCase) e, soprattutto, contratto con il server invariato.

Stato: **solo proposta, nessun codice scritto**. Le scelte già confermate sono in [Decisioni prese](#decisioni-prese), quelle ancora da prendere in [Decisioni aperte](#decisioni-aperte).

Questa cartella (`TODO js-file-uploader/`) resta come materiale di riferimento durante la riscrittura e va eliminata a fine lavoro, come per `TODO json-table/`. Il nuovo componente va in `src/web-components/file-uploader/`.

---

## Cosa fa oggi (sintesi)

- `FileUploader({selector, options, css, local_strs})` cerca gli elementi `.file-uploader2`, legge le opzioni da `data-*` o da `data-file-uploader` (JSON), avvolge ogni elemento in un `fieldset.fupl-wrapper` e ne sostituisce il contenuto con template HTML passati come stringhe.
- Selezione da `input[type=file]` o trascinamento → controlli lato client (tipo, peso, dimensioni in pixel, proporzioni) → invio immediato di ogni file via `XMLHttpRequest` a `uploader_url`, con barra di avanzamento.
- Il server risponde `{tmp_file, error}`; per ogni file caricato vengono aggiunti al form campi nascosti `varname[id][tmp_file|file_name|size|type|width|height]`. Il salvataggio definitivo avviene all'invio del form.
- File già registrati (`values`): mostrati all'avvio; la rimozione genera un campo nascosto `elimina_file[]`.
- Funzioni accessorie: riordino per trascinamento (`sortable`), campi aggiuntivi per ogni file (`extra_fields`), integrazione Fancybox, alert interno per gli errori, due script esterni per bloccare l'invio del form (uploader obbligatorio vuoto, caricamento in corso).

## Problemi dell'architettura attuale

- **Il DOM è lo stato**: presenza di valori, ordine, file in caricamento sono dedotti con `querySelector` (`.fupl-item:last-child`, `.fupl-is-uploading`, `data-has-values`). Fragile e difficile da estendere.
- **Template come stringhe HTML sovrascrivibili**, con classi Bootstrap incorporate (`btn btn-outline-primary`, `text-muted`, `spinner-grow`, `close`…) e segnaposto in stile Mustache sostituiti a più livelli.
- **Stringhe localizzate con HTML ed entità** (`<strong>`, `&egrave;`) e nomi dei file inseriti con `innerHTML` senza escape (un nome file con markup viene interpretato).
- **Integrazione con il form fatta a mano**: campi nascosti, `data-required`, `disabled` sul fieldset, script esterni per la validazione all'invio.
- Residui storici: controllo del browser (IE), callback indicati come stringa risolta su `window`, caricamento del CSS via `<link>`, `_VERSION` nel codice, Fancybox, SCSS.

### Difetti da non riportare nella nuova versione

- [ ] `send-files.js`: il secondo controllo sul formato (`_type === 'img'`) confronta con `mimetypes.img` usando `||`: letto così, un SVG verrebbe rifiutato anche con `filetype` `svg` o `img+svg`. Nei progetti però gli SVG oggi vengono caricati, quindi la lettura del codice va **verificata con una prova** (vedi [Decisioni aperte](#decisioni-aperte)); in ogni caso i due controlli sul formato vanno unificati in `accept.js`.
- [ ] `send-files.js`: `disable_submit(false)` viene chiamato al termine del primo caricamento riuscito anche se altri sono ancora in corso, e non viene mai chiamato in caso di errore (i pulsanti restano disabilitati).
- [ ] `send-files.js`: `reject()` chiamato sempre in coda a `onload`; `console.log(filelist_item.type)` rimasto nel codice; `alternative_loading_func` riceve solo l'evento (lo spread `...[e, fupl]` passa un solo argomento a `exec_callback`); `upload_start_callback` riceve `uploader_options` invece di `fupl` come documentato.
- [ ] `build-hidden-fields.js`: i `data-width/height/size/type` vengono scritti sulla **prima** `.fupl-img` dell'uploader, non su quella del file appena caricato (errato con `multiple`).
- [ ] `create-item.js`: in modalità singola la sostituzione di un file già registrato non genera il campo `elimina_file[]` per quello sostituito (vedi [File registrati](#file-registrati)).
- [ ] `sortable.js`: stato a livello di modulo (`dragged_element`) condiviso tra tutte le istanze; nessun supporto per tastiera e dispositivi touch (limite del drag & drop HTML5).
- [ ] Id degli elementi basato su `Date.now() + indice`.

---

## Light DOM

Il componente usa il light DOM, come json-table. Campi aggiuntivi e pulsante di selezione devono ricevere lo stile del progetto, cosa che con lo shadow DOM sarebbe possibile solo tramite slot e token; il CSS resta un CSS module come negli altri componenti. L'integrazione con il form (`formAssociated` + `ElementInternals`) funziona allo stesso modo anche senza shadow DOM.

---

## Architettura proposta

### Principi

- **Stato esplicito**: un array di elementi è l'unica fonte di verità; DOM, valore del form e validità derivano dallo stato.
- **Markup interno fisso**, costruito con `domBuilder`; personalizzazione tramite `classes`, `labels` e custom properties (niente template come stringhe).
- **Eventi al posto dei callback** (`CustomEvent` con bubbling, prefisso `fupl:`).
- **Stesse convenzioni di json-table**: `init()`, `FileUploader.setDefaults()`, precedenza `init()` > attributo HTML > `setDefaults()` > default; `labels` e `classes` uniti ai default; `debug`.
- **Nessuna dipendenza esterna** nel nucleo. Ritaglio immagini eventualmente come peer dependency opzionale, in una fase successiva.

### Struttura dei file

```
src/web-components/file-uploader/
├── file-uploader-component.js          # classe FileUploader + customElements.define('file-uploader')
├── file-uploader-component.module.css
├── file-uploader.minimo.tokens.mjs     # token --fupl-*
├── readme.md
└── src/
    ├── defaults.js                     # default + typedef dei parametri, labels (it), classes
    ├── resolve-params.js               # unione attributi / init / setDefaults, normalizzazione dei tipi
    ├── accept.js                       # preset filetype → elenco mimetype/estensioni, verifica di un file
    ├── validate-file.js                # controlli puri: formato, peso, dimensioni, proporzioni → elenco errori
    ├── read-image-size.js              # dimensioni in pixel (createImageBitmap / object URL)
    ├── upload.js                       # invio di un file (XHR in una Promise, avanzamento, annullamento)
    ├── upload-queue.js                 # coda con limite di invii contemporanei
    ├── render-main.js                  # struttura: etichetta, elenco, pannello di selezione, testo informativo, errori
    ├── render-item.js                  # singolo elemento (immagine / documento, avanzamento, rimozione)
    ├── extra-fields.js                 # campi aggiuntivi per elemento
    ├── info-text.js                    # testo informativo generato dai vincoli
    ├── form-value.js                   # stato → FormData per ElementInternals
    ├── sortable.js                     # riordino (stato per istanza)
    ├── lightbox.js                     # anteprima ingrandita con <dialog>
    └── normalize-file-name.js
```

Riuso da minimo: `domBuilder`, `escape-html`, `random-id`/`create-id`, `classnames`. `parse-file-size.js` va valutato: oggi non formatta secondo la lingua (la vecchia versione usava `toLocaleString`).

### Stato

```js
/**
 * @typedef {Object} FuplItem
 * @property {string} id            - id univoco (id del record per i file registrati, generato per i nuovi)
 * @property {'registered'|'queued'|'uploading'|'uploaded'|'error'} status
 * @property {File|null} file       - null per i file registrati
 * @property {string} name
 * @property {number|null} size     - byte
 * @property {string|null} type     - mimetype
 * @property {boolean} isImage
 * @property {number|null} width
 * @property {number|null} height
 * @property {string|null} src      - anteprima (object URL per i nuovi, `src` del server per i registrati)
 * @property {string|null} url      - collegamento al file (solo registrati)
 * @property {string|null} tmpFile  - nome del file temporaneo restituito dal server
 * @property {string|number|null} relId
 * @property {number} progress      - 0–100
 * @property {Object} extra         - valori dei campi aggiuntivi (file registrati)
 */
```

Più `deletedIds` (file registrati rimossi) e l'elenco degli errori correnti. L'ordine dell'array è l'ordine inviato al server.

### Markup iniziale

Come nella versione attuale, il componente può avvolgere un normale `<input type="file">` con la sua `<label>`: senza JavaScript resta un campo di caricamento funzionante (miglioramento progressivo). All'avvio:

- il testo della `<label>` diventa l'etichetta dell'uploader (se `legend` non è impostato);
- `multiple`, `required`, `disabled` e `accept` dell'input vengono letti come parametri (`accept` unito al preset di `filetype`);
- l'input viene riutilizzato come campo di selezione dei file, senza `name`, così il file non viene inviato anche con il form.

Senza input figlio, il componente crea il proprio.

### Integrazione con il form

`static formAssociated = true` e `ElementInternals`:

- `internals.setFormValue(formData)`: con un `FormData` ogni voce viene inviata con il proprio nome, quindi si mantengono i nomi attuali senza campi nascosti nel DOM. Aggiornato a ogni cambio di stato.
- `internals.setValidity()`: `valueMissing` se `required` e nessun file; errore personalizzato durante un caricamento. Sostituisce `check-required-uploader.js` e `check-uncompleted-uploads.js`.
- `formDisabledCallback` (anche `disabled` ereditato da un `fieldset`), `formResetCallback` (ritorno ai valori iniziali).
- I form con `novalidate` saltano la validazione nativa: serve comunque un controllo sull'evento `submit` (parametro `blockSubmitWhileUploading`), che sostituisce anche `disable_submit`.

I campi aggiuntivi restano campi reali nel light DOM e partecipano al form da soli.

### Contratto con il server

Invariato:

- Invio: `POST` multipart a `uploaderUrl`, file nel campo `file` (configurabile con `uploadFieldName`).
- Risposta: `{ "tmp_file": "...", "error": null }`.
- Campi inviati con il form per ogni file nuovo: `varname[id][tmp_file|file_name|size|type|width|height]`.

Aggiunte proposte: `requestHeaders` (es. token CSRF) e `requestData` (campi aggiuntivi nella richiesta di caricamento).

File registrati: vedi sotto.

### File registrati

I dati dei file già registrati (campi aggiuntivi, ordine) viaggiano sotto una variabile distinta da quella dei file nuovi, `registeredVarname` (ex `registered_extra_field_varname`, nei progetti di solito `registered_files`). Così il controller tratta in due blocchi separati i file da salvare (`varname[…]`, con `tmp_file`) e i record esistenti da aggiornare (`registeredVarname[…]`), senza dover distinguere caso per caso. Con il default `null` tutto va sotto `varname`, come oggi.

- Chiave dei file registrati: `id`, oppure `rel_id` con `useRelId` (tabelle molti-a-molti, dove il record da aggiornare è quello di relazione e non il file). Oggi `use_rel_id` è definito per ogni campo aggiuntivo; proposta: un'unica opzione dell'uploader, perché la chiave deve essere la stessa per tutti i campi dello stesso file (ordine compreso).
- File registrati rimossi: `deleteVarname[]`, come oggi.
- **Sostituzione in modalità singola**: oggi non genera `deleteVarname[]` per il file sostituito; con lo stato esplicito verrebbe naturale inviarlo (come per qualsiasi rimozione). Da rivedere con i controller, vedi [Decisioni aperte](#decisioni-aperte).

### Include Twig

L'include attuale fa tre cose: converte le entità in `values` (con gli URL del viewer), genera il markup dei campi aggiuntivi predefiniti (`std_markup`) con classi Bootstrap, serializza tutto in `data-*`. Nella nuova versione:

- i **campi aggiuntivi predefiniti** passano nel componente: `extraFields: [{ key, label, type, options, emptyFirstOption, attrs, class }]`, costruiti con `dom-builder-helpers/form-tags.js`; `markup` (stringa con segnaposto) resta come alternativa per i casi particolari;
- l'include si riduce alla **conversione entità → `values`** (compreso `value_sub_key` per i valori annidati) e alla scrittura degli attributi di `<file-uploader>`;
- la parte sugli URL del viewer resta in Twig, perché dipende dal progetto.

### API pubblica

```html
<file-uploader uploaderurl="/upload" varname="foto" filetype="img" multiple required
  maxfilesize="2MB" imgminw="800" legend="Fotografie"></file-uploader>
```

```js
import { FileUploader } from '@massimo-cassandro/minimo/src/web-components/file-uploader/file-uploader-component.js';

FileUploader.setDefaults({ uploaderUrl: '/upload', classes: { selectBtn: 'btn btn-outline' } });
document.querySelector('file-uploader').init({ values: [...], extraFields: [...] });
```

Proprietà e metodi: `items` (sola lettura), `isUploading`, `addFiles(files)`, `remove(id)`, `abort(id?)`, `reset()`, oltre a quelli nativi dei controlli di form (`form`, `validity`, `checkValidity()`, `reportValidity()`).

Eventi (`event.detail.fileUploader` è l'istanza):

| Evento | Quando | Sostituisce |
|---|---|---|
| `fupl:ready` | struttura costruita e valori iniziali mostrati | `init_callback` |
| `fupl:upload-start` | inizio dell'invio di un file | `upload_start_callback` |
| `fupl:upload-progress` | avanzamento | `alternative_loading_func` |
| `fupl:upload-complete` | file caricato (o errore del server) | `upload_complete_callback` |
| `fupl:error` | file rifiutato o errore di invio; annullabile (`preventDefault()` evita il messaggio interno, per usare `modal-alert` o `snackbar`) | alert interno |
| `fupl:remove` | elemento rimosso | — |
| `fupl:sort` | ordine cambiato | — |
| `fupl:change` | qualsiasi variazione dell'elenco | — |

Errori: mostrati in linea in una zona `role="alert"` dentro il componente (chiudibile), non più in un overlay. Chi vuole un dialog usa `fupl:error`.

### Parametri: da vecchi a nuovi

| Vecchio | Nuovo | Note |
|---|---|---|
| `uploader_url` | `uploaderUrl` | obbligatorio |
| `ajax_method` | `method` | default `'POST'` |
| `varname` | `varname` | default `'file'` |
| `delete_varname` | `deleteVarname` | default `'elimina_file[]'` |
| `registered_extra_field_varname` | `registeredVarname` | default `null` (= `varname`), vedi [File registrati](#file-registrati) |
| `filetype` | `filetype` | preset `auto`, `img`, `svg`, `img+svg`, `pdf`; accetta anche un array di preset |
| `accept` | `accept` | sempre unito al preset, non solo con `auto` |
| `multiple`, `required`, `disabled` | uguali | attributi booleani dell'elemento |
| `max_filesize` | `maxFileSize` | numero = KB (come oggi) oppure stringa `'500KB'`, `'2MB'` |
| `img_w`, `img_h`, `img_min_w`, `img_min_h`, `img_max_w`, `img_max_h` | `imgW`, `imgH`, `imgMinW`, `imgMinH`, `imgMaxW`, `imgMaxH` | |
| `img_aspect_ratio`, `aspect_ratio_accuracy` | `imgAspectRatio`, `aspectRatioAccuracy` | |
| `values` | `values` | stessa struttura (`id`, `rel_id`, `name`, `url`, `src`, `wi`, `he`, `size`, …) |
| `sortable`, `sortable_varname` | `sortable`, `sortableVarname` | |
| `extra_fields` | `extraFields` | campi predefiniti `{ key, label, type, options, … }` oppure `{ key, markup }` con segnaposto `{{id}}`, `{{name}}`, `{{val}}`, `{{checked}}`; `use_rel_id` diventa un'opzione dell'uploader (`useRelId`) |
| `uploader_legend`, `uploader_legend_text`, `uploader_legend_class` | `legend` (testo o `false`) + `classes.legend` | |
| `help_text`, `custom_info_text`, `show_info_text`, `show_optimize_info` | `helpText`, `infoText`, `showInfoText`, `showOptimizeInfo` | |
| `disable_submit` | `blockSubmitWhileUploading` | default `true` |
| `locales` | `locale` | default `'it-IT'`, come json-table |
| `debug` | `debug` | |
| `input_label_class`, `wrapper_extra_class`, `fupl_alert_btn_class`, `element_dragover_class` | `classes.*` | |
| stringhe `local_strs` / `i18n/*.js` | `labels` | testo semplice, senza HTML; segnaposto per i valori |
| callback `*_callback`, `alternative_loading_func` | eventi | niente più nomi di funzione come stringa |

Nuovi: `maxFiles`, `maxConcurrentUploads` (default 3), `uploadFieldName`, `requestHeaders`, `requestData`, `layout` (`'auto'`, `'grid'`, `'list'`), `lightbox` (default `true`), `capture`.

Eliminati senza sostituto: tutti i `template_*`, `fupl_alert_template`, `fancybox*`, `sortable_icon`, `info_text_wrap_string`, `info_text_join_string` (confluiscono in `labels`), parametro `css`, `selector`, `data-file-uploader` JSON, controllo del browser, `_VERSION`.

### Altre scelte

- **Tipo per file, non per uploader**: oggi l'intero uploader è «img» o «doc». Nella nuova versione ogni elemento sa se è un'immagine: con `filetype: 'auto'` le immagini hanno l'anteprima e gli altri file un'icona per tipo (voce del vecchio TODO). `layout: 'auto'` sceglie griglia o elenco in base al preset.
- **Anteprime** con `URL.createObjectURL` (revocato alla rimozione) invece di `FileReader` in base64; dimensioni in pixel con `createImageBitmap`. Dimensioni degli SVG: rilevabili se hanno `width`/`height` o `viewBox` (TODO presente nel vecchio codice), da valutare.
- **Invio** ancora con `XMLHttpRequest`: `fetch` non espone l'avanzamento del caricamento in modo utilizzabile su tutti i browser. Incapsulato in `upload.js`, con annullamento.
- **Anteprima ingrandita** con `<dialog>` nativo al posto di Fancybox (voce del vecchio TODO).
- **Riordino**: stato per istanza; oltre al trascinamento, pulsanti «sposta prima/dopo» per tastiera e touch. Il trascinamento parte solo dall'icona di trascinamento (l'elemento diventa `draggable` solo mentre l'icona è premuta): la demo attuale segnala che in alcuni browser (Firefox) il testo dei campi aggiuntivi dentro un elemento `draggable` non è selezionabile.
- **Token**: `file-uploader.minimo.tokens.mjs` con prefisso `--fupl-*`, a partire da `scss/_fupl-default-variables.scss` (contorno e sfondo del riquadro, stato di trascinamento, bordo e raggio degli elementi, sfondo delle immagini, stato disabilitato, testo informativo, riordino, avanzamento, errori).
- **Twig e PHP**: include ridotto (vedi [Include Twig](#include-twig)) e controller PHP di esempio, entrambi in `snippets/`.

---

## Voci acquisite dal vecchio TODO.md

| Voce | Destinazione |
|---|---|
| Rimuovere `_VERSION` dal codice | superata: nessuna versione nel codice |
| Custom properties | file token `--fupl-*` (fase 2) |
| Visualizzazione ingrandita delle immagini (glightbox o nativo) | `<dialog>` nativo (fase 6) |
| Parametro `filetype` anche come array | `filetype` array di preset + `accept` (fase 3) |
| Anteprima immagini anche con `auto`; icona per gli altri documenti | tipo per file (fasi 2 e 6) |
| Campi aggiuntivi dei file registrati `disabled`/`readonly` o con classe aggiuntiva | proprietà `registered: { disabled, readonly, class }` in ogni definizione di `extraFields` (fase 5) |
| Ritaglio ([cropperjs](https://github.com/fengyuanchen/cropperjs), [croppie](https://github.com/foliotek/croppie)) | fase 8, peer dependency opzionale |
| Fotocamera ([attributo `capture`](https://austingil.com/html-capture-attribute/)) | parametro `capture` passato all'`input` (fase 3) |

---

## Demo

Le pagine della vecchia demo (`demo/pug/*.pug`, `demo/js/*.js`) vanno riprodotte nella demo centralizzata di minimo, come per json-table: cartella `demo/demo-files/file-uploader/`, voce `file-uploader` in `demo/routes.js`. I file di prova (`demo/test-files/`: JPEG di varie proporzioni, PNG piccoli, PDF, SVG, RTF) vanno copiati nella nuova cartella.

Il server non c'è (la demo statica andrà su GitHub Pages): come oggi, `uploaderUrl` punta a un JSON statico (`{ "tmp_file": "temporary_file_name", "error": null }`) con `method: 'GET'`. Va aggiunta una risposta con errore, per provare la gestione degli errori del server, e un modo per rallentare il caricamento (oggi la demo chiede di usare la limitazione di rete degli strumenti per sviluppatori).

Pagine attuali → nuova demo:

- [ ] `single-img-demo` — immagine singola, vincoli minimi, file registrato, avvio da `input[type=file]` → uguale
- [ ] `multiple-imgs-demo` — immagini multiple, parametri da JS → uguale, parametri via `init()`
- [ ] `single-doc-demo` — documento singolo, `filetype: auto`, file RTF registrato → uguale, con icona per tipo di file
- [ ] `multiple-doc-demo` — più PDF, `filetype: pdf` → uguale
- [ ] `svg-demo`, `mixed-img-svg-demo` — SVG e immagini + SVG con riordino → uguale; serve anche per la verifica sul caricamento degli SVG (vedi [Decisioni aperte](#decisioni-aperte))
- [ ] `aspect-ratio` — proporzioni 16:9 e 1:1 → uguale
- [ ] `sortable` — riordino → uguale, più tastiera
- [ ] `extra-fields` — campi aggiuntivi su elementi riordinabili, `rel_id` → uguale, con campi predefiniti e con `markup`, `registeredVarname` e `useRelId`
- [ ] `multiple-uploaders` — due uploader nella stessa pagina, `varname` diversi → uguale
- [ ] `required` — invio bloccato senza file → validazione nativa, senza script esterno
- [ ] `uncompleted-upload`, `disabling-submit-demo` — invio durante un caricamento → unica pagina con `blockSubmitWhileUploading`
- [ ] `disabling-uploader` — attivazione/disattivazione → anche tramite `fieldset` disabilitato
- [ ] `callbacks` — un `alert` per ogni callback → registro degli eventi `fupl:*` nella pagina
- [ ] `fancybox` — anteprima ingrandita → anteprima con `<dialog>`
- [ ] `php_sample` — esempio lato server → non in demo: controller PHP di esempio in `snippets/`
- `umd-version-demo` → eliminata (niente versione UMD)

In tutte le pagine: una sezione che mostra i dati che verrebbero inviati con il form (`new FormData(form)`), utile per verificare `varname`, `registeredVarname`, `deleteVarname` e l'ordine, al posto del `$_POST` dell'esempio PHP.

---

## Piano di lavoro

Ogni fase termina con qualcosa di verificabile nella demo; le pagine della [Demo](#demo) si aggiungono man mano che le funzioni sono pronte.

1. [ ] **Scheletro** — cartella, `defaults.js` con typedef, `resolve-params.js`, classe `FileUploader` (attributi, `init()`, `setDefaults()`), registrazione dell'elemento, `labels` in italiano, lettura di `input[type=file]` e `<label>` figli, cartella `demo/demo-files/file-uploader/` con file di prova e risposta JSON statica, voce in `demo/routes.js`.
2. [ ] **Stato e rendering** — modello degli elementi, struttura principale, elementi registrati (`values`), stato vuoto, singolo/multiplo, griglia/elenco, file token e CSS module.
3. [ ] **Selezione, controlli, invio** — `input` e trascinamento, `accept.js`, `validate-file.js`, lettura delle dimensioni, coda di invio con avanzamento e annullamento, messaggi di errore in linea, eventi.
4. [ ] **Form** — `ElementInternals`: valore, validità (`required`, caricamento in corso), `disabled`, reset, blocco dell'invio.
5. [ ] **Rimozione, riordino, campi aggiuntivi** — `deleteVarname`, `registeredVarname` e `useRelId`, `sortable` (trascinamento + tastiera), `extraFields` predefiniti e con markup, opzioni per i file registrati.
6. [ ] **Anteprime** — `<dialog>` per le immagini, icone per tipo di documento, anteprima con `filetype: 'auto'`.
7. [ ] **Chiusura** — `readme.md`, demo completa (vedi [Demo](#demo)), include Twig e controller PHP di esempio in `snippets/`, aggiornamento di `CLAUDE.md` e `TODO.md` della root, eliminazione di `TODO js-file-uploader/`.
8. [ ] **Successive** — ritaglio delle immagini, caricamento a blocchi per file grandi, eventuale `en` per `labels`.

---

## Decisioni prese

- [x] **Light DOM** con `formAssociated` + `ElementInternals` (vedi [Light DOM](#light-dom)).
- [x] **Include Twig da superare**: resta solo la conversione delle entità in `values` (vedi [Include Twig](#include-twig)).

## Decisioni aperte

- [ ] **Sostituzione in modalità singola**: inviare `deleteVarname[]` anche per il file registrato sostituito, o lasciare che sia il server a gestire la sostituzione? Da rivedere con due o tre controller reali.
- [ ] **`useRelId` per uploader invece che per campo aggiuntivo**: verificare che nessun progetto usi chiavi diverse per campi diversi dello stesso file.
- [ ] **Caricamento degli SVG nella versione attuale**: oggi funzionano, mentre dalla lettura di `send-files.js` sembrerebbero rifiutati. Da provare nella vecchia demo (`demo/svg-demo.html`, `demo/mixed-img-svg-demo.html`) prima della fase 3, per capire quale dei due controlli sul formato agisce davvero.
- [ ] **Valore del form**: `ElementInternals.setFormValue(FormData)` (raccomandato) oppure campi nascosti come oggi. Con `ElementInternals` i campi non sono più visibili nel DOM: da verificare che nessun progetto li legga via JS.
- [ ] **Uso fuori da minimo**: allinearsi a quanto fatto per json-table (CSS module + custom properties generate da `build-tokens`). Se serve un uso senza bundler, valutare valori di ripiego nei `var(--fupl-*, …)` o un CSS dei token già compilato accanto al componente.
- [ ] **Messaggi di errore**: zona in linea (proposta) o dialog? Con `fupl:error` annullabile resta comunque possibile delegare a `modal-alert`.
