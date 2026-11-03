# Backend Symfony per la modalità server-side

[↰ Indice](../json-table-docs.md)

Linee guida per costruire, in Symfony + Doctrine, l'endpoint JSON di una `<json-table>` con
`serverSide: true`. Il protocollo (parametri inviati e formato della risposta) è descritto in
[Modalità server-side](server-side.md) e [Ricerca e ordinamento](ricerca-ordinamento.md); qui si
assumono i nomi di default di `serverParams` e dei campi di risposta.

## Il contratto in breve

Richiesta (GET, tutti i parametri sono facoltativi):

| Parametro | Contenuto |
|---|---|
| `page` | pagina richiesta, da 1 |
| `start` | indice del primo record, da 0 (`(page - 1) * perPage`) |
| `perPage` | record per pagina |
| `sort` | chiavi di ordinamento separate da virgola (`key` delle colonne o loro `sortKeys`) |
| `dir` | `asc`/`desc` separati da virgola, uno per ogni chiave di `sort` |
| `search` | termine di ricerca |
| `searchFields` | campi su cui cercare, separati da virgola |
| altri | campi del form di filtro (`filterForm`) e parametri già presenti in `jsonUrl`, vedi [Filtri esterni alla tabella](#filtri-esterni-alla-tabella-filterform) |

Risposta:

```json
{ "data": [ ...righe della pagina... ], "totRec": 1500, "filteredRec": 40 }
```

## Struttura dell'azione

Le fasi sono sempre le stesse, nell'ordine:

1. **controllo accessi**
2. **query base** – condizioni sempre valide (record non cancellati, visibilità per l'utente…)
3. **`totRec`** – conteggio della query base
4. **filtri di pagina** – campi del form collegato con `filterForm` e parametri aggiuntivi di `jsonUrl`
5. **ricerca** – `search` + `searchFields`
6. **`filteredRec`** – conteggio dopo filtri e ricerca
7. **select** – solo i campi necessari, più eventuali campi `HIDDEN` per l'ordinamento
8. **ordinamento** – `sort` + `dir`, con chiave finale univoca
9. **paginazione** – `start` + `perPage`, con un massimo
10. **dati collegati** (relazioni *to-many*) caricati a parte per gli id della pagina
11. **normalizzazione** delle righe e `JsonResponse`

```php
#[Route(path: '/clienti-json', name: 'clienti_elenco_json', methods: ['GET'])]
public function elencoJson(Request $request, JsonTableHelper $jt): JsonResponse
{
  $this->denyAccessUnlessGranted('ROLE_CLIENTI');

  $qb = $this->em->getRepository(Cliente::class)
    ->createQueryBuilder('c')
    ->leftJoin('c.comune', 'com')
    ->andWhere('c.cancellato = 0');

  $totRec = $jt->count($qb, 'c.id');

  $this->applyFilters($qb, $request);

  $jt->applySearch($qb, $request, [
    'codice'                         => 'c.codice',
    'clienti.cognome'                => 'c.cognome',
    'clienti.nome'                   => 'c.nome',
    'clienti.denominazione_sociale'  => 'c.denominazioneSociale',
    'comuni.nome'                    => 'com.nome',
  ]);

  $filteredRec = $jt->count($qb, 'c.id');

  $qb
    ->select('c.id, c.codice, c.personaGiuridica, com.nome AS comune')
    ->addSelect("CASE WHEN c.personaGiuridica = 1 THEN c.denominazioneSociale
                 ELSE TRIM(CONCAT(COALESCE(c.cognome, ''), ' ', COALESCE(c.nome, ''))) END AS nominativo")
    ->addSelect("CASE WHEN c.personaGiuridica = 1 THEN c.denominazioneSociale
                 ELSE c.cognome END AS HIDDEN nominativoSort");

  $jt->applySort($qb, $request, [
    'codice'     => ['c.codice'],
    'nominativo' => ['nominativoSort', 'c.nome'],
    'comune'     => ['com.nome'],
  ], tieBreaker: 'c.id', default: ['nominativoSort' => 'ASC']);

  $rows = $jt->paginate($qb, $request)->getQuery()->getArrayResult();

  return new JsonResponse([
    'totRec'      => $totRec,
    'filteredRec' => $filteredRec,
    'data'        => array_map($this->normalizeRow(...), $rows),
  ]);
}
```

## Linee guida

### Sicurezza

- **Whitelist obbligatoria** per `sort` e `searchFields`: arrivano dal client e i nomi di campo
  non possono essere parametri di un prepared statement, quindi finirebbero direttamente nel
  DQL/SQL. Ogni chiave va tradotta tramite una mappa `chiave client → espressione DQL`; le chiavi
  sconosciute vengono ignorate, mai usate così come sono. Escludere dalla mappa i campi riservati:
  anche senza mostrarli, `filteredRec` permetterebbe di dedurne il contenuto per tentativi.
- **Valori sempre come parametri** (`setParameter`), compreso il termine di ricerca.
- **Escape dei caratteri jolly di `LIKE`**: `addcslashes($term, '%_\\')`, altrimenti `%` o `_`
  nel termine diventano jolly.
- **`dir` normalizzato**: solo `ASC` o `DESC`, qualsiasi altro valore diventa `ASC`.
- **`perPage` limitato** (es. `min($perPage, 500)`): un client può chiedere qualsiasi valore.
- **Controllo accessi con risposta JSON**: il componente si aspetta JSON; un redirect alla pagina
  di login o alla dashboard produce un errore di parsing poco chiaro. Usare
  `denyAccessUnlessGranted()` / `#[IsGranted]` (403) oppure restituire una `JsonResponse` con
  lo status appropriato.

### Conteggi

- `totRec` si calcola sulla query base **prima** di filtri e ricerca, `filteredRec` **dopo**, in
  entrambi i casi **prima** di select, ordinamento e paginazione.
- Usare un clone del QueryBuilder con `select('COUNT(...)')` e `getSingleScalarResult()`; azzerare
  l'eventuale `orderBy` (`resetDQLPart('orderBy')`), inutile e talvolta non valido in un `COUNT`.
- Con join verso relazioni *to-many* nella query principale usare `COUNT(DISTINCT x.id)`; meglio
  ancora evitare questi join (vedi [Relazioni to-many](#relazioni-to-many)).
- Se i filtri di pagina non devono incidere su `totRec` (il "totale generale" mostrato nell'info),
  applicarli dopo il primo conteggio, come nello schema sopra; altrimenti includerli nella query base.

### Ricerca

- Per ottenere lo stesso comportamento della modalità client-side, **dividere il termine in
  parole** (separatore: spazi) e richiedere che **ogni parola** compaia in **almeno uno** dei
  campi: `AND` tra le parole, `OR` tra i campi. Un unico `LIKE '%mario rossi%'` non trova nulla
  se nome e cognome sono in campi diversi.
- Un parametro distinto per ogni parola (`:jt_s0`, `:jt_s1`, …).
- `searchFields` vuoto o senza chiavi valide: cercare su un insieme di campi di default (in genere
  tutti quelli della mappa), non restituire zero righe.
- Le chiavi della mappa sono quelle inviate dal client (`key` delle colonne, `searchKeys`,
  `searchFields`): conviene usare nomi `tabella.campo` per i campi presenti in più entità e
  tenere la mappa unica per l'intera query, lasciando al client la scelta dei campi.
- Le espressioni calcolate (`CONCAT`, `CASE`…) non possono essere usate tramite il loro alias nel
  `WHERE`: nella mappa va messa l'espressione completa, oppure i singoli campi che la compongono.
- Campi data/numerici: `LIKE` su una data funziona in MySQL (cast implicito, formato
  `YYYY-MM-DD`) ma non è portabile; se la ricerca di date in formato locale è importante, conviene
  convertire il termine o usare `DATE_FORMAT` (estensioni DQL come `beberlei/doctrineextensions`).
- Condizioni su relazioni *to-many* (es. "trattative con almeno un preventivo che contiene la
  parola"): `EXISTS (SELECT … WHERE sub.parent = t AND (…))`. Gli alias delle subquery devono
  essere unici in tutto il DQL: se ricerca, filtri e ordinamento usano subquery sulla stessa
  entità, usare alias diversi in ciascuna.

### Ordinamento

- `sort` e `dir` sono **liste parallele**: la chiave *i* usa la direzione *i*; se `dir` ha meno
  elementi, usare l'ultima direzione disponibile (o `ASC`). Con `sortKeys` il client ripete già la
  direzione per ogni chiave.
- Ogni chiave della mappa può corrispondere a **più espressioni** (es. `['i.cognome', 'i.nome']`),
  ordinate nella stessa direzione.
- **Valori calcolati o condizionali** (es. denominazione sociale per le persone giuridiche,
  cognome per le persone fisiche): selezionarli come `… AS HIDDEN aliasSort` e ordinare per
  l'alias. Doctrine accetta in `ORDER BY` gli alias della select, non le espressioni.
- **Chiave finale univoca** (in genere l'id, nella stessa direzione dell'ultimo criterio), sempre:
  senza, a parità di valore l'ordine non è garantito e la paginazione può ripetere o saltare righe.
- **Ordinamento di default** lato server quando `sort` è assente o non valido, coerente con
  l'`initialSort` della tabella (che però, se impostato, viene comunque inviato).
- Ordinamento per un campo di una relazione *to-many* (es. una colonna di un subarray): una
  subquery `MIN()`/`MAX()` (in base alla direzione) selezionata come `HIDDEN`.

### Paginazione

- Usare `start` (`setFirstResult`) e `perPage` (`setMaxResults`); `page` è ridondante e può essere
  omesso con `serverParams: { page: null }`.
- `perPage` ≤ 0 o assente: applicare un default, non restituire l'intera tabella.
- Pagina oltre l'ultima: restituire semplicemente `data` vuoto con i conteggi corretti; il
  componente richiede da sé l'ultima pagina disponibile.
- `setFirstResult`/`setMaxResults` con join *fetch* verso relazioni *to-many* limitano le righe SQL,
  non le entità: in quel caso serve il `Paginator` di Doctrine, oppure (preferibile) l'approccio
  descritto sotto.

### Relazioni to-many

Quando ogni riga contiene un sotto-array (es. i preventivi di una trattativa), non includere la
relazione in join nella query principale: duplicherebbe le righe, falserebbe conteggi e
paginazione. Procedere invece in due passi:

1. query principale paginata, solo sull'entità radice e sulle relazioni *to-one*;
2. una seconda query per i soli id della pagina (`WHERE sub.parent IN (:ids)`), raggruppata in PHP
   per id del padre e aggiunta alle righe.

Filtri e ricerca sui figli si esprimono con `EXISTS`; i filtri sui figli selezionano i padri ma
non riducono il sotto-array (a meno che non sia esplicitamente richiesto).

### Formato dei dati

- Preferire `select` di campi scalari + `getArrayResult()` all'idratazione di entità: più veloce e
  senza rischi di serializzare relazioni o campi riservati.
- Normalizzare le righe prima della risposta: date in ISO (`format('Y-m-d')` o
  `DATE_ATOM`), booleani come `true`/`false`, oggetti annidati se le colonne usano chiavi con il
  punto (`cliente.id`, `cliente.nome`).
- I nomi delle proprietà del JSON sono le `key` delle colonne: mantenerli stabili e, dove possibile,
  identici alle chiavi delle mappe di ricerca e ordinamento, così le nuove colonne funzionano senza
  modifiche lato client.
- Restituire solo i campi effettivamente usati dalla tabella (render, link, condizioni).

### Filtri esterni alla tabella (`filterForm`)

Un form di filtro costruito liberamente nella pagina si collega alla tabella con il parametro `filterForm` (vedi [Form di filtro collegato](filter-form.md)): a ogni richiesta i suoi campi non vuoti vengono aggiunti alla query string, accanto ai parametri di paginazione, ordinamento e ricerca. Per il server sono normali parametri GET, non previsti dal protocollo della tabella: è l'azione a decidere come interpretarli.

Esempio di richiesta, con un form che contiene `stato`, `dal`, `al` e le checkbox `zone[]`:

```
GET /clienti-json?stato=attivo&dal=2025-01-01&zone[]=nord&zone[]=sud&page=1&start=0&perPage=25&sort=nome&dir=asc
```

Il metodo `applyFilters()` richiamato nell'azione di esempio:

```php
private function applyFilters(QueryBuilder $qb, Request $request): void
{
  $q = $request->query;

  // valore singolo da un elenco chiuso
  $stato = $q->getString('stato');
  if (in_array($stato, ['attivo', 'sospeso'], true)) {
    $qb->andWhere('c.stato = :f_stato')->setParameter('f_stato', $stato);
  }

  // date: validare il formato prima di usarle
  $dal = \DateTimeImmutable::createFromFormat('!Y-m-d', $q->getString('dal'));
  if ($dal) {
    $qb->andWhere('c.dataCreazione >= :f_dal')->setParameter('f_dal', $dal);
  }
  $al = \DateTimeImmutable::createFromFormat('!Y-m-d', $q->getString('al'));
  if ($al) {
    $qb->andWhere('c.dataCreazione < :f_al')->setParameter('f_al', $al->modify('+1 day'));
  }

  // checkbox / select multiple (`zone[]`): array, filtrato con una whitelist
  $zone = array_intersect($q->all('zone'), ['nord', 'centro', 'sud']);
  if ($zone) {
    $qb->andWhere('c.zona IN (:f_zone)')->setParameter('f_zone', $zone);
  }

  // booleano facoltativo: assente = nessun filtro, '0' = false
  if ($q->has('privato')) {
    $qb->andWhere('c.personaGiuridica = :f_pg')->setParameter('f_pg', !$q->getBoolean('privato'));
  }
}
```

Linee guida:

- **parametro assente = nessun filtro**: il componente non invia i campi vuoti, quindi `has()` distingue "nessuna scelta" da `0`/`false` quando questi sono valori validi;
- leggere i valori con i metodi tipizzati (`getString()`, `getInt()`, `getBoolean()`) e validarli; un valore non valido va ignorato, non deve produrre un errore 500;
- i campi multipli arrivano come array solo se il nome termina con `[]`: leggerli con `$request->query->all('nome')` (senza `[]`); senza le parentesi PHP conserva solo l'ultimo valore;
- valori sempre come parametri (`setParameter`); i valori che diventano **nomi** di campo o di colonna (es. un select "cerca in…") vanno tradotti con una whitelist, come `sort` e `searchFields`;
- nomi dei parametri con un prefisso (es. `f_`) per non collidere con quelli della query (ricerca `jt_s0`…, eventuali subquery);
- **conteggi**: applicare i filtri dopo il calcolo di `totRec` se l'info deve mostrare il totale generale (come nello schema sopra), prima se `totRec` deve essere il totale dell'insieme filtrato; in ogni caso prima di `filteredRec`;
- i campi del form non devono usare i nomi di `serverParams` (`page`, `start`, `perPage`, `sort`, `dir`, `search`, `searchFields` con i default): la tabella li sovrascriverebbe;
- il pulsante che ha inviato il form viene incluso se ha un `name` (es. `azione=esporta`): l'endpoint deve comunque rispondere con il JSON della tabella, per un'esportazione usare un'azione separata.

**Tabelle client-side.** Con `filterForm` senza `serverSide` l'endpoint riceve solo i campi del form: applica i filtri e restituisce **tutte** le righe corrispondenti (nessuna paginazione, ricerca o ordinamento lato server), con `totRec` facoltativo.

## Helper riutilizzabile

Un servizio che raccoglie le parti generiche; le mappe restano nel controller (o nel repository),
perché dipendono dalla query.

```php
<?php

namespace App\Service;

use Doctrine\ORM\QueryBuilder;
use Symfony\Component\HttpFoundation\Request;

/**
 * Supporto per gli endpoint server-side di <json-table>
 * (parametri con i nomi di default di `serverParams`)
 */
final class JsonTableHelper
{
  public function __construct(
    private int $defaultPerPage = 50,
    private int $maxPerPage = 500,
  ) {}

  public function count(QueryBuilder $qb, string $idField, bool $distinct = false): int
  {
    return (int) (clone $qb)
      ->select(sprintf('COUNT(%s%s)', $distinct ? 'DISTINCT ' : '', $idField))
      ->resetDQLPart('orderBy')
      ->getQuery()
      ->getSingleScalarResult();
  }

  /**
   * Ogni parola di `search` deve comparire in almeno uno dei campi di `searchFields`
   * presenti in `$map` (chiave client => espressione DQL); senza campi validi usa tutta la mappa
   * @param array<string, string> $map
   */
  public function applySearch(QueryBuilder $qb, Request $request, array $map): void
  {
    $words = preg_split('/\s+/u', trim((string) $request->query->get('search', '')), -1, PREG_SPLIT_NO_EMPTY);
    if (!$words) {
      return;
    }

    $requested = array_flip(array_filter(explode(',', (string) $request->query->get('searchFields', ''))));
    $fields = array_intersect_key($map, $requested) ?: $map;

    foreach ($words as $i => $word) {
      $param = 'jt_s' . $i;
      $qb
        ->andWhere(implode(' OR ', array_map(fn (string $f) => "$f LIKE :$param", $fields)))
        ->setParameter($param, '%' . addcslashes($word, '%_\\') . '%');
    }
  }

  /**
   * `sort` e `dir` sono liste parallele; ogni chiave di `$map` corrisponde a una o più
   * espressioni DQL (o alias HIDDEN). `$tieBreaker` rende stabile la paginazione
   * @param array<string, string[]> $map
   * @param array<string, 'ASC'|'DESC'> $default  ordinamento senza chiavi valide
   */
  public function applySort(QueryBuilder $qb, Request $request, array $map, string $tieBreaker, array $default = []): void
  {
    $keys = array_filter(explode(',', (string) $request->query->get('sort', '')));
    $dirs = array_map(
      fn (string $d) => strtolower(trim($d)) === 'desc' ? 'DESC' : 'ASC',
      explode(',', (string) $request->query->get('dir', ''))
    );

    $lastDir = 'ASC';
    $applied = false;
    foreach ($keys as $i => $key) {
      $lastDir = $dirs[$i] ?? $lastDir;
      foreach ($map[$key] ?? [] as $expr) {
        $qb->addOrderBy($expr, $lastDir);
        $applied = true;
      }
    }

    if (!$applied) {
      foreach ($default as $expr => $dir) {
        $qb->addOrderBy($expr, $dir);
        $lastDir = $dir;
      }
    }

    $qb->addOrderBy($tieBreaker, $lastDir);
  }

  public function paginate(QueryBuilder $qb, Request $request): QueryBuilder
  {
    $perPage = $request->query->getInt('perPage', $this->defaultPerPage);

    return $qb
      ->setFirstResult(max(0, $request->query->getInt('start', 0)))
      ->setMaxResults($perPage > 0 ? min($perPage, $this->maxPerPage) : $this->defaultPerPage);
  }
}
```

Se il progetto usa nomi diversi per i parametri (`serverParams`) o la
[modalità jQuery DataTables](server-side.md#modalità-jquery-datatables), adattare la lettura dei
parametri nell'helper, lasciando invariato il resto.

## Checklist

- [ ] accesso negato → risposta JSON con status 401/403, non redirect
- [ ] `sort` e `searchFields` filtrati con una whitelist; nessun nome di campo dal client nel DQL
- [ ] termine di ricerca diviso in parole, con escape di `%` e `_`, passato come parametro
- [ ] `totRec` prima di filtri e ricerca, `filteredRec` dopo; nessun `ORDER BY` nei conteggi
- [ ] `sort`/`dir` letti come liste parallele; valori calcolati come `HIDDEN`; chiave finale univoca
- [ ] `perPage` con default e massimo
- [ ] nessun join *to-many* nella query paginata; sotto-array caricati per gli id della pagina
- [ ] righe normalizzate (date ISO, booleani, oggetti annidati) con le `key` delle colonne
- [ ] filtri di pagina (`filterForm`): parametro assente = nessun filtro, valori tipizzati e validati, campi multipli con `[]`, nomi che non collidono con `serverParams`

[↰ Indice](../json-table-docs.md)
