# Create favicons

Crea i file favicon come descritto in [How to Favicon in 2024](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs).

Il file sorgente può essere SVG o un formato raster (PNG, JPEG, WEBP, GIF, TIFF, AVIF). I file generati sono PNG (apple-touch-icon e altri file Android) e ICO (un'altra favicon per la compatibilità con i browser più vecchi); viene generata anche una favicon SVG, ma solo quando il file sorgente è a sua volta SVG (da una sorgente raster non si può ricavare una favicon vettoriale). Vengono generati anche i file `manifest.webmanifest`, insieme a uno snippet HTML opzionale con i tag `link` per inserire gli elementi generati (lo snippet omette il tag `link` SVG quando non è stata generata alcuna favicon SVG).

Le immagini vengono generate con [Sharp](https://sharp.pixelplumbing.com/), [SVGO](https://github.com/svg/svgo), and [sharp-ico](https://github.com/ssnangua/sharp-ico).

## Installazione

```bash
npm i -D @massimo-cassandro/create-favicons
```

## Creazione dei file di configurazione di esempio (vedi sotto)

```bash
npx create-favicons init
```

## Utilizzo

```bash
npx create-favicons [--dir=./path/to/dir]
```

Lo script viene normalmente eseguito nella directory corrente, ma con il parametro opzionale `--dir`
si può indicare una directory alternativa (percorso relativo alla directory di esecuzione).

Lo script cerca prima nella directory di lavoro il file `create-favicons-cfg.mjs`, che contiene un oggetto
con tutti i parametri necessari (vedi sotto).

Se manca, cerca il file `favicon-src.svg` da usare come sorgente per tutte le immagini, assumendo i valori di default (vedi sotto) per tutti gli altri parametri.

Tra gli altri, si può indicare il parametro `small_src_img` se serve un'immagine ottimizzata per le dimensioni ridotte (32px).

Il formato migliore per i file sorgente è SVG, oppure PNG/JPEG/WEBP/GIF/TIFF/AVIF.

Se entrambi i file mancano, viene restituito un errore.

I parametri di default sono elencati in dettaglio nel file `src/create-favicons/src/default-params.mjs`
e possono essere personalizzati nel file di configurazione, che deve avere questa forma:

```javascript
// file create-favicons-cfg.mjs
const params = [{ /* ... */ }];

export default params;
```

`params` può essere un oggetto o un array. Nel secondo caso, ogni elemento dell'array corrisponde a un set di favicon diverso.

Per creare un file cfg di esempio **nella directory corrente** (con tutti i valori di default e le relative descrizioni),
usare il comando:

```bash
npx create-favicons init
```

## Uso remoto

I comandi possono essere eseguiti anche senza installare prima il pacchetto:

```
npx --package=@massimo-cassandro/dev-utilities create-favicons init
npx --package=@massimo-cassandro/dev-utilities create-favicons [--dir=...]
```

## Esecuzione

Lo script produce le varie immagini png e svg, il file `manifest.webmanifest` e uno snippet HTML (o nel linguaggio indicato nel parametro `snippet_language`).
Tutte le immagini vengono ottimizzate con [SVGO](https://github.com/svg/svgo) e [imagemin](https://github.com/imagemin/imagemin).

Tutti i file vengono salvati nella directory indicata in `output_dir` (default: directory corrente).

Facoltativamente, il file dello snippet può essere salvato in una directory diversa (`snippet_path`) oppure si può scegliere di non crearlo,
impostando il valore `snippet_name` a `null`.

Nel file di configurazione si può impostare anche il parametro `webmanifest_extra`, che permette di aggiungere ulteriori voci al file *manifest*.
Per maggiori informazioni: <https://developer.mozilla.org/en-US/docs/Web/Manifest>

File generati:

```html
<link rel="icon" href="/favicon.ico" sizes="any"> <!-- 32×32 + 16x16 -->
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png"> <!-- 180×180 -->
<link rel="manifest" href="/manifest.webmanifest">
```

```javascript
// manifest.webmanifest
{ 
  "icons": [ 
    { "src": "/icon-192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "/icon-512.png", "type": "image/png", "sizes": "512x512" }
  ]
}
```

Vedi anche i file della demo
