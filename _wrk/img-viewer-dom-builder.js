/**
 * minimo: img-viewer-dom-builder
 * Produce un array da utilizzare con domBuilder per generare un tag `picture`
 *
 * @returns Array
 */

// TODO implementare getImgInfo (da ada)
// TODO detect se amabiente local per uso avif

/*
img_viewer_dom_builder({
  viewer_url: 'iviewer',
  sources: [
    {
      src: 'xxx',
      crop: null, // 'x,y,w,h',
      w: 100,
      h: 100,
      imgWidths: [100, 200, 300],
      mq: null, // '(max-width: xxx)'
    },
    ...
  ],
  imgClassName: null,
  // condition: true | false,
  add2XWidths: false, // true,
  alt_text: '',
  useAvif: false | true,
  // loadingMode: null | 'lazy' | 'eager'
})
*/
export function img_viewer_dom_builder({
  /** url del viewer */
  viewer_url,

  /**
  array dei sorgenti
  deve contenere almeno un oggetto configurato come `source_default`
  l'ultimo oggetto della lista è quello sulla base el quale si costruirà il tag img
  In mancanza di uno degli elementi richiesti (fatta eccezione per `mq` e `crop`),
  il sorgente viene ignorato
  */
  sources = [], // array dei sorgenti

  /** se false, il markup non viene generato */
  condition = true,

  /** se true, alle dimensioni fornite, viene aggiunta la versione 2x */
  add2XWidths = false,

  /** testo alt */
  alt_text = null,

  /** classe del tag img */
  imgClassName = null,

  /** se true viene usato anche il formato avif, oltre a webp e jpg */
  useAvif = false,

  /** valore dell'attributo loading: eager o lazy */
  loadingMode = null
}) {

  if(!viewer_url || !condition) {
    return null;
  }

  const originalSourcesLength = (sources?? []).length,
    source_default = {
      id: null,   // id per immagini da db
      src: null,  // percorso dalla root dell'immagine sorgente
      crop: null, // eventuali coordinate per il crop dell'immagine sorgente
      w: null,    // larghezza e altezza dell'immagine da restituire
      h: null,
      imgWidths: [], // dimensioni dell'immagine
      mq: null    // media query, necessaria solo per gli oggetti prima dell'ultimo
    };

  sources = sources.map(item => {
    item = {...source_default, ...item?? {}};

    if((!item.src && !item.id) || !item.w || !item.h || !item.imgWidths?.length) {
      return null;
    }

    return item;

  }).filter(result => result != null);

  if(!sources.length || sources.length !== originalSourcesLength) {
    // eslint-disable-next-line no-console
    console.error('`sources` array error');
    return [];
  }

  // array per gli elementi <source>
  const sourceTagsArray = [],
    srcset_builder = (format, srcsetsArray) => {
      return srcsetsArray.map(src => `${src[0]}${format? `&f=${format}` : ''} ${src[1]}`).join(',');
    },
    formats = (useAvif? ['avif','webp'] : ['webp']);

  // sono definite fuori dal ciclo forEach perché saranno utilizzate anche dal tag img finale
  let srcsetsArray, sizes;

  // costruzione array `sourceTagsArray`
  sources.forEach((item, sourceIdx) => {

    item.imgWidths = item.imgWidths.map(w => add2XWidths? [w, w * 2] : w).flat().toSorted((a,b) => b - a);

    const isLastSource = sourceIdx === sources.length - 1,
      baseSrc = viewer_url + (item.src? `?src=${encodeURIComponent(item.src)}&` : `/${item.id}?`);

    srcsetsArray = item.imgWidths.map(w =>{
      const bbHeight = w / (item.w / item.h);
      return [`${baseSrc}bb=${w}x${bbHeight}`,  `${w}w`];
    });

    sizes = item.imgWidths.map((w,idx) => {

      // la prima dimensione va ignorata (sarà utilizzata nell'iterazione successiva)
      if(idx === 0) {
        return null;

      } else {
        // elemento `sizes` diverso dal primo e dall'ultimo
        const middle_size_mq = `(${w}px < width <= ${item.imgWidths.at(idx-1)}px) ${item.imgWidths.at(idx-1)}px`;

        // primo elemento dell'attributo sizes
        if(idx === 1) {
          return `(width > ${w}px) ${item.imgWidths.at(0)}px`;

        // ultimo
        } else if(idx === item.imgWidths.length - 1) {
          return [
            middle_size_mq,
            `${w}px`
          ];

        // tutti gli altri
        } else {
          return middle_size_mq;
        }
      }
    }).filter(s => s != null).flat().join(','); // rimuove elemento null, flat e crea stringa sizes

    // il formato `null` è riferito a jpeg, che non è necessario indicare esplicitamente
    // ed è utilizzato solo nel caso di presenza di media query per creare il tag source per il formato jpeg,
    // non va inoltre considerato nell'ultimo elemento di source
    // visto che, in questo caso, il formato jpeg viene gestito nel tag `img`
    [...formats, ...(item.mq && !isLastSource? [null] : [])].forEach(format => {
      sourceTagsArray.push({
        tag: 'source',
        attrs: {
          type: format? `image/${format}` : null,
          srcset: srcset_builder(format, srcsetsArray),
          sizes: sizes,
          media: item.mq,

          // width e height sono necessarie solo in caso di presenza della media query
          // presupponendo che in questi casi l'immagine abbia proporzioni diverse
          // da quelle dell'immagine del tag `img`.
          // In assenza di media query, vengono "ereditate" quelle indicate in `img`
          width: item.mq? item.w : null,
          height: item.mq? item.h : null,
        }
      });
    });

  });

  const img_source_obj = sources.at(-1);

  return {
    tag: 'picture',
    condition: condition,
    children: [
      ...sourceTagsArray,
      {
        tag: 'img',
        className: imgClassName,
        attrs: {
          alt: alt_text,
          width: img_source_obj.w,
          height: img_source_obj.h,
          srcset: srcset_builder(null, srcsetsArray),
          sizes: sizes,
          src: srcsetsArray.at(-1)[0],
          loading: loadingMode,
        }
      }
    ]
  };

}
