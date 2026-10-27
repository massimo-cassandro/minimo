# Aggiornamento della configurazione webpack

La versione della configurazione in uso è indicata dal commento `// v.N` alla riga 2 di `webpack.config.mjs` e di ogni file in `webpack-config-modules/`.

Dove non esiste il commento, si intende una configurazione v2 o precedente.

Le versioni precedenti sono conservate in `archived/webpack-config-v2/` del repository di minimo.

> **Alternativa rapida:** rilanciare `starter-install.sh` (è idempotente): i file diversi dai sorgenti vengono rinominati `OLD-<nome>` e sostituiti dalla nuova versione. Poi si riportano nel nuovo `webpack.config.mjs` le personalizzazioni del progetto (entry, glob dei contenuti, safelist, template html, regole custom) copiandole da `OLD-webpack.config.mjs`. Le istruzioni seguenti servono per aggiornare a mano un progetto già esistente.

---

## Fix e upg da verificare e applicare a tutte le versioni
* WebpackManifestPlugin: impostare `removeKeyHash: /\?.*$/, // /([a-f0-9]{32}\.?)/gi, // /(\?as_asset)$/,`, sostituendo eventuali impostazione `removeKeyHash: true` se presente

