// webpack.config.mjs __project_name__
// v.3
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import fs from 'fs';
import * as process from 'process'; // Rende 'process' disponibile nel contesto ESM
// import { styleText } from 'node:util';
// import { createRequire } from 'node:module';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackInjectPreload from '@principalstudio/html-webpack-inject-preload';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
// import Dotenv from 'dotenv-webpack';
import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';
// import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
// import HtmlWebpackInjectAttributesPlugin from 'html-webpack-inject-attributes-plugin';

import { cssRules } from './webpack-config-modules/css-rules.mjs';
import { createPurgeCSSPlugins } from './webpack-config-modules/purgecss-setup.mjs';
import { getJsConfigAliases } from './webpack-config-modules/get-jsConfig-aliases.mjs';
import { svgRules } from './webpack-config-modules/svg-rules.mjs';
// import { InlineCriticalCssPlugin } from './webpack-config-modules/inline-critical-css.mjs';


// --- config ---
const __filename = fileURLToPath(import.meta.url)
  ,__dirname = path.dirname(__filename);

// Risolve un percorso a partire dalla root del progetto, che coincide con la dir
// di questo file solo se il frontend NON è in una sottodirectory (es. ./app):
// vengono provate entrambe le posizioni, in fallback la prima
// const fromProjectRoot = (relPath) => {
//   const candidates = ['./', '../'].map(p => path.resolve(__dirname, p, relPath));
//   return candidates.find(p => fs.existsSync(p)) ?? candidates[0];
// };

const isDevelopment = process.env.NODE_ENV === 'development'
  ,devServerPort = [[port5700]]
  ,apiPort = [[port8000]] // eslint-disable-line no-unused-vars
  ,useSass = false

  // css in dev: true = iniettato con style-loader (veloce, nessun asset css);
  // false = estratto in asset con MiniCssExtractPlugin (come in produzione).
  // NB: con `purgeCssInDev: true` (vedi sotto) viene comunque forzato a false,
  // perché il purge e il plugin delle custom properties lavorano sugli asset css
  ,inlineCssInDevMode = true
  // sf: inlineCssInDevMode = false
  ,useSvgo = true
  ,useSvgr = false // svg per react
  ,svgoConfig = useSvgo? (await import('./webpack-config-modules/svgo.config.mjs')).default : null
  ,postcssConfig_path = path.resolve(__dirname, './webpack-config-modules/postcss.config.mjs')

  // dir di output: relativa a QUESTO file ('../build' se il frontend è in una
  // sottodirectory, './build' se webpack.config.mjs è nella root del progetto)
  ,output_dir = path.resolve(__dirname, './build')
  // ,output_dir = isDevelopment? '_dev' : 'build' // symfony

  // dir delle favicons generate da `npx create-favicons` (vedi package.json):
  // il path assoluto serve a CopyWebpackPlugin/HtmlWebpackPlugin (i path
  // relativi sarebbero risolti dal cwd, non da questo file), mentre la regexp
  // resta relativa perché viene confrontata con i path dei moduli
  ,favicons_path = path.resolve(__dirname, './app/favicons/output') // commentare se non usato
  ,favicons_path_regexp = /favicons\/output/ // source pattern per le favicons (regexp o null)

  //sf:
  //,favicons_path
  // ,favicons_path_regexp = null


  // NB: jsconfig.json va tenuto in questa stessa dir (gli alias sono risolti
  // a partire dalla sua posizione)
  ,jsConfigAliases = getJsConfigAliases(path.resolve(__dirname, './jsconfig.json'))
  ,packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8')) //JSON.parse(fs.readFileSync(fromProjectRoot('package.json'), 'utf-8'))

  // path del pacchetto minimo (il suo js genera markup con classi proprie e il
  // suo css dichiara custom properties: entrambi vanno visti da PurgeCSS)
  ,minimo_path = './node_modules/@massimo-cassandro/minimo' // fromProjectRoot('node_modules/@massimo-cassandro/minimo')

  ,usePurgeCss = true // false per disattivare PurgeCSS (debug rapido di problemi legati al purge)
  ,purgeCSSOptions = {
    keyframes: true, // rimuove i @keyframes non referenziati
    debug: false // true per loggare i selettori rimossi da PurgeCSS a fine build
  }

  // plugin per l'estrazione ottimizzata delle custom properties (vedi
  // webpack-config-modules/custom-props-purgecss-plugin.mjs): dopo la
  // minificazione inietta nei css compilati SOLO le definizioni di custom
  // properties effettivamente usate, prese dal file master. I css del progetto
  // contengono quindi solo usi `var(--nome)`, mai definizioni (custom-properties.css
  // NON va importato nelle entry css). Se false il plugin non viene nemmeno
  // caricato e la gestione delle custom properties resta a carico del progetto
  ,useCustomPropsPlugin = true
  // file master con TUTTE le definizioni di custom properties disponibili
  // (copiato da minimo da starter-install.sh, generato da `npm run 'build tokens'`)
  ,customPropsFile = path.resolve(__dirname, './app/css/custom-properties.css')

  // PurgeCSS e plugin custom properties lavorano sugli asset css finali:
  // in dev, con `false`, sono entrambi disattivati (build più veloce, css
  // iniettato con style-loader; se `useCustomPropsPlugin` è true le definizioni
  // vengono aggiunte per intero alle entry, vedi `entries`).
  // Con `true` (a scopo di test) sono attivi come in produzione (secondo i
  // rispettivi flag `usePurgeCss` / `useCustomPropsPlugin`) e `inlineCssInDevMode`
  // viene forzato a false
  ,purgeCssInDev = false
  ,inlineCssInDev = inlineCssInDevMode && !purgeCssInDev // valore effettivo passato a cssRules
  ,runPurgeCss = usePurgeCss && (!isDevelopment || purgeCssInDev)
  ,runCustomPropsPlugin = useCustomPropsPlugin && (!isDevelopment || purgeCssInDev)
  // ,manifest_shared_seed = {}
;

const { CustomPropsPurgeCssPlugin } = runCustomPropsPlugin
  ? await import('./webpack-config-modules/custom-props-purgecss-plugin.mjs')
  : {};

// cacheGroup `shared` (splitChunks): raccoglie in `shared.js` / `shared.css` i
// moduli js e css provenienti da node_modules e dalle directory condivise del
// progetto (vedi `pathsRegexp` sotto), così non vengono duplicati in ogni entry.
//
// Dalla v3 anche i css finiscono nello `shared.css` (in v2 restavano sempre nel
// css della entry, duplicati, per due limiti di PurgeCSS che operava sul singolo
// asset con `variables: true`): le custom properties sono ora gestite dal plugin
// CustomPropsPurgeCssPlugin, che lavora sugli asset finali e le cui definizioni
// vengono iniettate nello `shared.css` (vedi `sets` nei `plugins`).
//
// - le entry `.critical` sono escluse dal chunk condiviso (`chunks` sotto):
//   il loro css è inline nei template e deve restare autosufficiente
// - `enforce: true` garantisce che `shared.js` e `shared.css` siano sempre
//   generati (senza, splitChunks non crea il chunk se i moduli sono sotto la
//   soglia `minSize`, e il link nel template punterebbe a un file inesistente)
// - i template (twig/altro) devono linkare (preload + link) sia `shared.css` che il
//   css della propria entry, con `shared.css` PRIMA del css della entry per
//   rispettare l'ordine della cascata (vedi _sf/templates/_main-tpl.html.twig)
//
// NB: PurgeCSS elabora ogni asset css singolarmente, quindi i @keyframes
// definiti nello `shared.css` ma usati solo in un altro asset (es. un css di
// progetto che usa una animation di minimo) verrebbero rimossi: in tal caso
// aggiungerli a `safelist.keyframes` o impostare `keyframes: false` in
// `purgeCSSOptions`
const shared_chunk_paths = (module) => {

  // path delle directory da utilizzare nel chunk `shared`
  const sep = '[\\\\/]'; // stringa che produce [\\/] nel pattern
  const pathsRegexp = new RegExp([
    'node_modules',
    'app/src',
    'app/src/js',
    'app/src/web-components',
    'app/src/components',
  ].map(p => `${sep}${p.replace(/\//g, sep)}${sep}`).join('|'));

  return pathsRegexp.test(module.nameForCondition?.() ?? '');
};


// hash: https://medium.com/@web_developer/hash-vs-chunkhash-vs-contenthash-e94d38a32208

// =>> CopyWebpackPlugin patterns
// (null o array vuoto per disattivare)
// https://github.com/webpack/copy-webpack-plugin/tree/main?tab=readme-ov-file#copy-webpack-plugin
const CopyWebpackPluginPatterns = [

  // {
  //   from: 'app/api',
  //   to: 'api',
  //   globOptions: {
  //     dot: true,
  //     gitignore: true,
  //     ignore: [
  //       '**/.DS_Store',
  //       // config.php e config-prod.php sono
  //       // gestiti a parte nei pattern successivi (config.php è sempre
  //       // scritto a mano per ambiente, mai copiato dalla build)
  //       // '**/config.php',
  //       // '**/config-prod.php',
  //     ]
  //   }
  // },
  // {
  //   from: 'app/api/config-prod.php',
  //   to: 'api/config.php'
  // },
  // {
  //   from: './app/assets/root_htaccess',
  //   to: '.htaccess',
  //   toType: 'file'
  // },
  // {
  //   from: './app/assets/robots.txt',
  //   to: 'robots.txt',
  //   toType: 'file'
  // },
  // {
  //   from: './app/assets/api_htaccess',
  //   to: 'api/.htaccess',
  //   toType: 'file',
  //   // context: 'app/api'
  // },
];

// =>> PurgeCSS
// Istanze e opzioni sono in webpack-config-modules/purgecss-setup.mjs: qui restano
// solo i flag e i dati di progetto (vedi createPurgeCSSPlugins nei `plugins`).

// recupero metadata immagini
// const require = createRequire(import.meta.url);
// responsive-loader adapter (CJS) — use createRequire
// const responsiveLoaderSharp = require('responsive-loader/sharp');

/******************************/
/** CONFIG **/

// =>> entries
// NB: percorsi dalla root del progetto
const projectEntries = {
  'index': './app/index.js',

  // css critici da includere inline nei template html: il suffisso `.critical` nel nome
  // della entry attiva l'istanza PurgeCSS dedicata con purge stretto
  // (vedi purgecss-setup.mjs) e la regola dedicata in css-rules.mjs
  'layout.critical': './app/css/layout.critical.css'

};

// dev senza plugin custom properties (`purgeCssInDev: false`, css iniettato con
// style-loader, quindi nessun asset css in cui il plugin possa inserire le
// definizioni): il file master con TUTTE le custom properties viene aggiunto come
// primo modulo di ogni entry (escluse le `.critical`). Non serve nessuna
// modifica ai template
const entries = (useCustomPropsPlugin && isDevelopment && !purgeCssInDev)
  ? Object.fromEntries(Object.entries(projectEntries).map(([name, entry]) => [
    name,
    /\.critical/.test(name) ? entry : [customPropsFile, ...[entry].flat()]
  ]))
  : projectEntries;


const config = {
  mode: isDevelopment ? 'development' : 'production',

  // watch: isDevelopment, // necessario se non si usa devServer
  watchOptions: {
    ignored: [
      '**/build/**',
      '**/_dev/**',
      '**/.git/**',
      '**/_private/**',
      '**/node_modules/**',
      '!**/node_modules/@massimo-cassandro/**'
    ],
    // poll: 1000, // se necessario, risolve il problema `Error: EMFILE: too many open files, watch`
  },

  // https://webpack.js.org/configuration/dotenv/
  // dotenv: {
  //   prefix: 'APP_',
  //   dir: '/',
  //   template: ['.env', '.env.development'] //, '.env.local', '.env.[mode]', '.env.[mode].local'],
  // },

  devtool: isDevelopment ? 'inline-source-map' : false,

  entry: entries,

  output: {
    path: output_dir,
    filename: '[name].[contenthash].js',
    publicPath: '/',
    // publicPath: isDevelopment? '/' : './', // nel caso in cui l'output di produzione non sia sulla root
    clean: !isDevelopment
  },

  /* SYMFONY:
  output: {
    path: path.resolve(__dirname, `./public/${output_dir}` ),
    // filename: '[name].js',
    filename: '[name].[contenthash].js',
    publicPath: `/${output_dir}/`,
    clean: !isDevelopment || !!process.env.WEBPACK_SERVE,
  },
  */

  // =>> optimization
  optimization: {
    minimize: !isDevelopment,
    // di default true solo se minimize:true (quindi false in dev): esplicito qui perché
    // PurgeCSSPlugin e il plugin delle custom properties modificano gli asset css
    // dopo il calcolo dell'hash "veloce" — senza questo, in dev con `purgeCssInDev`
    // il contenthash non riflette le loro modifiche e il browser può servire dalla
    // cache una versione stale pur avendo rigenerato la build
    realContentHash: !isDevelopment || purgeCssInDev,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: /^!/
          }
        },
        extractComments: false
      })
    ],
    runtimeChunk: 'single', // true
    splitChunks: {
      cacheGroups: {

        shared: {
          // vedi shared_chunk_paths sopra per la logica completa del test
          test: shared_chunk_paths,
          name: 'shared',
          enforce: true,
          // le entry `.critical` restano autosufficienti (css inline nei template)
          chunks: (chunk) => !/\.critical/.test(chunk.name)
        }
      }
    },
  },

  // =>> performance
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },

  // =>> devServer
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, '/'),
      serveIndex: true
    },
    open: { app: { name: 'Google Chrome' } },
    compress: true,
    hot: true,
    port: devServerPort,
    client: { overlay: true, },
  },

  // =>> devServer (con symfony)
  // reverse proxy davanti a `symfony serve` (porta 8102, vedi package.json):
  // il browser va aperto su questo dev server (non su :8102). Le richieste per
  // gli asset (path che iniziano per output.publicPath, es. /_dev/*) vengono
  // servite da webpack (in memoria, con HMR); tutto il resto (pagine Twig,
  // route Symfony, chiamate ajax con url relativi) viene proxato a Symfony.
  // Symfony resta un processo separato e ignaro del dev server: continua a
  // risolvere asset() leggendo manifest.json da disco, per questo serve
  // devMiddleware.writeToDisk: true (vedi anche `output.clean` sopra, sempre
  // false in dev per non ripulire il manifest tra una build e l'altra)
  // devServer: {
  //   host: '0.0.0.0', // come symfony serve --listen-ip=0.0.0.0
  //   port: devServerPort,
  //   allowedHosts: 'all', // necessario per accesso da altri device in LAN
  //   // senza contenthash (vedi output.filename / MiniCssExtractPlugin sopra) i
  //   // filename restano stabili tra una modifica e l'altra: impedisce al browser
  //   // di servire una versione stale in cache su reload manuale
  //   headers: { 'Cache-Control': 'no-store' },
  //   hot: true,
  //   open: { app: { name: 'Google Chrome' } }, // apertura automatica del browser all'avvio
  //   static: false, // niente static serving proprio: tutto il resto passa dal proxy verso Symfony
  //   devMiddleware: { writeToDisk: true, },
  //   client: { overlay: true, },
  //   proxy: [
  //     {
  //       context: ['**'], // ['/api'],
  //       target: process.env.API_URL || `http://localhost:${apiPort}`
  //       // NON impostare changeOrigin: deve restare l'Host visto dal browser
  //       // (questo dev server), altrimenti gli url assoluti eventualmente
  //       // generati da Symfony (redirect, form action, ecc.) punterebbero a
  //       // `:${apiPort}` invece che a questo dev server
  //     }
  //   ],
  // },

  // =>> plugins
  plugins: [
    // =>> plugins: Dotenv
    // new Dotenv({
    //   path: isDevelopment ? './.env.development' : './.env',
    //   expand: true,
    //   ignoreStub: true,
    //   allowEmptyValues: true
    // }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js'
    }),


    // =>> plugins: RemoveEmptyScriptsPlugin
    new RemoveEmptyScriptsPlugin({
      enabled: !isDevelopment,
      verbose: true
    }),

    // =>> plugins: CopyWebpackPlugin
    ...(
      CopyWebpackPluginPatterns != null && CopyWebpackPluginPatterns.length > 0
        ? [
          new CopyWebpackPlugin({
            patterns: CopyWebpackPluginPatterns
          })
        ]
        : []
    ),

    // =>> plugins: WebpackManifestPlugin
    // new WebpackManifestPlugin({
    //   fileName: path.join(output_dir, 'manifest.json'),
    // sf: fileName: 'manifest.json', // scrive in output.path
    //   // basePath: item.source_dirname
    //   // removeKeyHash: /(^(_assets\/(?!(fonts\/))))|((\?as_asset)$)/,
    //   removeKeyHash: true, // /([a-f0-9]{32}\.?)/gi, // /(\?as_asset)$/,
    //   // rimuove i font dal manifest. Non necessari, rendono il file inutilmente grande
    //   filter: isDevelopment? undefined : (FileDescriptor) => {
    //     return /fonts/.test(FileDescriptor.path)? false : true;
    //   },
    //   sort: isDevelopment? undefined : (a, b) => a.name.localeCompare(b.name)
    // }),

    // =>> plugins: MiniCssExtractPlugin
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
      ignoreOrder: true
    }),

    // =>> plugins: InlineCriticalCssPlugin (solo prod)
    // ...(isDevelopment
    //   ? []
    //   : [new InlineCriticalCssPlugin({ match: (href) => href?.includes('.critical') })]
    // ),

    // =>> plugins: HtmlWebpackPlugin (manifest)
    new HtmlWebpackPlugin({
      filename: 'manifest.webmanifest',
      template: path.resolve(favicons_path, './manifest.webmanifest.ejs'),
      inject: false,
      minify: false //!isDevelopment
    }),

    // =>> plugins: HtmlWebpackPlugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, './app/tpl/index.ejs'),
      inject: 'body',
      title: 'XXXXX',
      minify: !isDevelopment
      // base: isDevelopment ? '/' : '/xxxxx/',
    }),

    // =>> plugins: HtmlWebpackInjectAttributesPlugin
    // new HtmlWebpackInjectAttributesPlugin({
    //   // La funzione riceve un oggetto con gli attributi del tag corrente
    //   media: (tag) => {
    //     // console.log(tag.attributes);
    //     // 'tag.attributes.href' contiene il percorso del file CSS generato
    //     if (tag.attributes.href && tag.attributes.rel ===  'stylesheet' && /^(\.\/memo\.).*(\.css)$/.test(tag.attributes.href)) {
    //       return 'print';
    //     }
    //     return null;
    //   }
    // }),

    // =>> plugins: HtmlWebpackInjectPreload
    // https://github.com/principalstudio/html-webpack-inject-preload
    ...(isDevelopment
      ? []
      : [
        new HtmlWebpackInjectPreload({
          files: [
            {
              match: /.*-latin-(?!(ext-)).*\.woff2$/,
              attributes: { as: 'font', type: 'font/woff2', crossorigin: true }
            },
            {
              match: /.*\.css$/,
              attributes: { as: 'style' }
            },
            {
              match: /.*\.js$/,
              attributes: { as: 'script' }
            }
          ]
        })
      ]
    ),

    // =>> plugins: BannerPlugin
    new webpack.BannerPlugin({
      banner: () => {

        const start_year = 2026
          ,current_year = new Date().toLocaleString('en-UK', { year: 'numeric' })
          ,year = [
            start_year,
            ...(current_year > start_year? [current_year] : [])
          ].join('-')
          ,vers = packageJson.version.split('.').slice(0,-1).join('.')
          // ,vers = packageJson.version
        ;

        const author = packageJson.author?.name ?? (packageJson.author ?? '');

        return `/*! ${packageJson.name} v.${vers} - ${author} ${year} */`;

      },
      raw: true,
      // niente banner nei critical css: vengono inseriti inline nei template html
      exclude: /\.critical/ // chunk name
    }),

    // =>> plugins: PurgeCSSPlugin (solo classi/keyframes, le custom properties sono
    // gestite dal plugin successivo)
    // https://github.com/FullHuman/purgecss/tree/main/packages/purgecss-webpack-plugin
    // https://purgecss.com/configuration.html
    // istanze e opzioni in webpack-config-modules/purgecss-setup.mjs (qui solo flag/dati progetto)
    // `usePurgeCss: false` disattiva il purge per intero (utile per isolare rapidamente
    // eventuali problemi legati ad esso); `purgeCSSOptions` (keyframes/debug,
    // vedi sopra) si applica solo quando è attivo
    // NB: in dev il purge è attivo solo con `purgeCssInDev: true` (vedi sopra). In
    // watch mode i template twig NON sono osservati da webpack: dopo aver
    // aggiunto una classe solo in un twig occorre rilanciare la build (o toccare
    // un file js/css) per aggiornare il purge
    ...(runPurgeCss
      ? createPurgeCSSPlugins({

        // SOLO file che generano markup o classi (twig, php, js);
        // i file di stile vengono comunque scartati dal plugin
        contentGlobs: [
          path.resolve(__dirname, './templates/**/*.twig'),
          path.resolve(__dirname, './app/**/*.php'),
          path.resolve(__dirname, './app/index.js'), // entry js di default
          path.resolve(__dirname, './app/src/**/*.{js,mjs,jsx}'),
          path.resolve(__dirname, './app/src/**/*.ejs'), // template html di webpack
          path.resolve(__dirname, './app/error-pages/**/*.js'),
          // il js di minimo genera markup con classi proprie (snackbar, unsplash-page, ecc.)
          `${minimo_path}/src/**/*.{js,mjs}`,
        ],

        safelist: {
          standard: [
            // flash messages: class="alert alert-{{ label }}" (templates/incl/flash-messages.html.twig)
            /^alert-(success|notice|error|warning)$/
          ],
          deep: [
            // css modules: prefisso `m_` della build di produzione (vedi css-rules.mjs),
            // le classi con hash non possono comparire nei file scansionati
            /^m_/
          ],
          keyframes: [
            // stesso motivo dei selettori sopra, più un bug di purgecss: dentro un
            // blocco `purgecss start/end ignore` la regola è preservata ma le sue
            // dichiarazioni non vengono scansionate per l'uso di animation-name
            // (vedi @keyframes slide-in/slide-out di minimo snackbar.module.css),
            // quindi l'@keyframes verrebbe rimosso come "non referenziato" anche
            // se in realtà è usato dalla regola stessa
            /^m_/
          ],
          greedy: [
            // purgecss non riconosce il nesting selector nativo: senza questo pattern
            // i selettori annidati composti solo da `&` + pseudo classi (&:hover,
            // &:focus-visible, `&` semplice, ecc.) verrebbero SEMPRE rimossi
            /^&$/
          ]
        },

        // fontFace resta false (default): i font sono referenziati solo tramite
        // var(--font-family) e purgecss non risolve le custom properties nei valori
        ...purgeCSSOptions
      })
      : []),

    // =>> plugins: CustomPropsPurgeCssPlugin (dopo PurgeCSS e dopo la minificazione)
    // estrazione ottimizzata delle custom properties: vedi il commento in testa a
    // webpack-config-modules/custom-props-purgecss-plugin.mjs e i flag
    // `useCustomPropsPlugin` / `purgeCssInDev` sopra
    ...(runCustomPropsPlugin
      ? [new CustomPropsPurgeCssPlugin({

        // file master con tutte le definizioni disponibili
        definitionsFile: customPropsFile,

        // set di asset css elaborati in modo indipendente: `sources` sono i nomi
        // degli asset compilati (con l'hash nel nome: usare `*`, oppure una
        // RegExp), `target` l'asset in cui iniettare le definizioni (se omesso
        // è il primo asset del set; se non corrisponde ad alcun asset e non ha
        // `*` viene emesso come nuovo asset, che va poi linkato nei template).
        // NB: `*` corrisponde a qualsiasi carattere: 'layout.*.css' corrisponde
        // anche a 'layout.critical.<hash>.css'
        sets: [
          // il critical css è inline nei template: deve restare autosufficiente
          { sources: ['layout.critical.*.css'] },

          // shared.css è linkato in tutte le pagine: contiene le definizioni
          // per tutti i css delle entry (le definizioni non sono duplicate
          // negli altri asset). Ogni css delle entry va elencato qui
          { sources: ['shared.*.css', 'index.*.css'], target: 'shared.*.css' },
        ],

        // css usati fuori dagli asset purgati (shadow DOM dei web components,
        // import `?raw`): tutti i loro usi di var() contano per tutti i set
        extraUsageGlobs: [
          path.resolve(__dirname, './app/src/web-components/**/*.css'),
          `${minimo_path}/src/web-components/**/*.css`,
        ],

        // props da includere comunque in tutti i set (nomi esatti o RegExp),
        // es. override consumati da un altro asset
        // seeds: [/^--btn-secondary-/],

        // selettore dei blocchi `:root` del master (default: ':root')
        // selector: ':where(html)',

        minify: !isDevelopment
      })]
      : [])
  ], // end plugins

  module: {

    rules: [

      // =>> icons.js è un barrel di puri re-export: nessun side effect
      // {
      //   test: /[/\\]icons\.js$/,
      //   sideEffects: false
      // },

      // =>> rules: js / jsx
      {
        test: /\.jsx?$/,
        oneOf: [
          {
            resourceQuery: /as_(?:lib|asset)/, // utilizzo come libreria / asset
            type: 'asset/resource',
            generator: {
              filename: 'libs/[name].[contenthash][ext]'
            }
          },
          {
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [['@babel/preset-env', { targets: 'defaults' }]]
              }
            }
          }
        ]
      },

      // =>> template ejs
      {
        test: /\.ejs$/i,
        use: [
          {
            loader: 'ejs-loader',
            options: {
              esModule: false // Necessario per far sì che il require restituisca la stringa correttamente
            }
          }
        ]
      },

      // =>> rules: html files
      {
        test: /(\.html?)$/i,
        oneOf: [
          {
            type: 'asset/resource',
            resourceQuery: /as_asset/,
            generator: {
              filename: '[name].[contenthash][ext]'
            }
          },
          {
            loader: 'html-loader'
          }
        ]
      },

      // =>> rules: favicons
      {
        test: /\.(?:ico|png|svg|webmanifest)$/i,
        type: 'asset/resource',
        include: favicons_path_regexp?? undefined,
        generator: {
          filename: '[name][ext]?_=[contenthash]'
        }
      },



      // =>> raw txt / md files
      {
        test: /(\.(txt|md))$/i,
        type: 'asset/source'
      },

      // =>> rules: svg
      ...svgRules({useSvgo: useSvgo, svgoConfig: svgoConfig, useSvgr: useSvgr, favicons_path_regexp: favicons_path_regexp?? null }),

      // =>> rules: Images / pdf
      {
        test: /\.(?:gif|png|jpg|jpeg|webp|avif|pdf)$/i,
        oneOf: [

          // './img.jpg?metadata'
          // {
          //   resourceQuery: /metadata/,
          //   // 'javascript/auto' è OBBLIGATORIO qui per impedire a Webpack 5 di trattarlo come un asset nativo duplicato
          //   type: 'javascript/auto',
          //   use: [
          //     {
          //       loader: 'responsive-loader',
          //       options: {
          //         // Sharp è necessario per leggere i metadati velocemente
          //         adapter: responsiveLoaderSharp,

          //         // solo i dati del file originale
          //         // disable: true,
          //         sizes: [99999999], // forza responsive-loader a ricalcolare le dimensioni reali

          //         esModule: true,

          //         // Manteniamo i nomi file consistenti
          //         name: '[name].[contenthash][ext]',
          //         outputPath: 'imgs',
          //         publicPath: path.join((isDevelopment? '/_dev/' : '/build/'), 'imgs')
          //       },
          //     },
          //   ],
          // },

          {
            type: 'asset/resource',
            exclude: favicons_path_regexp?? undefined,
            generator: {
              filename: 'imgs/[name].[contenthash][ext]',
            }
          },
        ],
      },

      // =>> Video
      // {
      //   test: /\.(?:mp4|webm)$/i,
      //   type: 'asset/resource',
      //   generator: {
      //     filename: 'video/[name].[contenthash][ext]'
      //   }
      // },

      // =>> rules: Fonts
      {
        test: /\.(woff2?|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash][ext]'
        }
      },

      // =>> rules: css / scss
      ...cssRules({isDevelopment: isDevelopment, useSass: useSass, inlineCssInDevMode: inlineCssInDev, postcssConfig_path: postcssConfig_path})
    ] // end rules
  }, // end module

  // =>> resolve
  resolve: {
    fallback: {
      fs: false,
      util: false,
      process: 'process/browser.js'
    },
    modules: [ './', './node_modules' ],
    extensions: [ '.tsx', '.ts', '.js', '.mjs', '.cjs', '.jsx', '.json', '.scss', '.css' ],
    alias: {
      ...jsConfigAliases
    }
  },

  // =>> stats
  // stats: {
  //   assets: false,
  //   modules: false,
  //   chunks: false,
  //   errors: true,        // Mostra solo gli errori
  //   errorDetails: false, // Disabilita i dettagli troppo prolissi
  //   moduleTrace: false,
  // },
};

export default config;

