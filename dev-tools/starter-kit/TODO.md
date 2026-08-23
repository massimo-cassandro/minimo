# TODO — Starter kit: config come punto di regia, moduli autonomi

## Obiettivo

`webpack.config.mjs` deve diventare **solo** un punto di impostazione di scelte e
parametri (in piccolo già lo è: `useSass`, `useSvgo`, `purgeCSSDebug`, ecc.).
Tutta la logica deve migrare nei moduli di `webpack-modules/`, che devono diventare
**completamente autonomi e indipendenti dalle impostazioni e dal layout del progetto**:
in questo modo potranno essere aggiornati/sovrascritti in qualsiasi progetto senza
danni, perché il timone resta sempre nel config del progetto.

## Contratto dei moduli (da rispettare in ogni intervento)

1. **Nessun percorso di progetto hardcodato** nei moduli: tutti i path (sorgenti,
   node_modules, template, ecc.) arrivano come parametri dal config.
2. Ogni modulo esporta **factory pure** (funzioni che ricevono opzioni e
   restituiscono rules/plugin/config): nessun side effect a import time.
3. Ogni parametro ha un **default sensato** e JSDoc: il modulo deve funzionare
   anche senza opzioni, e un'opzione nuova non deve mai rompere un config vecchio.
4. **Niente dipendenze implicite tra moduli**: se un modulo ha bisogno di un altro
   (es. css-rules → postcss config), il collegamento avviene via parametro passato
   dal config, non con import/path interni.
5. Aggiornare un modulo non deve mai richiedere modifiche al config esistente,
   se non per adottare volontariamente opzioni nuove.
6. **Import opzionali = import dinamici**: i pacchetti usati solo quando una
   scelta li attiva (es. sass-loader con `useSass`, responsive-loader, svgo)
   non vanno importati staticamente: con la nuova struttura ogni import
   condizionato da un flag va fatto con `await import(...)` dentro la factory
   (come già avviene per `svgo.config.mjs` nel config), così un pacchetto non
   installato non rompe il caricamento del config/modulo se la relativa
   funzionalità è disattivata.

## Stato attuale (inventario del coupling)

| Modulo | Stato | Problemi |
|---|---|---|
| `get-jsConfig-aliases.mjs` | ✅ autonomo | riceve il path del jsconfig dal config |
| `purgecss-variables-safelist.mjs` | ✅ autonomo | tutti i glob/seeds arrivano dal config |
| `svgo.config.mjs` | ✅ autonomo | nessun riferimento al progetto |
| `mini-svg-data-uri-loader.cjs` | ✅ autonomo | loader puro |
| `svg-rules.mjs` | ⚠️ quasi | parametrico, ma da riverificare rispetto al contratto (default, JSDoc) |
| `css-rules.mjs` | ⚠️ quasi | parametrico, ma riceve `postcssConfig_path` (file di config esterno invece di opzioni); scelte come `localIdentName` non sovrascrivibili dal config |
| `postcss.config.mjs` | ❌ accoppiato | **hardcoda** `../src/css/custom-media.css` (layout del progetto): non aggiornabile senza danni |
| `webpack.config.mjs` | ❌ contiene logica | blocchi che sono logica, non scelte: sezione PurgeCSS (opzioni comuni + 2 istanze + log debug), test del cacheGroup `shared`, rules asset (js/ejs/html/img/font/video/favicon), BannerPlugin |

## Piano d'azione

### 1. Oggetto `settings` unico nel config
Raggruppare in testa al config un unico oggetto di scelte e percorsi
(flag attuali + tutti i path oggi sparsi: sorgenti js/css, template twig/php,
node_modules di minimo, glob shadow-DOM, seeds, favicons, output...).
Le factory dei moduli ricevono ciò che serve da qui. Il config diventa:
`settings` → chiamate alle factory → oggetto `config`.

### 2. `postcss.config.mjs` → factory senza path hardcodati
- Trasformarlo in una factory (es. `postcssPlugins({ globalDataFiles, preserveCustomMedia })`)
  che riceve i file per `postcss-global-data` dal config.
- `css-rules.mjs` non riceve più `postcssConfig_path` (file caricato da
  postcss-loader) ma direttamente l'oggetto `postcssOptions` (o la factory + le sue
  opzioni) costruito nel config: sparisce l'ultimo path relativo al layout progetto.
- Attenzione a preservare il comportamento attuale di `loaderContext.mode`.
- **DA CONTROLLARE E VALUTARE — eliminazione del file postcss config**: verificare
  la possibilità di eliminare del tutto il file di config postcss e sostituirlo
  con regole definite direttamente nel webpack config (plugin postcss dichiarati
  inline in `postcssOptions`). Considerare però che in certi casi postcss
  necessita di impostazioni ad hoc per progetto (è il motivo per cui oggi esiste
  il parametro `postcssConfig_path`): in quel caso la strada è mantenere la
  possibilità di override — es. default inline nel config + parametro opzionale
  per un file/oggetto di impostazioni custom. Tenere conto anche degli altri
  consumatori del file: un postcss config a livello di progetto può servire ad
  altri tool (stylelint, editor/IDE, CLI postcss) oltre che a postcss-loader.

### 3. Sezione PurgeCSS → `webpack-modules/purgecss-plugins.mjs`
Factory (es. `purgecssPlugins({ contentGlobs, safelist, variablesSafelistOptions, debug })`)
che incapsula: opzioni comuni, safelist base (deep `m_`, greedy `&`), le due istanze
(critical + generale) e il mini-plugin di log `purgedStats`.
Restituisce l'array di plugin pronto per lo spread nel config.
Nel config restano SOLO: i glob dei contenuti, le safelist specifiche del progetto
(standard/seeds), il flag `purgeCSSDebug`. I commenti "strutturali" (problemi a/b/c)
migrano nel modulo; nel config restano i commenti sulle scelte.

### 4. Rules asset generiche → `webpack-modules/asset-rules.mjs`
Estrarre js/babel, ejs, html, immagini/pdf, font, video, favicons in una factory
parametrica con on/off per gruppo (es. `assetRules({ favicons_path_regexp, useVideo, ... })`).
Le parti oggi commentate nel config (responsive-loader, video) diventano opzioni
documentate del modulo.

### 5. splitChunks
Valutare una piccola factory (es. `sharedCacheGroup({ pathsRegexp })`) che incapsuli
l'esclusione dei moduli css (`module.type !== 'css/mini-extract'`, requisito PurgeCSS)
lasciando nel config solo l'elenco dei path. In alternativa lasciarla nel config ma
con l'esclusione css delegata a una helper del modulo purgecss (è un suo requisito).

### 6. `starter-install.sh`
- Aggiornare l'array `FILES` con i nuovi moduli.
- Distinguere due categorie nel flusso di copia:
  - `webpack-modules/` = aggiornabili sempre (una volta autonomi, la copia
    NEW- può diventare sovrascrittura diretta o diff);
  - `webpack.config.mjs` e template = mai sovrascritti (proprietà del progetto).
- **Audit delle dipendenze installate**: verificare la corrispondenza tra i
  pacchetti degli `npm i -D` dello script e quelli effettivamente usati da
  config, moduli e template, per evitare installazioni inutili. Da controllare
  in entrambe le direzioni:
  - installati ma (forse) mai usati: es. `postcss-preset-env` (assente dal
    postcss config), `responsive-loader` (solo in blocchi commentati),
    `style-dictionary` (riguarda i design token, non la build webpack);
  - usati ma non installati: es. `file-loader` (referenziato dalla rule video
    del config) e `sass-loader`/`sass` (necessari con `useSass: true`).
  - i pacchetti legati a funzionalità opzionali (sass, responsive-loader,
    video, svgr...) escono dall'installazione di default: o vengono installati
    su richiesta dallo script (prompt/flag) o documentati come "da installare
    quando si attiva l'opzione X" — coerentemente con la regola degli import
    dinamici del contratto (punto 6).

### 7. Versionamento dei moduli
Aggiungere in testa a ogni modulo un commento con versione (o data) per capire a
colpo d'occhio, nei progetti, quale revisione è installata.

### 8. Documentazione
README dello starter kit con la mappa: cosa si imposta nel config (e solo lì),
cosa fa ogni modulo, come aggiornare i moduli in un progetto esistente.

## Ordine consigliato

2 → 3 → 4 → 5 (refactor moduli, uno per volta, build demo di verifica dopo ognuno)
→ 1 (consolidamento `settings`) → 6 → 7 → 8.

## Note

- `merge-jsonc` (già spostato in `src/merge-jsonc.mjs`, convertito in ESM) è
  stato rimosso: `package.json` e `*.code-workspace` esistenti non vengono più
  mergiati, il template viene copiato accanto con un `_` davanti al nome
  (vedi FIX.md, punto 1). La dir `src/` (utility interne dell'installer, NON
  copiate nei progetti) non esiste più, essendo rimasta senza contenuto;
  `webpack-modules/` resta la dir dei moduli copiati nei progetti.
- Criterio di "fatto": si deve poter copiare l'intera `webpack-modules/` aggiornata
  in un progetto esistente senza toccare il suo `webpack.config.mjs` e ottenere
  una build identica (o migliorata) senza errori.
