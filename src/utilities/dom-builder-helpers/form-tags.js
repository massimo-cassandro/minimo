import { classnames } from '../classnames.js';
import { randomId } from '../random-id.js';


/**
 * Wrapper opzionale condiviso dai builder di tag qui sotto: gestisce il controllo
 * `condition`, `wrapper`, `wrapperClass` e il testo di aiuto opzionale in
 * un unico punto, così che ogni builder debba fornire solo i propri `children`
 * (tipicamente label + controllo).
 *
 * @param {Object} args
 * @param {boolean} [args.condition=true] - Se false, restituisce `null` senza costruire nulla (default: true)
 * @param {boolean} [args.wrapper=true] - Se true, racchiude `children` in un `div` (default: true)
 * @param {string | null} [args.wrapperClass='form-group'] - classe/i del `div` wrapper; con `null` il `div` non ha classi (default: 'form-group')
 * @param {string | HTMLElement | null} [args.help=null] - Testo di aiuto opzionale, inserito solo se `wrapper` è true (default: null)
 * @param {Array<DomBuilderItem|string>} args.children - figli domBuilder da renderizzare dentro il wrapper (prima del testo di aiuto).
 * @returns {DomBuilderItem|string|Array<DomBuilderItem|string>|null} Il `div` wrapper; con `wrapper` false solo `children`
 *    (il singolo elemento se `children` ne contiene uno solo); `null` quando `condition` è false.
 */
function buildWrapper({
  condition = true,
  wrapper = true,
  wrapperClass = 'form-group',
  help = null,
  children
}) {

  if(!condition) {
    return null;
  }

  if(!wrapper) {
    return children.length === 1 ? children[0] : children;
  }

  return {
    className: classnames(wrapperClass),
    children: [
      ...children,
      {
        className: 'form-help-text',
        condition: help != null,
        content: help
      }
    ]
  };
}


/**
 * Builder del tag input
 *
 * @param {Object} args
 * @param {string} args.label - label dell'input.
 * @param {string | null} [args.name=null] - attributo `name` dell'input (default: null)
 * @param {string | null} args.id - attributo `id`.
 * @param {string | number | null} args.value - attributo `value` dell'input.
 * @param {string | null} [args.type='text'] - attributo `type` dell'input (default: 'text')
 * @param {boolean} [args.wrapper=true] - Se true, racchiude label e input in un `div` wrapper; se false viene restituito l'array [label, input] (default: true)
 * @param {string | null} [args.wrapperClass='form-group'] - classe/i del `div` wrapper; con `null` il `div` non ha classi (default: 'form-group')
 * @param {string | null} [args.class=null] - classe opzionale da aggiungere all'`input` (default: null)
 * @param {string | null} [args.classname=null] - Alias di `class` (default: null)
 * @param {string | null} [args.className=null] - Alias di `class` (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {string | HTMLElement | null} args.help - Testo di aiuto opzionale (solo con `wrapper` true).
 * @param {(function(Element|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * buildInput({
 *   label: '...', // label, OBBL
 *   name: null, // attributo name, FAC
 *   id: null, // attributo id, FAC
 *   value: null, // attributo value, FAC
 *   type: 'text', // attributo type, FAC
 *   wrapper: true, // racchiude in un div wrapper, FAC
 *   wrapperClass: 'form-group', // classi del wrapper (null = nessuna), FAC
 *   class: null, // classi extra (alias `classname`, `className`), FAC
 *   condition: true, // se false restituisce null, FAC
 *   help: null, // testo di aiuto, FAC
 *   attrs: {}, // attributi extra, FAC
 *   callback: null, // callback(el) dopo la creazione, FAC
 * });
 *
 * @returns {DomBuilderItem|string|Array<DomBuilderItem|string>|null} Il wrapper domBuilder (o l'array [label, input] con `wrapper` false), oppure `null` quando `condition` è false.
 */
export function buildInput({
  label,
  name = null,
  id = null,
  value = null,
  type = 'text',
  wrapper = true,
  wrapperClass = 'form-group',
  class: classArg = null,
  classname: classnameArg = null,
  className: classNameArg = null,
  condition = true,
  help = null,
  attrs = {},
  callback = null
}){

  const className = classArg ?? classnameArg ?? classNameArg;

  id = id || randomId();

  return buildWrapper({
    condition,
    wrapper,
    wrapperClass,
    help,
    children: [
      `label.form-label[for:${id}] ${label}`,
      {
        tag: 'input',
        className: classnames('form-control', className, attrs?.class),
        id: id,
        attrs: {
          ...(attrs??{}),
          type: type,
          name: name ?? attrs?.name,
          value: value
        },
        callback: callback
      }
    ]
  });
}

/**
 * Builder del tag select
 *
 * @param {Object} args
 * @param {string} args.label - label della select.
 * @param {string | null} [args.name=null] - attributo `name` della select (default: null)
 * @param {string | null} args.id - attributo `id`.
 * @param {string | number | null} args.selectedValue - valore selezionato (nota: confrontato con i valori di 'options' tramite uguaglianza debole '=='):
 * @param {Array<[string|number, string]> | Array<Record<string, string>> | Record<string, string> | null} args.options -
 *    coppie valore/testo delle opzioni, come array di array a due elementi `[[value, text], ...]`,
 *    come array di oggetti `[{somekey: value, somekey2: text},...]`, oppure come singolo oggetto `{value: text, ...}`
 * @param {boolean} [args.addEmptyOption=true] - Se true, viene aggiunto in cima un tag option vuoto (default: true)
 * @param {boolean} [args.wrapper=true] - Se true, racchiude label e select in un `div` wrapper; se false viene restituito l'array [label, select] (default: true)
 * @param {string | null} [args.wrapperClass='form-group'] - classe/i del `div` wrapper; con `null` il `div` non ha classi (default: 'form-group')
 * @param {string | null} [args.class=null] - classe opzionale da aggiungere all'`input` (default: null)
 * @param {string | null} [args.classname=null] - Alias di `class` (default: null)
 * @param {string | null} [args.className=null] - Alias di `class` (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {boolean} [args.useBsClass=false] - Se true, usa la classe BS5 (`form-select`) al posto di `form-control` (default: false)
 * @param {string | HTMLElement | null} args.help - Testo di aiuto opzionale (solo con `wrapper` true).
 * @param {(function(Element|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * buildSelect({
 *   label: '...', // label, OBBL
 *   name: null, // attributo name, FAC
 *   id: null, // attributo id, FAC
 *   selectedValue: null, // valore selezionato (confronto ==), FAC
 *   options: null, // coppie [value, label], array di oggetti o oggetto, FAC
 *   addEmptyOption: true, // option vuota in cima, FAC
 *   wrapper: true, // racchiude in un div wrapper, FAC
 *   wrapperClass: 'form-group', // classi del wrapper (null = nessuna), FAC
 *   class: null, // classi extra (alias `classname`, `className`), FAC
 *   useBsClass: false, // usa `form-select` invece di `form-control`, FAC
 *   condition: true, // se false restituisce null, FAC
 *   help: null, // testo di aiuto, FAC
 *   attrs: {}, // attributi extra, FAC
 *   callback: null, // callback(el) dopo la creazione, FAC
 * });
 *
 * @returns {DomBuilderItem|string|Array<DomBuilderItem|string>|null} Il wrapper domBuilder (o l'array [label, select] con `wrapper` false), oppure `null` quando `condition` è false.
 */
export function buildSelect({
  label,
  name = null,
  id = null,
  selectedValue = null,
  options = null,
  addEmptyOption = true,
  wrapper = true,
  wrapperClass = 'form-group',
  class: classArg = null,
  classname: classnameArg = null,
  className: classNameArg = null,
  useBsClass = false,
  condition = true,
  help = null,
  attrs = {},
  callback = null
}){

  const className = classArg ?? classnameArg ?? classNameArg;

  id = id || randomId();

  // normalizza le opzioni come array di coppie [value, text]
  /** @type {Array<[string|number, string]>} */
  let optionsList = [];

  if(options) {
    if(!Array.isArray(options)) {
      optionsList = /** @type {Array<[string|number, string]>} */ (Object.entries(options));

    } else if(!Array.isArray(options[0])) {
      optionsList = /** @type {Array<Record<string, string>>} */ (options)
        .map(o => /** @type {[string|number, string]} */ (Object.values(o)));

    } else {
      optionsList = /** @type {Array<[string|number, string]>} */ (options);
    }
  }


  return buildWrapper({
    condition,
    wrapper,
    wrapperClass,
    help,
    children: [
      `label.form-label[for:${id}] ${label}`,
      {
        tag: 'select',
        className: classnames(useBsClass? 'form-select' : 'form-control', className, attrs?.class),
        id: id,
        attrs: {
          ...(attrs??{}),
          name: name ?? attrs?.name,
        },
        children: [
          ...(addEmptyOption? ['option[value:]'] : []),
          ...optionsList.map(([value, text]) => ({
            tag: 'option',
            attrs: {
              value: value,
              // eslint-disable-next-line eqeqeq
              selected: value == selectedValue
            },
            content: text
          }))
        ],
        callback: callback
      }
    ]
  });
}


/**
 * Builder del tag checkbox
 *
 * @param {Object} args
 * @param {string} args.label - label della checkbox.
 * @param {string | null} [args.name=null] - attributo `name` della checkbox (default: null)
 * @param {string | null} args.id - attributo `id`.
 * @param {string | number | null} [args.value=1] - attributo `value` della checkbox (default: 1)
 * @param {boolean} [args.checked=false] - attributo `checked` della checkbox (default: false)
 * @param {boolean} [args.switch=false] - Se true, la checkbox viene resa come switch
 *    (wrapper `.form-switch`, `role="switch"` e attributo nativo `switch`) (default: false)
 * @param {boolean} [args.wrapper=true] - Se true, racchiude il `.form-check` in un `div` wrapper (default: true)
 * @param {string | null} [args.wrapperClass='form-group'] - classe/i del `div` wrapper; con `null` il `div` non ha classi (default: 'form-group')
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {string | HTMLElement | null} args.help - Testo di aiuto opzionale (solo con `wrapper` true).
 * @param {(function(Element|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * buildCheckbox({
 *   label: '...', // label, OBBL
 *   name: null, // attributo name, FAC
 *   id: null, // attributo id, FAC
 *   value: 1, // attributo value, FAC
 *   checked: false, // attributo checked, FAC
 *   switch: false, // resa come switch, FAC
 *   wrapper: true, // racchiude in un div wrapper, FAC
 *   wrapperClass: 'form-group', // classi del wrapper (null = nessuna), FAC
 *   condition: true, // se false restituisce null, FAC
 *   help: null, // testo di aiuto, FAC
 *   attrs: {}, // attributi extra, FAC
 *   callback: null, // callback(el) dopo la creazione, FAC
 * });
 *
 * @returns {DomBuilderItem|null} L'elemento domBuilder `.form-check` (o racchiuso nel wrapper), oppure `null` quando `condition` è false.
 */
export function buildCheckbox({
  label,
  name = null,
  id = null,
  value = 1,
  checked = false,
  switch: isSwitch = false,
  wrapper = true,
  wrapperClass = 'form-group',
  condition = true,
  help = null,
  attrs = {},
  callback = null
}) {

  /*
  <div class="form-group"> <- opzionale
    <div class="form-check">
      <input type="checkbox" id="..." name="..." class="form-check-input" value="1">
      <label for="..." class="form-label">...</label>
    </div>
  </div>

  <div class="form-group"> <- opzionale
    <div class="form-check form-switch">
      <input class="form-check-input" type="checkbox" role="switch" switch id="my-switch">
      <label class="form-label" for="my-switch">My label</label>
    </div>
  </div>
  */
  id = id || randomId();

  return /** @type {DomBuilderItem|null} */ (buildWrapper({
    condition,
    wrapper,
    wrapperClass,
    help,
    children: [{
      className: classnames('form-check', isSwitch && 'form-switch'),
      children: [
        {
          tag: 'input',
          className: 'form-check-input',
          id: id,
          attrs: {
            ...(attrs??{}),
            type: 'checkbox',
            value: value,
            name: name ?? attrs?.name,
            checked: checked,
            // controllo switch nativo (per ora solo WebKit), con ripiego css altrove
            ...(isSwitch? {role: 'switch', switch: ''} : {})
          },
          callback: callback
        },
        `label.form-label[for:${id}] ${label}`,
      ]
    }]
  }));
}


/**
 * Builder del tag textarea
 *
 * @param {Object} args
 * @param {string} args.label - label della textarea.
 * @param {string | null} [args.name=null] - attributo `name` della textarea (default: null)
 * @param {string | null} args.id - attributo `id`.
 * @param {string | number | null} args.value - contenuto della textarea.
 * @param {boolean} [args.autosize=true] - aggiunge la classe `autosize` (default: true)
 * @param {boolean} [args.wrapper=true] - Se true, racchiude label e textarea in un `div` wrapper; se false viene restituito l'array [label, textarea] (default: true)
 * @param {string | null} [args.wrapperClass='form-group'] - classe/i del `div` wrapper; con `null` il `div` non ha classi (default: 'form-group')
 * @param {string | null} [args.class=null] - classe opzionale da aggiungere all'elemento textarea (default: null)
 * @param {string | null} [args.classname=null] - Alias di `class` (default: null)
 * @param {string | null} [args.className=null] - Alias di `class` (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {string | HTMLElement | null} args.help - Testo di aiuto opzionale (solo con `wrapper` true).
 * @param {(function(Element|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * buildTextarea({
 *   label: '...', // label, OBBL
 *   name: null, // attributo name, FAC
 *   id: null, // attributo id, FAC
 *   value: null, // contenuto, FAC
 *   autosize: true, // aggiunge la classe autosize, FAC
 *   wrapper: true, // racchiude in un div wrapper, FAC
 *   wrapperClass: 'form-group', // classi del wrapper (null = nessuna), FAC
 *   class: null, // classi extra (alias `classname`, `className`), FAC
 *   condition: true, // se false restituisce null, FAC
 *   help: null, // testo di aiuto, FAC
 *   attrs: {}, // attributi extra, FAC
 *   callback: null, // callback(el) dopo la creazione, FAC
 * });
 *
 * @returns {DomBuilderItem|string|Array<DomBuilderItem|string>|null} Il wrapper domBuilder (o l'array [label, textarea] con `wrapper` false), oppure `null` quando `condition` è false.
 */
export function buildTextarea({
  label,
  name = null,
  id = null,
  value = null,
  wrapper = true,
  wrapperClass = 'form-group',
  class: classArg = null,
  classname: classnameArg = null,
  className: classNameArg = null,
  condition = true,
  help = null,
  callback = null,
  attrs = {},
  autosize = true
}) {

  const className = classArg ?? classnameArg ?? classNameArg;

  id = id || randomId();

  return buildWrapper({
    condition,
    wrapper,
    wrapperClass,
    help,
    children: [
      `label.form-label[for:${id}] ${label}`,
      {
        tag: 'textarea',
        className: classnames('form-control', className, attrs?.class, autosize && 'autosize'),
        id: id,
        attrs: {
          ...(attrs??{}),
          name: name ?? attrs?.name,
        },
        content: value,
        callback: callback
      }
    ]
  });
}

/**
 * Campo finto (testo semplice mostrato come campo input)
 *
 * @param {Object} args
 * @param {string} args.label - label.
 * @param {string | number | null} args.value - contenuto testuale.
 * @param {boolean} [args.wrapper=true] - Se true, racchiude label e campo in un `div` wrapper; se false viene restituito l'array [label, campo] (default: true)
 * @param {string | null} [args.wrapperClass='form-group'] - classe/i del `div` wrapper; con `null` il `div` non ha classi (default: 'form-group')
 * @param {boolean} [args.noBorder=true] - aggiunge la classe `no-border` (default: true)
 * @param {string | null} [args.class=null] - classe opzionale da aggiungere al campo finto (default: null)
 * @param {string | null} [args.classname=null] - Alias di `class` (default: null)
 * @param {string | null} [args.className=null] - Alias di `class` (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {string | HTMLElement | null} args.help - Testo di aiuto opzionale (solo con `wrapper` true).
 * @param {(function(Element|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * buildFakeField({
 *   label: '...', // label, OBBL
 *   value: null, // contenuto testuale, FAC
 *   wrapper: true, // racchiude in un div wrapper, FAC
 *   wrapperClass: 'form-group', // classi del wrapper (null = nessuna), FAC
 *   noBorder: true, // aggiunge la classe no-border, FAC
 *   class: null, // classi extra (alias `classname`, `className`), FAC
 *   condition: true, // se false restituisce null, FAC
 *   help: null, // testo di aiuto, FAC
 *   attrs: {}, // attributi extra, FAC
 *   callback: null, // callback(el) dopo la creazione, FAC
 * });
 *
 * @returns {DomBuilderItem|string|Array<DomBuilderItem|string>|null} Il wrapper domBuilder (o l'array [label, campo] con `wrapper` false), oppure `null` quando `condition` è false.
 */
export function buildFakeField({
  label,
  value = null,
  wrapper = true,
  wrapperClass = 'form-group',
  class: classArg = null,
  classname: classnameArg = null,
  className: classNameArg = null,
  condition = true,
  help = null,
  callback = null,
  attrs = {},
  noBorder = true
}) {

  const className = classArg ?? classnameArg ?? classNameArg;

  return buildWrapper({
    condition,
    wrapper,
    wrapperClass,
    help,
    children: [
      `span.form-label ${label}`,
      {
        className: classnames('form-control-static', className, attrs?.class, noBorder && 'no-border'),
        attrs: {
          ...(attrs??{}),
        },
        content: value,
        callback: callback
      }
    ]
  });
}



/**
 * Builder del tag button
 *
 * @param {Object} args
 * @param {string|HTMLElement|Array<DomBuilderItem>} args.content - contenuto del button. Quando viene passato un array di
 *   elementi domBuilder, viene renderizzato tramite `children` invece di `content`.
 * @param {string} [args.type=button] - tipo del button (default: 'button')
 * @param {string | null} args.id - attributo `id`.
 * @param {string | null} [args.class=null] - classe opzionale da aggiungere all'elemento button (default: null)
 * @param {string | null} [args.classname=null] - Alias di `class` (default: null)
 * @param {string | null} [args.className=null] - Alias di `class` (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {(function(Element|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @param {boolean} [args.wrapper=false] - Se true, racchiude il button in un `div` wrapper (default: false)
 * @param {string | null} [args.wrapperClass='form-group'] - classe/i del `div` wrapper (solo con `wrapper` true); con `null` il `div` non ha classi (default: 'form-group')
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * buildButton({
 *   content: '...', // contenuto (stringa, elemento o array domBuilder), OBBL
 *   type: 'button', // attributo type, FAC
 *   id: null, // attributo id, FAC
 *   class: null, // classi extra (alias `classname`, `className`), FAC
 *   condition: true, // se false restituisce null, FAC
 *   attrs: {}, // attributi extra, FAC
 *   callback: null, // callback(el) dopo la creazione, FAC
 *   wrapper: false, // racchiude in un div wrapper, FAC
 *   wrapperClass: 'form-group', // classi del wrapper (null = nessuna), FAC
 * });
 *
 * @returns {DomBuilderItem|null} L'elemento domBuilder `button` (o racchiuso nel wrapper), oppure `null` quando `condition` è false.
 */
export function buildButton({
  content,
  type = 'button',
  id = null,
  class: classArg = null,
  classname: classnameArg = null,
  className: classNameArg = null,
  condition = true,
  callback = null,
  attrs = {},
  wrapper = false,
  wrapperClass = 'form-group',
}) {

  const className = classArg ?? classnameArg ?? classNameArg;

  return /** @type {DomBuilderItem|null} */ (buildWrapper({
    condition,
    wrapper,
    wrapperClass,
    children: [{
      tag: 'button',
      className: classnames(className, attrs?.class),
      id: id,
      attrs: {
        ...(attrs??{}),
        type: type
      },
      ...(Array.isArray(content)
        ? { children: content }
        : { content: content }
      ),
      callback: callback
    }]
  }));
}
