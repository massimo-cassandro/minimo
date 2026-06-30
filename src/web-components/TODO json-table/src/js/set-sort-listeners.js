import * as styles from '../css/table.module.css';
import { domBuilder } from '@massimo-cassandro/dom-builder/index.js';

// TODO defaultSorting => conversione nel formato datatable se jqDatatableCompliant = true

export function setSortListeners(){

  this.params.activeSorting = { ...this.params.defaultSorting }; // to preserve the original sorting

  this.params.elements.thead.addEventListener('click', e => {

    const hasShiftKey = e.shiftKey,
      sortBtn = e.target.closest(`.${styles.sortArrow}`);

    if( sortBtn ) {
      const columnKey = sortBtn.closest('th').dataset.key;

      // each click activate a sort direction in this order: asc, desc or none (null)
      const newDirection = this.params.activeSorting[columnKey] == null
        ? 'asc'
        : this.params.activeSorting[columnKey] === 'asc'
          ? 'desc'
          : null;

      if(!hasShiftKey) {
        this.params.elements.thead.querySelectorAll(`.${styles.sortActive}`).forEach(el => {
          el.classList.remove(styles.sortActive);
        });
        this.params.activeSorting = {};
      }

      // TODO aria attrs (vedi sotto)

      sortBtn.classList.toggle(styles.sortActive, newDirection != null);
      this.params.activeSorting[columnKey] = newDirection;


      // TODO wait for shift click ending
      if (this.params.ajax) {
        // TODO ajax sorting (vedi datatable-like url in _work)

      } else {

        const sorted = this.staticDataSorting();

        domBuilder(
          sorted.map( row_data => this.tableRow(row_data)),
          this.params.elements.tbody,
          {emptyParent: true}
        );

      }
    }

  }, false);
}


/*
Per rendere accessibile un pulsante di ordinamento all'interno di una cella di intestazione (`<th>`), non basta l'aspetto visivo. È necessario comunicare agli screen reader la funzione del pulsante e, soprattutto, lo **stato corrente** dell'ordinamento.

Ecco gli attributi ARIA e i ruoli fondamentali da utilizzare:

---

### 1. Attributi ARIA Fondamentali

Quando un pulsante controlla l'ordinamento, l'attributo più importante risiede sulla cella genitore (`<th>`), mentre il pulsante gestisce l'interazione.

* **`aria-sort` (sull'elemento `<th>`):**
Indica se la colonna è ordinata e in quale direzione. I valori possibili sono:
* `ascending`: Ordinamento crescente.
* `descending`: Ordinamento decrescente.
* `none`: La colonna è ordinabile ma non è attualmente ordinata.


* **`aria-label` o testo descrittivo (sul pulsante):**
Il pulsante deve avere un nome accessibile chiaro. Invece di un generico "Ordina", è meglio usare "Ordina per [Nome Colonna]".
* **`aria-pressed` (opzionale sul pulsante):**
Se vuoi indicare che il pulsante è "attivo", puoi usare questo stato, anche se `aria-sort` sul `th` è solitamente sufficiente per il contesto della tabella.

---

### 2. Struttura del Codice (Esempio)

Ecco come implementare correttamente il pattern per una colonna che viene ordinata in modo crescente:

```html
<th scope="col" aria-sort="ascending">
  <button type="button" aria-label="Ordina per Nome in modo decrescente">
    Nome
    <span aria-hidden="true">↑</span>
  </button>
</th>

```

### 3. Best Practices per l'Accessibilità

* **Non usare `role="button"` su tutto:** Se usi il tag HTML `<button>`, il ruolo è implicito. Non serve aggiungerlo manualmente.
* **Gestione del Focus:** Quando l'utente clicca sul pulsante e la tabella si aggiorna, il focus deve rimanere sul pulsante stesso per permettere di cambiare nuovamente l'ordinamento senza dover navigare di nuovo l'intera pagina.
* **Aggiornamento Dinamico:** Quando lo stato cambia da crescente a decrescente, devi aggiornare via JavaScript sia l'attributo `aria-sort` sul `<th>` che l' `aria-label` (o il testo nascosto) sul pulsante.
* **Icone:** Se usi icone (come frecce), nascondile agli screen reader con `aria-hidden="true"`, poiché l'informazione è già fornita dagli attributi ARIA.

---

### Riepilogo degli Stati

| Stato della Colonna | Valore `aria-sort` (su `th`) | Suggerimento `aria-label` (su `button`) |
| --- | --- | --- |
| Non ordinata | `none` | "Ordina per [Nome]" |
| Crescente (A-Z) | `ascending` | "Ordina decrescente" |
| Decrescente (Z-A) | `descending` | "Rimuovi ordinamento" o "Ordina crescente" |

*/
