/** URI dei namespace supportati tramite alias da domBuilder */
export const NS = {
  html: 'http://www.w3.org/1999/xhtml',
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
};

// URI assoluto generico (schema seguito da `:`), per namespace diversi dai tre alias
const URI_REGEX = /^[a-z][a-z0-9+.-]*:\S+$/i;

// elementi MathML i cui figli tornano nel namespace HTML (text integration point)
const MATHML_TEXT_INTEGRATION_POINTS = new Set(['mi', 'mo', 'mn', 'ms', 'mtext']);

// eccezioni: dentro i text integration point MathML questi elementi restano MathML
const MATHML_TEXT_INTEGRATION_EXCEPTIONS = new Set(['mglyph', 'malignmark']);

// valori di `encoding` che rendono `annotation-xml` un punto di ritorno all'HTML
const ANNOTATION_XML_HTML_ENCODINGS = new Set(['text/html', 'application/xhtml+xml']);

/**
 * Normalizza un valore di namespace (alias o URI completo).
 *
 * @param {string | null | undefined} value - Alias (`'html'`, `'svg'`, `'math'`) o URI completo
 * @param {string} [source='namespace'] - Nome della proprietà da citare nel messaggio d'errore (default: 'namespace')
 * @returns {string | null} L'URI del namespace, oppure null se il valore è assente o non valido
 *   (in quest'ultimo caso viene scritto un `console.error`)
 *
 * @example
 * normalizeNamespace('svg');                             // 'http://www.w3.org/2000/svg'
 * normalizeNamespace('http://www.w3.org/2000/svg');      // 'http://www.w3.org/2000/svg'
 * normalizeNamespace(undefined);                         // null
 * normalizeNamespace('foo', 'item.namespace');           // null + console.error
 */
export function normalizeNamespace(value, source = 'namespace') {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    if (Object.hasOwn(NS, value)) {
      return NS[/** @type {keyof typeof NS} */ (value)];
    }
    if (URI_REGEX.test(value)) {
      return value;
    }
  }

  // eslint-disable-next-line no-console
  console.error(`[domBuilder]: \`${source}\` non valido (accettati 'html', 'svg', 'math' o un URI completo) → ` + value);
  return null;
}

/**
 * Determina il namespace in cui creare un elemento.
 *
 * Ordine di risoluzione:
 * 1. `explicitNs` (da `item.namespace`), se presente;
 * 2. `svg` → SVG e `math` → MathML, qualunque sia il genitore;
 * 3. punti di ritorno all'HTML: figli di `foreignObject` (SVG), di `mi`/`mo`/`mn`/`ms`/`mtext` (MathML,
 *    tranne `mglyph` e `malignmark`) e di `annotation-xml` con `encoding` `text/html` o `application/xhtml+xml`;
 * 4. namespace del genitore effettivo;
 * 5. `fallbackNs` (da `options.namespace`), quando il genitore manca o non ha namespace;
 * 6. HTML.
 *
 * @param {string} tag - Nome del tag
 * @param {Node | null} [effectiveParent] - Genitore effettivo dell'elemento (default: null)
 * @param {string | null} [explicitNs] - URI già normalizzato da `item.namespace` (default: null)
 * @param {string | null} [fallbackNs] - URI già normalizzato da `options.namespace` (default: null)
 * @returns {string} L'URI del namespace
 *
 * @example
 * resolveNamespace('svg');                          // NS.svg
 * resolveNamespace('use', svgElement);              // NS.svg
 * resolveNamespace('div', foreignObjectElement);    // NS.html
 * resolveNamespace('use', null, null, NS.svg);      // NS.svg
 * resolveNamespace('div');                          // NS.html
 */
export function resolveNamespace(tag, effectiveParent = null, explicitNs = null, fallbackNs = null) {

  if (explicitNs) {
    return explicitNs;
  }

  const lowerTag = tag.toLowerCase();
  if (lowerTag === 'svg') {
    return NS.svg;
  }
  if (lowerTag === 'math') {
    return NS.math;
  }

  const parentEl = effectiveParent instanceof Element ? effectiveParent : null;

  if (parentEl) {
    const parentNs = parentEl.namespaceURI;
    const parentName = parentEl.localName;

    if (parentNs === NS.svg && parentName === 'foreignObject') {
      return NS.html;
    }

    if (parentNs === NS.math) {
      if (MATHML_TEXT_INTEGRATION_POINTS.has(parentName) && !MATHML_TEXT_INTEGRATION_EXCEPTIONS.has(tag)) {
        return NS.html;
      }
      if (parentName === 'annotation-xml'
        && ANNOTATION_XML_HTML_ENCODINGS.has((parentEl.getAttribute('encoding') ?? '').toLowerCase())) {
        return NS.html;
      }
    }

    if (parentNs) {
      return parentNs;
    }
  }

  return fallbackNs ?? NS.html;
}

/**
 * Crea un elemento nel namespace risolto da `resolveNamespace`.
 * Per l'HTML usa `document.createElement` (comportamento storico di domBuilder), per gli altri namespace
 * `document.createElementNS`, che distingue maiuscole e minuscole (`linearGradient`, `clipPath`, ...).
 *
 * @param {string} tag - Nome del tag
 * @param {Node | null} [effectiveParent] - Genitore effettivo dell'elemento (default: null)
 * @param {string | null} [explicitNs] - URI già normalizzato da `item.namespace` (default: null)
 * @param {string | null} [fallbackNs] - URI già normalizzato da `options.namespace` (default: null)
 * @returns {Element}
 *
 * @example
 * createDomElement('div');                       // HTMLDivElement
 * createDomElement('svg');                       // SVGSVGElement
 * createDomElement('linearGradient', svgEl);     // SVGLinearGradientElement
 * createDomElement('use', null, NS.svg);         // SVGUseElement
 */
export function createDomElement(tag, effectiveParent = null, explicitNs = null, fallbackNs = null) {
  const ns = resolveNamespace(tag, effectiveParent, explicitNs, fallbackNs);

  if (ns === NS.html) {
    return document.createElement(tag);
  }

  // `svg` e `math` vanno scritti in minuscolo per essere riconosciuti nei rispettivi namespace
  const lowerTag = tag.toLowerCase();
  return document.createElementNS(ns, lowerTag === 'svg' || lowerTag === 'math' ? lowerTag : tag);
}
