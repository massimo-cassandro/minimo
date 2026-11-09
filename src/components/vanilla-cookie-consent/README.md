# vanilla-cookie-consent

Banner e modal di consenso ai cookie basati su [vanilla-cookieconsent](https://cookieconsent.orestbida.com/) v3, con testi in italiano, stile collegato ai token di minimo e moduli opzionali (Google reCAPTCHA v3, Google Analytics 4) caricati solo dopo il consenso.

## Installazione

Il componente richiede la peer dependency opzionale `vanilla-cookieconsent`:

```bash
npm i vanilla-cookieconsent
```

Il CSS della libreria viene importato da `cookie-consent.css` (a sua volta importato da `cookie-consent.js`): serve una configurazione webpack in grado di risolvere gli `@import` da `node_modules` (come quella dello starter-kit di minimo).

## Configurazione

Copiare `cookie-consent.config.sample.mjs` nel progetto (es. `src/cookie-consent.config.mjs`) e compilarlo. Tutte le proprietà sono facoltative:

| Proprietà | Descrizione |
|---|---|
| `privacyPolicyUrl` | URL della pagina Privacy e Cookie Policy, linkata nei modal (default: `/privacy-policy`) |
| `modules` | Moduli opzionali, attivi solo con `enabled: true` (vedi sotto) |
| `cookies` | Cookie impostati dal sito, per categoria (`necessary`, `functionality`, `analytics`). `cc_cookie` è sempre aggiunto tra i necessari |
| `categories` | Titoli e descrizioni delle categorie, sovrascrivono quelli di default |
| `guiOptions` | [Opzioni grafiche](https://cookieconsent.orestbida.com/reference/configuration-reference.html#guioptions) di vanilla-cookieconsent, unite a quelle di default |
| `onConsent`, `onChange` | Callback aggiuntivi di vanilla-cookieconsent |

Le categorie `functionality` e `analytics` compaiono solo se contengono cookie (del sito o dei moduli attivi). Nessuna categoria non necessaria è preselezionata.

Ogni riga di `cookies` ha la forma:

```js
{ name: 'PHPSESSID', domain: 'Questo sito', description: 'Sessione corrente', expiration: 'sessione' }
```

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

Ogni modulo attivo viene registrato come servizio di vanilla-cookieconsent nella propria categoria: l'utente può abilitarlo o disabilitarlo singolarmente dal modal delle preferenze. I cookie del modulo vengono aggiunti automaticamente all'elenco della categoria.

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

## Elenco dei cookie nella pagina privacy

`renderCookieList()` genera l'elenco dei cookie a partire dalla stessa configurazione, così che coincida con quello del modal:

```js
import { renderCookieList } from '@massimo-cassandro/minimo/vanilla-cookie-consent';
import config from './cookie-consent.config.mjs';

renderCookieList(document.getElementById('cookie-list'), config);
```

L'elenco è una `<ul>` annidata; i titoli delle categorie hanno la classe `cookie-list-section`.

## Scanner di cookie

Per non disturbare i crawler il banner non viene mostrato ai bot. Aggiungendo `?cc-list-parser` all'URL il banner viene mostrato comunque, ad esempio per gli scanner automatici dei cookie.

## Stile

Il CSS usa le custom properties `--vcc-*`, generate da `vanilla-cookie-consent.minimo.tokens.mjs` a partire dai token di minimo (colori dei pulsanti, testo, sfondo, raggi, font), e le assegna alle variabili native della libreria (`--cc-bg`, `--cc-btn-primary-bg`, ecc.) su `#cc-main`.

Per personalizzare lo stile si possono modificare i token o ridefinire le `--vcc-*` nel CSS del progetto. La dark mode segue quella dei token di minimo: la classe `.cc--darkmode` della libreria non ha effetto.
