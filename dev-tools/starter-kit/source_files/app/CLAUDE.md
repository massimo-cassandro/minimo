# CLAUDE.md - frontend

## Contesto di dominio



## Stile di lavoro

- Conferma la comprensione prima di agire su richieste ambigue
- Il progetto usa ES modules (import/export), evitare soluzioni che utilizzano commonJs
- In linea di massima non proporre soluzioni che richiedano modifiche alla parte back-end, se presente, a meno che non sia esplicitamente richiesto
- evitare SEMPRE neologismi come 'inlinare', 'parsare', 'committare' ecc., usare i termini corrispondenti in italiano o il termine originale in inglese dove non sia possibile un equivalente in italiano. Non coniugare mai secondo le regole dell'italiano verbi di altre lingue
- nei commenti di 3 o più righe preferire `/* ... */` piuttosto che ripetere `//` ad igni inizio riga
- a meno che non sia esplicitamente richiesto di eseguire subito una modifica, NON ESEGUIRE MAI nulla autonomamente ma mostra sempre un piano d'azione prima di procedere
- nei commenti jsDoc aggiungere sempre dove possibile una sezione example che riepiloghi i vari parametri mostrando i valori di default
- commenti nel codice (inclusi TODO/FIX e jsDoc) e file README vanno scritti sempre in italiano; gli identificatori restano in inglese
- nei documenti markdown generati non andare a capo forzatamente alla fine di ogni riga: un paragrafo è una sola riga, così si usa il soft wrap dell'editor ed è più semplice fare correzioni
