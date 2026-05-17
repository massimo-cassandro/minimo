<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;



class ImgViewerController extends AbstractController
{
  /**
   *
   * @param src: (string) path immagine
   * @param raw: (bool) nessuna eleborazione (no image magick)
   * @param crop: ritaglia l'immagine originale (prima dell'eventuale ridimensionamento con bb)
   *              secondo i parametri forniti: x,y (origine immagine), w,h (dimensioni ritaglio)
   *              es: crop=10,10,100,100 -> ritaglia un quadrato di 100px a partire dal punto 10,10
   * @param bb: bounding box dell'area che deve contenere l'immagine ridimensionata
   * @param fd: (bool) forza dimensioni (utilizzato in coppia con bb)
   * @param q: compression quality
   * @param alpha: mantiene la trasparenza nelle png (default 0)
   * @param bg: in combinazione con alpha=1 definisce il bg color della png
   * @param refresh: (bool) forza la rigenerazione dell'immagine
   * @param f: definisce il formato dell'immagine, secondo le chiavi di ALLOWED_FORMATS
   *           il valore 'auto' (default) imposta il formato migliore secondo i valori in PREFERRED_AUTO_FORMATS
   * @param ext: lascia inalterato il formato dell'immagine
   * @param d: (bool) forza il download dell'immagine
   */

  // parametri get del viewer accettati
  const ALLOWED_PARAMS = array('raw', 'bb', 'fd', 'q', 'alpha', 'bg', 'refresh', 'f', 'ext', 'd', 'crop');
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

  // formati input accettati da Imagick (in aggiunta a quelli definiti in ALLOWED_FORMATS)
  const ALLOWED_INPUT = ['bmp', 'tiff', 'tif'];

  // parametro compression quality di default
  const DEFAULT_COMPRESSION_QUALITY = 60;

  // src -> percorso assoluto dentro la dir public con gli slash
  #[Route(path: '/iviewer', name: 'img_viewer')]
  public function indexAction(Request $request)
  {


    $get = $request->query->all();
    $src = $get['src'];

    if (!$src)
      throw $this->createNotFoundException('Parametro mancante! (src)');

    // formati supportati dall'istanza imageMagick
    $supported_formats = array_map("strtolower", \imagick::queryFormats());

    // formati accettati dal browser
    $accept = $request->server->get('HTTP_ACCEPT');

    // format 'auto' default
    if(!isset($get['f'])) $get['f'] = 'auto';

    // format 'auto' -> sceglie il formato migliore per il browser, se disponibile
    if(isset($get['f']) && strtolower($get['f']) == 'auto') {

      foreach(self::PREFERRED_AUTO_FORMATS as $f) {
        if(strpos($accept, self::ALLOWED_FORMATS[$f]) !== false &&
          in_array($f, array_keys(self::ALLOWED_FORMATS)) &&
          in_array($f, $supported_formats)
        ) {
          $get['f']=$f;
          break;
        }
      }
    }


    // durata della cache dei file: 7gg
    $cache_lifetime = 604800;

    $params = $this->cleanParams($get);

    $cache_params_str = "";

    // parte del nome file del cache formata da tutti i parametri concatenati tra loro
    foreach ($params as $kg => $g) {
      if ($kg != 'refresh' && $kg != 'raw')
        $cache_params_str .= '_' . $kg . $g;
    }
    $cache_params_str = str_replace(',', '_',  $cache_params_str);


    $publicPath = $this->getParameter('kernel.project_dir') . '/public';
    $filePath = $publicPath . $src;

    $fileExt = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    // $fileBasename = strtolower(pathinfo($filePath, PATHINFO_BASENAME));
    // $fileCacheName = $fileBasename; // porzione inziale del nome del file di cache
    $fileCacheName = str_replace('/', '_', $src); // porzione inziale del nome del file di cache


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
      $compressionQuality = !empty($params['q']) ? intval($params['q']) : self::DEFAULT_COMPRESSION_QUALITY;


      // elaborazione con imagick per i seguenti casi:
      // 1) non esiste il file nella cartella cache
      // 2) la cache è scaduta
      // 3) è richiesto il refresh
      if (!file_exists($cachefile) || (filemtime($cachefile) + $cache_lifetime) < time() || isset($params['refresh'])) {

        // inizializzazione imagick
        $img = new \Imagick();
        $img->readImage($filePath);

        $img->stripImage(); // Strips an image of all profiles and comments

        if(isset($params['crop']) or isset($params['bb'])) {
          // dimensioni originali
          $ow = $img->getImageWidth();
          $oh = $img->getImageHeight();
        }


        if(isset($params['crop'])) {
          $crop_params = array_map( fn($val) => intval(trim($val)), explode(',', $params['crop']));

          // devono essere presenti tutti e 4 i parametri e devono essere maggiori di zero
          if(count($crop_params) != 4 or min($crop_params) < 0) {
            throw $this->createNotFoundException('Errore di configurazione! (crop 1)');
          }

          [$x,$y,$crop_w,$crop_h] = $crop_params;

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
          $bb_param = strtolower($params['bb']);
          $bb_has_x = strpos($bb_param, 'x') !== false;

          if ($bb_has_x) {
            // dimensioni richieste
            // se un parametro è mancante viene impostato a 0 e non ha influenza nelle elaborazioni successive
            [$w, $h] = array_map( fn($val) => $val? (int)$val : 0, explode('x', $bb_param));

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
          $mimeType = 'png';
          if (isset($params['alpha']) && isset($params['bg']) && preg_match('/[0-9a-f]{6}/i', $params['bg'])) {
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

        $img->writeImage($cachefile);
        $img->clear();
        $img->destroy();

      } else {

        $mimeType = self::ALLOWED_FORMATS[$format];
      }



    // nessuna elaborazione richiesta: restituisce il file originale
    } else {

      $cachefile = $filePath;
      // $fileCacheName = $fileBasename . '.' . $fileExt;
      $fileCacheName = str_replace('/', '_', $src);

      if ($fileExt == 'svg')
        $mimeType = 'image/svg+xml';
    }


    $response = new BinaryFileResponse($cachefile);
    $response->trustXSendfileTypeHeader();

    if (isset($mimeType)) {
      $response->headers->set('Content-Type', $mimeType);
    }

    $response->headers->set('Content-Disposition', $disposition . '; filename = ' . $fileCacheName);

    return $response;

    //return array();

  }

  protected function cleanParams($params) {

    //compatibilità con vecchio parametro jq
    // if(isset($params['jq']) && !isset($params['q'])) {
    //   $params['q'] = $params['jq'];
    // }

    // array_walk($params, create_function('&$val', '$val = trim($val);'));
    // array_walk($params, function ($val): string {
    //   return trim($val);
    // });


    foreach ($params as $key => $value) {
      if(!in_array($key, self::ALLOWED_PARAMS)) {
        unset($params[$key]);
      } else if($value) {
        $params[$key] = trim($value);
      }
    }

    if(isset($params['f'])) {
      $params['f'] = strtolower($params['f']);
    }

    return $params;
  }

  // restituisce un json con le info dell'immagine indicata
  #[Route(path: '/iviewer-info', name: 'img_viewer_info')]
    public function iviewerInfo(Request $request)
    {
      $get = $request->query->all();
      $src = $get['src'];

      if (!$src)
        throw $this->createNotFoundException('iviewer-info: Parametro mancante! (src)');

      $publicPath = $this->getParameter('kernel.project_dir') . '/public';
      $filePath = $publicPath . $src;

      $img_info = getimagesize($filePath);

      $response = new JsonResponse();
      $response->setData($img_info);

      return $response;

    }
}
