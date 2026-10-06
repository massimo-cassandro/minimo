# Demo

Per eseguire la demo, clonare questo repository e installare tutte le dipendenze, quindi lanciare lo script `demo run`:

```bash
# clona il repository
git clone https://github.com/massimo-cassandro/svg-icons-tools.git

# installa tutte le dipendenze
cd path/to/install/folder
npm install

## esegue lo script
npm run 'demo run'
```

Tutti i file generati vengono salvati nella directory `demo/demo-output`.

In alternativa, scaricare e salvare solo la directory demo (si può usare [download-directory.github.io](https://download-directory.github.io/), questo è il link diretto per il download: <https://download-directory.github.io/?url=https%3A%2F%2Fgithub.com%2Fmassimo-cassandro%2Fsvg-icons-tools%2Ftree%2Fmain%2Fdemo>), poi installare *svg-icons-tools* con **npm** (`npm i @massimo-cassandro/svg-icons-tools`), spostare la directory demo nella stessa cartella dell'installazione ed eseguire:

```bash
npx iconsTools --config ./demo/svg-icons-tools.config.mjs
```

**Informazioni sui file della demo**

Alcune icone provengono da [Phosphor Icons](https://phosphoricons.com/), [Remix Icon](https://remixicon.com/) e [heroicons](https://heroicons.com/).

I prefissi dei file (heroicons, phosphoricons, ecc.) servono a identificarne l'origine e vengono rimossi durante l'elaborazione.

Il suffisso `-w-pallet` indica che il file contiene un “pallet” (vedi file di configurazione) da rimuovere.
Allo stesso modo, le icone duotone sono indicate dal suffisso `-duotone`.
