# vanilla-cookie-consent

Banner e modal di consenso ai cookie basati su [vanilla-cookieconsent](https://cookieconsent.orestbida.com/) v3, con testi in italiano, stile collegato ai token di minimo e moduli opzionali (Google reCAPTCHA v3, Google Analytics 4, Google Maps) e servizi personalizzati attivati solo dopo il consenso.

## Installazione

Il componente richiede la peer dependency opzionale `vanilla-cookieconsent`:

```bash
npm i vanilla-cookieconsent
```

Il CSS della libreria viene importato da `cookie-consent.css` (a sua volta importato da `cookie-consent.js`): serve una configurazione webpack in grado di risolvere gli `@import` da `node_modules` (come quella dello starter-kit di minimo).

Con PurgeCSS le classi del banner, generate dal js della libreria, verrebbero rimosse: aggiungere `/^cc-main$/` e `/^show--consent$/` al safelist `greedy` (già presenti nel `webpack.config-tpl.mjs` dello starter-kit). I commenti `purgecss start/end ignore` di `cookie-consent.css` proteggono solo le regole del file stesso: css-loader tratta l'`@import` della libreria come modulo separato.

## Configurazione

Copiare `cookie-consent.config.sample.mjs` nel progetto (es. `src/cookie-consent.config.mjs`) e compilarlo. Tutte le proprietà sono facoltative:

| Proprietà | Descrizione |
|---|---|
| `privacyPolicyUrl` | URL della pagina Privacy e Cookie Policy, linkata nei modal (default: `/privacy-policy`) |
| `modules` | Moduli opzionali, attivi solo con `enabled: true` (vedi [Moduli](#moduli)) |
| `services` | Servizi personalizzati, per nome (vedi [Servizi personalizzati](#servizi-personalizzati)) |
| `cookies` | Righe dell'elenco impostate dal sito (cookie, localStorage, sessionStorage, servizi di terzi), per categoria (`necessary`, `functionality`, `analytics`). `cc_cookie` è sempre aggiunto tra i necessari |
| `categories` | Opzioni delle categorie: `title`, `description`, `show`, `reloadOnRevoke` (vedi sotto) |
| `cookieTableHeaders` | Intestazioni della tabella: `name`, `type`, `domain`, `description`, `expiration`; sovrascrivono quelle di default |
| `guiOptions` | [Opzioni grafiche](https://cookieconsent.orestbida.com/reference/configuration-reference.html#guioptions) di vanilla-cookieconsent, unite a quelle di default |
| `onConsent`, `onChange` | Callback aggiuntivi di vanilla-cookieconsent |

Nessuna categoria non necessaria è preselezionata.

### Categorie

| Opzione | Descrizione |
|---|---|
| `title`, `description` | Testi della categoria, sovrascrivono quelli di default |
| `show` | Mostra la categoria anche senza righe né servizi (default: `false`) |
| `reloadOnRevoke` | Ricarica la pagina quando l'utente revoca il consenso alla categoria (default: `false`) |

Le categorie `functionality` e `analytics` compaiono se hanno righe nell'elenco o servizi attivi (moduli o servizi personalizzati), oppure con `show: true`.

`reloadOnRevoke` attiva `autoClear.reloadPage` di vanilla-cookieconsent: uno script di terzi già caricato, come Google Maps, non si può scaricare, e ricaricare la pagina è l'unico modo per rispettare la revoca.

### Righe dell'elenco

Ogni riga di `cookies` (e di `services.*.cookies`) ha la forma:

```js
{ name: 'PHPSESSID', domain: 'Questo sito', description: 'Sessione corrente', expiration: 'sessione' }
```

`expiration` è facoltativo. Il campo facoltativo `type` (`cookie`, `localStorage`, `sessionStorage`, `servizio di terzi`) permette di elencare anche strumenti di memorizzazione diversi dai cookie e servizi esterni:

```js
{ name: 'theme-preference', type: 'localStorage', domain: 'Questo sito', description: 'Tema scelto dall’utente', expiration: 'fino alla cancellazione' }
```

Se almeno una riga indica `type`, nella tabella compare la colonna "Tipo" (le righe senza `type` sono indicate come `cookie`) e la prima colonna si intitola "Nome" invece di "Cookie". Per mostrare sempre la colonna basta indicarne l'intestazione in `cookieTableHeaders.type`.

## Avvio

```js
import { initCookieConsent } from '@massimo-cassandro/minimo/vanilla-cookie-consent';
import config from './cookie-consent.config.mjs';

initCookieConsent(config);
```

`initCookieConsent()` restituisce (tramite Promise) l'API di vanilla-cookieconsent, utile ad esempio per riaprire le preferenze:

```js
const cc = await initCookieConsent(config);
document.querySelector('.cookie-settings-btn').addEventListener('click', () => cc.showPreferences());
```

In alternativa, la libreria gestisce in automatico qualsiasi elemento con l'attributo `data-cc`:

```html
<button type="button" data-cc="show-preferencesModal">Preferenze cookie</button>
```

## Moduli

Ogni modulo attivo viene registrato come servizio di vanilla-cookieconsent nella propria categoria: l'utente può abilitarlo o disabilitarlo singolarmente dal modal delle preferenze. Le righe del modulo vengono aggiunte automaticamente all'elenco della categoria.

### reCAPTCHA (`modules.recaptcha`)

| Opzione | Descrizione |
|---|---|
| `enabled` | Attiva il modulo (default: `false`) |
| `siteKey` | Chiave pubblica reCAPTCHA v3, obbligatoria |
| `category` | Categoria di appartenenza (default: `functionality`) |
| `formWrapperSelector` | Elementi da disabilitare in assenza di consenso (default: `.recaptcha-form-wrapper`) |
| `disabledClass` | Classe aggiunta a quegli elementi (default: `disabled`) |
| `description` | Descrizione del cookie `_GRECAPTCHA` nell'elenco |

All'avvio gli elementi di `formWrapperSelector` ricevono `disabledClass`, che viene rimossa quando, dopo il consenso, lo script reCAPTCHA è caricato. Lo stile dello stato disabilitato è a cura del progetto.

Al submit del form si ottiene il token con `loadRecaptchaAsync`:

```js
import { loadRecaptchaAsync } from '@massimo-cassandro/minimo/vanilla-cookie-consent';

loadRecaptchaAsync(siteKey, () => {
  window.grecaptcha.execute(siteKey, { action: 'submit' }).then(token => {
    // inviare il token insieme ai dati del form
  });
});
```

Il cookie `_GRECAPTCHA` è impostato sul dominio google.com: alla revoca del consenso lo script viene rimosso, ma il cookie non può essere eliminato dal sito.

### Analytics (`modules.analytics`)

| Opzione | Descrizione |
|---|---|
| `enabled` | Attiva il modulo (default: `false`) |
| `measurementId` | ID di misurazione GA4 (es. `G-XXXXXXXXXX`), obbligatorio |
| `category` | Categoria di appartenenza (default: `analytics`) |

Dopo il consenso viene caricato `gtag.js` e definito `window.gtag`, utilizzabile per inviare eventi. Alla revoca del consenso i cookie `_ga*` vengono eliminati e il tracciamento viene disattivato con l'opt-out ufficiale di GA4.

### Google Maps (`modules.googleMaps`)

| Opzione | Descrizione |
|---|---|
| `enabled` | Attiva il modulo (default: `false`) |
| `category` | Categoria di appartenenza (default: `functionality`) |
| `label` | Etichetta del servizio nel modal (default: `Google Maps`) |
| `description` | Descrizione nell'elenco (default: testo generico) |
| `onAccept`, `onReject` | Callback al consenso e alla revoca |

Il modulo non carica nulla: dichiara il servizio, aggiunge una riga di tipo `servizio di terzi` e lascia al progetto il caricamento della mappa (ad esempio con [`onCategoryAccepted()`](#helper-per-il-progetto)). Conviene abbinarlo a `categories.functionality.reloadOnRevoke: true`.

## Servizi personalizzati

Con `services` si dichiarano servizi propri del progetto, registrati come servizi di vanilla-cookieconsent nella categoria indicata, con le righe aggiunte all'elenco della categoria (come per i moduli):

```js
services: {
  youtube: {
    category: 'functionality', // functionality (default) o analytics
    label: 'Video YouTube', // default: nome del servizio
    cookies: [
      { name: 'YouTube', type: 'servizio di terzi', domain: 'youtube.com', description: 'Riproduzione dei video incorporati' },
    ],
    autoClearCookies: [{ name: /^yt_/ }], // cookie da eliminare alla revoca, facoltativo
    onAccept: () => { /* attivare i video */ },
    onReject: () => { /* … */ },
  },
},
```

Tutte le proprietà sono facoltative; con `enabled: false` il servizio viene ignorato. `onReject` viene eseguito solo se il consenso era stato dato in precedenza.

## Helper per il progetto

Le funzioni seguenti evitano di importare direttamente vanilla-cookieconsent:

```js
import { isAccepted, acceptCategoryKeepingOthers, onCategoryAccepted } from '@massimo-cassandro/minimo/vanilla-cookie-consent';
```

`isAccepted(category)` indica se la categoria è stata accettata (wrapper di `acceptedCategory`).

`acceptCategoryKeepingOthers(category)` accetta una categoria lasciando invariate le scelte sulle altre, compresi i singoli servizi; se il banner è aperto viene chiuso. È pensata per i pulsanti "Attiva la mappa" / "Attiva il video" mostrati al posto dei contenuti bloccati:

```js
placeholder.querySelector('button').addEventListener('click', () => acceptCategoryKeepingOthers('functionality'));
```

`onCategoryAccepted(category, callback)` esegue `callback` una sola volta quando la categoria risulta accettata: subito, se il consenso è già stato dato, oppure quando arriva. Restituisce una funzione che annulla l'attesa. È utile ai moduli caricati in modo differito (es. una mappa caricata solo quando la sezione entra nel viewport), indipendentemente dal fatto che vengano avviati prima o dopo `initCookieConsent()`:

```js
onCategoryAccepted('functionality', () => loadMap(mapElement));
```

Per gestioni più specifiche, vanilla-cookieconsent emette su `window` gli eventi `cc:onConsent` (a ogni caricamento di pagina con consenso valido, e alla prima scelta) e `cc:onChange` (a ogni modifica delle preferenze), con i dati del consenso in `event.detail`.

## Elenco dei cookie nella pagina privacy

`getCookieList()` restituisce l'elenco dei cookie a partire dalla stessa configurazione, così che coincida con quello del modal. Restituisce solo i dati, diviso per categoria: il markup (titoli, liste, tabelle) è a cura del progetto.

```js
import { getCookieList } from '@massimo-cassandro/minimo/vanilla-cookie-consent';
import config from './cookie-consent.config.mjs';

getCookieList(config);
// [
//   {
//     key: 'necessary',
//     section: 'Cookie strettamente necessari',
//     description: 'I cookie necessari sono indispensabili…',
//     cookies: [
//       { name: 'cc_cookie', type: 'cookie', domain: 'Questo sito', description: 'Registra la tua scelta sui cookie', expiration: '6 mesi' },
//       …
//     ]
//   },
//   …
// ]
```

- categorie nello stesso ordine e con gli stessi titoli e descrizioni del modal preferenze; compaiono solo quelle mostrate anche nel modal;
- nelle righe tutti i campi sono valorizzati: `type` vale `'cookie'` se non indicato, `expiration` una stringa vuota;
- `description` può contenere `<br>` (il modal interpreta l'HTML): sostituirlo o usare `innerHTML` a seconda del markup;
- gli oggetti restituiti sono copie: si possono modificare senza effetti sul modal.

Sostituisce `renderCookieList()` (fino alla v1.63.2), che generava una `<ul>` annidata.

## Scanner di cookie e test automatici

Per non disturbare i crawler il banner non viene mostrato ai bot. Aggiungendo `?cc-list-parser` all'URL il banner viene mostrato comunque, ad esempio per gli scanner automatici dei cookie.

Lo stesso vale per i test automatici: il rilevamento dei bot di vanilla-cookieconsent considera anche i browser automatizzati (`navigator.webdriver`, es. Chrome con Playwright o Puppeteer), quindi senza `?cc-list-parser` il banner non compare e la libreria si interrompe senza leggere neppure il consenso salvato (servizi e `onCategoryAccepted()` non scattano). Nei test va quindi aggiunto `?cc-list-parser` all'URL.

## Stile

Il CSS usa le custom properties `--vcc-*`, generate da `vanilla-cookie-consent.minimo.tokens.mjs` a partire dai token di minimo (colori dei pulsanti, testo, sfondo, raggi, font), e le assegna alle variabili native della libreria (`--cc-bg`, `--cc-btn-primary-bg`, ecc.) su `#cc-main`.

Per personalizzare lo stile si possono modificare i token o ridefinire le `--vcc-*` nel CSS del progetto. La dark mode segue quella dei token di minimo: la classe `.cc--darkmode` della libreria non ha effetto.
