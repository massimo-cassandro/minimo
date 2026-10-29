<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Mime\MimeTypes;



class ImgViewerController extends AbstractController
{
  /**
   *
   * @param src: (string) path immagine, relativo alla dir public e con lo slash iniziale
   *             (deve trovarsi in una delle dir di ALLOWED_SRC_DIRS)
   * @param raw: (bool) nessuna eleborazione (no image magick)
   * @param crop: ritaglia l'immagine originale (prima dell'eventuale ridimensionamento con bb)
   *              secondo i parametri forniti: x,y (origine immagine), w,h (dimensioni ritaglio)
   *              es: crop=10,10,100,100 -> ritaglia un quadrato di 100px a partire dal punto 10,10
   * @param bb: bounding box dell'area che deve contenere l'immagine ridimensionata
   * @param fd: (bool) forza dimensioni (utilizzato in coppia con bb)
   * @param q: compression quality 1-100
   * @param alpha: mantiene la trasparenza nelle png (default 0)
   * @param bg: in combinazione con alpha=1 definisce il bg color della png (esadecimale a 6 cifre)
   * @param refresh: (bool) forza la rigenerazione dell'immagine (solo in ambiente dev)
   * @param f: definisce il formato dell'immagine, secondo le chiavi di ALLOWED_FORMATS
   *           il valore 'auto' (default) imposta il formato migliore secondo i valori in PREFERRED_AUTO_FORMATS
   * @param ext: lascia inalterato il formato dell'immagine
   * @param d: (bool) forza il download dell'immagine
   */

  // parametri get del viewer accettati
  const ALLOWED_PARAMS = array('raw', 'bb', 'fd', 'q', 'alpha', 'bg', 'refresh', 'f', 'ext', 'd', 'crop');
  // parametri senza valore significativo (la sola presenza attiva l'opzione)
  const FLAG_PARAMS = array('raw', 'fd', 'alpha', 'ext', 'd');
  // formati output
  const ALLOWED_FORMATS = array(
    'avif'  =>  'image/avif',
    'pjpeg' =>  'image/pjpeg',
    'jpeg'  =>  'image/jpeg',
    'jpg'   =>  'image/jpeg',
    'png'   =>  'image/png',
    'gif'   =>  'image/gif',
    'webp'  =>  'image/webp',
    'ico'   =>  'image/vnd.microsoft.icon'
  );

  // formati preferiti per la scelta automatica in ordine di preferenza
  // in loro mancanza il formato prefefinito è jpeg
  // (NB: devono essere uguali alle chiavi di ALLOWED_FORMATS)
  const PREFERRED_AUTO_FORMATS = ['avif', 'webp'];

  // solo dev: true = le richieste f=avif vengono servite in WebP (test crash Chrome, vedi CLAUDE.md)
  const DEV_NO_AVIF = true;

  // formati input accettati da Imagick (in aggiunta a quelli definiti in ALLOWED_FORMATS)
  const ALLOWED_INPUT = ['bmp', 'tiff', 'tif'];

  // formati serviti senza elaborazione (in aggiunta a ALLOWED_INPUT e ALLOWED_FORMATS)
  const ALLOWED_RAW = ['svg'];

  // dir (relative a public) da cui è possibile leggere le immagini: output di webpack
  const ALLOWED_SRC_DIRS = ['build', '_dev'];

  // corrispondenza estensione file -> coder Imagick, dove diversi
  const INPUT_CODERS = ['jpg' => 'jpeg', 'tif' => 'tiff'];

  // limiti delle risorse di Imagick (protezione da immagini sovradimensionate / decompression bomb)
  const IMAGICK_LIMITS = [
    'memory' => 256 * 1024 * 1024,  // byte
    'map'    => 512 * 1024 * 1024,  // byte
    'area'   => 64 * 1000 * 1000,   // pixel
    'width'  => 16000,              // pixel
    'height' => 16000,              // pixel
  ];

  // parametro compression quality di default
  const DEFAULT_COMPRESSION_QUALITY = 60;

  // header CSP per i contenuti che il browser potrebbe eseguire (svg)
  const SANDBOX_CSP = "default-src 'none'; style-src 'unsafe-inline'; sandbox";

  // src -> percorso assoluto dentro la dir public con gli slash
  #[Route(path: '/iviewer', name: 'img_viewer')]
  public function indexAction(Request $request)
  {

    [$filePath, $relPath] = $this->resolveSrc($request);

    // formati supportati dall'istanza imageMagick
    $supported_formats = array_map("strtolower", \imagick::queryFormats());

    // formati accettati dal browser
    $accept = (string) $request->headers->get('Accept', '');

    $params = $this->cleanParams($request->query->all());

    // format 'auto' (default, o formato richiesto non valido) -> sceglie il formato migliore per il browser, se disponibile
    $autoFormat = !isset($params['f']);
    if($autoFormat) {

      $params['f'] = 'auto';

      foreach(self::PREFERRED_AUTO_FORMATS as $f) {
        if(strpos($accept, self::ALLOWED_FORMATS[$f]) !== false &&
          in_array($f, $supported_formats)
        ) {
          $params['f'] = $f;
          break;
        }
      }
    }


    // durata della cache dei file: 30gg
    $cache_lifetime = 2592000;

    $cache_params_str = "";

    // parte del nome file del cache formata da tutti i parametri concatenati tra loro
    foreach ($params as $kg => $g) {
      if ($kg != 'refresh' && $kg != 'raw')
        $cache_params_str .= '_' . $kg . $g;
    }
    $cache_params_str = str_replace(',', '_',  $cache_params_str);


    $fileExt = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    // $fileBasename = strtolower(pathinfo($filePath, PATHINFO_BASENAME));
    // $fileCacheName = $fileBasename; // porzione inziale del nome del file di cache
    $fileCacheName = str_replace('/', '_', $relPath); // porzione inziale del nome del file di cache


    if (isset($params['d'])) {
      $disposition = 'attachment';
    } else {
      $disposition = 'inline';
    }


    // elaborazione immagine: se sono presenti parametri, non è settato raw ed è un formato trattabile da imagick
    if (count($params) && !isset($params['raw']) && in_array($fileExt, array_merge(self::ALLOWED_INPUT, array_keys(self::ALLOWED_FORMATS)))) {

      // se è richiesto un formato deve essere tra quelli permessi
      if (isset($params['f']) &&
        in_array($params['f'], array_keys(self::ALLOWED_FORMATS)) &&
        in_array($params['f'], $supported_formats)
      ) {

        $format = $params['f'];

        // se è presente il parametro ext ed è tra quelli permessi
      } else if (isset($params['ext']) && $params['ext'] && in_array(strtolower($fileExt), array_keys(self::ALLOWED_FORMATS))) {

        $format = strtolower($fileExt);

        // formato predefinito in assenza di altre impostazioni
      } else {
        $format = 'jpeg';
      }

      $fileCacheName = $fileCacheName . $cache_params_str . '.' . ($format == 'pjpeg' ? 'jpeg' : $format);

      $cachefile = $this->getParameter('cache_dir') . $fileCacheName;

      // definizione della qualità della compressione dell'immagine
      $compressionQuality = $params['q'] ?? self::DEFAULT_COMPRESSION_QUALITY;


      // elaborazione con imagick per i seguenti casi:
      // 1) non esiste il file nella cartella cache
      // 2) la cache è scaduta
      // 3) il file originale è più recente della cache
      // 4) è richiesto il refresh
      if (!file_exists($cachefile) ||
        (filemtime($cachefile) + $cache_lifetime) < time() ||
        filemtime($cachefile) < filemtime($filePath) ||
        isset($params['refresh'])
      ) {

        // il coder di lettura è forzato dall'estensione, così Imagick non sceglie il formato dal contenuto del file
        $coder = self::INPUT_CODERS[$fileExt] ?? $fileExt;
        if (!in_array($coder, $supported_formats))
          throw $this->createNotFoundException('Formato non supportato!');

        // inizializzazione imagick
        $this->setImagickLimits();
        $img = new \Imagick();
        $img->readImage($coder . ':' . $filePath);

        $img->stripImage(); // Strips an image of all profiles and comments

        if(isset($params['crop']) or isset($params['bb'])) {
          // dimensioni originali
          $ow = $img->getImageWidth();
          $oh = $img->getImageHeight();
        }


        if(isset($params['crop'])) {
          // formato già validato in cleanParams: x,y,w,h interi, w e h maggiori di zero
          [$x,$y,$crop_w,$crop_h] = array_map('intval', explode(',', $params['crop']));

          // l'area ritagliata non può essere più grande dell'immagine
          if($x + $crop_w > $ow or $y + $crop_h > $oh) {
            throw $this->createNotFoundException('Errore di configurazione! (crop 2)');
          }

          $img->cropImage($crop_w, $crop_h, $x, $y);

          // nuove dimensioni dell'immagine (corrispondono a $crop_w e $crop_h)
          $ow = $img->getImageWidth();
          $oh = $img->getImageHeight();
        }

        if (isset($params['bb'])) {
          // formato già validato in cleanParams: [larghezza]x[altezza]
          $bb_param = $params['bb'];
          $bb_has_x = strpos($bb_param, 'x') !== false;

          if ($bb_has_x) {
            // dimensioni richieste
            // se un parametro è mancante viene impostato a 0 e non ha influenza nelle elaborazioni successive
            [$w, $h] = array_map('intval', explode('x', $bb_param));

            // le dimensioni richieste non possono superare quelle originali
            if ($w > $ow) $w = $ow;
            if ($h > $oh) $h = $oh;
          }
        }

        // fd => l'immagine deve rispettare con precisione le dimensioni richieste
        // è necessario che siano presenti entrambi i parametri bb
        if (isset($params['bb']) && isset($params['fd']) && $bb_has_x && $w > 0 && $h > 0) {

          if ($ow < $w && $oh < $h) {
            $nb = $ow;
            $nh = $oh;

            if ($w > $h) {
              $r = $h / $w;
            } else {
              $r = $w / $h;
            }

            if ($nb > $nh) {
              $nh = $r * $nb;
            } else {
              $nb = $r * $nh;
            }

            $w = $nb;
            $h = $nh;

          }

          $img->cropThumbnailImage($w, $h);
          // $img->resizeImage($w, $h, \imagick::FILTER_GAUSSIAN, 0);

        } elseif (isset($params['bb']) && $bb_has_x) {

          if ($w != 0 || $h != 0) {
            $nb = $ow;
            $nh = $oh;
            if ($w != 0 && $w < $nb) {
              $nh = ($w / $nb) * $nh;
              $nb = $w;
            }

            if ($h != 0 && $h < $nh) {
              $nb = ($h / $nh) * $nb;
              $nh = $h;
            }

            $w = $nb;
            $h = $nh;
          }
          $img->thumbnailImage($w, $h, true);
          // $img->resizeImage($w, $h, \imagick::FILTER_GAUSSIAN, 0);
        }

        // compressione immagine
        if ($compressionQuality) {
          $img->setImageCompressionQuality($compressionQuality);
        }
        //$img->setImageAlphaChannel(\imagick::COMPOSITE_CLEAR);
        //$img->setBackgroundColor(new \ImagickPixel('white'));

        // formato immagine

        $img->setImageFormat($format);

        // $mimeType = $img->getImageMimeType();
        $mimeType = self::ALLOWED_FORMATS[$format];


        /*if ($format == 'webp') {
          // per i webp non posso recuperare direttamente il mime type con il metodo
          $mimeType = 'image/webp';

          //$img->setImageAlphaChannel(\imagick::COMPOSITE_CLEAR);
          //$img->setBackgroundColor(new \ImagickPixel('transparent'));

        } else if ($format == 'pjpeg') {
          $mimeType = 'image/jpeg';

        } else  */

        if ($format == 'ico') {
          $img->setImageAlphaChannel(\imagick::COMPOSITE_CLEAR);
          $img->setBackgroundColor(new \ImagickPixel('transparent'));
          $img->cropThumbnailImage(16, 16);
          // $mimeType = self::ALLOWED_FORMATS['ico']; //'image/vnd.microsoft.icon';

        } else if ($format == 'png') {
          if (isset($params['alpha']) && isset($params['bg'])) {
            $bgColor = '#' . $params['bg'];
            // elimino la trasparenza
            //$img->setImageAlphaChannel(\imagick::COMPOSITE_CLEAR);
            $img->setImageBackgroundColor($bgColor);
            $img = $img->flattenImages();

          } else {
            //$bgColor = '#ffffff';
            //$img->setImageAlphaChannel(\imagick::COMPOSITE_CLEAR);
            //$img->setBackgroundColor(new \ImagickPixel('transparent'));

            $draw = new \ImagickDraw();
            $draw->setStrokeAntialias(false);
            $img->drawImage($draw);
          }
        }

        /* scrittura atomica: scrivo su un file temporaneo e poi lo rinomino,
        così una richiesta concorrente non legge mai un file scritto a metà */
        $tmpfile = $cachefile . '.' . bin2hex(random_bytes(4)) . '.tmp';
        $img->writeImage($format . ':' . $tmpfile);
        $img->clear();
        $img->destroy();

        if (!rename($tmpfile, $cachefile)) {
          @unlink($tmpfile);
          throw new \RuntimeException('Impossibile scrivere il file di cache');
        }

      } else {

        $mimeType = self::ALLOWED_FORMATS[$format];
      }



    // nessuna elaborazione richiesta: restituisce il file originale
    } else {

      $cachefile = $filePath;
      // $fileCacheName = $fileBasename . '.' . $fileExt;
      $fileCacheName = str_replace('/', '_', $relPath);

      if ($fileExt == 'svg')
        $mimeType = 'image/svg+xml';
    }


    $response = new BinaryFileResponse($cachefile);

    // content type esplicito (ricavato dal contenuto del file se non già definito)
    if (!isset($mimeType)) {
      $mimeType = MimeTypes::getDefault()->guessMimeType($cachefile) ?? 'application/octet-stream';
    }
    $response->headers->set('Content-Type', $mimeType);

    // il browser non deve dedurre un content type diverso da quello dichiarato
    $response->headers->set('X-Content-Type-Options', 'nosniff');

    // contenuti potenzialmente eseguibili (svg) aperti in una sandbox senza script
    $response->headers->set('Content-Security-Policy', self::SANDBOX_CSP);

    $fileCacheNameFallback = preg_replace('/[^\x20-\x7e]|[%\/\\\\]/', '_', $fileCacheName);
    $response->setContentDisposition($disposition, str_replace('\\', '_', $fileCacheName), $fileCacheNameFallback);

    // cache http (browser e cdn), stessa durata della cache su disco
    $response->setPublic();
    $response->setMaxAge($cache_lifetime);

    // con il formato automatico la risposta dipende dall'header Accept del browser
    if ($autoFormat) {
      $response->setVary('Accept');
    }

    return $response;

    //return array();

  }

  /**
   * Filtra i parametri get del viewer: scarta quelli non ammessi e quelli con valori non validi,
   * e normalizza i valori, così da usarli in sicurezza anche nel nome del file di cache.
   *
   * @param array $params parametri get grezzi
   * @return array parametri validati
   *
   * @example
   * $this->cleanParams([
   *   'bb'      => '300x200',     // [larghezza]x[altezza], 0-4 cifre ciascuna
   *   'crop'    => '0,0,100,100', // x,y,w,h interi, w e h > 0
   *   'q'       => '70',          // 1-100, default DEFAULT_COMPRESSION_QUALITY (60)
   *   'bg'      => 'ffffff',      // esadecimale a 6 cifre
   *   'f'       => 'webp',        // chiave di ALLOWED_FORMATS, default auto
   *   'refresh' => '1',           // solo in ambiente dev
   *   'raw' => '', 'fd' => '', 'alpha' => '', 'ext' => '', 'd' => '', // flag: conta la sola presenza
   * ]);
   * // -> ['bb' => '300x200', 'crop' => '0,0,100,100', 'q' => 70, 'bg' => 'ffffff', 'f' => 'webp', 'raw' => 1, ...]
   */
  protected function cleanParams(array $params): array {

    $clean = [];

    foreach ($params as $key => $value) {
      if(!in_array($key, self::ALLOWED_PARAMS, true) || !is_scalar($value)) {
        continue;
      }

      $value = strtolower(trim((string) $value));

      if(in_array($key, self::FLAG_PARAMS, true)) {
        $clean[$key] = 1;
        continue;
      }

      switch ($key) {
        case 'bb':
          if(preg_match('/^\d{0,4}x\d{0,4}$/', $value)) {
            $clean[$key] = $value;
          }
          break;

        case 'crop':
          if(preg_match('/^\d{1,5},\d{1,5},\d{1,5},\d{1,5}$/', $value)) {
            $crop = array_map('intval', explode(',', $value));
            if($crop[2] > 0 && $crop[3] > 0) {
              $clean[$key] = implode(',', $crop);
            }
          }
          break;

        case 'q':
          if(ctype_digit($value) && (int) $value >= 1 && (int) $value <= 100) {
            $clean[$key] = (int) $value;
          }
          break;

        case 'bg':
          if(preg_match('/^[0-9a-f]{6}$/', $value)) {
            $clean[$key] = $value;
          }
          break;

        case 'f':
          if(array_key_exists($value, self::ALLOWED_FORMATS)) {
            // solo dev: AVIF sostituito da WebP (test crash Chrome, vedi CLAUDE.md)
            if($value === 'avif' && $this->getParameter('kernel.environment') === 'dev' && self::DEV_NO_AVIF) {
              $value = 'webp';
            }
            $clean[$key] = $value;
          }
          break;

        case 'refresh':
          if($this->getParameter('kernel.environment') === 'dev') {
            $clean[$key] = 1;
          }
          break;
      }
    }

    return $clean;
  }

  /**
   * Ricava dal parametro `src` il percorso del file, verificando che sia un'immagine
   * all'interno di una delle dir di ALLOWED_SRC_DIRS (impedisce il path traversal).
   * Se il file non esiste o non è ammesso genera un 404.
   *
   * @param Request $request
   * @return array [percorso assoluto, percorso relativo a public con lo slash iniziale]
   *
   * @example
   * // /iviewer?src=/build/imgs/foto.webp
   * [$filePath, $relPath] = $this->resolveSrc($request);
   * // -> ['/var/www/progetto/public/build/imgs/foto.webp', '/build/imgs/foto.webp']
   */
  private function resolveSrc(Request $request): array
  {
    $src = $request->query->all()['src'] ?? null;

    if (!is_string($src) || $src === '')
      throw $this->createNotFoundException('Parametro mancante! (src)');

    $publicPath = realpath($this->getParameter('kernel.project_dir') . '/public');
    $filePath = realpath($publicPath . '/' . ltrim($src, '/'));

    $allowedExt = array_merge(self::ALLOWED_INPUT, array_keys(self::ALLOWED_FORMATS), self::ALLOWED_RAW);

    if ($filePath === false ||
      !is_file($filePath) ||
      !in_array(strtolower(pathinfo($filePath, PATHINFO_EXTENSION)), $allowedExt, true)
    )
      throw $this->createNotFoundException('Risorsa non disponibile!');

    foreach (self::ALLOWED_SRC_DIRS as $dir) {
      $allowedDir = realpath($publicPath . '/' . $dir);

      if ($allowedDir !== false && str_starts_with($filePath, $allowedDir . DIRECTORY_SEPARATOR)) {
        return [$filePath, substr($filePath, strlen($publicPath))];
      }
    }

    throw $this->createNotFoundException('Risorsa non disponibile!');
  }

  /**
   * Imposta i limiti delle risorse di Imagick (IMAGICK_LIMITS); i tipi di risorsa
   * non disponibili nella versione installata vengono ignorati.
   *
   * @example
   * $this->setImagickLimits(); // memory 256MB, map 512MB, area 64Mpx, width/height 16000px
   */
  private function setImagickLimits(): void
  {
    $types = [
      'memory' => 'RESOURCETYPE_MEMORY',
      'map'    => 'RESOURCETYPE_MAP',
      'area'   => 'RESOURCETYPE_AREA',
      'width'  => 'RESOURCETYPE_WIDTH',
      'height' => 'RESOURCETYPE_HEIGHT',
    ];

    foreach ($types as $key => $const) {
      if (defined('\Imagick::' . $const)) {
        \Imagick::setResourceLimit(constant('\Imagick::' . $const), self::IMAGICK_LIMITS[$key]);
      }
    }
  }

  // restituisce un json con le info dell'immagine indicata
  #[Route(path: '/iviewer-info', name: 'img_viewer_info')]
    public function iviewerInfo(Request $request)
    {
      [$filePath] = $this->resolveSrc($request);

      $img_info = getimagesize($filePath);

      $response = new JsonResponse();
      $response->setData($img_info);

      return $response;

    }
}
