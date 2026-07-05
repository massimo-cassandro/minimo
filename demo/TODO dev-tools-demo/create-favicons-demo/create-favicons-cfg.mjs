const params = {

  // immagine sorgent. SVG o PNG 512x512
  src_img: 'favicon-src.svg',
  // src_img: 'favicon-src2.svg',

  // sorgente opzionale per immagine piccole (32px)
  small_src_img: 'favicon-small-src.svg',

  // directory output (percorso relatuvo alla dir di lavoro)
  output_dir: './output',

  // chiavi aggiuntive per webmanifest, normalmente non necessarie per il browser
  //esempio:
  // vedi https://developer.mozilla.org/en-US/docs/Web/Manifest
  // webmanifest_extra: {
  //   name: "my Application",
  //   short_name: "my app",
  //   background_color: "#ffffff",
  //   theme_color: "#ffffff",
  //   display: "fullscreen"
  // }
  webmanifest_extra: null,


  // SNIPPET
  //****************************************************************************

  // nome del file snippet, compresa l'estensione
  // se null, lo snippet non viene generato
  snippet_name: 'favicon.html',

  // path (relativo a questo file) in cui salvare lo snippet
  // se null, viene utilizzato lo stesso percorso indicato in `output_dir`
  snippet_path: null,

  // linguaggio da utilizzare per la sintassi dello snippet html
  // html o pug o ejs
  snippet_language: 'ejs',

  // template per la costruzione dello snippet.
  // si tratta di una stringa (anche su più righe) in cui deve essere presente
  // '%_link_tags_%', che verrà sostituito con i tag links dei vari file
  snippet_template: '<!-- File generato dinamicamente - non modificare -->\n\n' +
    '%_link_tags_%',

  // template per la costruzione di ogni singolo attributo `href` dei tag link.
  // deve contenere la stringa '%_file_name_%', che conterrà il nome del file,
  // e la stringa '%_cache_buster_%' (se attivata)', che conterrà `?_=xxxx`, dove
  // 'xxxx' rappresenta il timestamp generato per annullare la cache.
  // Va scritto tenendo conto del linguaggio utilizzato.
  href_template: '/public/path/%_file_name_%%_cache_buster_%',

  // se true aggiunge allo snippet una query string per ovviare ad eventuali
  // problemi di caching del browser
  add_cache_buster: true,

  //****************************************************************************

  // SHARP PNG PARAMETERS
  // parametri per i file PNG
  // vedi https://sharp.pixelplumbing.com/api-output#png
  png_parameters: {compressionLevel: 5, quality: 60, palette: true}
};

export default params;
