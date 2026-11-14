# multi-select — piano di sviluppo

Proposta per realizzare il web component `<multi-select>`: un gruppo di checkbox o radio presentato come un menu a comparsa, simile a una `<select>`, generato dal form theme Symfony di minimo (`params.multiselect`) o scritto a mano.

Stato: **solo proposta, nessun codice scritto**. Le scelte da confermare sono in [Decisioni aperte](#decisioni-aperte).

Questa cartella (`TODO form-multiselect/`) resta come materiale di riferimento e va eliminata a fine lavoro. Il nuovo componente andrebbe in `src/web-components/multi-select/`.

---

## Materiale esistente

A differenza di file-uploader e autocomplete, qui non c'è una versione funzionante da riscrivere, solo frammenti:

- `form-multiselect.js`: la classe `MultiSelectComponent` è **vuota** (solo `constructor` e registrazione di `<multi-select>`); il JSDoc descrive i tre usi previsti (checkbox, radio, `select[multiple]`). Sotto, commentata, la vecchia funzione `formMultiselect()` basata sul dropdown di Bootstrap.
- `form-multiselect.css`: in realtà SCSS, con variabili e mixin di Bootstrap (`$input-bg`, `button-variant`, `@extend .text-truncate`). Da riscrivere per intero.
- `dev-tools/starter-kit/source_files/root/_sf/templates/_incl/minimo-form-layout.html.twig` (blocco `choice_widget_expanded`): con `params.multiselect` genera ancora il vecchio markup `div.btn-group.form-multiselect > button.dropdown-toggle + div.dropdown-menu`, con il commento «TODO multiselect web-component». Oggi quel markup non ha né JS né CSS funzionanti in minimo.
- [Documentazione del form theme](https://massimo-cassandro.github.io/symfony-bootstrap-form-theme/form-theme-bs5.html#multiple_checkboxes) (versione Bootstrap, da cui deriva il form theme di minimo): descrive le opzioni di `params.multiselect` e gli esempi (checkbox, radio).
- `src/css/forms/select.css`: commento «TODO multiselect» in testa.

Cosa faceva la vecchia funzione, da conservare come comportamento:

- pulsante che apre e chiude il menu; chiusura con un clic all'esterno;
- testo del pulsante = etichette delle voci selezionate separate da virgola, oppure «—» se nessuna;
- `data-close-on-click`: chiusura dopo ogni scelta (utile con i radio);
- posizionamento con Popper (già commentato).

Limiti della vecchia funzione: un listener su `document.body` per ogni istanza, nessuna gestione della tastiera (Esc, ritorno del focus), `aria-expanded` senza `aria-controls`, etichette cercate con `closest('.form-check')`.

---

## Light DOM

Il componente usa il light DOM. Checkbox e radio sono i campi reali del form resi da Symfony e devono mantenere la configurazione CSS dei controlli di form di minimo (`.form-check`, `.form-check-input`, stati di errore e disabilitato): in uno shadow root non la riceverebbero. Il valore viaggia con i campi nativi, quindi non serve neanche `formAssociated`.

## Componente o funzione

Nell'uso tipico il markup è reso da Symfony, che resta l'unico responsabile dei campi e dei valori. Qui un custom element non entra in conflitto con questo: il form theme emette già un involucro attorno ai campi (`div.btn-group.form-multiselect`), e basta sostituirlo con `<multi-select>`. Rispetto a una funzione di inizializzazione sui `div.form-multiselect`:

- nessuna chiamata JS da ricordare: si attiva da solo, anche nei form caricati via Ajax o in `modal-popup`;
- `connectedCallback`/`disconnectedCallback` per creare e rimuovere i listener;
- senza JavaScript (o prima della registrazione del componente) restano visibili i campi originali.

**Proposta: custom element.** Al contrario dell'autocomplete, dove il valore va scritto in un campo che Symfony deve leggere, qui il componente non tocca i valori: cambia solo la presentazione.

---

## Integrazione con il form theme

Il blocco `choice_widget_expanded` di `minimo-form-layout.html.twig` va aggiornato: con `params.multiselect` genera `<multi-select>` attorno a `div.form-collection`, al posto di `div.btn-group.form-multiselect` + pulsante + `div.dropdown-menu`. Lo stesso markup compare in `archived/bs5-form-layout.html.twig`, che non va toccato.

Opzioni del form theme e comportamento richiesto al componente:

| Form theme | Componente |
|---|---|
| `params.multiselect: true` oppure `{ placeholder, button_class, menu_class }` | attributi `placeholder`, `buttonclass`, `menuclass` del tag (ossia `classes.button` e `classes.menu`). Il default di `button_class` (`btn-multiselect`, definito nel vecchio `_forms.scss`) non esiste in minimo: il pulsante prende lo stile dai token, vedi [CSS e token](#css-e-token) |
| `ChoiceType` con `expanded: true`, `multiple: true` → checkbox; `multiple: false` → radio | entrambi supportati; la documentazione ha un esempio con i radio. Con i radio `closeOnSelect` è attivo per default |
| `required` (oggi aggiunge solo la classe al fieldset; il controllo «va fatto in JavaScript») | il form theme passa `required` al tag; il componente blocca l'invio finché non c'è almeno una voce selezionata |
| `disabled` | il form theme passa `disabled` al tag; il componente disabilita il pulsante (i campi sono già disabilitati da Symfony) |
| `columns` (classi `rcolumns-*` sulla `div.form-collection`) | in sospeso, vedi [Decisioni aperte](#decisioni-aperte) |
| `inline` | incompatibile, già forzato a `false` dal form theme |
| `no_items_mes` (testo quando non ci sono scelte) | il messaggio resta dentro il menu; il pulsante mostra il placeholder |
| `help` (con `multiselect` reso dopo il widget) e `form_errors` | restano fuori dal componente, nel contenitore reso dal form theme; il pulsante riceve `aria-describedby` verso il testo di aiuto |
| `fieldset` + `legend` (e la variante senza fieldset, `collection_container: false`) | il pulsante e il menu sono etichettati dalla `legend` (`aria-labelledby`); senza fieldset, dall'etichetta indicata con l'attributo `labelledby` |
| campi con errore (`is-invalid`, aggiunta da `widget_attributes`) | il pulsante riflette lo stato di errore (attributo `aria-invalid` e classe), così l'errore è visibile anche a menu chiuso |

Markup risultante (semplificato):

```html
<fieldset class="form-group form-collection-fset">
  <legend>Categorie</legend>
  <multi-select placeholder="Scegli…" required>
    <div class="form-collection">
      <div class="form-check"><input type="checkbox" class="form-check-input" id="c1" name="cat[]" value="1"><label class="form-check-label" for="c1">Uno</label></div>
      <div class="form-check"><input type="checkbox" class="form-check-input" id="c2" name="cat[]" value="2"><label class="form-check-label" for="c2">Due</label></div>
    </div>
  </multi-select>
  <!-- help ed errori del form theme -->
</fieldset>
```

---

## Architettura proposta

Il componente, alla connessione:

1. sposta i figli in un contenitore `div[popover]`;
2. inserisce prima del contenitore un `<button type="button" popovertarget="…">` con il riepilogo della selezione;
3. aggiorna il riepilogo a ogni `change`.

### Alternative native valutate

- **Popover API** (`popover` + `popovertarget`): chiusura con clic esterno e con Esc, ritorno del focus, top layer (nessun taglio da `overflow`) forniti dal browser. È già usata in minimo da `snackbar`. **È la base proposta**: elimina il listener su `document.body` e Popper.
- **`<select multiple>` personalizzabile (`appearance: base-select`)**: oggi copre solo la select singola e non è disponibile in tutti i browser. Da tenere d'occhio (è già citata nel TODO di `select.css`).
- **`<details>`**: niente chiusura con clic esterno né top layer, e semantica sbagliata per un controllo di form.

### Struttura dei file

```
src/web-components/multi-select/
├── multi-select-component.js         # classe MultiSelect + customElements.define('multi-select')
├── multi-select-component.module.css
├── multi-select.minimo.tokens.mjs    # token --msel-*
├── readme.md
└── src/
    ├── defaults.js                   # default + typedef dei parametri, labels, classes
    ├── resolve-params.js             # attributi / init() / setDefaults()
    ├── build.js                      # pulsante, contenitore popover, spostamento dei figli
    ├── summary.js                    # testo del pulsante
    └── filter.js                     # campo di ricerca nell'elenco (facoltativo)
```

Convenzioni uguali a json-table: `init()`, `MultiSelect.setDefaults()`, `labels` e `classes` uniti ai default, eventi con prefisso `msel:`. Il componente è piccolo: se `src/` risultasse eccessivo, i moduli possono stare in un solo file.

### Parametri

| Parametro | Default | Note |
|---|---|---|
| `placeholder` | `'—'` | testo del pulsante senza selezione (`params.multiselect.placeholder`) |
| `maxLabels` | `3` | oltre questo numero il riepilogo diventa «N selezionati» (`labels.selectedCount`); `0` = sempre l'elenco delle etichette |
| `separator` | `', '` | separatore delle etichette nel riepilogo |
| `closeOnSelect` | `false`; `true` con i radio | sostituisce `data-close-on-click` |
| `filter` | `false` | campo di ricerca in testa all'elenco; `'auto'` = solo oltre `filterThreshold` voci |
| `filterThreshold` | `10` | |
| `selectAll` | `false` | pulsanti «seleziona tutti / nessuno» (solo checkbox) |
| `required` | `false` | almeno una voce selezionata (i gruppi di checkbox non hanno un `required` nativo) |
| `disabled` | `false` | disabilita il pulsante |
| `labelledby` | `null` | id dell'etichetta, quando il componente non è dentro un `fieldset` con `legend` |
| `classes` | — | `button`, `menu`, `summary` (`params.multiselect.button_class` e `menu_class`) |
| `labels` | — | `placeholder`, `selectedCount`, `selectAll`, `selectNone`, `filterPlaceholder`, `noMatches`, `required` |

### Comportamento

- **Apertura e chiusura**: Popover API (`popover="auto"`): clic esterno, Esc e ritorno del focus al pulsante sono nativi. Un solo menu aperto alla volta, senza codice.
- **Posizionamento**: sotto il pulsante, larghezza almeno pari al pulsante, altezza massima con scorrimento. Stessa questione dell'elenco dell'autocomplete: vedi [Decisioni aperte](#decisioni-aperte).
- **Tastiera**: Tab tra le voci e Spazio per selezionare sono nativi dei campi; in aggiunta ↓ sul pulsante apre il menu e porta il focus sulla prima voce, ↑/↓ tra le voci, Esc chiude.
- **Accessibilità**: il pulsante riceve `aria-haspopup="true"` ed `aria-expanded` (gestito dal browser con `popovertarget`); il contenitore ha `role="group"` e `aria-labelledby` verso la `legend`; il riepilogo fa parte del nome accessibile del pulsante. I campi restano checkbox e radio veri: niente `role="listbox"` da simulare.
- **Riepilogo**: etichette lette dal `<label for>` associato a ogni campo (non da `closest('.form-check')`), testo troncato con ellissi e `title` completo.
- **`required`**: messaggio di validità personalizzato sul primo campo del gruppo finché nessuna voce è selezionata, così l'invio del form viene bloccato dalla validazione nativa; all'errore il menu si apre per mostrare il campo.
- **Reset del form**: riepilogo aggiornato all'evento `reset`.
- **Modifiche esterne**: metodo `refresh()` per riallineare il riepilogo dopo modifiche via JS ai campi; un `MutationObserver` sui figli per voci aggiunte o rimosse.

Eventi: `msel:change` (`detail.values`, `detail.labels`), `msel:open`, `msel:close`. Proprietà: `values`, `labels`; metodi: `open()`, `close()`, `refresh()`.

### CSS e token

- I campi dentro il menu mantengono lo stile dei controlli di form di minimo (`form-check.css`): il componente non li ridefinisce.
- File token `multi-select.minimo.tokens.mjs`, prefisso `--msel-*`. I valori fanno riferimento ai token dei form di minimo (`{form.control.…}`), così il pulsante ha lo stesso aspetto di `select.form-control`: bordo, sfondo, raggio, spaziature, icona, stato di errore e disabilitato; più i token del menu (sfondo, bordo, ombra, altezza massima, spaziatura).
- Il pulsante non usa `.btn`: è l'equivalente visivo di una select, non di un pulsante d'azione.
- Nessuna dipendenza da Bootstrap; rimosso il commento «TODO multiselect» da `select.css` a lavoro finito.

---

## Rapporto con autocomplete

I due componenti si sovrappongono solo in apparenza: `multi-select` presenta un elenco **fisso e già presente nella pagina**; l'autocomplete in modalità multipla cerca **su un elenco remoto** e mostra le scelte come badge. Restano distinti, ma conviene condividere:

- la soluzione di posizionamento del menu rispetto al campo;
- i token di base del menu (sfondo, bordo, ombra, raggio), referenziati da entrambi i file token.

Con la ricerca locale su un gruppo di checkbox (prevista nel piano dell'autocomplete) i due casi si avvicinano a `multi-select` con `filter`: nel readme va chiarito quando usare l'uno o l'altro (indicativamente: poche scelte da vedere tutte insieme → `multi-select`; molte scelte da cercare per nome → autocomplete).

---

## Piano di lavoro

1. [ ] **Scheletro** — cartella, `defaults.js`, `resolve-params.js`, classe `MultiSelect`, costruzione di pulsante e popover attorno a checkbox e radio esistenti, pagina nella demo con il markup del form theme.
2. [ ] **Riepilogo e token** — `summary.js`, file token, CSS module, aspetto allineato a `select.form-control`.
3. [ ] **Tastiera, accessibilità, form** — frecce, attributi ARIA (`legend`, help), `required`, `disabled`, stato di errore, reset.
4. [ ] **Form theme** — aggiornamento di `choice_widget_expanded` in `minimo-form-layout.html.twig` (starter-kit), prova con checkbox, radio, `required`, `disabled`, `no_items_mes`, errori di validazione.
5. [ ] **Funzioni facoltative** — `filter`, `selectAll`.
6. [ ] **Chiusura** — readme (compreso l'uso con il form theme), aggiornamento di `CLAUDE.md` e `src/TODO.md` (se pertinente), eliminazione di `TODO form-multiselect/`.
7. [ ] **Successive** — conversione di `select[multiple]` in checkbox (vedi [Decisioni aperte](#decisioni-aperte)).

---

## Decisioni aperte

- [ ] **Posizionamento del menu**: Popover API come base (proposta). Per l'ancoraggio al pulsante: CSS anchor positioning dove disponibile, con ripiego su un calcolo minimo in JS all'apertura (posizione e larghezza dal `getBoundingClientRect()` del pulsante). Da decidere una volta sola insieme all'autocomplete, eventualmente come utilità condivisa in `src/utilities/`.
- [ ] **Colonne** (in sospeso): il form theme usa le classi `rcolumns-*`, che vengono da `m-utilities` e non esistono in minimo; la documentazione del form theme ha un esempio di multiselect con radio in colonne. Da decidere se e come supportarle nel menu (equivalente in minimo, attributo `columns` del componente, oppure rinuncia); se supportate, il menu deve potersi allargare oltre la larghezza del pulsante.
- [ ] **`select[multiple]`**: con Symfony basta usare `expanded: true` per avere le checkbox, quindi la conversione serve solo per markup non generato dal form theme. Proposta: rimandarla (fase 7), o abbandonarla in attesa della select personalizzabile nativa.
- [ ] **Nome del tag e della cartella**: `<multi-select>` (già usato nello stub) in `src/web-components/multi-select/`, oppure mantenere `form-multiselect`.
- [ ] **Prefisso dei token**: `--msel-*` proposto (`--ms-*` è troppo generico e ricorda i prefissi proprietari).
- [ ] **Funzioni facoltative** (`filter`, `selectAll`): incluse nel piano come fase 5, da confermare o rimandare.
