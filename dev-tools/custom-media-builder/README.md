# Custom media builder

Genera il file css delle @custom-media a partire da un modulo JS che esporta
(default) un oggetto { nome: media-query } e un un secondo oggetto breakpoint.js
per la condivisione dei breakpoiunt in js, vedi `src/custom-media.js`.

Uso da riga di comando (percorsi relativi alla directory corrente):

```bash
node custom-media-builder.mjs [--src=./app/css/custom-media.js] [--dest=<src con estensione .css>]
```
