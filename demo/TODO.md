# TODO — demo

## Da `demo/` a `docs/`: demo e documentazione insieme

- [ ] Rinominare la directory `demo/` in `docs/` (la vecchia `docs/` con il solo `README.md` placeholder è già stata rimossa).
- [ ] Aggiornare il workflow GitHub Pages ([.github/workflows/static.yml](../.github/workflows/static.yml)): nello step "Assemble site" il percorso `demo/build/` diventa `docs/build/`; rivedere anche nome e commenti del workflow ("Deploy demo content to Pages").
- [ ] Aggiornare tutti gli altri riferimenti a `demo/` (CLAUDE.md, README, `package.json`, config webpack interna, `jsconfig.json`, `.gitignore`, eventuali path relativi nei file demo).
- [ ] Riorganizzare la struttura in modo più pratico, facendo convivere demo e documentazione: per ogni componente/utilità, una pagina con la documentazione e gli esempi funzionanti affiancati.
- [ ] Spostare qui la documentazione di json-table ([src/web-components/json-table/json-table-docs.md](../src/web-components/json-table/json-table-docs.md)), consultabile via web da un URL dedicato (es. `.../minimo/json-table/`).
  - [ ] Riorganizzare la documentazione di json-table in più file (oggi è un unico `json-table-docs.md`).
- [ ] Decidere il formato della documentazione: continuare con Markdown (convertito in build) o passare a HTML scritto direttamente.
- [ ] Valutare in alternativa l'uso del wiki GitHub del repo per la documentazione (lasciando in `docs/` solo le demo), confrontandolo con la soluzione integrata demo + documentazione.
- [ ] Stesso trattamento per la documentazione di tutti gli altri componenti/utilità: ognuno con il proprio URL dedicato.
