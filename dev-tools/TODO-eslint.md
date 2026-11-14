# TODO — eslint-config

`stylelint-config` è già stato incorporato in minimo (v.1.33.0, 12/9/2026): vedi `dev-tools/stylelint-config/`, export path `@massimo-cassandro/minimo/stylelint-config`. Resta da fare lo stesso per l'altro package esterno, `@massimo-cassandro/eslint-config` (repo a sé stante in `/Users/mazz/Sites/eslint-config`; non toccare il repo originale), replicando lo schema effettivamente seguito per stylelint (non quello originariamente ipotizzato — vedi note sotto):

1. Crea `dev-tools/eslint-config/`:
   - `index.js` — copia identica di `eslint-config/index.js`
   - `README.md` — copia di `eslint-config/README.md`, aggiornando il comando d'installazione/import per riflettere il nuovo path (`@massimo-cassandro/minimo/eslint-config` invece del pacchetto a sé stante)

2. `package.json` di minimo:
   - aggiungi l'export path `"./eslint-config": "./dev-tools/eslint-config/index.js"`
   - aggiungi in `dependencies` (non `devDependencies`+`peerDependencies` come da ipotesi iniziale: per i config condivisi si è scelta una deroga esplicita alla policy generale sulle dipendenze esterne — vedi CLAUDE.md "Politica sulle dipendenze esterne" — così i pacchetti richiesti arrivano in automatico ai consumer che installano minimo, senza passi d'installazione aggiuntivi) i pacchetti richiesti dal config: `@eslint/js`, `eslint`, `globals`
   - rimuovi da `devDependencies` `@massimo-cassandro/eslint-config`

3. Root di minimo — aggiorna `eslint.config.mjs` per puntare alla copia interna (`./dev-tools/eslint-config/index.js`) invece che al pacchetto npm esterno

4. Dependabot: nessuna azione necessaria (stesso ecosystem/directory già coperto da `minimo/.github/dependabot.yml`)

5. `dev-tools/starter-kit/starter-install.sh`: rimuovi la riga `@massimo-cassandro/eslint-config` da `devDependencies`. Non serve aggiungere nulla al suo posto: i pacchetti richiesti da eslint-config sono in `dependencies` di minimo e arrivano quindi in automatico ai progetti consumer (stesso comportamento già verificato con stylelint-config, che infatti non è mai stato aggiunto né ai `devDependencies` fissi né ai pacchetti opzionali dello script)

6. `dev-tools/starter-kit/source_files/eslint.config.mjs`: `import eslint_config from '@massimo-cassandro/eslint-config';` → `import eslint_config from '@massimo-cassandro/minimo/eslint-config';`

7. `README.md` (root) — rimuovi `npm i -D @massimo-cassandro/eslint-config` dalla sezione Install (la riga per stylelint-config è già stata rimossa)

Non toccare: il repo originale `/Users/mazz/Sites/eslint-config`; LICENSE (minimo ha già la propria, MIT); `.editorconfig` e `*.code-workspace` del progetto originale (non vanno copiati, già coperti dalle impostazioni di minimo).

**Da valutare:** se effettuare questo switch (starter-kit + source_files + root config di minimo) subito, oppure rimandarlo al rilascio della versione 2 di minimo, trattandolo come parte dei breaking change già previsti lì (vedi sezione V2 in [src/TODO.md](../src/TODO.md#v2)) — dato che cambia il modo in cui i progetti consumer devono importare il config.
