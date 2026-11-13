# autocomplete — piano di riscrittura

Proposta per riscrivere l'autocomplete di minimo (oggi `autocompleteEngine`, wrapper di `@tarekraafat/autocomplete.js`) senza libreria esterna: il campo reso da Symfony (hidden, select, radio o checkbox) resta nel form ma nascosto, e il componente crea il proprio campo di testo; classe `Autocomplete` più involucro `<auto-complete>` emesso dal form theme.

Stato: **solo proposta, nessun codice scritto**. Le scelte da confermare sono in [Decisioni aperte](#decisioni-aperte).

Questa cartella (`TODO-autocomplete/`) resta come materiale di riferimento durante la riscrittura e va eliminata a fine lavoro. La posizione del nuovo codice è tra le [Decisioni aperte](#decisioni-aperte).

---

## Cosa fa oggi (sintesi)

- `autocompleteEngine(params)` riceve un campo di testo e un URL (`ac_url`); a ogni digitazione (da 3 caratteri) chiama `ac_url + query`, passa il JSON a `fetch_result_function`, che restituisce elementi `{id, val, list_display}`.
- La libreria mostra l'elenco, gestisce tastiera e attributi ARIA, evidenzia la corrispondenza con `<mark>`.
- Alla selezione: `val` nel campo di testo, `id` in un campo nascosto (`hidden_field` / `hidden_id` + `hidden_name`) oppure in una `<select>` esistente (`select_id`), anche multipla con badge rimovibili (`badges_container_id`, `badges_builder`).
- Se il testo non corrisponde più all'ultima selezione, il valore viene azzerato (`check_ac`, più la funzione esterna `checkAutocomplete`).
- `callback(id, val, campo, list_display, row)` a ogni selezione e a ogni azzeramento.

## Problemi attuali

Legati alla libreria:

- **Ricerca fatta due volte**: i risultati arrivano già filtrati dal server, ma la libreria li filtra di nuovo con il proprio motore sulla chiave `list_display`. Se il server trova un record per un campo che non compare in `list_display`, o con una logica diversa (più parole, sinonimi), il risultato rischia di non essere mostrato. **Da verificare con un caso concreto**, ma è il comportamento documentato di `data.keys`.
- **Evidenziazione sulla stringa HTML**: `list_display` contiene markup (`<br><small>…`) e `<mark>` viene inserito con una sostituzione sulla stringa, quindi una ricerca può corrispondere a nomi di tag o attributi e rompere il markup. Anche questo da verificare, stessa origine del punto precedente.
- **Selettore come stringa**: la libreria cerca il campo con `document.querySelector('#id')`. Il campo deve avere un `id` ed essere già nel documento: da qui l'errore con i callback di `domBuilder` (`Cannot use 'in' operator to search for 'aria-controls' in null`), descritto nel TODO della root.
- **Markup dell'elenco non controllabile**: il `<div>` dentro ogni `li`, su cui si basano i CSS dei progetti (ADA), dipende da come ogni chiamante scrive `list_display`.
- **Nessun controllo sulle richieste**: `debounce` della libreria non impostato (una richiesta per ogni tasto), nessun annullamento delle richieste superate (una risposta lenta può sovrascrivere una più recente), errori di rete restituiti come dati (`return error`).
- Dipendenza non dichiarata in `peerDependencies` e CSS derivato da quello della libreria.

Legati al wrapper:

- `check_ac` è collegato a `search`, `blur`, `change` e `keydown`: il callback con valori vuoti parte a ogni tasto premuto quando il testo differisce dalla selezione.
- Inserimenti senza escape: `data.query` nel messaggio «nessun risultato», `result_obj.val` nei badge, `hidden_name`/`hidden_id` nel markup del campo nascosto.
- URL costruito per concatenazione (`ac_url` «con slash iniziale e finale»), parametri aggiuntivi non codificati.
- Classi Bootstrap nei badge (`badge rounded-pill text-bg-secondary`), testi in italiano nel codice, soglia fissa a 3 caratteri.
- CSS: residuo di progetto (`.hmenu-subsection-emulazione { overflow-y: visible }`), token generici (`--secondary-100`, `--text-muted`), `!important` diffusi, elenco posizionato in `absolute` dentro `.form-group` (viene tagliato dai contenitori con `overflow`, ed è il motivo della regola residua).
- Il contenitore è cercato con `closest('.form-group')`: il componente dipende dal markup della pagina.

---

## Libreria esterna o implementazione nativa

Quello che la libreria fornisce davvero, nell'uso che ne fa minimo: ascolto dell'input con soglia, rendering dell'elenco, navigazione da tastiera, attributi ARIA del combobox, evidenziazione. Il motore di ricerca interno (modalità `strict`/`loose`, diacritici) non serve, perché la ricerca è sul server; anzi è la fonte dei primi due problemi.

| | Libreria (`@tarekraafat/autocomplete.js`) | Nativo in minimo |
|---|---|---|
| Codice da scrivere e mantenere | Solo il wrapper (già ~380 righe) | Stimate 400–500 righe in più moduli; nessun wrapper |
| Accessibilità | Già implementata e collaudata | Da implementare seguendo il pattern ARIA «combobox con listbox»: ben documentato, ma va provato con tastiera e lettore di schermo |
| Ricerca lato server | Va aggirato il filtro interno | Nessun filtro: si mostra ciò che il server restituisce |
| Evidenziazione | Sulla stringa HTML | Sui nodi di testo (non tocca il markup), insensibile ad accenti e maiuscole |
| Markup dell'elenco | Deciso dalla libreria, corretto a posteriori nei callback | Deciso dal componente: `li > div` garantito |
| Richieste | `debounce` disponibile; annullamento da gestire fuori | `debounce` + `AbortController` nel componente |
| Integrazione con `domBuilder` | Problema del selettore | Risolto alla radice: si passa l'elemento, non un selettore |
| Dipendenze | Peer dependency opzionale, manutenzione esterna (ultima versione maggiore del 2021) | Nessuna, coerente con la politica di minimo |
| Rischio | Basso oggi, ma con i limiti sopra | Regressioni di comportamento rispetto a quanto i progetti si aspettano: serve una demo che copra i casi reali |

**Raccomandazione: implementazione nativa.** Il wrapper attuale è già lungo quasi quanto servirebbe per fare tutto senza libreria, e buona parte della sua complessità serve ad adattare la libreria a un uso (chiave-valore con ricerca remota) per cui non è pensata. L'unica parte in cui la libreria fa risparmiare lavoro vero è l'accessibilità, che però è un pattern standard e circoscritto.

Alternativa prudente, se si vuole ridurre il rischio: prima fase con il componente nativo affiancato al vecchio engine (che resta in `TODO-autocomplete/`), sostituzione nei progetti uno alla volta.

---

## Campi resi da Symfony

Nell'uso più frequente il valore arriva al server tramite un campo reso da Symfony con il form theme di minimo, che può essere:

- un `<input type="hidden">` con l'id;
- una `<select>`, singola o `multiple` (`EntityType`, `ChoiceType`);
- un gruppo di radio o checkbox (`ChoiceType` con `expanded: true`).

Quel campo deve restare quello generato da Symfony, perché è quello che il componente Form legge, valida e ripresenta dopo un errore di validazione. Proposta: **il campo Symfony resta nel form ma nascosto, e il componente crea il proprio campo di testo** (più i badge in modalità multipla), riportando ogni selezione nel campo Symfony.

Vantaggi:

- un solo comportamento qualunque sia il widget Symfony: nel template basta il `form_row`/`form_widget` del campo;
- il testo visibile si ricostruisce dal campo Symfony, anche dopo un errore di validazione: testo dell'option o etichetta del radio/checkbox selezionato; per l'hidden serve un attributo con l'etichetta (`data-ac-label`);
- con select e gruppi di radio/checkbox le scelte sono già nella pagina: l'autocomplete può cercare tra queste senza chiamate al server (ricerca locale), utile per elenchi lunghi.

Punti da gestire:

- **Validazione delle scelte in Symfony**: `ChoiceType`/`EntityType` accettano solo valori presenti tra le scelte del form type. Con la ricerca remota il componente aggiunge alla select option nuove, che vengono accettate solo se il form type le carica comunque (es. `EntityType` con tutte le entità, oppure `choice_loader` o un evento `PRE_SUBMIT` che aggiunge il valore inviato). Da verificare su come lo gestiscono oggi i progetti; un esempio di form type va in `snippets/`.
- **Radio e checkbox**: aggiungerne di nuovi via JS è scomodo e va comunque contro la validazione delle scelte; proposta: con questi widget solo ricerca locale tra le scelte esistenti.
- **`required` sul campo nascosto**: un campo `required` non visibile blocca l'invio con un errore che il browser non riesce a mostrare. Il componente toglie `required` dal campo Symfony e applica la validità al proprio campo di testo.
- **Come nasconderlo**: attributo `hidden` sul campo (o sul contenitore dei radio/checkbox); i campi con `hidden` vengono comunque inviati.
- **Etichetta**: la `<label for>` resa da Symfony punta al campo nascosto; il componente la ricollega al proprio campo di testo.

### Componente o funzione

Con il campo di testo creato dal componente, la forma custom element diventa naturale, come per multi-select: il form theme può emettere `<auto-complete>` attorno al widget Symfony tramite `params.autocomplete`, e nel template basta passare le opzioni al `form_row`.

**Proposta**:

- `Autocomplete`, classe che riceve il campo di destinazione (`new Autocomplete(campo, opts)`) e crea il campo di testo: è il motore, usabile anche senza involucro;
- `<auto-complete>`, involucro che crea l'istanza in `connectedCallback` e la distrugge in `disconnectedCallback`: si attiva da solo anche nei form caricati via Ajax, in `modal-popup` o creati con `domBuilder`;
- `params.autocomplete` nel form theme di minimo, che emette l'involucro.

Niente `formAssociated`/`ElementInternals`: il valore viaggia nel campo Symfony.

---

## Architettura proposta

### Forma

```twig
{{ form_row(form.agenzia, {params: {autocomplete: {url: path('agenzie_search')}}}) }}
```

genera (semplificato):

```html
<auto-complete url="/agenzie/search">
  <select id="form_agenzia" name="form[agenzia]">…</select> <!-- campo Symfony, nascosto dal componente -->
</auto-complete>
```

```js
// senza involucro
new Autocomplete(document.getElementById('form_agenzia'), { url: '/agenzie/search' });
```

- Il campo di testo è creato dal componente, con le classi di `classes.input` (default `form-control`).
- Light DOM: campo ed elenco usano le classi del progetto; CSS module come gli altri componenti.
- Nessun `id` richiesto, nessun `document.querySelector`; sparisce la dipendenza da `.form-group` (`autocomplete_parent_selector`): l'elenco viene posizionato rispetto al campo di testo.

Campi di destinazione:

| Campo Symfony | Modalità | Scrittura della selezione | Testo iniziale |
|---|---|---|---|
| `<input type="hidden">` | singola | `value` | attributo `data-ac-label` |
| `<select>` | singola | option selezionata, aggiunta se manca | testo dell'option selezionata |
| `<select multiple>` | multipla | option `selected`, aggiunte se mancano; badge | testi delle option selezionate (badge) |
| gruppo di radio | singola, solo ricerca locale | radio `checked` | etichetta del radio selezionato |
| gruppo di checkbox | multipla, solo ricerca locale | checkbox `checked`; badge | etichette delle checkbox selezionate (badge) |
| nessuno, opzione `name` | singola | campo nascosto generato | — |

### Struttura dei file

```
src/web-components/autocomplete/
├── autocomplete.js                   # classe Autocomplete (motore: riceve il campo di destinazione, crea il campo di testo)
├── autocomplete-component.js         # involucro <auto-complete> + customElements.define
├── autocomplete.module.css
├── autocomplete.minimo.tokens.mjs    # token --ac-*
├── readme.md
└── src/
    ├── defaults.js                   # default + typedef dei parametri, labels, classes
    ├── resolve-params.js             # attributi / init() / setDefaults()
    ├── fetch-results.js              # costruzione dell'URL, debounce, AbortController, gestione errori
    ├── listbox.js                    # rendering dell'elenco, stati (caricamento, nessun risultato, errore)
    ├── keyboard.js                   # navigazione: ↓ ↑ Home End Invio Esc Tab
    ├── highlight.js                  # <mark> sui nodi di testo, insensibile ad accenti e maiuscole
    ├── targets.js                    # adattatori per i campi di destinazione (hidden, select, radio, checkbox): lettura, scrittura, testo iniziale
    ├── selection.js                  # selezione e azzeramento
    ├── local-search.js               # ricerca tra le scelte già presenti nel campo o nell'array `data`
    └── badges.js                     # modalità multipla
```

Convenzioni uguali a json-table dove applicabili: `Autocomplete.setDefaults()`, precedenza opzioni JS > attributi > `setDefaults()` > default, `labels` e `classes` uniti ai default, eventi con prefisso `ac:` emessi sul campo di testo (con bubbling, quindi intercettabili anche sull'involucro).

### Comportamento

- **Richieste**: `debounce` (default 250 ms), `minChars` (default 3), annullamento della richiesta precedente, stato di caricamento visibile, errori di rete mostrati nell'elenco e segnalati con `ac:error`.
- **URL**: costruito con `URL`/`URLSearchParams`. `queryParam` (es. `q`) per inviare la ricerca come parametro; se `null`, la ricerca viene accodata al percorso come oggi (continuità). `extraParams` come oggetto o funzione (valori letti al momento della richiesta, es. da altri campi del form).
- **Risultati**: `fetchResultFunction(data)` restituisce `{ id, val, listDisplay, … }` come oggi (accettato anche `list_display`). `listDisplay` può essere una stringa HTML (inserita con `setHTML`, come in json-table e `domBuilder`) o un elemento.
- **Markup dell'elenco**: `ul[role=listbox] > li[role=option] > div`. Il `<div>` è garantito dal componente; se `listDisplay` è già un unico `<div>` radice non ne viene aggiunto un secondo (le classi esistenti, es. `alert-item`, restano). È la voce «div wrapper garantito» del TODO della root.
- **Accessibilità**: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` sul campo; `aria-selected` sulle opzioni; zona `aria-live` per numero di risultati e «nessun risultato».
- **Selezione rigorosa** (`strict`, default `true`): se all'uscita dal campo il testo non corrisponde alla selezione, campo e valore vengono azzerati. Sostituisce `check_ac` e `checkAutocomplete`, con un solo punto di controllo (`blur`/`change`, non `keydown`). Con `strict: false` il testo libero resta nel campo senza id.
- **Posizionamento dell'elenco**: vedi [Decisioni aperte](#decisioni-aperte).
- **Ricerca locale**: senza `url`, la ricerca avviene tra le scelte già presenti nel campo Symfony (option, radio, checkbox) oppure in un array `data`; filtro insensibile ad accenti e maiuscole. Obbligatoria con radio e checkbox.

### API pubblica

Eventi (`event.detail.autocomplete` è l'istanza):

| Evento | Quando | `detail` | Sostituisce |
|---|---|---|---|
| `ac:select` | elemento selezionato | `id`, `val`, `item` (oggetto completo restituito da `fetchResultFunction`) | `callback` |
| `ac:clear` | selezione azzerata | — | `callback('', '')` |
| `ac:remove` | badge rimosso (multipla) | `id`, `val` | `badges_remove_callback` |
| `ac:results` | risultati ricevuti | `query`, `results` | — |
| `ac:error` | errore di rete o risposta non valida | `error` | — |

Proprietà e metodi dell'istanza (raggiungibile anche dall'involucro, es. `el.autocomplete`): `value` (id, o array di id in modalità multipla), `selected` (oggetto o array di oggetti), `setValue(id, val)`, `clear()`, `open()`, `close()`, `destroy()`.

### Parametri: da vecchi a nuovi

| Vecchio | Nuovo | Note |
|---|---|---|
| `ac_url` | `url` | obbligatorio |
| — | `queryParam` | default `null` = ricerca accodata al percorso, come oggi |
| `extra_query_params` | `extraParams` | oggetto o funzione |
| `test_mode` | `staticUrl` | la ricerca non viene aggiunta all'URL (JSON statico per le prove) |
| `fetch_result_function` | `fetchResultFunction` | stesso formato |
| `placeholder` | `placeholder` | default in `labels` |
| `autocomplete_field` | creato dal componente | `classes.input` e `inputAttrs` per classi e attributi |
| `autocomplete_parent_selector` | eliminato | l'elenco è posizionato rispetto al campo di testo |
| `hidden_field`, `hidden_id`, `select_id` | campo di destinazione | primo argomento del costruttore, oppure figlio dell'involucro (hidden, select, gruppo di radio/checkbox) |
| `select_multiple` | eliminato | multipla se la select ha `multiple` o se il gruppo è di checkbox |
| `hidden_name` | `name` | solo per generare il campo nascosto quando non c'è un campo di destinazione |
| `badges_container_id` | `badgesContainer` | facoltativo; per default i badge sono inseriti dopo il campo di testo |
| `badges_builder` | `badgeRender(item)` | il default usa `.badge` di minimo, senza classi Bootstrap |
| `badge_label_class`, `badge_btn_class`, `resultList_extra_class`, `wrapper_extra_class` | `classes.*` | |
| `callback`, `badges_remove_callback` | eventi | |
| soglia fissa (3) | `minChars` | default 3 |

Nuovi: `debounce`, `strict`, `maxResults`, `highlight` (default `true`), `labels` (`placeholder`, `noResults`, `loading`, `error`, `removeBadge`, `resultsCount`).

### CSS e token

- File token `autocomplete.minimo.tokens.mjs`, prefisso `--ac-*` (già usato): colore e sfondo dell'elenco, bordo, raggio, ombra, altezza massima, voce attiva/hover, evidenziazione, messaggi, badge. Spariscono i riferimenti diretti a `--secondary-100` e `--text-muted`.
- Stato attivo unico per mouse e tastiera: `li[aria-selected='true'] > div` e `li > div:hover` con le stesse regole (oggi la navigazione con le frecce può risultare invisibile).
- Via gli `!important`, la regola `.hmenu-subsection-emulazione` e le regole specifiche di progetto (`.alert-item`, `.text-muted`, `.badge` dentro le voci): diventano token o restano nei CSS dei progetti.

---

## Voci acquisite

Dal `TODO.md` di questa cartella (eliminato):

| Voce | Destinazione |
|---|---|
| Da rivedere | questo piano |
| Definire uso CSS | CSS module importato dal componente |
| Unificare tokens | file token `--ac-*` |

Dalla sezione AUTOCOMPLETE del [TODO.md della root](../../../TODO.md) (non modificata: va aggiornata quando il piano viene approvato):

| Voce | Destinazione |
|---|---|
| Errore con i callback di `domBuilder` (campo non ancora nel documento) | risolto: la classe riceve l'elemento, non un selettore; l'involucro si attiva all'inserimento nel documento |
| Uso anche senza minimo | CSS module + token propri; vedi decisioni aperte |
| XSS su `data.query` e sui badge | testo inserito come testo, HTML solo tramite `setHTML` |
| Componente indipendente o libreria in `peerDependenciesMeta` | implementazione nativa (raccomandata) |
| `<div>` garantito nelle voci dell'elenco | markup deciso dal componente |
| Token generici nel CSS, colori scritti nel file | file token |
| Classi Bootstrap nei badge | default con `.badge` di minimo |
| Rimozione dei `<div>` espliciti in `ada-frontend/src/shared/autocomplete/` | dopo la pubblicazione e l'aggiornamento in ADA |

Dai commenti nel codice: «attivare la selezione dell'autocomplete» (`check-autocomplete.js`) e «rendere più efficiente l'invocazione della callback» (`autocomplete-engine.js`) sono assorbiti da `strict` e dagli eventi.

---

## Piano di lavoro

1. [ ] **Scheletro** — cartella, `defaults.js` con typedef, `resolve-params.js`, classe `Autocomplete`, adattatori dei campi di destinazione (`targets.js`), campo di testo generato, campo Symfony nascosto (`required` ed etichetta spostati), involucro `<auto-complete>`, pagina nella demo con un JSON statico.
2. [ ] **Ricerca e elenco** — `fetch-results.js` (URL, debounce, annullamento, errori), rendering con `li > div` garantito, stati di caricamento / nessun risultato / errore, file token e CSS.
3. [ ] **Tastiera e accessibilità** — pattern combobox completo, zona `aria-live`, prova con tastiera e VoiceOver.
4. [ ] **Selezione singola** — scrittura del valore (hidden / select / radio), `strict`, `required`, reset del form, ripristino del testo visibile dopo un errore di validazione Symfony, eventi `ac:select` e `ac:clear`.
5. [ ] **Evidenziazione** — `highlight.js` sui nodi di testo.
6. [ ] **Modalità multipla** — select multipla e checkbox, badge, rimozione, selezioni già presenti all'avvio, `ac:remove`.
7. [ ] **Ricerca locale** — `local-search.js`, tra le scelte del campo o in `data`.
8. [ ] **Symfony** — `params.autocomplete` in `minimo-form-layout.html.twig`, prove con hidden, `EntityType`, `ChoiceType` (anche `expanded`) ed errori di validazione; esempio di form type che accetta le scelte aggiunte dalla ricerca remota (snippet in `snippets/`).
9. [ ] **Chiusura** — readme, demo con i casi reali (riprendere le sei implementazioni di ADA come banco di prova), aggiornamento di `CLAUDE.md` e `TODO.md` della root, eliminazione di `TODO-autocomplete/`.
10. [ ] **Successive** — raggruppamento dei risultati, eventuale helper per `domBuilder`.

---

## Decisioni aperte

- [ ] **Nativo o libreria**: raccomandato nativo. Da confermare prima di tutto il resto.
- [ ] **Campo Symfony nascosto + campo di testo del componente**: proposta (vedi [Campi resi da Symfony](#campi-resi-da-symfony)), da confermare insieme alla forma classe + involucro emesso dal form theme.
- [ ] **Scelte aggiunte dalla ricerca remota**: verificare su ADA come i form type accettano oggi valori non presenti tra le scelte iniziali (`EntityType` con tutte le entità, `choice_loader`, `PRE_SUBMIT`, campo hidden), per scegliere il caso da documentare.
- [ ] **Radio e checkbox solo con ricerca locale**: confermare, o prevedere l'aggiunta di nuove voci anche per questi widget.
- [ ] **Posizione nel repo**: la classe è il prodotto principale, quindi `src/components/autocomplete/` con l'involucro accanto, oppure `src/web-components/autocomplete/` come gli altri custom element.
- [ ] **Nome del tag**: `<auto-complete>` (i nomi dei custom element richiedono un trattino).
- [ ] **Posizionamento dell'elenco**: (a) `position: absolute` dentro il componente, come oggi: semplice, ma viene tagliato dai contenitori con `overflow`; (b) `popover="manual"` + CSS anchor positioning: l'elenco va nel top layer e non viene mai tagliato, ma il supporto dell'anchor positioning nei browser è recente e va verificato rispetto ai browser dei progetti. Proposta: (a) come base, (b) attivato con `@supports`. La stessa scelta vale per `multi-select` (vedi `src/web-components/TODO form-multiselect/TODO-refactoring.md`): conviene un'unica soluzione condivisa.
- [ ] **Verifica dei due difetti attribuiti alla libreria** (doppio filtro, evidenziazione sul markup): da riprodurre in un progetto reale. Non cambiano la raccomandazione, ma danno la misura dell'urgenza.
- [ ] **Uso fuori da minimo**: stessa questione di json-table e file-uploader (CSS module + token generati da `build-tokens`), da risolvere una volta per tutti i web component.
