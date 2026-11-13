# modal-alert

Dialog modale di alert/conferma basato su `HTMLDialogElement`. Restituisce una `Promise` che si risolve alla chiusura del dialog.

## Utilizzo

```js
import { modalAlert } from '@massimo-cassandro/minimo';

modalAlert({ type: 'success', mes: 'Dati salvati' });

const ok = await modalAlert({ type: 'confirm', mes: 'Eliminare il record?' });
if (ok) { /* … */ }
```

Tipi disponibili: `success`, `error` (alias `danger`), `warning`, `info`, `confirm`.

Valore restituito: per `confirm`, `true`/`false` (OK/Annulla); per gli altri tipi `undefined`. Se il pulsante che chiude il dialog ha un attributo `data-malert-result`, viene restituito il suo valore.

L'elenco completo dei parametri, con i valori di default, è nel JSDoc di `modalAlert` in [modal-alert.js](modal-alert.js).

## Default di progetto – `modalAlert.setDefaults()`

Modifica i default di `modalAlert` per la pagina corrente, così da non doverli ripetere a ogni chiamata (testi dei pulsanti, classi, timer, animazione, ecc.). I nuovi valori vengono usati da tutte le chiamate successive, anche da file e bundle diversi (vedi [Condivisione tra file e bundle](#condivisione-tra-file-e-bundle)).

```js
// file A (ad es. uno script comune caricato in tutte le pagine)
import { modalAlert } from '@massimo-cassandro/minimo';

modalAlert.setDefaults({
  animation: false,                                  // tutti i tipi
  okBtnText: 'Va bene',                              // tutti i tipi
  success: { timer: 2000 },                          // solo success
  confirm: { okBtnText: 'Sì', cancelBtnText: 'No' }  // solo confirm
});

// file B (stessa pagina)
import { modalAlert } from '@massimo-cassandro/minimo';

modalAlert({ type: 'confirm', mes: 'Continuare?' }); // pulsanti 'Sì' / 'No', senza animazione
modalAlert({ type: 'info', mes: 'Fatto' });          // pulsante 'Va bene', senza animazione
modalAlert({ type: 'info', mes: 'Fatto', animation: true }); // il parametro della chiamata vince sempre
```

### Struttura dell'oggetto

- le chiavi `success`, `error`, `warning`, `info`, `confirm` accettano un oggetto di parametri applicato solo a quel tipo; `danger` è un alias di `error`
- tutte le altre chiavi sono parametri di `modalAlert` e valgono per tutti i tipi
- `type` viene ignorato; i vecchi nomi snake_case (`ok_btn_text`, ecc.) sono accettati

### Unione e precedenza

Ogni chiamata a `setDefaults()` si aggiunge alle precedenti (le chiavi non presenti restano invariate). Per ripartire da zero usare `resetDefaults()`.

L'ordine di precedenza, dal più forte al più debole, è:

1. parametri passati a `modalAlert()`
2. default di progetto del tipo (es. `confirm: {…}`)
3. default di progetto generali
4. default predefiniti del tipo
5. default predefiniti generali

Di conseguenza un default di progetto generale prevale anche sui default predefiniti di un tipo: ad esempio `setDefaults({ timer: null })` disattiva anche la chiusura automatica di `success`, che di base ha un timer di 4000 ms.

### Condivisione tra file e bundle

I default di progetto non sono salvati in una variabile del modulo ma su `globalThis`, con una chiave `Symbol.for('@massimo-cassandro/minimo/modal-alert/defaults')`. Sono quindi condivisi da tutto ciò che gira nella pagina, anche quando `modal-alert.js` è incluso più volte, ad esempio:

- più entry webpack nella stessa pagina, ciascuna con il proprio runtime (`runtimeChunk` non impostato a `'single'`)
- bundle prodotti da build diverse (progetti o configurazioni webpack separati)

I default valgono per la sola pagina corrente: non vengono salvati e vanno reimpostati a ogni caricamento. `setDefaults()` va eseguito prima delle chiamate a `modalAlert()` che ne devono tenere conto: se il file A e il file B sono bundle diversi, assicurarsi che A venga eseguito per primo.

Se nella pagina sono presenti versioni diverse di minimo, anche queste condividono gli stessi default.

### Altri metodi

- `modalAlert.resetDefaults()`: cancella tutti i default di progetto
- `modalAlert.getDefaults(type)`: restituisce i default effettivi (predefiniti + di progetto) per un tipo, utile per verifiche e debug

```js
modalAlert.getDefaults('confirm').okBtnText; // → 'Sì'
```

## Personalizzazione CSS

Il CSS usa solo custom properties `--malert-*`, definite in [modal-alert.minimo.tokens.mjs](modal-alert.minimo.tokens.mjs).
