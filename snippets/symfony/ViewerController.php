<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
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

        $isSvg = false;
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

            if($file !== null) {

                $isSvg = true;

            } else {

                # se non trovo l'svg predefinito cerco il bitmap predefinito
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

        } else {

            # cerco il bitmap predefinito
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

            if($isSvg) {
            $params = array(
                'id' => $file->getFile()->getId()
            );
            } else {

            $params = array(
                'id' => $file->getFile()->getId(),
                'request' => $request
            );

            }

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
   * @param q: compression quality (ex jq)
   * @param alpha: mantiene la trasparenza nelle png (default 0)
   * @param bg: in combinazione con alpha=1 definisce il bkg color della png
   * @param refresh: forza la rigenerazione dell'immagine
   * @param f: definisce il formato dell'immagine: pjpeg (default), jpeg, gif, png, webp, ico
   * @param ext: lascia inalterato il formato dell'immagine
   * @param d: forza il download dell'immagine
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


  #[Route('/viewer/{id}')]
  public function index(Request $request, $id = null)
  {
    $em = $this->managerRegistry->getManager();

    $get = $request->query->all();

    // formati supportati dall'istanza imageMagick
    $supported_formats = array_map("strtolower", \imagick::queryFormats());

    // formati accettati dal browser
    $accept = $request->server->get('HTTP_ACCEPT');

    // format 'auto' default
    if(!isset($get['f'])) {
      $get['f'] ='auto';
    } else {
      $get['f'] = strtolower($get['f']);
    }

    // format 'auto' -> sceglie il formato migliore per il browser, se disponibile
    if(isset($get['f']) && $get['f'] == 'auto') {

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

    if($get['f'] == 'auto') $get['f'] = 'jpeg';

    ## durata della cache di un file: 7gg ##
    $cache_lifetime = 604800;

    $params = $this->cleanParams($get);

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

      $string = $dbfile->getNome();

      $fileNm = substr($string, 0, strripos($string, '.'));
      $fileExt = substr($string, strripos($string, '.') + 1, strlen($string)) ;

    } else
      throw $this->createNotFoundException('Risorsa non disponibile!!');

    if($dbfile->getIsImg()) {

      $disposition = isset($params['d']) ? 'attachment' : 'inline';

      // if($this->getParameter('local_test') == true && isset($params['f']) && $params['f'] == 'webp') {
      //   unset($params['f']);
      // }

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

        $filename = $fileNm . $cache_params_str . '.' . ($format == 'pjpeg' ? 'jpeg' : $format);

        $cachefile = $this->getParameter('cache_dir') . $dbfile->getId() . '_' . $filename;

        ## definizione della qualità della compressione dell'immagine ##
        $compressionQuality = isset($params['q']) && $params['q'] > 0 ? $params['q'] : self::DEFAULT_COMPRESSION_QUALITY;

        ## elaborazione con imagick per i seguenti casi:
        ## 1) non esiste il file nella cartella cache
        ## 2) la cache è scaduta
        ## 3) forzo il refresh
        if(!file_exists($cachefile) || (filemtime($cachefile)+$cache_lifetime) < time() || isset($params['refresh'])) {

          ## inizializzazione imagick ##
          $img = new \Imagick();
          $img->readImage($file);

          $img->stripImage();

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

          if(isset($params['bb'])) {
            $bb_param = strtolower($params['bb']);
            $pox = strpos($bb_param, 'x');

            if($pox !== false) {
              $b = ($pox > 0) ? substr($bb_param, 0, $pox) : 0;
              $h = (($pox + 1) < strlen($bb_param)) ? substr($bb_param, $pox + 1) : 0;

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
                if(isset($params['alpha']) && isset($params['bg']) && preg_match('/[0-9a-f]{6}/i', $params['bg'])) {
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

          $img->writeImage($cachefile);
          $img->clear();
          $img->destroy();

        } else {

          // $mimeTypeArray = array(
          //   'pjpeg' =>  'image/jpeg',
          //   'jpeg'  =>  'image/jpeg',
          //   'jpg'   =>  'image/jpeg',
          //   'png'   =>  'image/png',
          //   'gif'   =>  'image/gif',
          //   'webp'  =>  'image/webp',
          //   'ico'   =>  'image/vnd.microsoft.icon'
          // );
          // $mimeType = $mimeTypeArray[$format];
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
    $response->trustXSendfileTypeHeader();

    if(isset($mimeType)) {
      $response->headers->set('Content-Type', $mimeType);
    }

    $response->headers->set('Content-Disposition', $disposition . '; filename = ' . $filename);

    return $response;

    //return array();
  }

  protected function cleanParams($params)
  {

    // compatibilità con vecchio parametro jq
    if(isset($params['jq']) && !isset($params['q'])) {
      $params['q'] = $params['jq'];
    }

    $array_filters = array('raw', 'bb', 'fd', 'jq', 'alpha', 'bg', 'refresh', 'f', 'd', 'ext', 'og');

    #array_walk($params, create_function('&$val', '$val = trim($val);'));
    // array_walk($params, function($val): string {
    //     return trim($val);
    // });

    // foreach ($params as $key => $value)
    // {
    //   if (!(in_array($key, $array_filters) && $value)) {
    //     unset($params[$key]);
    //   }
    // }

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

}
