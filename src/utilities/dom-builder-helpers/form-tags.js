import { classnames } from '../classnames.js';
import { randomId } from '../random-id.js';


/**
 * Shared `.form-group` wrapper for the tag builders below: handles the
 * `condition` guard, `wrapperClass`, optional help text and `callback` in
 * one place, so each builder only needs to provide its own `children`
 * (typically the label + control).
 *
 * @param {Object} args
 * @param {boolean} [args.condition=true] - When false, returns `null` without building anything.
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper.
 * @param {string | HTMLElement | null} [args.help=null] - Optional help text.
 * @param {Array<Object>} args.children - domBuilder children to render inside the `.form-group` (before the help text).
 * @returns {DomBuilderItem|null} The `.form-group` domBuilder item, or `null` when `condition` is false.
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
 * Input tag builder
 *
 * @param {Object} args
 * @param {string} args.label - input label.
 * @param {string | null} args.name - input `name` attribute.
 * @param {string | null} args.id - `id` attribute.
 * @param {string | number | null} args.value - input `value` attribute.
 * @param {string | null} [args.type='text'] - input `type` attribute.
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper.
 * @param {string | null} [args.className=null] - optional class to be added to the `input`.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @param {string | HTMLElement | null} args.help - Optional help text.
 * @param {(function(HTMLElement): void) | null} args.callback - Optional callback function.
 * @param {Record<string, any> | null}  [args.attrs={}] - Optional attributes object.
 * @returns {DomBuilderItem|null} The `input` domBuilder item, or `null` when `condition` is false.
 */
export function buildInput({
  label,
  name,
  id = null,
  value = null,
  type = 'text',
  wrapperClass = null,
  className = null,
  condition = true,
  help = null,
  attrs = {},
  callback = null
}){

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
 * select tag builder
 *
 * @param {Object} args
 * @param {string} args.label - select label.
 * @param {string | null} args.name - select `name` attribute.
 * @param {string | null} args.id - `id` attribute.
 * @param {string | number | null} args.selectedValue - selected value (note: checked against 'options' values using loose equality '=='):
 * @param {Array<[string|number, string]> | Array<Record<string, string>> | Record<string, string> | null} args.options -
 *    options value/text pairs, as an array of two-element `[[value, text], ...]` arrays,
 *    as an array of objects `[{somekey: value, somekey2: text},...]` objects, or as a single `{value: text, ...}` object
 * @param {boolean} [args.addEmptyOption=true] - When true, and empty option tag is added at top
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper.
 * @param {string | null} [args.className=null] - optional class to be added to the `input`.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @param {boolean} [args.useBsClass=false] - When true, uses BS5 class (`form-select`) instead of `form-control`
 * @param {string | HTMLElement | null} args.help - Optional help text.
 * @param {(function(HTMLElement): void) | null} args.callback - Optional callback function.
 * @param {Record<string, any> | null}  [args.attrs={}] - Optional attributes object.
 * @returns {DomBuilderItem|null} The `input` domBuilder item, or `null` when `condition` is false.
 */
export function buildSelect({
  label,
  name,
  id = null,
  selectedValue = null,
  options = null,
  addEmptyOption = true,
  wrapperClass = null,
  className = null,
  useBsClass = false,
  condition = true,
  help = null,
  attrs = {},
  callback = null
}){

  id = id || randomId();

  // normalizing options as an array of [value, text] pairs
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
 * Checkbox tag builder
 *
 * @param {Object} args
 * @param {string} args.label - checkbox label.
 * @param {string | null} args.name - checkbox `name` attribute.
 * @param {string | null} args.id - `id` attribute.
 * @param {string | number | null} [args.value=1] - checkbox `value` attribute.
 * @param {boolean} [args.checked=false] - checkbox `checked` attribute.
 * @param {boolean} [args.switch=false] - When true, the checkbox is rendered as a switch
 *    (`.form-switch` wrapper, `role="switch"` and the native `switch` attribute).
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper (used only when `addFormGroup` is true).
 * @param {boolean} [args.addFormGroup=true] - When true, wraps the checkbox in a `.form-group` element.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @param {string | HTMLElement | null} args.help - Optional help text.
 * @param {(function(HTMLElement): void) | null} args.callback - Optional callback function.
 * @param {Record<string, any> | null}  [args.attrs={}] - Optional attributes object.
 * @returns {DomBuilderItem|null} The `.form-check` (or `.form-group`-wrapped) domBuilder item, or `null` when `condition` is false.
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
  <div class="form-group"> <- optional
    <div class="form-check">
      <input type="checkbox" id="..." name="..." class="form-check-input" value="1">
      <label for="..." class="form-label">...</label>
    </div>
  </div>

  <div class="form-group"> <- optional
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
          // native switch control (WebKit only for now), with the css fallback elsewhere
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
 * Textarea tag builder
 *
 * @param {Object} args
 * @param {string} args.label - textarea label.
 * @param {string | null} args.name - textarea `name` attribute.
 * @param {string | null} args.id - `id` attribute.
 * @param {string | number | null} args.value - textarea content.
 * @param {boolean} [args.autosize=true] - adds `autosize` class
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper.
 * @param {string | null} [args.className=null] - optional class to be added to the textarea element.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @param {string | HTMLElement | null} args.help - Optional help text.
 * @param {(function(HTMLElement): void) | null} args.callback - Optional callback function.
 * @param {Record<string, any> | null}  [args.attrs={}] - Optional attributes object.
 * @returns {DomBuilderItem|null} The `textarea` domBuilder item, or `null` when `condition` is false.
 */
export function buildTextarea({
  label,
  name,
  id = null,
  value = null,
  wrapperClass = null,
  className = null,
  condition = true,
  help = null,
  callback = null,
  attrs = {},
  autosize = true
}) {

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
 * Fake field (plain text showed as an input field)
 *
 * @param {Object} args
 * @param {string} args.label - label.
 * @param {string | number | null} args.value - text content.
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper.
 * @param {boolean} [args.noBorder=true] - adds `no-border` class.
 * @param {string | null} [args.className=null] - optional class to be added to the fake field.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @param {string | HTMLElement | null} args.help - Optional help text.
 * @param {(function(HTMLElement): void) | null} args.callback - Optional callback function.
 * @param {Record<string, any> | null}  [args.attrs={}] - Optional attributes object.
 * @returns {DomBuilderItem|null} The fake field domBuilder item, or `null` when `condition` is false.
 */
export function buildFakeField({
  label,
  value = null,
  wrapperClass = null,
  className = null,
  condition = true,
  help = null,
  callback = null,
  attrs = {},
  noBorder = true
}) {


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
          name: name,
        },
        content: value,
        callback: callback
      }
    ]
  });
}
