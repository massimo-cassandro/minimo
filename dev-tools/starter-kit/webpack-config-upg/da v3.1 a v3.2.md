# Da v3.1 a v3.2

Novità della v3.2: nessuna modifica di comportamento, solo riorganizzazione per rendere più agevole l'uso del config. Il blocco delle entry del progetto è spostato in cima al file (subito dopo gli import, prima di `// --- config ---`) e rinominato da `projectEntries` a `entries`; la costante `entries` che conteneva le entry elaborate per il dev (con il file master delle custom properties) è rinominata `parsedEntries`. Così le entry, che sono la parte da personalizzare in ogni progetto, si trovano subito e non vanno cercate a metà file. I moduli in `webpack-config-modules/` non cambiano.

Prompt per aggiornare un progetto esistente:

Riepilogo: 

1. Riga 2: `// v.3.1` → `// v.3.2`.
2. Rinomina l'attuale costante `entries` (quella con la logica `useCustomPropsPlugin && isDevelopment && !purgeCssInDev`, che aggiunge `customPropsFile` come primo modulo delle entry non `.critical`) in `parsedEntries`. Aggiorna i riferimenti: `entry: entries` → `entry: parsedEntries` nella config e i commenti che citano `entries` in questo senso (es. nel commento sopra `purgeCssInDev`: "vedi `entries`" → "vedi `parsedEntries`").
3. Rinomina `projectEntries` in `entries` in tutto il file (definizione, uso in `parsedEntries`, `cssEntries`, `criticalEntries` e commenti).
4. Sposta l'intero blocco `// =>> entries` + `const entries = { ... };` (con le entry già presenti nel progetto, che vanno mantenute così come sono) in cima al file, subito dopo gli import e prima di `// --- config ---`, lasciando due righe vuote prima del blocco e una dopo.
5. Verifica con `grep -n "projectEntries" webpack.config.mjs` (nessun risultato) e con `NODE_ENV=production npx webpack --config ./webpack.config.mjs --stats minimal` (nessun errore).
6. Mostrami il diff prima di salvare.

