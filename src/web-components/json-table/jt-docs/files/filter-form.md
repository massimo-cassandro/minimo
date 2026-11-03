# Form di filtro collegato – `filterForm`

[↰ Indice](../json-table-docs.md)

Il parametro `filterForm` collega alla tabella un form costruito liberamente nella pagina: al submit il form non viene inviato, i suoi valori vengono aggiunti alla query string di `jsonUrl`, il server restituisce un nuovo JSON già filtrato e la tabella viene ridisegnata.

I campi del form sono indipendenti dalle colonne della tabella: possono filtrare su qualsiasi dato che il server sappia gestire (date, stati, categorie, intervalli di importo…). La tabella non interpreta i valori, si limita a inoltrarli: il filtro vero e proprio avviene **sempre lato server** (vedi [Lato server](#lato-server)).

## Utilizzo

Il valore è l'`id` del form; con `init()` si può passare anche l'elemento stesso. Il form può trovarsi in qualsiasi punto della pagina, anche dopo la tabella.

```html
<form id="filtri-clienti">
  <select name="stato">
    <option value="">Tutti</option>
    <option value="attivo">Attivi</option>
    <option value="sospeso">Sospesi</option>
  </select>
  <input type="date" name="dal">
  <input type="date" name="al">
  <label><input type="checkbox" name="zone[]" value="nord"> Nord</label>
  <label><input type="checkbox" name="zone[]" value="sud"> Sud</label>
  <button type="submit">Filtra</button>
  <button type="reset">Azzera</button>
</form>

<json-table
  jsonurl="/clienti-json"
  serverside="true"
  filterform="filtri-clienti"
  cols='[...]'
></json-table>
```

```javascript
jtable.init({
  jsonUrl: '/clienti-json',
  serverSide: true,
  filterForm: 'filtri-clienti', // oppure document.querySelector('#filtri-clienti')
  cols: [...]
});
```

Funziona sia in modalità server-side sia in modalità client-side (vedi [Modalità client-side](#modalità-client-side)). Richiede `jsonUrl`: con `data` inline il parametro viene ignorato con un avviso in console.

## Cosa viene inviato

A ogni richiesta (compresa la prima) i valori del form vengono letti con `FormData` e aggiunti alla query string di `jsonUrl`:

- i campi con valore vuoto (select senza scelta, input vuoti) non vengono inviati: per il server un parametro assente significa "nessun filtro";
- i campi con lo stesso nome (checkbox, `<select multiple>`) vengono inviati come parametri ripetuti; per riceverli come array in PHP il nome deve terminare con `[]` (es. `zone[]`);
- i campi `file` vengono ignorati;
- al submit viene incluso anche il pulsante che ha inviato il form, se ha un attributo `name` (es. `<button name="azione" value="esporta">`);
- un campo del form con lo stesso nome di un parametro già presente in `jsonUrl` lo sostituisce;
- la richiesta è sempre in GET, indipendentemente da `method` e `action` del form, che vengono ignorati.

In modalità server-side vengono aggiunti anche i parametri di paginazione, ordinamento e ricerca (`serverParams`), che **prevalgono** sui campi del form con lo stesso nome: in questo caso viene segnalato un avviso in console. I campi del form non devono quindi usare i nomi di `serverParams` (con i default: `page`, `start`, `perPage`, `sort`, `dir`, `search`, `searchFields`).

Esempio, con il form sopra compilato e la tabella ordinata per nome:

```
GET /clienti-json?stato=attivo&dal=2025-01-01&zone[]=nord&zone[]=sud&page=1&start=0&perPage=25&sort=nome&dir=asc
```

## Comportamento

**Primo caricamento.** La prima richiesta contiene già i valori presenti nel form: filtri precompilati dal server (es. un template Twig con valori di default) o ripristinati dal browser vengono applicati da subito.

**Submit.** L'invio del form viene bloccato (`preventDefault`) e la tabella:

- richiede di nuovo i dati con i nuovi valori;
- torna alla prima pagina;
- **azzera la ricerca** dell'input interno alla tabella, per evitare che un termine rimasto attivo dalla ricerca precedente restringa i nuovi risultati senza che sia evidente;
- **mantiene l'ordinamento** corrente;
- ridisegna corpo, footer, paginazione e testo informativo, senza ricostruire la struttura (niente spinner: durante l'attesa il contenitore ha `aria-busy="true"`).

La validazione nativa del form resta attiva: con campi non validi (`required`, `min`, `pattern`…) l'evento `submit` non viene emesso e la tabella non cambia.

**Reset.** Un `<button type="reset">` (o `form.reset()`) riporta i campi ai valori iniziali e aggiorna la tabella allo stesso modo del submit.

**Richieste sovrapposte.** Se si invia il form più volte prima che arrivi la risposta, viene mostrata solo l'ultima.

**Evento.** Al termine viene emesso `jt:update` con `reason: 'filter'`:

```javascript
jtable.addEventListener('jt:update', e => {
  if (e.detail.reason === 'filter') {
    contatore.textContent = e.detail.jsonTable.state.filteredRec;
  }
});
```

**`reload()` e `destroy()`.** `reload()` ricollega il form (anche con un `filterForm` diverso passato negli `overrides`) e ne rilegge i valori; `destroy()` lo scollega.

## `refresh()`

Il metodo `refresh()` richiede di nuovo i dati con lo stato corrente (pagina, ordinamento, ricerca e valori **già applicati** del form) e ridisegna la tabella senza ricostruirla. È utile per aggiornare i dati dopo una modifica sul server o a intervalli regolari, ed emette `jt:update` con `reason: 'refresh'`. Le modifiche al form non ancora inviate non vengono considerate.

```javascript
await jtable.refresh();
```

## Modalità client-side

Senza `serverSide` il form funziona allo stesso modo: a ogni submit viene richiesto l'intero insieme di dati filtrato (la query string contiene solo `jsonUrl` più i campi del form), mentre ricerca, ordinamento e paginazione restano locali. È la scelta adatta quando i record filtrati sono pochi; per insiemi grandi conviene la modalità server-side.

## Lato server

L'endpoint riceve i campi del form come normali parametri GET, accanto a quelli della tabella. Le indicazioni per Symfony + Doctrine (lettura tipizzata dei valori, campi vuoti, array, effetto su `totRec`, sicurezza) sono nel capitolo [Filtri esterni alla tabella](serverside-api.md#filtri-esterni-alla-tabella-filterform) del backend Symfony.

In sintesi:

- un parametro assente significa "nessun filtro" (i campi vuoti non vengono inviati);
- leggere i valori con i metodi tipizzati e validarli; i valori usati come nomi di campo o di colonna vanno tradotti con una whitelist;
- applicare i filtri **dopo** il conteggio di `totRec` se il "totale generale" non deve risentirne, prima di quello di `filteredRec` in ogni caso;
- in modalità client-side l'endpoint applica solo i filtri del form e restituisce tutte le righe, senza paginazione.

[↰ Indice](../json-table-docs.md)
