# CLAUDE.md — @massimo-cassandro/minimo

## Contesto di dominio

Framework leggero JS + CSS (`@massimo-cassandro/minimo`) con componenti e utilità gestibili on-demand. Pubblicato su npm come pacchetto pubblico ES module.

Progettato per essere usato con **webpack** (configurazione starter inclusa in `dev-tools/starter-kit/`). Importazioni SVG e CSS modules dipendono dalla configurazione webpack fornita.

---

## Struttura del progetto

```
minimo/
├── index.js                        # entry point principale (export JS)
├── _wrk/                           # repo vecchi in lavorazione, da integrare in minimo (non pubblicato)
│   ├── spinner/                    # componente spinner
│   ├── popup-page/                 # pagina popup
│   ├── auto-datatable-customization/
│   ├── alert-autoclose.js          # single-file utilities
│   ├── flash-alerts.js
│   ├── img-viewer-dom-builder.js
│   ├── create-blurhash-canvas.js
│   ├── print-icon.js
│   └── __snippets/                 # snippet di codice da vari progetti (style-dictionary, utilities varie)
├── src/
│   ├── minimo.css                  # entry point CSS principale
│   ├── custom-properties.css       # CSS custom properties
│   ├── custom-media.css            # media query custom (gestite da PostCSS)
│   ├── fonts.css
│   ├── css/                        # moduli CSS
│   │   ├── reset.css, layout-base.css, container.css
│   │   ├── forms/                  # forms, fieldset, form-group, input-group, validation, ...
│   │   ├── buttons/                # buttons, status-buttons, btn-close, ...
│   │   ├── badge.css, text.css, anchors.css, headings.css, alerts.css
│   │   ├── icons.css, svg.css, table.css, flex.css, grid.css, details.css
│   │   └── dimensions.css, display.css, margin-padding.css, overflow.css, position.css, visibility.css
│   ├── icons/                      # SVG (Phosphor icons)
│   ├── utilities/                  # utilità JS
│   │   ├── classnames.js
│   │   ├── dom-builder/            # dom-builder.js, parseDomString.js, domBuilderBasicSetup.js
│   │   ├── enable-submit-btns.js
│   │   ├── sentence-case.js, title-case.js
│   │   └── validation-error-class.js
│   ├── components/                 # componenti JS (+CSS)
│   │   ├── autocomplete/           # wrapper di @tarekraafat/autocomplete.js
│   │   ├── dismiss-alerts.js
│   │   ├── form-reset-submit.js
│   │   ├── inner-nav/
│   │   ├── modal-alert/            # dialog modale (usa HTMLDialogElement)
│   │   ├── modal-popup/            # popup — nuova versione in produzione
│   │   ├── overlay/
│   │   ├── sf-macro/               # integrazione form Symfony
│   │   ├── snackbar/               # usa Popover API
│   │   ├── spinner/                # solo CSS
│   │   ├── unsplash-page/          # pagina foto Unsplash
│   │   ├── TODO form-multiselect/       # spostato da _wrk, in attesa di integrazione
│   │   └── TODO vanilla-cookie-consent/ # spostato da _wrk, in attesa di integrazione
│   └── web-components/
│       ├── s-datatable-component/  # web component per simple-datatables ⚠️ da deprecare (verrà sostituito da json-table)
│       └── TODO json-table/        # spostato da _wrk, ★ futuro sostituto di s-datatable-component (vedi sotto)
├── charts/                         # grafici SVG (usa @svgdotjs/svg.js come peer dep opzionale)
│   ├── index.js                    # export: barsChart, goalChart, linesChart, MinimoCharts
│   ├── src/
│   │   ├── bars.js, lines.js, goal.js
│   │   ├── helpers/                # cartesian-axis, chart-utils, core, create-svg-canvas, legenda, ...
│   │   ├── node-helpers/           # rendering SVG lato server (richiede opentype)
│   │   └── rating-display/         # grafico gauge (commentato in index, WIP)
│   └── TODO charts/                # vecchia versione (1a vers) da rifattorizzare, spostata da _wrk/charts
├── design-tokens/
│   ├── _src/                       # sorgenti token (.mjs e .jsonc)
│   └── tokens/                     # token compilati (JSONC, W3C DTCG format) — generati da build-tokens
├── design-tokens/utilities/        # script Node.js per build token (Style Dictionary v5)
│   ├── build-tokens.mjs            # → CLI: buildTokens
│   └── check-unresolved-custom-props.mjs  # → CLI: checkUnresolvedProps
├── dev-tools/starter-kit/          # configurazione webpack starter + script d'installazione
├── demo/                           # ambiente di test dei componenti (webpack, config interna alla dir)
├── demo-build/                     # (non ancora presente) build statica della demo per GitHub Pages
├── snippets/                       # porzioni di codice slegate dal framework, utili per integrazioni rapide
└── archived/                       # vecchi script inutilizzati, parcheggiati per usi futuri (potrebbero essere eliminati)
```

---

## Tecnologie

| Ambito | Tecnologia |
|---|---|
| Build demo | Webpack |
| Build token | Style Dictionary v5 |
| CSS | PostCSS, CSS Modules (componenti) |
| Linting | ESLint (`@massimo-cassandro/eslint-config`), Stylelint (`@massimo-cassandro/stylelint-config`) |
| Formattazione | Prettier |

---

## Convenzioni di codice

**Lingua dei commenti**: i commenti `TODO`/`FIX` (e simili, es. `FIXME`) vanno scritti **in italiano**. Tutti gli altri commenti nel codice vanno scritti **in inglese**.

**Caratteri Unicode**: dove nel codice si trovano caratteri Unicode letterali (es. em dash, freccie, valuta), vanno lasciati così come sono — non vanno convertiti nella relativa sequenza di escape JS (`\uXXXX`), né viceversa.

**Valori di default nei JSDoc**: quando un parametro `@param` ha un valore di default (assegnato nella firma della funzione, in una destrutturazione, o definito altrove, es. un oggetto `defaults`), il commento del `@param` deve terminare con `(default: xxxx)`, così da renderlo visibile nei tooltip di VSCode anche quando non si usa la sintassi `[nome=valore]`. Esempio:

```js
/**
 * @param {number} [retries=3] - Numero di tentativi (default: 3)
 * @param {string} [mode] - Modalità di esecuzione (default: "auto")
 */
```

---

## File pubblicati su npm

Dal `files` di `package.json`:
- `./index.js`
- `src/**/*.{js,mjs,css,svg,md}`
- `design-tokens/tokens/**/*.{tokens.json,tokens.jsonc}`
- `design-tokens/_src/**/*.{tokens.json,tokens.jsonc,mjs,js,md}`
- `design-tokens/utilities/**/*.{mjs,md}`
- `charts/**/*.{js,md}`

**Nota:** la cartella `_wrk/` non viene pubblicata.

---

## Demo (`demo/`)

Ambiente di test e visualizzazione dei componenti di minimo. È **da completare** man mano che i componenti vengono stabilizzati.

- La configurazione webpack è contenuta nella directory stessa (`demo/webpack.config.mjs` e `demo/webpack-modules/`)
- Usa il proprio `package.json` e `node_modules` separati dal root
- Una volta raggiunta una certa stabilità, verrà generata la directory **`demo-build/`** (build statica) per la visualizzazione tramite **GitHub Pages**

---

## Documentazione (`docs/`)

La documentazione è **interamente da costruire**. Il contenuto attuale è minimo (solo un `README.md` placeholder). L'obiettivo è produrla preferibilmente con **JSDoc**, partendo dai commenti già presenti nel codice sorgente (molti file hanno già JSDoc parziale, in particolare `dom-builder.js` e `s-datatable-component.js`).

---

## snippets/

Contiene porzioni di codice **slegate dal framework** ma utili per l'integrazione rapida di alcune funzionalità in progetti che usano minimo:
- `UnsplashController.php` — controller PHP per Unsplash
- `ImgViewerController.php` — controller PHP per image viewer
- `minimo-form-layout.html.twig` — layout form Symfony/Twig
- `flash-messages.html.twig` — template Twig per flash messages
- `error-pages/` — template Twig per pagine di errore
- `unsplash-browser-app/` — utility JS per il recupero immagini da Unsplash lato browser
- `config-templates/` — template di configurazione (`.env`, `.htaccess`, robots.txt, babel, rollup, dependabot, ...)
- altri script di utilità sparsi (validazioni IT — codice fiscale, partita IVA —, festività, anti-spam email, build custom device list)

Non viene pubblicato su npm (non incluso nel campo `files` di `package.json`).

---

## archived/

Contiene vecchi script inutilizzati, parcheggiati temporaneamente per eventuali usi futuri. **Potrebbero essere eliminati del tutto** in qualsiasi momento. Non va considerato come codice attivo o di riferimento.

---

## Politica sulle dipendenze esterne

**Minimo non include dipendenze esterne nell'installazione di default.** Le librerie di terze parti vengono dichiarate come `peerDependencies` opzionali (come già avviene per `@svgdotjs/svg.js`) e devono essere installate a cura dell'utente solo quando il componente che le richiede viene effettivamente utilizzato.

Esempi attuali/previsti:
- `@svgdotjs/svg.js` — richiesto da `charts/` (già in `peerDependencies`/`peerDependenciesMeta` come opzionale)
- `blurhash` — richiesto da `unsplash-page` (già in `peerDependencies`/`peerDependenciesMeta` come opzionale)
- `@tarekraafat/autocomplete.js` — richiesto da `src/components/autocomplete/` (TODO: aggiungere a `peerDependenciesMeta`)

Ogni nuovo componente che introduce una dipendenza esterna deve seguire questa stessa logica: aggiungere la libreria a `peerDependencies` con `"optional": true` in `peerDependenciesMeta`, e documentare l'installazione richiesta.

---

## CLI tools (bin)

```bash
npx buildTokens --config ./design-tokens/tokens-config.mjs
npx checkUnresolvedProps --config ./design-tokens/tokens-config.mjs
```

---

## npm scripts

```bash
npm run build-tokens          # Compila i design token in CSS + file Penpot
npm run "check unresolved props"  # Verifica custom props non risolte nei CSS
npm run UPD-version           # Aggiorna la versione
npm run npm-publish           # Pubblica su npm
npm run upd@m                 # Aggiorna dipendenze
```

---

## Indipendenza dei design token nei componenti

Ogni componente/web-component con CSS (`src/components/*`, `src/web-components/*`) deve essere indipendente dal resto di minimo dal punto di vista dei design token: il CSS del componente fa riferimento **solo** alle proprie custom properties, namespaced sul componente (es. `--malert-*`, `--inner-nav-*`), mai a token generici di minimo referenziati direttamente (es. `--size-lg`, `--text-color`).

A questo scopo ogni cartella componente/web-component ha un proprio file `<nome-componente>.minimo.tokens.mjs` colocato al suo interno (accanto al CSS/JS). Il file token del componente può referenziare token generici di minimo (es. `{status.success.background.color}`) — la risoluzione avviene in fase di build tramite `build-tokens` — ma il CSS del componente vede solo l'output namespaced, non la catena di riferimenti. Questo rende più semplice portare il componente in framework diversi da minimo (basta il proprio file token, non l'intero `custom-properties.css`).

**Stato:** fatto per `modal-alert` e `inner-nav`. Per lo stato degli altri componenti vedi le rispettive sezioni in [TODO.md](TODO.md).

---

## CSS ottimizzazione — valutazioni in corso

### postcss-jit-props

[postcss-jit-props](https://github.com/GoogleChromeLabs/postcss-jit-props) potrebbe essere integrato come PostCSS plugin per includere automaticamente solo le custom properties effettivamente usate nel CSS compilato. **Da valutare**: il repository non viene aggiornato da molto tempo, quindi la manutenzione futura è incerta.

### PurgeCSS

L'opzione preferibile sarebbe strutturare meglio l'integrazione con **PurgeCSS**, ma in progetti con backend Symfony e template Twig produce spesso risultati errati (classi usate rimosse). Il problema potrebbe non essere legato a PurgeCSS in sé, ma al fatto che `domBuilder` genera classi dinamicamente a runtime: PurgeCSS analizza i sorgenti staticamente e non riesce a rilevare le classi costruite via stringa in JS. Anche i template Twig con classi costruite per concatenazione o tramite variabili Symfony sfuggono all'analisi statica. Se si volesse testare PurgeCSS seriamente, la strada più pulita è una **safelist esplicita** per le classi generate dinamicamente (da `domBuilder` e dai template). Da investigare prima di escludere PurgeCSS come soluzione.

---

## Cartella `_wrk` — repo in migrazione

`_wrk/` raccoglie parti di repo preesistenti da valutare per l'integrazione in minimo con la stessa logica work-in-progress. Non viene pubblicata su npm (non inclusa nel campo `files` di `package.json`), ma **è inclusa nel repo git**. Ogni elemento può essere integrato, rifattorizzato **oppure cestinato** se ritenuto inutile o obsoleto.

### json-table ★ (priorità alta)

`src/web-components/TODO json-table/` (spostato da `_wrk/json-table/`, in attesa di integrazione) è il sostituto designato di `s-datatable-component`. Il componente attuale (`src/web-components/s-datatable-component/`) è stato creato per ragioni di fretta ed **è destinato alla deprecazione** non appena `json-table` sarà pronto per la produzione.

**json-table** è un generatore di tabelle HTML da dati JSON (Ajax o statici), con search, sorting, paginazione, senza dipendenze esterne (no jQuery, no librerie terze come simple-datatables). Già pubblicato separatamente come `@massimo-cassandro/json-table`.

Struttura attuale in `src/web-components/TODO json-table/src/`:
- `js/` — moduli: `main-builder`, `table-builder`, `table-row/thead/tfoot`, `parse-data-row`, `parse-params`, `get-ajax-data`, `init-ajax-table`, `init-static-table`, `set-search-listener`, `set-sort-listeners`, `static-data-sorting`, `info-section`, `update-info`, `utilities`, `defaults`, `default-columns-data-types`
- `css/` — CSS modules: `main-builder`, `table`, `info-section`, `icons`, `utility`
- `__json-table-react/` — versione React (WIP separato)
- `index.js` — entry point

TODO aperti su json-table ([src/web-components/TODO json-table/TODO.md](src/web-components/TODO%20json-table/TODO.md)):
- Meccanismo di acquisizione JSON paginato per grandi quantità di record
- Campi numerici: classi default `text-end`/`text-numeric` sovrascrivibili
- `footerRender`: funzioni predefinite per calcoli base (somma, media, ecc.)
- Documentazione incompleta nel README (sezioni TODO)
- `src/web-components/TODO json-table/src/TODO.md`: verificare tutte le occorrenze di `this.params.ajax`

### Altri elementi in `_wrk/`

`js-utilities/` e `recaptcha/` sono stati **cestinati** (rimossi senza migrazione). `modal-popup/` è stato integrato in produzione in `src/components/modal-popup/`. `vanilla-cookie-consent/` è stato spostato in `src/components/TODO vanilla-cookie-consent/` e `json-table/` in `src/web-components/TODO json-table/` (vedi sopra), entrambi in attesa di integrazione. `unsplash-page-demo/` e `modal-alert-demo/` sono stati rimossi da `_wrk/`; quest'ultimo è ora in `demo/demo-files/TODO modal-alert-demo/`. `charts/` (vecchia versione 1a vers da rifattorizzare) è stato spostato in `charts/TODO charts/`, accanto alla nuova versione. `__snippets/twig/` (snippet Twig/Symfony: form theme, shared includes, select2, sf-macro, contenuti, error-pages, ...) è stato smistato: le parti ancora utili sono confluite in `archived/` e `snippets/`, il resto è stato **cestinato**; sono rimaste in `__snippets/` solo le sottocartelle `style-dictionary/` e `utilities/`.

Elementi ancora presenti in `_wrk/`:

| Cartella/File | Stato | Note |
|---|---|---|
| `spinner/` | da valutare | Componente spinner (attualmente in minimo solo come CSS) |
| `popup-page/` | da valutare | Componente popup page — da integrare o cestinare |
| `auto-datatable-customization/` | da valutare | Da integrare o cestinare |
| `alert-autoclose.js` | da valutare | Da integrare o cestinare |
| `flash-alerts.js` | da valutare | Da integrare o cestinare |
| `img-viewer-dom-builder.js` | da valutare | Da integrare o cestinare |
| `create-blurhash-canvas.js` | da valutare | Correlato a peer dep `blurhash` (già aggiunta in `package.json` per `unsplash-page`) — da integrare o cestinare |
| `print-icon.js` | da valutare | Da integrare o cestinare |
| `__snippets/` | archivio | Snippet `style-dictionary/` e `utilities/` da vari progetti |

---

## TODO e FIX pendenti

Traccia dei TODO/FIX sparsi nel codice, da risolvere alla prima occasione utile.

### Import CSS module (priorità bassa)

Componenti/web-component che importano un `*.module.css` (spinner, modal-popup, snackbar, slide-up-down-toggle, s-datatable-component) usano `import * as styles from './x.module.css'` e leggono le classi come export nominati (`styles.nomeClasse`). Questo assume che il consumer usi css-loader con `modules.namedExport` attivo (di fatto il comportamento effettivo di default in `dev-tools/starter-kit`, dato che non viene mai impostato esplicitamente).

Con configurazioni diverse (`namedExport: false`, o `esModule: false`) le classi finiscono sotto `.default`/`.default.locals`/`.locals` invece che come export diretti, e `styles.nomeClasse` risulterebbe `undefined` (nessun errore in build, solo classi mancanti a runtime). In passato si era tentato un fallback tipo `_css.default ?? _css` per coprire più casi, ma genera un errore di build ("export 'default' ... was not found") non appena il consumer usa `MiniCssExtractPlugin` + `namedExport` (perché webpack analizza staticamente l'accesso `.default` sul binding dell'import): per questo è stato rimosso, tornando all'import diretto.

Da affrontare con calma in futuro (eventualmente con una utility condivisa che risolva l'accesso a `.default`/`.locals` dentro una funzione, non sul binding dell'import, per non far scattare l'analisi statica di webpack).

### CSS

| File | Riga | Nota |
|---|---|---|
| [src/custom-media.css](src/custom-media.css#L1) | 1 | da rivedere: valutare rinomina breakpoint in nomi semantici per evitare collisioni con la scala `sizes`; impatto su molti file consumer e sul template personalizzabile dall'utente |
| [src/css/visibility.css](src/css/visibility.css#L21) | 21 | da rivedere |
| [src/css/alerts.css](src/css/alerts.css#L75) | 75 | alerts links da completare |
| [src/css/grid.css](src/css/grid.css#L1) | 1 | unificare regole comuni con flex |
| [src/css/anchors.css](src/css/anchors.css#L1) | 1, 4, 38 | rivedere e completare; sostituire colori con custom props specifiche |
| [src/css/table.css](src/css/table.css#L10) | 10 | opzione per alternate row color |
| [src/css/text.css](src/css/text.css#L7) | 7 | rivedere |
| [src/css/forms/fieldset.css](src/css/forms/fieldset.css#L2) | 2 | da verificare |
| [src/css/forms/forms.css](src/css/forms/forms.css#L1) | 1–6 | separare file; radio/checkbox groups; multiselect; `.form-grid`; customizable select; form-check come flex |
| [src/css/buttons/status-buttons.css](src/css/buttons/status-buttons.css#L1) | 1 | rivedere tutto |
| [src/css/buttons/buttons.css](src/css/buttons/buttons.css#L1) | 1, 93 | dividere per variante; button solo-icona da completare o eliminare |
| [src/css/buttons/btn-close.css](src/css/buttons/btn-close.css#L6) | 6 | controllare allineamento x interna |

### JS — utilities

| File | Riga | Tipo | Nota |
|---|---|---|---|
| [src/utilities/dom-builder/dom-builder.js](src/utilities/dom-builder/dom-builder.js#L4) | 4–5 | TODO | Sintassi stringa multi-riga e nidificazione con indent |
| [src/utilities/dom-builder/dom-builder.js](src/utilities/dom-builder/dom-builder.js#L169) | 169 | TODO | Callback con azioni su children potrebbero non essere eseguiti in assenza di parent |

### JS — componenti

| File | Riga | Nota |
|---|---|---|
| [src/components/autocomplete/autocomplete-engine.js](src/components/autocomplete/autocomplete-engine.js#L283) | 283 | TODO[epic=autocomplete] (da definire) |
| [src/components/autocomplete/check-autocomplete.js](src/components/autocomplete/check-autocomplete.js#L1) | 1 | TODO: trigger ac selection |
| [src/components/snackbar/snackbar.js](src/components/snackbar/snackbar.js#L16) | 16–17 | TODO: snackbar action; gestione multiple senza stacking |

### JS — web components

| File | Riga | Nota |
|---|---|---|
| [src/web-components/s-datatable-component/s-datatable-component.js](src/web-components/s-datatable-component/s-datatable-component.js#L607) | 607–608 | TODO: semplificare gestione casi; passare `nullAs` al render predefinito |
| [src/web-components/s-datatable-component/src/parse-cols.js](src/web-components/s-datatable-component/src/parse-cols.js#L55) | 55 | TODO: distinguere `null` da `false` |

### Charts

| File | Riga | Nota |
|---|---|---|
| [charts/src/helpers/chart-utils.js](charts/src/helpers/chart-utils.js#L48) | 48 | TODO: unificare con `classnames` globale |
| [charts/src/helpers/parse-std-axis-opts.js](charts/src/helpers/parse-std-axis-opts.js#L17) | 17 | TODO: calcolo dinamico dimensioni assi |
| [charts/src/lines.js](charts/src/lines.js#L358) | 358 | TODO: verificare correttezza indici per `data-title` |
| [charts/src/rating-display/index.js](charts/src/rating-display/index.js#L165) | 165–168, 250, 465 | TODO (WIP): rotazione asticella con step; porzioni disuguali; forma ovale; animazione; spessore scala |
| [charts/src/node-helpers/](charts/src/node-helpers/) | — | TODO: documentare; richiede opentype installato |

### Design tokens

| File | Riga | Nota |
|---|---|---|
| [design-tokens/_src/btn-color-themes.minimo.tokens.mjs](design-tokens/_src/btn-color-themes.minimo.tokens.mjs#L1) | 1 | TODO: aggiungere temi neutral e accent |
| [design-tokens/_src/form.minimo.tokens.mjs](design-tokens/_src/form.minimo.tokens.mjs#L292) | 292 | TODO: importazione automatica SVG (problemi con svgo) |

### TODO dai file TODO.md dei componenti

- **autocomplete** ([src/components/autocomplete/TODO.md](src/components/autocomplete/TODO.md)): da rivedere; definire uso CSS; unificare tokens
- **unsplash-page** ([src/components/unsplash-page/TODO.md](src/components/unsplash-page/TODO.md)): riscrivere CSS con sizes; rivedere JS; importare CSS direttamente nel JS
- **charts** ([charts/TODO.md](charts/TODO.md)): completare; aggiornare documentazione; aggiungere test nella demo; implementare tooltip nativo SVG (ora usa `data-title`)
- **charts/node-helpers** ([charts/src/node-helpers/TODO.md](charts/src/node-helpers/TODO.md)): documentare modalità d'uso; richiede opentype




## Stile di lavoro

- Conferma la comprensione prima di agire su richieste ambigue
- Il progetto usa ES modules (import/export), evitare soluzioni che utilizzano commonJs
- In linea di massima non proporre soluzioni che richiedano modifiche alla parte back-end, se presente, a meno che non sia esplicitamente richiesto
- nella chat evitare neologismi come parsare, committare ecc., usare i termini corrispondenti in italiano o il termine originale in inglese dove non sia possibile un equivalente in italiano. Non coniugare mai secondo le regole dell'italiano verbi di altre lingue
- nei commenti su più righe preferire `/* ... */` piuttosto che ripetere `//` ad igni inizio riga
