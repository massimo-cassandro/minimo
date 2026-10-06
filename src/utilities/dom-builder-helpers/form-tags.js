import { classnames } from '../classnames.js';
import { randomId } from '../random-id.js';


/**
 * Wrapper `.form-group` condiviso dai builder di tag qui sotto: gestisce il controllo
 * `condition`, `wrapperClass`, il testo di aiuto opzionale e `callback` in
 * un unico punto, così che ogni builder debba fornire solo i propri `children`
 * (tipicamente label + controllo).
 *
 * @param {Object} args
 * @param {boolean} [args.condition=true] - Se false, restituisce `null` senza costruire nulla (default: true)
 * @param {string | null} [args.wrapperClass=null] - classe opzionale da aggiungere al wrapper `.form-group` (default: null)
 * @param {string | HTMLElement | null} [args.help=null] - Testo di aiuto opzionale (default: null)
 * @param {Array<Object>} args.children - figli domBuilder da renderizzare dentro il `.form-group` (prima del testo di aiuto).
 * @returns {DomBuilderItem|null} L'elemento domBuilder `.form-group`, oppure `null` quando `condition` è false.
 */
function buildFormGroup({
  condition = true,
  wrapperClass = null,
  help = null,
  children
}) {

  if(!condition) {
    return null;
  }

  return {
    className: classnames('form-group', wrapperClass),
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
 * @param {string | null} args.name - attributo `name` dell'input.
 * @param {string | null} args.id - attributo `id`.
 * @param {string | number | null} args.value - attributo `value` dell'input.
 * @param {string | null} [args.type='text'] - attributo `type` dell'input (default: 'text')
 * @param {string | null} [args.wrapperClass=null] - classe opzionale da aggiungere al wrapper `.form-group` (default: null)
 * @param {string | null} [args.class=null] - classe opzionale da aggiungere all'`input` (default: null)
 * @param {string | null} [args.classname=null] - Alias di `class` (default: null)
 * @param {string | null} [args.className=null] - Alias di `class` (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {string | HTMLElement | null} args.help - Testo di aiuto opzionale.
 * @param {(function(HTMLElement|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @returns {DomBuilderItem|null} L'elemento domBuilder `input`, oppure `null` quando `condition` è false.
 */
export function buildInput({
  label,
  name,
  id = null,
  value = null,
  type = 'text',
  wrapperClass = null,
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

  return buildFormGroup({
    condition,
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
          name: name,
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
 * @param {string | null} args.name - attributo `name` della select.
 * @param {string | null} args.id - attributo `id`.
 * @param {string | number | null} args.selectedValue - valore selezionato (nota: confrontato con i valori di 'options' tramite uguaglianza debole '=='):
 * @param {Array<[string|number, string]> | Array<Record<string, string>> | Record<string, string> | null} args.options -
 *    coppie valore/testo delle opzioni, come array di array a due elementi `[[value, text], ...]`,
 *    come array di oggetti `[{somekey: value, somekey2: text},...]`, oppure come singolo oggetto `{value: text, ...}`
 * @param {boolean} [args.addEmptyOption=true] - Se true, viene aggiunto in cima un tag option vuoto (default: true)
 * @param {string | null} [args.wrapperClass=null] - classe opzionale da aggiungere al wrapper `.form-group` (default: null)
 * @param {string | null} [args.class=null] - classe opzionale da aggiungere all'`input` (default: null)
 * @param {string | null} [args.classname=null] - Alias di `class` (default: null)
 * @param {string | null} [args.className=null] - Alias di `class` (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {boolean} [args.useBsClass=false] - Se true, usa la classe BS5 (`form-select`) al posto di `form-control` (default: false)
 * @param {string | HTMLElement | null} args.help - Testo di aiuto opzionale.
 * @param {(function(HTMLElement|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @returns {DomBuilderItem|null} L'elemento domBuilder `input`, oppure `null` quando `condition` è false.
 */
export function buildSelect({
  label,
  name,
  id = null,
  selectedValue = null,
  options = null,
  addEmptyOption = true,
  wrapperClass = null,
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


  return buildFormGroup({
    condition,
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
          name: name,
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
 * @param {string | null} args.name - attributo `name` della checkbox.
 * @param {string | null} args.id - attributo `id`.
 * @param {string | number | null} [args.value=1] - attributo `value` della checkbox (default: 1)
 * @param {boolean} [args.checked=false] - attributo `checked` della checkbox (default: false)
 * @param {boolean} [args.switch=false] - Se true, la checkbox viene resa come switch
 *    (wrapper `.form-switch`, `role="switch"` e attributo nativo `switch`) (default: false)
 * @param {string | null} [args.wrapperClass=null] - classe opzionale da aggiungere al wrapper `.form-group` (usata solo quando `addFormGroup` è true) (default: null)
 * @param {boolean} [args.addFormGroup=true] - Se true, racchiude la checkbox in un elemento `.form-group` (default: true)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {string | HTMLElement | null} args.help - Testo di aiuto opzionale.
 * @param {(function(HTMLElement|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @returns {DomBuilderItem|null} L'elemento domBuilder `.form-check` (o racchiuso in `.form-group`), oppure `null` quando `condition` è false.
 */
export function buildCheckbox({
  label,
  name,
  id = null,
  value = 1,
  checked = false,
  switch: isSwitch = false,
  wrapperClass = null,
  addFormGroup = true,
  condition = true,
  help = null,
  attrs = {},
  callback = null
}) {

  if(!condition) {
    return null;
  }

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

  const tag = {
    className: classnames('form-check', isSwitch && 'form-switch', !addFormGroup && !help && wrapperClass),
    children: [
      {
        tag: 'input',
        className: 'form-check-input',
        id: id,
        attrs: {
          ...(attrs??{}),
          type: 'checkbox',
          value: value,
          name: name,
          checked: checked,
          // controllo switch nativo (per ora solo WebKit), con ripiego css altrove
          ...(isSwitch? {role: 'switch', switch: ''} : {})
        },
        callback: callback
      },
      `label.form-label[for:${id}] ${label}`,
    ]
  };

  if(addFormGroup) {
    return buildFormGroup({
      wrapperClass,
      help,
      children: [tag]
    });

  } else {
    return tag;
  }

}


/**
 * Builder del tag textarea
 *
 * @param {Object} args
 * @param {string} args.label - label della textarea.
 * @param {string | null} args.name - attributo `name` della textarea.
 * @param {string | null} args.id - attributo `id`.
 * @param {string | number | null} args.value - contenuto della textarea.
 * @param {boolean} [args.autosize=true] - aggiunge la classe `autosize` (default: true)
 * @param {string | null} [args.wrapperClass=null] - classe opzionale da aggiungere al wrapper `.form-group` (default: null)
 * @param {string | null} [args.class=null] - classe opzionale da aggiungere all'elemento textarea (default: null)
 * @param {string | null} [args.classname=null] - Alias di `class` (default: null)
 * @param {string | null} [args.className=null] - Alias di `class` (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {string | HTMLElement | null} args.help - Testo di aiuto opzionale.
 * @param {(function(HTMLElement|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @returns {DomBuilderItem|null} L'elemento domBuilder `textarea`, oppure `null` quando `condition` è false.
 */
export function buildTextarea({
  label,
  name,
  id = null,
  value = null,
  wrapperClass = null,
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

  return buildFormGroup({
    condition,
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
          name: name,
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
 * @param {string | null} [args.wrapperClass=null] - classe opzionale da aggiungere al wrapper `.form-group` (default: null)
 * @param {boolean} [args.noBorder=true] - aggiunge la classe `no-border` (default: true)
 * @param {string | null} [args.class=null] - classe opzionale da aggiungere al campo finto (default: null)
 * @param {string | null} [args.classname=null] - Alias di `class` (default: null)
 * @param {string | null} [args.className=null] - Alias di `class` (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {string | HTMLElement | null} args.help - Testo di aiuto opzionale.
 * @param {(function(HTMLElement|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @returns {DomBuilderItem|null} L'elemento domBuilder del campo finto, oppure `null` quando `condition` è false.
 */
export function buildFakeField({
  label,
  value = null,
  wrapperClass = null,
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

  return buildFormGroup({
    condition,
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
 * @param {(function(HTMLElement|Text): void) | null} args.callback - Funzione callback opzionale.
 * @param {Record<string, any> | null}  [args.attrs={}] - Oggetto di attributi opzionale (default: {})
 * @returns {DomBuilderItem|null} L'elemento domBuilder `button`, oppure `null` quando `condition` è false.
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
}) {

  const className = classArg ?? classnameArg ?? classNameArg;

  return {
    condition: condition,
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
  };
}
