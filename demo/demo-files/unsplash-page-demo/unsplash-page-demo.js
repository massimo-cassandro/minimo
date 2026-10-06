// @ts-nocheck

import { homeLink } from '../../demo.js';

import { unsplashPage } from '@src/components/unsplash-page/unsplash-page.js';

export async function unsplashPageDemo(){

  const isLocal = window.location.origin.match('localhost') !== null,
    unsplashDataUrl = isLocal
      ? 'http://localhost:8100/demo-files/unsplash-page-demo/getUnsplashPhotosLocal.php' // local test only
      : 'https://primominuto.altervista.org/proxy/getUnsplashPhotos.php';

  /*
    controllo aggiuntivo, solo per la demo: segnala se il server PHP locale non è attivo (o se un altro
    server occupa la porta) invece di lasciare lo spinner girare all'infinito. Usa una richiesta HEAD
    per non consumare una chiamata alle API di Unsplash solo per il controllo
  */
  if(isLocal) {
    try {
      const response = await fetch(unsplashDataUrl, {method: 'HEAD'}),
        contentType = response.headers.get('content-type') ?? '';
      if(!response.ok || !contentType.includes('application/json')) {
        throw new Error('unexpected response from local PHP server');
      }
    } catch {
      window.alert('Il server PHP su localhost:8100 non risulta attivo: avvialo per visualizzare questa demo.');
      return;
    }
  }

  console.log(homeLink);

  unsplashPage({
    targetElement    : document.getElementById('root'),
    unsplashDataUrl,
    utmSource        : 'unsplashPageDemo test',
    title            : 'Unsplash Page Demo',
    text             : 'This is the message <strong>text</strong>',
    backLink         : `<a href="${homeLink}">Back to demo index</a>`,
    hidePhotoLink    : true,
    cssModulesObj    : null
  });
}
