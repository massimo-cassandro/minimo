# webpack-config-modules

Moduli di configurazione webpack usati da `webpack.config.mjs`, con le `resourceQuery` gestite da ciascuno.

## css-rules.mjs

Regole per i file `.css`/`.scss`/`.sass` (standard e CSS modules).

| Query | Descrizione |
|---|---|
| `?inline` | CSS iniettato a runtime con tag `<style>` tramite `style-loader` (anche per i CSS modules) |
| `?raw` | Restituisce il CSS elaborato come stringa, per lo shadow DOM dei web component (solo CSS standard) |
| `?as_url` | Il file viene emesso così com'è in `css/` e l'import restituisce il suo URL (solo CSS standard) |

Convenzione sul nome file (non query): `*.critical.css` / `*.critical.module.css` vengono estratti per l'inserimento inline nell'HTML in fase di build.

## svg-rules.mjs

Regole per i file `.svg` (escluse le favicon).

| Query | Descrizione |
|---|---|
| `?cssInline` | SVG convertito in Data URI compatto, da usare nei CSS |
| `?inline` | Restituisce il sorgente SVG come stringa, da inserire nel markup |
| `?react` | SVG importato come componente React tramite SVGR (solo con `useSvgr: true` e import da file js/jsx/ts/tsx) |
| `?noSVGO` | Salta l'ottimizzazione SVGO; combinabile con le altre query (es. `?cssInline&noSVGO`) |

Convenzione sul nome file (non query): il suffisso `-noSVGO.svg` esclude SVGO per tutti gli import di quel file. Senza query, l'SVG viene copiato in `imgs/` e l'import ne restituisce l'URL.

## Altri moduli
| Modulo | Descrizione |
|---|---|
| `custom-props-purgecss-plugin.mjs` | Plugin che inietta negli asset CSS finali solo le custom properties usate, prese dal file master |
| `get-jsConfig-aliases.mjs` | Ricava gli alias webpack dai `paths` di `jsconfig.json` |
| `inline-critical-css.mjs` | Plugin che sostituisce il `<link>` del CSS critical con un tag `<style>` nell'HTML generato |
| `mini-svg-data-uri-loader.cjs` | Loader che converte un SVG in Data URI compatto (usato da `?cssInline`) |
| `postcss.config.mjs` | Configurazione PostCSS (custom media globali, autoprefixer, ...) |
| `purgecss-setup.mjs` | Istanzia i plugin PurgeCSS (passaggio sui CSS critical e passaggio generale) |
| `svgo.config.mjs` | Configurazione SVGO usata da `svg-rules.mjs` |
