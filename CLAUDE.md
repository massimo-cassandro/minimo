# CLAUDE.md — @massimo-cassandro/minimo

## Contesto di dominio

Framework leggero JS + CSS (`@massimo-cassandro/minimo`) con componenti e utilità gestibili on-demand. Pubblicato su npm come pacchetto pubblico ES module.

Progettato per essere usato con **webpack** (configurazione starter inclusa in `webpack-setup/`). Importazioni SVG e CSS modules dipendono dalla configurazione webpack fornita.

---

## Struttura del progetto

```
minimo/
├── index.js                        # entry point principale (export JS)
├── _wrk/                           # repo vecchi in lavorazione, da integrare in minimo (non pubblicato)
│   ├── json-table/                 # ★ futuro sostituto di s-datatable-component (vedi sotto)
│   ├── js-utilities/               # utilità JS varie
│   ├── charts/                     # vecchia versione charts da rifattorizzare
│   ├── spinner/                    # componente spinner
│   ├── modal-popup/                # popup
│   ├── popup-page/                 # pagina popup
│   ├── vanilla-cookie-consent/     # cookie consent
│   ├── recaptcha/                  # integrazione reCAPTCHA
│   ├── unsplash-page-demo/         # demo unsplash page
│   ├── modal-alert-demo/           # demo modal alert
│   ├── auto-datatable-customization/
│   ├── alert-autoclose.js          # single-file utilities
│   ├── flash-alerts.js
│   ├── img-viewer-dom-builder.js
│   ├── create-blurhash-canvas.js
│   ├── print-icon.js
│   └── __snippets/                 # snippet di codice da vari progetti
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
│   │   └── unsplash-page/          # pagina foto Unsplash
│   └── web-components/
│       └── s-datatable-component/  # web component per simple-datatables ⚠️ da deprecare (verrà sostituito da json-table)
├── charts/                         # grafici SVG (usa @svgdotjs/svg.js come peer dep opzionale)
│   ├── index.js                    # export: barsChart, goalChart, linesChart, MinimoCharts
│   └── src/
│       ├── bars.js, lines.js, goal.js
│       ├── helpers/                # cartesian-axis, chart-utils, core, create-svg-canvas, legenda, ...
│       ├── node-helpers/           # rendering SVG lato server (richiede opentype)
│       └── rating-display/         # grafico gauge (commentato in index, WIP)
├── design-tokens/
│   ├── _src/                       # sorgenti token (.mjs e .jsonc)
│   └── tokens/                     # token compilati (JSONC, W3C DTCG format) — generati da build-tokens
├── design-tokens/utilities/        # script Node.js per build token (Style Dictionary v5)
│   ├── build-tokens.mjs            # → CLI: buildTokens
│   └── check-unresolved-custom-props.mjs  # → CLI: checkUnresolvedProps
├── webpack-setup/                  # configurazione webpack starter + script d'installazione
├── demo/                           # ambiente di test dei componenti (webpack, config interna alla dir)
├── demo-build/                     # (non ancora presente) build statica della demo per GitHub Pages
├── snippets-and-utilities/         # porzioni di codice slegate dal framework, utili per integrazioni rapide
├── archived/                       # vecchi script inutilizzati, parcheggiati per usi futuri (potrebbero essere eliminati)
└── _wrk/                           # work-in-progress, non pubblicato
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

## snippets-and-utilities/

Contiene porzioni di codice **slegate dal framework** ma utili per l'integrazione rapida di alcune funzionalità in progetti che usano minimo:
- `UnsplashController.php` — controller PHP per Unsplash
- `ImgViewerController.php` — controller PHP per image viewer
- `minimo-form-layout.html.twig` — layout form Symfony/Twig
- `error-pages/` — template Twig per pagine di errore

Non viene pubblicato su npm (non incluso nel campo `files` di `package.json`).

---

## archived/

Contiene vecchi script inutilizzati, parcheggiati temporaneamente per eventuali usi futuri. **Potrebbero essere eliminati del tutto** in qualsiasi momento. Non va considerato come codice attivo o di riferimento.

---

## Politica sulle dipendenze esterne

**Minimo non include dipendenze esterne nell'installazione di default.** Le librerie di terze parti vengono dichiarate come `peerDependencies` opzionali (come già avviene per `@svgdotjs/svg.js`) e devono essere installate a cura dell'utente solo quando il componente che le richiede viene effettivamente utilizzato.

Esempi attuali/previsti:
- `@svgdotjs/svg.js` — richiesto da `charts/` (già in `peerDependenciesMeta` come opzionale)
- `blurhash` — richiesto da `create-blurhash-canvas` (TODO: aggiungere a `peerDependenciesMeta`)
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

## CSS ottimizzazione — valutazioni in corso

### postcss-jit-props

[postcss-jit-props](https://github.com/GoogleChromeLabs/postcss-jit-props) potrebbe essere integrato come PostCSS plugin per includere automaticamente solo le custom properties effettivamente usate nel CSS compilato. **Da valutare**: il repository non viene aggiornato da molto tempo, quindi la manutenzione futura è incerta.

### PurgeCSS

L'opzione preferibile sarebbe strutturare meglio l'integrazione con **PurgeCSS**, ma in progetti con backend Symfony e template Twig produce spesso risultati errati (classi usate rimosse). Il problema potrebbe non essere legato a PurgeCSS in sé, ma al fatto che `domBuilder` genera classi dinamicamente a runtime: PurgeCSS analizza i sorgenti staticamente e non riesce a rilevare le classi costruite via stringa in JS. Anche i template Twig con classi costruite per concatenazione o tramite variabili Symfony sfuggono all'analisi statica. Se si volesse testare PurgeCSS seriamente, la strada più pulita è una **safelist esplicita** per le classi generate dinamicamente (da `domBuilder` e dai template). Da investigare prima di escludere PurgeCSS come soluzione.

---

## Cartella `_wrk` — repo in migrazione

`_wrk/` raccoglie parti di repo preesistenti da valutare per l'integrazione in minimo con la stessa logica work-in-progress. Non viene pubblicata su npm (non inclusa nel campo `files` di `package.json`), ma **è inclusa nel repo git**. Ogni elemento può essere integrato, rifattorizzato **oppure cestinato** se ritenuto inutile o obsoleto.

### json-table ★ (priorità alta)

`_wrk/json-table/` è il sostituto designato di `s-datatable-component`. Il componente attuale (`src/web-components/s-datatable-component/`) è stato creato per ragioni di fretta ed **è destinato alla deprecazione** non appena `json-table` sarà pronto per la produzione.

**json-table** è un generatore di tabelle HTML da dati JSON (Ajax o statici), con search, sorting, paginazione, senza dipendenze esterne (no jQuery, no librerie terze come simple-datatables). Già pubblicato separatamente come `@massimo-cassandro/json-table`.

Struttura attuale in `_wrk/json-table/src/`:
- `js/` — moduli: `main-builder`, `table-builder`, `table-row/thead/tfoot`, `parse-data-row`, `parse-params`, `get-ajax-data`, `init-ajax-table`, `init-static-table`, `set-search-listener`, `set-sort-listeners`, `static-data-sorting`, `info-section`, `update-info`, `utilities`, `defaults`, `default-columns-data-types`
- `css/` — CSS modules: `main-builder`, `table`, `info-section`, `icons`, `utility`
- `__json-table-react/` — versione React (WIP separato)
- `index.js` — entry point

TODO aperti su json-table ([_wrk/json-table/TODO.md](_wrk/json-table/TODO.md)):
- Meccanismo di acquisizione JSON paginato per grandi quantità di record
- Campi numerici: classi default `text-end`/`text-numeric` sovrascrivibili
- `footerRender`: funzioni predefinite per calcoli base (somma, media, ecc.)
- Documentazione incompleta nel README (sezioni TODO)
- `_wrk/json-table/src/TODO.md`: verificare tutte le occorrenze di `this.params.ajax`

### Altri elementi in `_wrk/`

| Cartella/File | Stato | Note |
|---|---|---|
| `js-utilities/` | da valutare | Utilità JS varie — da integrare o cestinare |
| `charts/` | da rifattorizzare | Vecchia versione (1a vers) con chart `settimanale-mensile` e altre non ancora migrate |
| `spinner/` | da valutare | Componente spinner (attualmente in minimo solo come CSS) |
| `popup-page/` | da valutare | Componente popup page — da integrare o cestinare |
| `vanilla-cookie-consent/` | da valutare | Integrazione cookie consent — da integrare o cestinare |
| `recaptcha/` | da valutare | Integrazione reCAPTCHA — da integrare o cestinare |
| `alert-autoclose.js` | da valutare | Da integrare o cestinare |
| `flash-alerts.js` | da valutare | Da integrare o cestinare |
| `img-viewer-dom-builder.js` | da valutare | Da integrare o cestinare |
| `create-blurhash-canvas.js` | da valutare | Correlato a peer dep `blurhash` (vedi TODO package.json) — da integrare o cestinare |
| `print-icon.js` | da valutare | Da integrare o cestinare |
| `__snippets/` | archivio | Snippet da vari progetti, inclusi template Twig/Symfony, form theme, style-dictionary |

---

## TODO e FIX pendenti

Traccia dei TODO/FIX sparsi nel codice, da risolvere alla prima occasione utile.

### package.json / root

- **TODO** — Aggiungere `blurhash` come peer dependency ([TODO.md](TODO.md)).

### CSS

| File | Riga | Nota |
|---|---|---|
| [src/css/visibility.css](src/css/visibility.css#L21) | 21 | da rivedere |
| [src/css/alerts.css](src/css/alerts.css#L75) | 75 | alerts links da completare |
| [src/css/grid.css](src/css/grid.css#L1) | 1 | unificare regole comuni con flex |
| [src/css/anchors.css](src/css/anchors.css#L1) | 1, 4, 38 | rivedere e completare; sostituire colori con custom props specifiche |
| [src/css/table.css](src/css/table.css#L10) | 10 | opzione per alternate row color |
| [src/css/text.css](src/css/text.css#L7) | 7 | rivedere |
| [src/css/margin-padding.css](src/css/margin-padding.css#L3) | 3–4 | generare utilities in automatico; versione con naming Bootstrap |
| [src/css/forms/fieldset.css](src/css/forms/fieldset.css#L2) | 2 | da verificare |
| [src/css/forms/forms.css](src/css/forms/forms.css#L1) | 1–6 | separare file; radio/checkbox groups; multiselect; `.form-grid`; customizable select; form-check come flex |
| [src/css/buttons/status-buttons.css](src/css/buttons/status-buttons.css#L1) | 1 | rivedere tutto |
| [src/css/buttons/buttons.css](src/css/buttons/buttons.css#L1) | 1, 93 | dividere per variante; button solo-icona da completare o eliminare |
| [src/css/buttons/btn-close.css](src/css/buttons/btn-close.css#L6) | 6 | controllare allineamento x interna |

### JS — utilities

| File | Riga | Tipo | Nota |
|---|---|---|---|
| [src/utilities/dom-builder/parseDomString.js](src/utilities/dom-builder/parseDomString.js#L40) | 40 | **FIX** | Non funziona con `<TAG>.<CLASSE>#<ID>` (l'id deve precedere le classi) |
| [src/utilities/dom-builder/dom-builder.js](src/utilities/dom-builder/dom-builder.js#L4) | 4–5 | TODO | Sintassi stringa multi-riga e nidificazione con indent |
| [src/utilities/dom-builder/dom-builder.js](src/utilities/dom-builder/dom-builder.js#L169) | 169 | TODO | Callback con azioni su children potrebbero non essere eseguiti in assenza di parent |

### JS — componenti

| File | Riga | Nota |
|---|---|---|
| [src/components/autocomplete/autocomplete-engine.js](src/components/autocomplete/autocomplete-engine.js#L283) | 283 | TODO[epic=autocomplete] (da definire) |
| [src/components/autocomplete/check-autocomplete.js](src/components/autocomplete/check-autocomplete.js#L1) | 1 | TODO: trigger ac selection |
| [src/components/snackbar/snackbar.js](src/components/snackbar/snackbar.js#L16) | 16–17 | TODO: snackbar action; gestione multiple senza stacking |
| [src/components/modal-alert/modal-alert.js](src/components/modal-alert/modal-alert.js#L6) | 6 | TODO: riscrivere come async |

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
- **modal-alert** ([src/components/modal-alert/TODO.md](src/components/modal-alert/TODO.md)): da rivedere; spostare custom props nel dictionary; eliminare `customization-templates/`
- **unsplash-page** ([src/components/unsplash-page/TODO.md](src/components/unsplash-page/TODO.md)): riscrivere CSS con sizes; rivedere JS; importare CSS direttamente nel JS
- **charts** ([charts/TODO.md](charts/TODO.md)): completare; aggiornare documentazione; aggiungere test nella demo; implementare tooltip nativo SVG (ora usa `data-title`)
- **charts/node-helpers** ([charts/src/node-helpers/TODO.md](charts/src/node-helpers/TODO.md)): documentare modalità d'uso; richiede opentype
