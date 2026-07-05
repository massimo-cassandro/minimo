export const default_params = {

  // delimitazione porzione da copiare nel file init
  /*** INIT START ***/

  // tutti i percorsi sono relativi alla dir di lavoro

  // immagine sorgente SVG o PNG 512x512
  src_img: 'favicon-src.svg',

  // sorgente opzionale per immagini piccole (32px)
  small_src_img: null,

  // directory output (percorso relativo alla dir di lavoro)
  // se la dir non esiste, viene creata
  output_dir: './output',


  // WEBMANIFEST
  //****************************************************************************
  // chiavi aggiuntive per webmanifest, normalmente non necessarie per il browser
  // vedi https://developer.mozilla.org/en-US/docs/Web/Manifest
  // esempio:
  // webmanifest_extra: {
  //   name: "my Application",
  //   short_name: "my app",
  //   background_color: "#ffffff",
  //   theme_color: "#ffffff",
  //   display: "fullscreen"
  // }
  webmanifest_extra: null,

  // if true, all files linked in manifest will end with
  // '?_=[hash]'
  webmanifest_add_hash_to_files: true,


  // SNIPPET
  //****************************************************************************

  // nome del file snippet, compresa l'estensione
  // se questo parametro è null e anche `snippet_target_file` lo è, lo snippet non viene generato
  // se il linguaggio è ejs il nome è sempre 'favicons.incl.ejs' e snippet_name viene ignorato
  snippet_name: 'favicon.html',

  // path (relativo a questo file) in cui salvare lo snippet
  // se null, viene utilizzato lo stesso percorso indicato in `output_dir`
  // se la dir non esiste, viene creata
  snippet_path: null,

  // path del file in cui scrivere le righe dello snippet
  // questa impostazione è alternativa alle due precedenti e, se presente, queste
  // ultime vengono ignorate.
  // Per utilizzarla, le va assegnato il percorso del file (già esistente) nel quale
  // scrivere le righe delle snippet.
  // Il file deve contenere dei segnaposti per contrassegnare lo spazio entro il quale
  // scrivere lo snippets
  // <!-- favicon-snippet-start --><!-- favicon-snippet-end -->
  snippet_target_file: null,

  // linguaggio da utilizzare per la sintassi dello snippet html
  // html, pug, ejs
  snippet_language: 'ejs',

  // template per la costruzione dello snippet.
  // si tratta di una stringa (anche su più righe) in cui deve essere presente
  // '%_link_tags_%', che verrà sostituito con i tag links dei vari file
  snippet_template: '%_link_tags_%',

  // template per la costruzione di ogni singolo attributo `href` dei tag link.
  // deve contenere la stringa '%_file_name_%', che conterrà il nome del file,
  // e la stringa '%_cache_buster_%' (se attivata)', che conterrà `?_=xxxx`, dove
  // 'xxxx' rappresenta il timestamp generato per annullare la cache.
  // Va scritto tenendo conto del linguaggio utilizzato.
  href_template: '/%_file_name_%%_cache_buster_%',

  // se true aggiunge allo snippet una query string per ovviare ad eventuali
  // problemi di caching del browser
  add_cache_buster: false,

  //****************************************************************************

  // SHARP PNG PARAMETERS
  // parametri per i file PNG
  // vedi https://sharp.pixelplumbing.com/api-output#png
  png_parameters: {compressionLevel: 5, quality: 60, palette: true}


  /*** INIT END ***/

};
