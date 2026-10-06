# Design Tokens Builder

<!-- TODO rivedere e semplificare -->

Un insieme di script Node.js per gestire i design token CSS di un progetto. Costruito su [Style Dictionary v5](https://styledictionary.com/).

### Scopo

Lo scopo di questo builder è unire i design token di minimo con quelli usati in un progetto — tipicamente provenienti da Figma o Penpot — e produrre le custom properties usate durante lo sviluppo.

L'obiettivo è mantenere la nomenclatura dei token del progetto il più possibile vicina a quella di minimo, in modo che i componenti di minimo possano essere personalizzati senza ulteriori interventi.

La strategia migliore è dare alle variabili in Figma/Penpot, fin dall'inizio, gli stessi nomi usati da minimo, così che sovrascrivere un valore resti un processo trasparente e automatico.

In un progetto preesistente, però, alcuni nomi potrebbero non corrispondere (ad es. il colore base del progetto si chiama `primary`, mentre l'equivalente di minimo è `primary.100`). Invece di correggere a mano le custom properties generate dopo ogni build, una voce di `source` può avere un'opzione `transform` (vedi [Rinomina dei token sorgente](#rinomina-dei-token-sorgente-transform) più sotto) che rimappa i nomi dei token su quelli di minimo prima ancora che vengano passati a Style Dictionary.

### Script

| Script | Scopo |
|---|---|
| `build-tokens.mjs` | Genera un file di custom properties CSS a partire dai file sorgente dei design token |
| `check-unresolved-custom-props.mjs` | Analizza i file CSS e segnala i riferimenti `var(--...)` non presenti nel file dei token generato |

Entrambi gli script condividono lo stesso file di configurazione, passato con `--config`.

### Configurazione iniziale

Gli script sono pensati per essere usati come npm script. Aggiungerli al proprio `package.json`:

```json
{
  "scripts": {
    "build tokens": "npx buildTokens --config ./path/to/tokens-config.mjs",
    "check unresolved props": "npx checkUnresolvedProps --config ./path/to/tokens-config.mjs"
  }
}
```

### Dipendenze

I seguenti pacchetti devono essere presenti nel progetto:

```json
{
  "style-dictionary": "^5",
  "stylelint": "^16"
}
```

### File di configurazione

Entrambi gli script leggono un file di configurazione condiviso passato con `--config`. Usare `tokens-config-sample.mjs` come punto di partenza.

Per maggiori informazioni leggere i commenti all'interno del file di esempio.


### `build-tokens.mjs`

Legge i file sorgente dei design token e genera:
- Un **file CSS** che contiene tutti i token come custom properties dentro `:root { ... }`
- Opzionalmente, uno o più file **W3C DTCG JSON/JSONC**, indipendenti da qualsiasi strumento specifico (utilizzabili in Penpot, Figma tramite plugin, Token Studio, ...).

#### Utilizzo

```sh
npx buildTokens --config ./path/to/tokens-config.mjs
```

#### File sorgente

L'array `source` accetta qualsiasi combinazione di:
- Percorsi di file: `'./tokens/colors.jsonc'`
- Pattern glob: `'./tokens/**/*.{json,jsonc,mjs}'`
- Oggetti `{ src, prefix, transform }`, per aggiungere un prefisso alle custom properties di quei file (vedi [Prefissi dei sorgenti](#prefissi-dei-sorgenti)) e/o per rinominare i nodi dei token al loro interno (vedi [Rinomina dei token sorgente](#rinomina-dei-token-sorgente-transform))

**Formati supportati:**
- `.json` / `.jsonc` — letti direttamente come dati dei token
- `.mjs` / `.js` — importati come moduli ES; devono esportare come `default` un oggetto conforme a W3C DTCG

**Sintassi legacy dei token (rilevata automaticamente, solo `.json`):** i file sorgente `.json` scritti con la vecchia sintassi di Style Dictionary, non DTCG (`value`/`type` invece di `$value`/`$type`, riferimenti come `{group.token.value}` invece di `{group.token}` — ad es. un file esportato da [Open Props](https://open-props.style/)) vengono convertiti automaticamente alla sintassi DTCG v5 in fase di parsing, nodo per nodo. I file che usano già `$value`/`$type` non vengono toccati, quindi non servono flag di configurazione né elenchi di file: mescolare sorgenti legacy e DTCG nello stesso array `source` funziona senza altro. `.jsonc` non è coperto (riservato ai sorgenti DTCG scritti a mano, letti dal loader di Style Dictionary) e questi file `.json` vengono letti con un semplice `JSON.parse` (niente commenti, niente trailing comma). Vedi `build-tokens-src/legacy-tokens-parser.mjs`.

Un nodo legacy che è al tempo stesso un token (con `value`/`type` propri) *e* un gruppo con figli annidati (ad es. `other.ease.out` di Open Props, che ha un valore proprio più `out.1` ... `out.5`) non può essere rappresentato in DTCG v5, dove un nodo con `$value` è sempre una foglia. Il suo valore viene spostato in un token figlio chiamato `default` (`other.ease.out.default`, cioè `--other-ease-out-default`), oppure `base` se esiste già un figlio `default`; se esistono entrambi la build fallisce con un errore esplicito. I riferimenti a un nodo di questo tipo dallo stesso file vengono riscritti di conseguenza; da altri file devono usare esplicitamente il nome del figlio.

#### Prefissi dei sorgenti

Una voce di `source` (o di una modalità di `sourceModes`) può essere un oggetto `{ src, prefix }` al posto di una stringa: ogni custom property generata dai file individuati da `src` (un percorso, un glob o un array di questi) viene resa con il prefisso indicato. Utile per evitare collisioni di nomi con set di token di terze parti o per rendere esplicita la loro origine:

```js
source: [
  './my-tokens/*.mjs',
  { src: `${node_modules_path}/open-props/open-props.style-dictionary-tokens.json`, prefix: 'op' },
],
```

Con questa configurazione `gray.0` di Open Props diventa `--op-gray-0`. `prefix` accetta `'op'`, `'op-'` o `'--op-'` (equivalenti).

- Cambia solo il **nome** della custom property, non il percorso del token: i `{riferimenti}` continuano a funzionare e un token di un'altra sorgente che referenzia `{gray.0}` viene reso come `var(--op-gray-0)`.
- L'output JSON (`jsonBuildPath`) **non** viene prefissato: mantiene l'albero dei token originale.
- `customPropsGroups` confronta il nome prefissato, quindi un gruppo può usare `prefixes: ['op']`.
- Assegnare due prefissi diversi allo stesso file fa fallire la build con un errore.
- `check-unresolved-custom-props.mjs` comprende la stessa sintassi. Le voci di `extraCustomPropsFiles` sono semplici file CSS e non vengono mai prefissate.

Vedi `build-tokens-src/source-prefixes.mjs`.

#### Rinomina dei token sorgente (`transform`)

Una voce di `source` (o di una modalità di `sourceModes`) può avere anche un oggetto `transform`: un token trovato a un dato dot-path in quei file viene spostato in un altro dot-path, **prima** che Style Dictionary risolva i `{riferimenti}` o costruisca l'output CSS/JSON — a differenza di `prefix` visto sopra, che è una modifica puramente estetica del nome CSS applicata a posteriori.

Caso d'uso tipico: un progetto preesistente (ad es. guidato da Figma/Penpot) chiama `primary` il proprio colore base, mentre i token di minimo referenziano `{primary.100}`. Invece di rinominare a mano la custom property generata dopo ogni build, o di cercare ogni riferimento di minimo per modificarlo, `transform` corregge una volta sola il percorso del token, nella configurazione:

```js
source: [
  './my-tokens/*.mjs',
  { src: './project-tokens/*.jsonc', transform: { primary: 'primary.100' } },
],
```

Con questa configurazione, qualunque cosa sia definita al dot-path `primary` nei file individuati viene spostata in `primary.100` — quindi diventa `--primary-100` nel CSS generato, e ogni riferimento esistente di minimo a `{primary.100}` viene risolto correttamente.

- **Notazione:** entrambi i lati della mappa usano la notazione dot-path di Style Dictionary (`'primary.100'`), non la notazione delle custom properties con trattini (`'primary-100'`). In questo progetto i segmenti dei nomi dei token possono a loro volta contenere trattini (ad es. `btn-close`), quindi un trattino non permette di distinguere in modo affidabile un separatore di percorso da una parte letterale del nome di un segmento — un punto invece sì, perché è già riservato da Style Dictionary come separatore di percorso dei `{riferimenti}`.
- **I riferimenti vengono riscritti automaticamente:** una volta uniti tutti i file sorgente, ogni `{riferimento}` al *vecchio* percorso del token — nello stesso file o in uno completamente diverso — viene riscritto in tutto l'albero col *nuovo* percorso (ad es. ogni `{primary}` della build diventa `{primary.100}`). È sicuro perché Style Dictionary risolve i `{riferimenti}` sull'unico albero di token unito, tramite percorso assoluto: se `primary` esisteva una sola volta, ogni `{primary}` ovunque puntava senza ambiguità a quell'unico nodo.
  - **Eccezione:** se la *stessa* chiave sorgente (ad es. `primary`) ha una destinazione *diversa* nelle mappe `transform` di due file diversi, ogni rinomina funziona comunque da sola, ma il riferimento semplice `{primary}` diventa ambiguo: a quale destinazione dovrebbe puntare? In quel caso la riscrittura automatica viene saltata per quella chiave (viene registrato un warning) e ogni riferimento `{primary}` va corretto a mano per puntare al giusto fra i due nuovi percorsi.
- Una chiave sorgente non trovata nel file registra solo un warning; non fa fallire la build.
- Si applica **sia** all'output CSS sia a quello JSON (vedi [Output JSON](#output-json) più sotto), perché entrambi vengono ricostruiti dal percorso del token, ormai già rinominato — non serve una gestione separata.
- Due voci che danno destinazioni diverse alla stessa chiave sorgente nello stesso file fanno fallire la build con un errore.
- `check-unresolved-custom-props.mjs` comprende la stessa sintassi.

Vedi `build-tokens-src/source-transforms.mjs` e `build-tokens-src/token-rename-parser.mjs`.


#### Formato dei file token (esempio JS)

Quando si usano file sorgente `.mjs`, esportare come default un oggetto che segue il [formato del W3C Design Token Community Group](https://design-tokens.github.io/community-group/format/):

```js
// colors.tokens.mjs
export default {
  color: {
    brand: {
      primary: { $type: 'color', $value: '#0057FF' },
      secondary: { $type: 'color', $value: '#FF6B00' },
    },
    neutral: {
      '100': { $type: 'color', $value: '#F5F5F5' },
      '900': { $type: 'color', $value: '#1A1A1A' },
    },
  },
  semantic: {
    color: {
      text: {
        primary: { $type: 'color', $value: '{color.neutral.900}' }, // alias
      },
    },
  },
};
```

Il principale vantaggio di `.mjs` rispetto a `.json` è la possibilità di usare variabili JavaScript, commenti e valori calcolati nella definizione dei token.

I valori possono essere espressioni come `"{size.base} * .25"`, vedi `tokens-config-sample.mjs` per maggiori informazioni.

#### Transform personalizzate

Le seguenti transform vengono registrate in aggiunta a quelle predefinite di Style Dictionary:

| Nome | Tipo | Descrizione |
|---|---|---|
| `shadow/css` | value | Converte gli oggetti shadow (singoli o array) in una stringa CSS `box-shadow`. I valori in px vengono convertiti in rem. |
| `size/pxToRem-smart` | value | Converte i valori dei token `dimension` da px a rem. Salta i valori già in rem. |
| `color/css-modern` | value | Passthrough dei colori con supporto agli alias transitivi. |
| `gradient/css` | value | Converte gli oggetti gradient in `linear-gradient`, `radial-gradient` o `conic-gradient` CSS. |
| `composite/css` | value | Converte gli oggetti `border`, `outline`, `transition` e `animation` nella relativa shorthand CSS. |
| `typography/css` | value | Passthrough della tipografia — è il format a occuparsi di scomporre il valore nelle singole proprietà. |

#### Output CSS

Tutti i token vengono generati come custom properties CSS dentro `:root`, in ordine alfabetico.

I token di tipografia vengono espansi in più proprietà:
- `--token-name-font` — una shorthand `font` (quando sono presenti sia `fontSize` sia `fontFamily`)
- `--token-name-letter-spacing`, `--token-name-text-transform`, `--token-name-text-decoration` — proprietà singole

Il file generato viene controllato e corretto automaticamente con stylelint usando la configurazione indicata in `stylelintConfigPath`.

#### Output JSON

Quando `jsonBuildPath` è impostato, lo script genera anche file di token W3C DTCG, indipendenti da qualsiasi strumento specifico (ad es. importabili in Penpot tramite il [plugin Design Tokens](https://penpot.app/penpot-files/design-tokens), in Figma tramite un plugin compatibile o in Token Studio).

**File singolo** (`jsonDestFile` è una stringa):
```
jsonBuildPath/tokens.jsonc   ← tutti i token in un unico file
```

**Un file per ogni sorgente** (`jsonDestFile` è `null` o omesso):
```
jsonBuildPath/colors.tokens.jsonc
jsonBuildPath/spacing.tokens.jsonc
jsonBuildPath/typography.tokens.jsonc
```
Tutti i file vengono scritti nella stessa cartella `jsonBuildPath`, indipendentemente dalla struttura di sottocartelle dei file sorgente — non vengono create sottocartelle. Se due file sorgente con percorsi diversi producessero lo stesso nome di file di output, la build fallisce con un errore che elenca i file in conflitto, invece di sovrascriverne uno silenziosamente con l'altro.

L'opzione `jsonFormat` controlla l'output:

| Valore | Estensione | Intestazione di avviso |
|---|---|---|
| `'jsonc'` | `.jsonc` | Sì |
| `'json'` | `.json` | No |

I riferimenti agli alias (`{color.brand.primary}`) vengono conservati nell'output, in modo che gli strumenti che li usano mantengano i collegamenti tra token primitivi e semantici.

> I file JSON dei token usano volutamente un insieme minimo di transform (nessuna conversione px→rem, nessuna espansione delle shorthand) perché gli strumenti che li usano si aspettano in genere i valori originali e oggetti strutturati, non stringhe CSS già risolte.

#### sourceModes (suddivisione light/dark)

`sourceModes` è un'alternativa a `source`, per i progetti che richiedono una suddivisione light/dark (o altra) delle custom properties. Vedi i commenti in `tokens-config-sample.mjs` per il riferimento completo delle opzioni (`sourceModes`, `sourceModesBase`).

Quando è impostato, ogni modalità ha il proprio array `source` e il CSS generato compone tutte le modalità in un unico `destFile`:
- le proprietà della modalità base vanno in un blocco `:root { ... }` di primo livello, con `color-scheme: <tutte le modalità>;` anteposto
- le proprietà di ogni altra modalità vanno in `@media (prefers-color-scheme: <modalità>) { :root { ... } }`, con `color-scheme: <modalità>;` anteposto

I token di una modalità non base possono referenziare token definiti nella modalità base (ad es. un token dark che usa `{color.1}` definito in light, reso come `var(--color-1)`). I riferimenti ai token di una modalità non base (dalla modalità base o da un'altra modalità non base) falliscono con un errore "reference not defined", perché il target risulterebbe non definito fuori dal proprio blocco `@media`.

`customPropsGroups`, `mergeCustomProps`, `addLayer`, `pxToRem` ecc. si applicano allo stesso modo che con un singolo `source` (`mergeCustomProps` impostato a un array di stringhe/RegExp confronta i file token di ogni modalità). L'output JSON (quando `jsonBuildPath` è impostato) viene prodotto una volta per modalità, con il nome della modalità aggiunto a ogni nome di file (ad es. `tokens-light.jsonc` / `tokens-dark.jsonc`).

---

### `check-unresolved-custom-props.mjs`

Analizza (ricorsivamente) tutti i file `.css` in `dirToCheck` e segnala:

- **proprietà non risolte** — riferimenti `var(--...)` non definiti nel file CSS dei token generato né in alcun `extraCustomPropsFiles`
- **proprietà non usate** — custom properties definite nel file CSS dei token generato (o in una voce di `extraCustomPropsFiles`) ma mai referenziate tramite `var()` in alcun file CSS analizzato. Vengono segnalate solo se nella configurazione è impostato `checkUnused: true`, perché viene rieseguita la pipeline di trasformazione di Style Dictionary sui sorgenti dei token per risalire, quando possibile, al file sorgente `.mjs` di ogni proprietà non usata. Quando `ignoreUnusedInNodeModules` è true (default), le proprietà provenienti da un file token sotto `node_modules` (ad es. un pacchetto di token di terze parti) non vengono mai segnalate come non usate.

I risultati vengono scritti in `unresolved-unused-props.md`, nella stessa directory del file di configurazione.

#### Utilizzo

```sh
npx checkUnresolvedProps --config ./path/to/tokens-config.mjs
```

#### Output

Lo script crea un file `unresolved-unused-props.md` accanto al file di configurazione (solo se c'è almeno una proprietà non risolta o non usata). Ogni voce non risolta rimanda al file e al numero di riga in cui la proprietà è usata; ogni voce non usata rimanda al relativo file sorgente `.mjs` dei token quando è possibile risalirvi, altrimenti viene riportato solo il nome della proprietà:

```markdown
## Custom properties non risolte

* [components.css](../src/components.css#L42) -> `--color-action-hover`
* [layout.css](../src/layout.css#L17) -> `--spacing-missing`

## Custom properties non usate

* [colors.minimo.tokens.mjs](../_src/colors.minimo.tokens.mjs) -> `--color-legacy-accent`
* `--manually-added-prop`
```

In VS Code, Option/Alt-clic sull'URL apre il file alla riga richiesta.


#### Esclusione di proprietà

Usare `excludePattern` per eliminare i falsi positivi — ad esempio le custom properties interne/private definite dinamicamente o inline:

```js
// salta tutte le custom props che iniziano con `--_` o `--js-`
excludePattern: [
  /^--_/,          
  /^--js-/,        
]
```
