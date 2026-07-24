# TODO — @massimo-cassandro/minimo

Riferimento centralizzato dei prossimi interventi. Le dir con prefisso `TODO ` in `src/` indicano codice già spostato da `_wrk/` in attesa di integrazione.

---


## CUSTOM PROPERTIES:
  * aggiungere prefisso (`mm-`) a tutte le custom properties **generiche/base** di minimo (`--size-*`, `--color-*`, `--radius-*`, `--text-color`, `--body-background-color`, `--z-index-*`, ...), per evitare collisioni con custom properties di progetti che integrano minimo. Non serve invece sui token già namespaced per componente (`--malert-*`, `--sf-macro-*`, `--up-*`, ...), poco a rischio di collisione — vedi anche la sezione [Compatibilità con framework diversi da minimo (CSS)](#compatibilità-con-framework-diversi-da-minimo-css). Breaking change: in versione 2. Da accompagnare con uno script di migrazione (find/replace sui nomi noti delle custom properties) per i progetti esistenti.

## WEBPACK PLUGIN PER ESTRAZIONE OTTIMIZZATA DELLE CSS CUSTOM PROPERTIES

  * **Contesto:** minimo ha un file "master" con **tutte** le definizioni di custom properties disponibili (spacing, colori, tipografia, ecc.). Nei progetti che consumano il framework le definizioni vengono rimosse a monte e i CSS compilati da webpack contengono solo *usi* (`var(--nome)`), mai definizioni. Serve un plugin webpack che, dopo l'emit degli asset, scansioni i CSS compilati, determini quali custom properties sono effettivamente usate (incluse le dipendenze transitive) e inietti solo le definizioni necessarie in uno o più file target. La cosa viene fatta ora con postcss-jit-props, mentre l'uso di purgeCSS non ha dato mai risultati accettabili (ma viene cmq conservato per il purge delle classi)

  * **Perché non jit-props:** [postcss-jit-props](https://github.com/GoogleChromeLabs/postcss-jit-props) risolve un problema simile ma a livello di singolo file, dentro la pipeline PostCSS pre-bundling: produce duplicazioni tra chunk e non permette di controllare il raggruppamento sources→target sul risultato finale del bundle. Il plugin va invece fatto operare sugli asset già finalizzati da webpack (hook `processAssets`, stage `PROCESS_ASSETS_STAGE_ADDITIONAL`).

  * Legge un file di definizioni globale (master) con tutte le custom properties disponibili

  * Per ogni "set" configurato (array di file CSS sorgente compilati → un file target), scansiona i sorgenti per trovare le custom properties effettivamente usate (`var(--nome)`)

  * Risolve ricorsivamente le dipendenze transitive: se `--a` è usata ed è definita come `calc(var(--b) * 2)`, anche `--b` va inclusa, a cascata fino al fixed point — incluse le var() nei fallback (`var(--foo, var(--bar))`)

  * Estrae le definizioni corrispondenti dal master, **preservando l'ordine originale di dichiarazione** (rilevante per il calcolo a cascata dei valori CSS)

  * Inietta le definizioni risolte nel file target di quel set (nuovo asset o merge in un file esistente, configurabile), ripetendo il processo per ogni set in modo indipendente.

  * Configurazione indicativa:
    ```js
    {
      definitionsFile: 'src/tokens/all-custom-props.css',
      sets: [
        { sources: ['dist/main.css', 'dist/vendor.css'], target: 'dist/tokens.css' },
        { sources: ['dist/admin.css'], target: 'dist/admin-tokens.css' }
      ]
    }
    ```

    * **NB:** valutare opzione (preferita) di utilizzare come file di target uno dei file source, iniettando le custom props all'inizio (se possibile, tenendo conto dell'eventuale presenza del banner prodotto da webpack)

    * **opzione aggiuntiva** per la scelta del selettore da usare le props (`:root`, default, o `:where(html)`, o qualsiasi altro scelto dall'utente)

  * Requisiti tecnici:

    * Parsing delle *definizioni* nel master file con PostCSS (non regex), per gestire correttamente valori complessi, funzioni annidate, stringhe con virgole/parentesi

    * Scansione degli *usi* nei CSS compilati può restare a regex (`/var\(\s*(--[\w-]+)/g`), essendo solo pattern-matching, non trasformazione

    * Gestione esplicita di scope diversi da `:root` nel master (es. override in media query, classi di tema) — se una prop base è inclusa, va portato con sé anche l'eventuale blocco di override, non solo la definizione base

    * Compatibilità con watch mode: il file master può essere cachato (cambia raramente), il set "usato" va ricalcolato ad ogni build incrementale

    * Il plugin deve girare dopo eventuali step di minify/ottimizzazione CSS di webpack, così il match avviene sul CSS realmente servito

  * Casi da non dimenticare:

    * **Dark mode / temi:** il master può contenere override di custom properties dentro selettori come `[data-theme="dark"]`, `.dark-mode`, o dentro `@media (prefers-color-scheme: dark)`. Vanno inclusi nel target ogni volta che la prop base corrispondente risulta usata, anche se il blocco di override in sé non contiene un uso diretto rilevabile dalla scansione — altrimenti il tema alternativo si rompe silenziosamente

    * **Custom properties "locali":** per convenzione le custom properties locali/interne a un componente hanno prefisso underscore (es. `--_spacing-internal`). Non fanno parte del pool globale del master e vanno escluse sia dalla scansione degli usi sia dalla risoluzione transitiva (pattern `--_`), per non cercarle inutilmente nel master né generare falsi "non trovati". In realtà questi casi dovrebbero essere gestiti dall'analisi dello scope (vedi sopra) e trattati come qualsiasi altra definizione gestita "internamente" in un selettore ad hoc. Es:

    ```css
    .mio-componente {
      --my-prop: #fff;
      --_my-prop2: #000;

      p {
        color: var(--my-prop);
        background: var(--_my-prop2);
      }
    }
    ```

## ICONE: centralizzare l'uso delle icone tramite un file `icons.js` come unica fonte di verità, per evitare potenziali duplicazioni dello stesso file

## UNSPLASH PAGE 
  * parametrizzare le icone nel box del messaggio ed altri eventuali parametri


## `src/components/TODO form-multiselect/`

## `src/web-components/TODO json-table/`

## `src/components/TODO vanilla-cookie-consent/`

## AUTOCOMPLETE

  * **Problema con domBuilder callback:** al momento della chiamata il campo non è ancora attaccato al document — e autoComplete.js lo cerca con document.querySelector. In dom-builder.js:177 i children vengono costruiti (e i loro callback eseguiti, riga 199) prima che l'elemento radice del blocco venga appeso a params.root (riga 194 della chiamata esterna). Quindi quando scatta il callback su #ac-dest, l'input esiste ma vive in un sottoalbero staccato dal documento. Il TODO a dom-builder.js:198 accenna proprio ai limiti di timing dei callback. autocompleteEngine non passa l'elemento ad autoComplete.js, ma un selettore stringa: selector: '#' + params.autocomplete_field.id (autocomplete-engine.js:178). In autoComplete.js, select() fa document.querySelector(selector) → restituisce null perché l'elemento non è nel documento. Poi create(this.input, {'aria-controls': …}) esegue key in el su null → ecco il TypeError: Cannot use 'in' operator to search for 'aria-controls' in null.

  * Risolvibile spostando la chiamata ad autocomplete dopo l'esecuione di dombuilder

  * **Fix strutturale nel pacchetto autocomplete:** autoComplete.js accetta anche una funzione come selector (e come resultsList.destination): in autocomplete-engine.js potresti usare selector: () => params.autocomplete_field e destination: () => params.autocomplete_field, rendendo l'engine indipendente dal fatto che il campo sia già nel DOM. È una modifica al pacchetto @massimo-cassandro/autocomplete, quindi va fatta lì e ripubblicata — ma risolverebbe il problema per tutti i casi d'uso con domBuilder.

  * prevedere possibilità utilizzo anche senza framework minimo

  * Pattern XSS via `innerHTML`/`insertAdjacentHTML` non sanificato su contenuti potenzialmente non fidati, stesso problema già risolto in `dom-builder.js` (v1.11.0, vedi sezione Performance e sopra "textContent/setHTML"):
    * `components/autocomplete/autocomplete-engine.js:218` — il messaggio "nessun risultato" reinietta `data.query` (l'input dell'utente) via `innerHTML` senza escape.
    * `components/autocomplete/autocomplete-engine.js:111,254` — `badges_builder` di default interpola `result_obj.val` senza escape nel markup del badge.

  * Valutare autocomplete indipendente oppure aggiungere `@tarekraafat/autocomplete.js` a `peerDependenciesMeta` come opzionale


  * **`<div>` wrapper garantito nelle voci della lista risultati** — in `src/autocomplete-engine.js` (autocompleteEngine, wrapper di @tarekraafat/autocomplete.js): fare in modo che l'engine garantisca sempre un `<div>` wrapper attorno al contenuto di ogni voce della lista risultati (`list_display`).

    * **Contesto:** i CSS dei progetti che usano questa libreria (es. ADA) applicano gli stili di hover e di navigazione da tastiera ai selettori `li[aria-selected='true'] > div` e `li > div:hover`. Oggi la presenza del div dipende da come ogni implementazione costruisce `list_display`: dove manca, la navigazione con le frecce funziona (aria-selected si sposta) ma è invisibile, perché nessuna regola CSS si applica. Il wrapper deve diventare una garanzia dell'engine, non una convenzione a carico dei chiamanti.

    * ogni `li` della lista risultati deve avere come unico figlio diretto un `<div>` che contiene il markup di `list_display`, incluso il `<mark>` generato dall'highlight della libreria, che deve continuare a funzionare: viene inserito con un replace sulla stringa, quindi il punto giusto dove wrappare è probabilmente il callback `resultItem.element`, che riceve l'elemento `li` già popolato

    * se `list_display` è già racchiuso in un unico `<div>` radice (alcune implementazioni passano `<div class="...">…</div>` con classi proprie, es. `alert-item`), NON aggiungere un secondo div: il markup e le classi esistenti devono restare identici

    * nessun cambiamento all'API pubblica: `fetch_result_function`, il formato `{id, val, list_display}` e gli argomenti dei callback restano invariati (il 4° argomento del callback, list_display/outerHTML, può includere il div)

    * aggiornare il README documentando che il div wrapper è garantito dall'engine e che nei CSS ci si può affidare a `li > div`

    * verifica con test manuale o headless: digitare una query, premere freccia giù e controllare che il `li[aria-selected='true']` contenga un `> div` sia con `list_display` semplice (solo testo) sia con `list_display` già wrappato in div

    * quando la nuova versione sarà pubblicata e aggiornata in ADA: togliere i `<div>` espliciti dalle sei implementazioni in `ada-frontend/src/shared/autocomplete/`
  
    * `autocomplete/autocomplete.css` (`--secondary-100`, `--text-muted`, righe 16 e 83 — il resto del file usa colori hardcoded locali, quindi è parzialmente portabile) 
    
    * `components/autocomplete/autocomplete-engine.js:111` — il markup di default per i badge usa classi Bootstrap (`badge rounded-pill text-bg-secondary`) invece della classe `.badge` di minimo stesso (`src/css/badge.css`): incoerente sia se usato dentro minimo (badge non stilato secondo i suoi token) sia fuori (dipende comunque da Bootstrap non dichiarato). Da allineare a `.badge` di minimo o rendere il default neutro.

## SNACKBAR
  * completare 
  * rendere custom props e css indipendenti dal resto `snackbar/snackbar.module.css` (`--size-*`, `--snackbar-*`, `--z-index-snackbar`)
  
## MODAL POPUP
  * rendere custom props e css indipendenti dal resto `modal-popup/modal-popup.module.css` (`--body-background-color`, `--modal-popup-*`, `--size-*`)
  * unificare con `_wrk/popup-page`?

## FILE-UPLOADER
  * includere e riscrivere `js-file-uploader` come web-component

## MINIMO
  * includere anche stylelint ed eslint config??
  * includere e successivamente archiviare `auto-datatables-bs5` e `ckeditor-utilities`
  * Includere layout-tools? è adattabile a minimo?
  * completare readme
  * docs -> build with jsDoc
  * capire come organizzare la dir `snippets`, recupero di quanto utile da `_wrk/__snippets`
  * rimozione `_wrk`, spostare autodatatable (anche il repo, da deprecare) in `archived`
  * Miglioramenti perfomances e verifica componenti con css per far sì che possano essere usati anche frameowrk diversi da minimo.
  * Analisi di `src/components` e `src/utilities` (esclusi i sotto-dir con prefisso `TODO ` — `form-multiselect`, `vanilla-cookie-consent` — già tracciati sopra come da integrare, non ancora in uno stato stabile).

## FORM
  * nuovo componente che combini la parte di gestione del submit del form in un unico componente. Da valutare. In caso positivo valutare se marcare come @deprecated le vecchie funzioni, ma manternerle per compatubilità (in una nuova dir `deprecated`?) (vedi commento in validation-error-class). Considerare che `disableBtnsOnSubmit` ha senso in tutte le situazioni in cui non sia necessario un listener submit ad hoc

## DOM BUILDER
  * `dom-builder/dom-builder.js:4-5` — sintassi stringa multi-riga e nidificazione con indent
  * `dom-builder/dom-builder.js:169` — callback con azioni su children potrebbero non essere eseguiti in assenza di parent 

## SF-MACRO
   * rendere indipendebti css e custom props `sf-macro/sf-macro.css` (già namespaced su `--sf-macro-*` e con token collocati; verificare se serve un fallback esplicito per l'indipendenza CSS completa)

## CHARTS 
  * (vedi anche `_wrk/charts`)

## CSS
  * `visibility.css:21` — da rivedere
  * `alerts.css:75` — links da completare
  * `grid.css` — unificare regole comuni con `flex.css`
  * `anchors.css` — rivedere e completare; sostituire colori con custom props specifiche
  * `table.css:10` — aggiungere opzione alternate row color
  * `text.css:7` — rivedere
  * `margin-padding.css` — generare utilities in automatico; anche versione con naming Bootstrap
  * `forms/fieldset.css:2` — da verificare
  * `forms/forms.css` — separare file; radio/checkbox groups; multiselect; `.form-grid`; customizable select; form-check come flex
  * `buttons/status-buttons.css` — rivedere tutto
  * `buttons/buttons.css` — dividere per variante; button solo-icona da completare o eliminare
  * `buttons/btn-close.css:6` — controllare allineamento `×` interna
  * `overlay/overlay.css` (`--z-index-overlay`, `--text-color`, `--body-background-color` — senza token l'overlay diventa invisibile ma resta nel DOM, fallimento silenzioso)


## DESIGN TOKENS
  * `btn-color-themes.minimo.tokens.mjs` — aggiungere temi `neutral` e `accent`
  * `form.minimo.tokens.mjs:292` — importazione automatica SVG (problemi con svgo)

## SPINNER
  * completare 
  * vedi anche `_wrk/spinner`
  * `components/spinner/spinner.js:11` — ritorna una stringa HTML con classe `.spinner` hardcoded (non passa dal CSS module `styles`), mentre `spinnerWrapper` sì: incoerenza nella stessa funzione tra classi scoped e globali 
  * rendere autonome custom props e css `spinner/spinner-circle-basic.css` (`--spinner-size`, `--spinner-color`, `--spinner-stroke-width`)

## CREATE FAVICONS
  * Rivedere calcolo percorsi
  * Rivedere meccanismo parametri cli (fare come svg-icons-tools)
  * Opzione calcolo percorso file nello snippet, in base alla sua posizione

## JS-FILE-UPLOADER
  * rifattorizzare (vedi todo nel repo)
  * prevedere possibilità di uso anche senza framework minimo

## DECIDERE SE TENERE
  * `_wrk/create-blurhash-canvas.js`
  * `_wrk/img-viewer-dom-builder.js`
  * `_wrk/print-icon.js`
  * `_wrk/alert-autoclose.js`
  * `_wrk/print-icon.js` eliminare???


## DATE
  * `utilities/relative-date.js:85` — `new Intl.RelativeTimeFormat('it', ...)` è hardcoded a `'it'` invece di usare `opts.locale` (che invece viene usato correttamente per `toLocaleString`): bug di correttezza oltre che micro-perf (nessun riuso dell'istanza tra chiamate/tick del `setInterval`).

## GENERATE-PWD
  * `utilities/generate-pwd.js:16` — usa `Math.random()` (non crittograficamente sicuro) invece di `crypto.getRandomValues`, a differenza di `utilities/random-id.js` che lo fa correttamente. Trattandosi di generazione password, andrebbe allineato.

  