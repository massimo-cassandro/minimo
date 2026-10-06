/**
 * File di configurazione di svg-icons-tools
 * ----------------------------
 * tutti i percorsi sono relativi alla directory di lavoro
 *
 * Maggiori informazioni su https://github.com/massimo-cassandro/svg-icons-tools
 *
 * esecuzione (dalla directory di lavoro di svg-icons-tools): `npx iconsTools`
 * oppure indicando il percorso del file di configurazione: `npx iconsTools --config path/to/config.mjs`
 *
 * Tutti i percorsi di questo oggetto di configurazione sono relativi alla cartella che contiene il file di configurazione
 *
 */

const config = {

  /**
   * SVG in componenti JSX
   */
  jsx: {
    /**
     * Cartelle sorgente
     *
     * Ogni file con estensione svg presente in queste cartelle viene elaborato.
     * Le sottocartelle vengono ignorate.
     * L'array `fill` deve contenere le icone che usano l'attributo `fill`;
     * analogamente, l'array `stroke` deve contenere le icone che usano l'attributo `stroke`.
     * È possibile gestire entrambi i tipi di icone contemporaneamente; altrimenti lasciare
     * vuoti gli array o rimuovere quelli non necessari.
     * Se non serve questa funzionalità, rimuovere l'intero oggetto `jsx`
     */
    source_folders: {
      fill: ['./svg-sources/fill-icons', './svg-sources/no-square-icons'],
      stroke: ['./svg-sources/stroke-icons']
    },

    /**
     * Funzione personalizzata per creare ogni file JSX di icona
     *
     * Se non definita, viene usata la funzione predefinita.
     * Vedi `src/jsx-icon-file-builder.mjs` per maggiori dettagli sull'argomento della funzione e sui valori da restituire
     *
     * @example
     * custom_icon_builder: (parsed_svg) => { ... il tuo codice ... }
     */
    custom_icon_builder: null,

    /* percorso della cartella in cui vengono salvati i componenti jsx */
    dest_folder: './output/jsx-icons',

    /**
     * Svuota la cartella dest_folder prima di salvare i nuovi file
     */
    clearDestFolder: true,

    /*
     * percorso del file indice delle icone jsx
     *
     * File opzionale che contiene tutte le icone generate come named export.
     * Lasciare vuoto o rimuovere se non serve
     */
    index_file: './output/jsx-icons-index.jsx',
  },

  /**
   * file svg da ottimizzare
   */
  optimize: {
    /**
     * Cartelle sorgente
     *
     * Vedi il commento di `jsx` per maggiori dettagli
     * Lasciare vuoto o rimuovere l'intero oggetto `optimize` se non serve questa funzionalità
     */
    source_folders: {
      fill: ['./svg-sources/fill-icons', './svg-sources/no-square-icons'],
      stroke: ['./svg-sources/stroke-icons']
    },

    /* percorso della cartella in cui vengono salvati i file ottimizzati */
    dest_folder: './output/optimized-svg',

    /**
     * Svuota la cartella dest_folder prima di salvare i nuovi file
     */
    clearDestFolder: true
  },

  /**
   * SVG come symbol
   *
   * Parametri per combinare più file svg in un unico file svg con symbol
   * Se non serve questa funzionalità, rimuovere l'oggetto `symbols` o lasciare vuoti i percorsi
   */
  symbols: {
    /**
     * Cartelle sorgente
     *
     * Ogni file con estensione svg presente in queste cartelle viene elaborato.
     * Le sottocartelle vengono ignorate.
     * Lasciare vuoto o rimuovere l'intero oggetto `symbols` se non serve questa funzionalità
     *
     * NB: le icone stroke e fill vengono gestite aggiungendo alcune classi al tag `symbol`.
     * Lo stesso vale per le icone non quadrate.
     * Aggiungere classi al tag `symbol` è utile per stilizzare le icone con css,
     * ma è una funzionalità poco documentata e potrebbe non funzionare come previsto in tutti i browser.
     * Tenerne conto se si intende usarla.
     */
    source_folders: {
      fill: ['./svg-sources/fill-icons'],
      stroke: ['./svg-sources/stroke-icons']
    },

    /* percorso del file svg elaborato */
    dest_file: './output/icons-as-symbols.svg',

    /* se true, la dichiarazione xml (`<?xml version...`) viene aggiunta al file risultante */
    add_xml_declaration: true,

    /* se true, il doctype svg (`<!DOCTYPE svg PUBLIC...`) viene aggiunto al file risultante */
    add_svg_doctype: true,

    /* se true, l'attributo `hidden` viene aggiunto al tag svg del file risultante */
    add_hidden_attribute: true,

    /**
     * percorso opzionale del file js che conterrà l'elenco delle icone convertite in symbol.
     *
     * Lasciare vuoto se non serve
     *
     * @example
     * icons_list_file: './path/to/icons-list.js',
     */
    icons_list_file: './output/icons-list.js',

    /**
     * template opzionale per creare il file demo delle icone
     *
     * Un file tpl di base viene fornito quando lo script viene lanciato con l'opzione `init`:
     * può essere personalizzato a piacere.
     * Se non serve questa funzionalità, rimuovere il file tpl e lasciare vuoto o rimuovere
     * il parametro `demo_tpl_path`
     *
     * @example
     * demo_tpl_path: './path/to/symbols-demo-tpl.html',
     */
    demo_tpl_path: './symbols-demo-tpl.html',

    /**
     * percorso opzionale del file demo generato
     *
     * Include l'elenco delle icone convertite in symbol e il file dei symbol stesso,
     * quindi può essere visualizzato in un browser tramite il protocollo `file:///`.
     * Richiede che il parametro `demo_tpl_path` sia impostato.
     * Lasciare vuoto questo parametro se non serve
     *
     * @example
     * demo_file_path: './symbols-demo.html',
     */
    demo_file_path: './output/symbols-demo.html',
  },


  /**
   * PARAMETRI GLOBALI
   *
   * Questi parametri sono usati da tutte le funzionalità
   */

  /*
   * prefissi dei nomi dei file svg da rimuovere negli id dei `symbols` e nei nomi
   * dei file jsx e dei file ottimizzati
   */
  remove_prefix: ['heroicons-outline-', 'phosphoricons-raw-', 'phosphoricons-', 'remixicons-'],

  /**
   * Configurazione di SVGO
   *
   * vedi https://svgo.dev/docs/plugins/
   */
  svgo_config: {
    multipass: true,
    plugins: [
      { name: 'cleanupIds', params: { remove: true, minify: true } }
      , 'removeDoctype'
      , 'removeComments'
      , 'removeTitle'
      , 'removeDimensions'
      , 'collapseGroups'
      , { name: 'cleanupNumericValues', params: { floatPrecision: 4  } }
      , { name: 'convertColors', params: { names2hex: true, rgb2hex: true } }
      , 'removeStyleElement'
      , 'removeEmptyContainers'
      // , { name: 'removeAttrs', params: { attrs: ['(fill|stroke|class|style|data.*)', 'svg:(width|height)'] } }
      // , { name: 'removeAttrs', params: { attrs: ['(filter|fill|stroke|class|style|data.*)', 'svg:(width|height)'] } }
      , { name: 'removeAttrs', params: { attrs: ['(filter|fill|stroke|fill-rule|clip-rule|stroke-linecap|stroke-linejoin|stroke-width|transform|style|class|data.*)', 'svg:(width|height)'] } }
      , 'removeUselessDefs'
      //, { name: 'addAttributesToSVGElement0, params: {attribute: "#{$attr}"}}
      // , { name: 'addClassesToSVGElement', params: { className: 'line-icon'  } }
    ]
  },

  /**
   * markup “pallet” da rimuovere dai file svg
   *
   * Come spiegato chiaramente sul [sito di remixicon](https://remixicon.com/),
   * il "pallet" è un rettangolo trasparente che garantisce che gli SVG mantengano
   * le proprie dimensioni nel software di design. Non è necessario negli SVG finali
   * e può persino produrre effetti indesiderati, quindi viene rimosso.
   * Ogni elemento è un'espressione regolare.
   */
  pallets: [
    /<rect width="256" height="256" fill="none" ?\/?>(<\/rect>)?/gmi, // phosphoricons raw
    /<path fill="none" d="(M0 0h24v24H0z|M0 0h256v256H0z)" ?\/?>(<\/path>)?/gmi, // remixicons with 'pallets' option (and others)
  ],

  /**
   * Classi di opacità per le icone duotone
   *
   * Converte i valori di opacità in classi predefinite.
   * La chiave è la parte decimale del valore di opacità (es.: 2 == 0.2), il valore
   * è la classe da aggiungere al posto del valore di opacità.
   * Lo scopo è convertire i valori di opacità delle icone duotone in classi
   * predefinite, unendo valori simili in un'unica classe:
   * lo script assegna la classe la cui chiave è la più vicina al valore di opacità.
   * Ad esempio, sia 0.2 sia 0.26 vengono convertiti nella classe `duotone-light`
   * (la cui chiave è 2). Poi basta definire le classi nel proprio css.
   * NB: vengono considerati solo gli attributi opacity applicati agli elementi all'interno del tag svg.
   * Se non si vuole usare questa funzionalità, rimuovere l'oggetto `opacity_classes` o lasciarlo vuoto
   *
   * NB: non disponibile per la funzionalità `symbols`
   *
   * @example
   * opacity_classes: {
   *   2: 'duotone-light',
   *   4: 'duotone-medium',
   *   6: 'duotone-dark',
   * },
   */
  opacity_classes: {
    2: 'duotone-light',
    4: 'duotone-medium',
    6: 'duotone-dark',
  },

  /**
     * Classi per tipo di icona
     *
     * Classi opzionali da aggiungere alle icone fill e/o stroke
     * lasciare vuoto o rimuovere se non servono
     *
     * @example
     * icon_type_class: {
     *   fill: 'fill-icons',
     *   stroke: 'stroke-icons',
     * },
     */
  icon_type_class: {
    fill: 'fill-icon',
    stroke: 'stroke-icon'
  },

  /**
   * Classi per le icone non quadrate
   *
   * Assegna classi specifiche alle icone non quadrate.
   * Presupponendo che tutte le icone abbiano l'attributo viewBox e che l'origine di
   * tutti i viewBox sia in 0 0, lo script analizza larghezza e altezza di tutte le icone
   * e individua quelle con aspect ratio non quadrato.
   * Poi i valori vengono confrontati (dopo l'arrotondamento a due decimali)
   * per trovare l'aspect ratio più vicino tra quelli elencati nell'array
   * `non_square_icons_classes`. La classe corrispondente al valore trovato
   * viene quindi assegnata all'icona.
   * Il primo valore di ogni sotto-array di `non_square_icons_classes` è l'aspect ratio
   * (larghezza / altezza), il secondo è la classe da assegnare.
   * Se non si vuole usare questa funzionalità, rimuovere l'array
   * `non_square_icons_classes` o lasciarlo vuoto
   *
   * NB: anche se le classi di aspect ratio vengono aggiunte ai tag `symbol`, questa funzionalità
   * non è supportata negli SVG con quel tipo di elemento.
   *
   * @example
   * non_square_icons_classes: [
   *   [ 3/4, 'ratio-3x4'],
   *   [ 3/5, 'ratio-3x5'],
   *   [ 2/3, 'ratio-2x3'],
   * ],
   */
  non_square_icons_classes: [
    [ 3/4, 'icon-3x4'],
    [ 3/5, 'icon-3x5'],
    [ 2/3, 'icon-2x3'],
  ],

  /**
   * Colori della console
   *
   * Colori per l'output in console, come definiti in <https://nodejs.org/api/util.html#customizing-utilinspect-colors>
   * I colori di default funzionano bene su terminali con sfondo scuro; con un terminale
   * con sfondo chiaro potrebbe essere necessario cambiarli.
   */
  console_colors: {
    error    : 'bgRed',
    warning  : 'red',
    success  : 'bgGreen',
    info     : 'yellow',
    infoDim  : ['yellow', 'dim'],
  },


  /**
   * LEGACY
   * Funzionalità mantenute per ragioni di compatibilità
   */

  /**
   * Svg in variabili scss
   * Genera variabili scss dalle icone svg indicate
   */
  svg_to_scss: {
    /* icone da convertire in variabili scss.
     * Percorsi dei file svg da elaborare (relativi al file di configurazione).
     * Le icone vengono analizzate e ottimizzate, quindi convertite in variabili scss.
     * I nomi delle variabili coincidono con i nomi dei file, senza estensione
     * e senza le parti rimosse in base al parametro `remove_prefix`.
     */
    files: [
      './svg-sources/fill-icons/phosphoricons-airplane-tilt.svg',
      './svg-sources/fill-icons/phosphoricons-beer-stein-duotone.svg',
      './svg-sources/fill-icons/this-file-doesnt-exist.svg',
    ],

    /* stringa da anteporre ai nomi delle variabili */
    varname_prefix: 'icon-',

    /* se true, i file svg vengono convertiti in data url */
    convert_to_css_url: true,

    /* percorso del file scss generato */
    scss_icons_file: './output/_icons-svg.scss',
  }

};


export default config;
