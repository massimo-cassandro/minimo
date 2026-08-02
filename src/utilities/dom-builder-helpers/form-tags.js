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
 * @param {Array} args.children - domBuilder children to render inside the `.form-group` (before the help text).
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
 * @param {string | number | null} args.value - input `value` attribute.
 * @param {string | null} [args.type='text'] - input `type` attribute.
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @param {string | HTMLElement | null} args.help - Optional help text.
 * @param {(function(HTMLElement): void) | null} args.callback - Optional callback function.
 * @param {object | null}  [args.attrs={}] - Optional attributes object.
 * @returns {DomBuilderItem|null} The `input` domBuilder item, or `null` when `condition` is false.
 */
export function buildInputTag({
  label,
  name,
  value = null,
  type = 'text',
  wrapperClass = null,
  condition = true,
  help = null,
  attrs = {},
  callback = null
}){

  const id = randomId();

  return buildFormGroup({
    condition,
    wrapperClass,
    help,
    children: [
      `label.form-label[for:${id}] ${label}`,
      {
        tag: 'input',
        className: 'form-control',
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
 * Checkbox tag builder
 *
 * @param {Object} args
 * @param {string} args.label - checkbox label.
 * @param {string | null} args.name - checkbox `name` attribute.
 * @param {string | number | null} [args.value=1] - checkbox `value` attribute.
 * @param {boolean} [args.checked=false] - checkbox `checked` attribute.
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper (used only when `addFormGroup` is true).
 * @param {boolean} [args.addFormGroup=true] - When true, wraps the checkbox in a `.form-group` element.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @param {string | HTMLElement | null} args.help - Optional help text.
 * @param {(function(HTMLElement): void) | null} args.callback - Optional callback function.
 * @param {object | null}  [args.attrs={}] - Optional attributes object.
 * @returns {DomBuilderItem|null} The `.form-check` (or `.form-group`-wrapped) domBuilder item, or `null` when `condition` is false.
 */
export function buildCheckboxTag({
  label,
  name,
  value = 1,
  checked = false,
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
  <div class="form-group">
    <div class="form-check">
      <input type="checkbox" id="..." name="..." class="form-check-input" value="1">
      <label for="..." class="form-label">...</label>
    </div>
  </div>
  */
  const id = randomId();

  const tag = {
    className: classnames('form-check', !addFormGroup && !help && wrapperClass),
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
          checked: checked
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
 * @param {string | number | null} args.value - textarea content.
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @param {string | HTMLElement | null} args.help - Optional help text.
 * @param {(function(HTMLElement): void) | null} args.callback - Optional callback function.
 * @param {object | null}  [args.attrs={}] - Optional attributes object.
 * @returns {DomBuilderItem|null} The `textarea` domBuilder item, or `null` when `condition` is false.
 */
export function buildTextareaTag({
  label,
  name,
  value = null,
  wrapperClass = null,
  condition = true,
  help = null,
  callback = null,
  attrs = {}
}) {

  const id = randomId();

  return buildFormGroup({
    condition,
    wrapperClass,
    help,
    children: [
      `label.form-label[for:${id}] ${label}`,
      {
        tag: 'textarea',
        className: 'form-control',
        id: id,
        attrs: {
          ...(attrs??{}),
          name: name,
          value: value
        },
        callback: callback
      }
    ]
  });
}
