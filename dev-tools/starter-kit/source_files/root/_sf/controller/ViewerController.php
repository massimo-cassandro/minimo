<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Mime\MimeTypes;
use Doctrine\Persistence\ManagerRegistry;
use App\Entity\Files\Files;
use App\Entity\Files\MarchiFamiglie;
use App\Entity\Files\MarchiTipologie;
use App\Entity\Files\MarchiFiles;

class ViewerController extends AbstractController
{
    public function __construct(private \Doctrine\Persistence\ManagerRegistry $managerRegistry)
    {
    }

    #[Route('/viewer/marchi/{famigliaId}')]
    public function marchi(Request $request, $famigliaId = null)
    {
        $em = $this->managerRegistry->getManager();

        $get = $request->query->all();

        $famiglia =  $em->getRepository(MarchiFamiglie::class)->find($famigliaId);

        if(!$famiglia instanceof \App\Entity\Files\MarchiFamiglie)
            throw $this->createNotFoundException('Famiglia non trovata!!');

        $tipoBitmap =  $em->getRepository(MarchiTipologie::class)->find(1); // Bitmap
        $tipoSvg =  $em->getRepository(MarchiTipologie::class)->find(2); // Svg

        $file = null;
        if(isset($get['svg']) && $get['svg']) {

            # in prima battuta cerco l'svg predefinito
            $file = $em->getRepository(MarchiFiles::class)->findOneBy(
                array(
                    'famiglia'    =>  $famiglia,
                    'predefinito' =>  1,
                    'cancellato'  =>  0,
                    'tipologia'   =>  $tipoSvg
                ),
                array()
            );

        }

        # cerco il bitmap predefinito (se non è richiesto l'svg o se l'svg predefinito non esiste)
        if($file === null) {
            $file = $em->getRepository(MarchiFiles::class)->findOneBy(
            array(
                'famiglia'    =>  $famiglia,
                'predefinito' =>  1,
                'cancellato'  =>  0,
                'tipologia'   =>  $tipoBitmap
            ),
            array()
            );
        }

        if($file !== null) {

            $params = array(
                'id' => $file->getFile()->getId()
            );

            # se non è richiesto un formato, lo forzo a png #
            if(!array_key_exists('f', $get)) {
            $request->query->set('f', 'png');
            }

            if(array_key_exists('og', $get)) {
            if ($get['og'] == 'q') {
                $request->query->set('og', 'q');
            } elseif ($get['og'] == 'r') {
                $request->query->set('og', 'r');
            } else
                $request->query->set('og', 'q');
            }

            return $this->forward('App\Controller\ViewerController::index', $params);

        } else {

            throw $this->createNotFoundException('Risorsa non trovata!!');

        }

    }

  /**
   * @param raw: nessuna eleborazione (no image magick)
   * @param crop: ritaglia l'immagine originale (prima dell'eventuale ridimensionamento con bb)
   *              secondo i parametri forniti: x,y (origine immagine), w,h (dimensioni ritaglio)
   *              es: crop=10,10,100,100 -> ritaglia un quadrato di 100px a partire dal punto 10,10
   * @param bb: bounding box dell'area che deve contenere l'immagine ridimensionata (image magick)
   * @param fd: forza dimensioni (utilizzato in coppia con bb)
   * @param q: compression quality 1-100 (ex jq)
   * @param alpha: mantiene la trasparenza nelle png (default 0)
   * @param bg: in combinazione con alpha=1 definisce il bkg color della png (esadecimale a 6 cifre)
   * @param refresh: forza la rigenerazione dell'immagine (solo in ambiente dev)
   * @param f: definisce il formato dell'immagine: auto (default), pjpeg, jpeg, gif, png, webp, avif, ico
   * @param ext: lascia inalterato il formato dell'immagine
   * @param d: forza il download dell'immagine
   * @param og: immagine per structured data / open graph: q (quadrata 600x600), r (rettangolare 1000x500)
   */

  // parametri get del viewer accettati
  const ALLOWED_PARAMS = array('raw', 'bb', 'fd', 'q', 'alpha', 'bg', 'refresh', 'f', 'ext', 'd', 'crop', 'og');
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

  // header CSP per i contenuti che il browser potrebbe eseguire (svg, html, ecc.)
  const SANDBOX_CSP = "default-src 'none'; style-src 'unsafe-inline'; sandbox";


  #[Route('/viewer/{id}', name: 'betogether_viewer')]
  public function index(Request $request, $id = null)
  {
    $em = $this->managerRegistry->getManager();

    // formati supportati dall'istanza imageMagick
    $supported_formats = array_map("strtolower", \imagick::queryFormats());

    // formati accettati dal browser
    $accept = (string) $request->headers->get('Accept', '');

    ## durata della cache di un file: 30gg ##
    $cache_lifetime = 2592000;

    $params = $this->cleanParams($request->query->all());

    // format 'auto' (default, o formato richiesto non valido) -> sceglie il formato migliore per il browser, se disponibile
    $autoFormat = !isset($params['f']);
    if($autoFormat) {

      $params['f'] = 'jpeg';

      foreach(self::PREFERRED_AUTO_FORMATS as $f) {
        if(strpos($accept, self::ALLOWED_FORMATS[$f]) !== false &&
          in_array($f, $supported_formats)
        ) {
          $params['f'] = $f;
          break;
        }
      }
    }

    $cache_params_str = "";

    foreach($params as $kg => $g)
    {
      if($kg != 'refresh' && $kg != 'raw')
        $cache_params_str .= '_' . $kg . $g;
    }
    // pulizia virgole del parametro crop
    $cache_params_str = str_replace(',', '_',  $cache_params_str);

    if(!$id)
      throw $this->createNotFoundException('Errore di configurazione!!');

    $dbfile = $em->getRepository(Files::class)->findOneBy(
      array('id' => $id, 'autenticazione' => 0),
      array()
    );

    if($dbfile !== null) {
      $folder = $this->getParameter('files_dir') . ((int)($dbfile->getId() / 1000));
      $file = $folder . '/' . $dbfile->getId() . '_' . $dbfile->getNome();

      ## record presente nel db ma file mancante su disco ##
      if(!is_file($file))
        throw $this->createNotFoundException('Risorsa non disponibile!!');

      $string = $dbfile->getNome();

      $fileNm = substr($string, 0, strripos($string, '.'));
      $fileExt = substr($string, strripos($string, '.') + 1, strlen($string)) ;

    } else
      throw $this->createNotFoundException('Risorsa non disponibile!!');

    if($dbfile->getIsImg()) {

      $disposition = isset($params['d']) ? 'attachment' : 'inline';

      $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));

      ## elaborazione immagine se ho dei parametri, non è settato raw ed ha un formato trattabile da imagick
      if(!isset($params['raw']) && in_array($ext, array_merge(self::ALLOWED_INPUT, array_keys(self::ALLOWED_FORMATS)))) {

        ## se è richiesto un formato verifico cher sia tra quelli disponibili ##
        if (isset($params['f']) && in_array(strtolower($params['f']), array_keys(self::ALLOWED_FORMATS))) {
          $format = strtolower($params['f']);
        } elseif (isset($params['ext']) && $params['ext']) {
          ## formato predefinito ##
          $format = $ext;
        } elseif (in_array($ext, array_keys(self::ALLOWED_FORMATS))) {
          ## formato predefinito ##
          $format = $ext;
        } else {
          ## formato predefinito ##
          $format = 'pjpeg';
        }

        ## se il formato non è supportato dall'istanza imagick o non è tra i formati di output uso jpeg ##
        if (!in_array($format, $supported_formats) || !array_key_exists($format, self::ALLOWED_FORMATS)) {
          $format = 'jpeg';
        }

        $filename = $fileNm . $cache_params_str . '.' . ($format == 'pjpeg' ? 'jpeg' : $format);

        $cachefile = $this->getParameter('cache_dir') . $dbfile->getId() . '_' . $filename;

        ## definizione della qualità della compressione dell'immagine ##
        $compressionQuality = $params['q'] ?? self::DEFAULT_COMPRESSION_QUALITY;

        ## elaborazione con imagick per i seguenti casi:
        ## 1) non esiste il file nella cartella cache
        ## 2) la cache è scaduta
        ## 3) il file originale è più recente della cache
        ## 4) forzo il refresh
        if(!file_exists($cachefile) ||
          (filemtime($cachefile)+$cache_lifetime) < time() ||
          filemtime($cachefile) < filemtime($file) ||
          isset($params['refresh'])
        ) {

          ## il coder di lettura è forzato dall'estensione, così Imagick non sceglie il formato dal contenuto del file ##
          $coder = self::INPUT_CODERS[$ext] ?? $ext;
          if(!in_array($coder, $supported_formats))
            throw $this->createNotFoundException('Formato non supportato!!');

          ## inizializzazione imagick ##
          $this->setImagickLimits();
          $img = new \Imagick();
          $img->readImage($coder . ':' . $file);

          $img->stripImage();

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

          if(isset($params['bb'])) {
            // formato già validato in cleanParams: [larghezza]x[altezza]
            $bb_param = $params['bb'];
            $pox = strpos($bb_param, 'x');

            if($pox !== false) {
              [$b, $h] = array_map('intval', explode('x', $bb_param));

              $ob = $img->getImageWidth();
              $oh = $img->getImageHeight();

              // le nuove dimensioni non possono superare quelle originali
              //if(!isset($params['fr'])) {
              if($b > $ob) $b = $ob;
              if($h > $oh) $h = $oh;
              //}
            }

          }

          if(isset($params['bb']) && isset($params['fd']) && $pox !== false && $b>0 && $h>0) {

            if ($ob < $b && $oh < $h && ($b != 0 && $h != 0)) {
                $nb = $ob;
                $nh = $oh;
                $r = $b > $h ? $h/$b : $b/$h;
                if($nb > $nh)
                  $nh = $r * $nb;
                else
                  $nb = $r * $nh;
                $b = $nb;
                $h = $nh;
            }
            $img->cropThumbnailImage($b, $h);

          } elseif(isset($params['bb']) && $pox !== false) {

            if($b != 0 || $h != 0) {
              $nb = $ob;
              $nh = $oh;
              if($b != 0 && $b < $nb) {
                $nh = ($b/$nb) * $nh;
                $nb = $b;
              }

              if($h != 0 && $h < $nh) {
                $nb = ($h/$nh) * $nb;
                $nh = $h;
              }

              $b = $nb;
              $h = $nh;

            }
            $img->thumbnailImage($b, $h, true);

          }

          # structured data quadrata #
          if(isset($params['og']) && $params['og'] == 'q') {

            $img->scaleImage(600, 600, true);
            $img->setImageBackgroundColor('white');
            //$img = $img->flattenImages();

            $size = 600;
            $geometry = $img->getImageGeometry();
            $width = $geometry['width'];
            $height = $geometry['height'];

            $img->cropImage($width, $height, 0, 0);

            $img->extentImage($size, $size, -($size - $width) / 2, -($size - $height) / 2);

          }

          # structured data rettangolare #
          if(isset($params['og']) && $params['og'] == 'r') {

            $sizeW = 1000;
            $sizeH = 500;

            $img->scaleImage($sizeW, $sizeH, true);
            $img->setImageBackgroundColor('white');
            //$img = $img->flattenImages();

            $geometry = $img->getImageGeometry();
            $width = $geometry['width'];
            $height = $geometry['height'];

            $img->cropImage($width, $height, 0, 0);

            $img->extentImage($sizeW, $sizeH, -($sizeW - $width) / 2, -($sizeH - $height) / 2);

          }

          ## eseguo l'eventuale compressione solo nel caso di jpeg ##
          if($compressionQuality && ($img->getImageMimeType() == 'image/jpeg')) {

            $img->setImageCompressionQuality((int) $compressionQuality);

          }
          //$img->setImageAlphaChannel(\imagick::COMPOSITE_CLEAR);
          //$img->setBackgroundColor(new \ImagickPixel('white'));

          ## definisco il formato dell'img ##
          if(isset($params['f'])) {

            $img->setImageFormat($format);

            // $mimeType = $img->getImageMimeType();
            $mimeType = self::ALLOWED_FORMATS[$format];

            if ($format == 'ico') {
              $img->setImageAlphaChannel(\imagick::COMPOSITE_CLEAR);
              $img->setBackgroundColor(new \ImagickPixel('transparent'));
              $img->cropThumbnailImage(16, 16);
              $mimeType = 'image/vnd.microsoft.icon';

            } elseif ($format == 'png') {

                // $mimeType = 'png';
                if(isset($params['alpha']) && isset($params['bg'])) {
                  $bgColor = '#' . $params['bg'];
                  ## elimino la trasparenza ##
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

          } /* else {

            $mimeType = 'image/jpeg';

          } */

          /* scrittura atomica: scrivo su un file temporaneo e poi lo rinomino,
          così una richiesta concorrente non legge mai un file scritto a metà */
          $tmpfile = $cachefile . '.' . bin2hex(random_bytes(4)) . '.tmp';
          $img->writeImage($format . ':' . $tmpfile);
          $img->clear();
          $img->destroy();

          if(!rename($tmpfile, $cachefile)) {
            @unlink($tmpfile);
            throw new \RuntimeException('Impossibile scrivere il file di cache');
          }

        } else {

          $mimeType = self::ALLOWED_FORMATS[$format];
        }

      } else {

        ## nessuna elaborazione richiesta: servo il file originale ##
        $cachefile = $file;
        $filename = $fileNm . '.' . $fileExt;

        if($ext == 'svg')
          $mimeType = 'image/svg+xml';
      }

    } else {

      ## gestisco un documento
      $cachefile = $file;
      $mimeType = null;
      $filename = $fileNm . '.' . $fileExt;
      $disposition = 'inline';

    }

    $response = new BinaryFileResponse($cachefile);

    ## content type esplicito (ricavato dal contenuto del file se non già definito) ##
    if(!isset($mimeType)) {
      $mimeType = MimeTypes::getDefault()->guessMimeType($cachefile) ?? 'application/octet-stream';
    }
    $response->headers->set('Content-Type', $mimeType);

    ## il browser non deve dedurre un content type diverso da quello dichiarato ##
    $response->headers->set('X-Content-Type-Options', 'nosniff');

    /* contenuti potenzialmente eseguibili (svg, html, ecc.) aperti in una sandbox senza script;
    esclusi i pdf, perché in una sandbox il visualizzatore di Chrome non si apre */
    if($mimeType !== 'application/pdf') {
      $response->headers->set('Content-Security-Policy', self::SANDBOX_CSP);
    }

    $filename = str_replace(['/', '\\'], '_', $filename);
    $filenameFallback = preg_replace('/[^\x20-\x7e]|%/', '_', $filename);
    $response->setContentDisposition($disposition, $filename, $filenameFallback);

    ## cache http (browser e cdn) per le immagini, stessa durata della cache su disco ##
    if($dbfile->getIsImg()) {
      $response->setPublic();
      $response->setMaxAge($cache_lifetime);

      // con il formato automatico la risposta dipende dall'header Accept del browser
      if($autoFormat) {
        $response->setVary('Accept');
      }
    }

    return $response;
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
   *   'bb'      => '300x200',   // [larghezza]x[altezza], 0-4 cifre ciascuna
   *   'crop'    => '0,0,100,100', // x,y,w,h interi, w e h > 0
   *   'q'       => '70',        // 1-100, default DEFAULT_COMPRESSION_QUALITY (60)
   *   'jq'      => '70',        // alias di q (compatibilità)
   *   'bg'      => 'ffffff',    // esadecimale a 6 cifre
   *   'f'       => 'webp',      // chiave di ALLOWED_FORMATS, default auto
   *   'og'      => 'q',         // q | r
   *   'refresh' => '1',         // solo in ambiente dev
   *   'raw' => '', 'fd' => '', 'alpha' => '', 'ext' => '', 'd' => '', // flag: conta la sola presenza
   * ]);
   * // -> ['bb' => '300x200', 'crop' => '0,0,100,100', 'q' => 70, 'bg' => 'ffffff', 'f' => 'webp', 'og' => 'q', 'raw' => 1, ...]
   */
  protected function cleanParams(array $params): array
  {

    // compatibilità con vecchio parametro jq
    if(isset($params['jq']) && !isset($params['q'])) {
      $params['q'] = $params['jq'];
    }

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

        case 'og':
          if($value === 'q' || $value === 'r') {
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
      if(defined('\Imagick::' . $const)) {
        \Imagick::setResourceLimit(constant('\Imagick::' . $const), self::IMAGICK_LIMITS[$key]);
      }
    }
  }

}
