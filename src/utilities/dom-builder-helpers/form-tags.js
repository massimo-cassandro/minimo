import { classnames } from '../classnames.js';
import { randomId } from '../random-id.js';

/**
 * Input tag builder
 *
 * @param {Object} args
 * @param {string} args.label - input label.
 * @param {string | null} args.name - input `name` attribute.
 * @param {string | number | null} args.defaultValue - input `value` attribute.
 * @param {string | null} [args.type='text'] - input `type` attribute.
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @returns {DomBuilderItem|null} The `input` domBuilder item, or `null` when `condition` is false.
 */
export function buildInputTag({
  label,
  name,
  defaultValue,
  type = 'text',
  wrapperClass = null,
  condition = true
}){

  if(!condition) {
    return null;
  }

  const id = randomId();

  return {
    className: classnames('form-group', wrapperClass),
    children: [
      `label.form-label[for:${id}] ${label}`,
      `input#${id}.form-control[type: ${type}, name: ${name}, value: ${defaultValue}]`
    ]
  };
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
 * @returns {DomBuilderItem|null} The `.form-check` (or `.form-group`-wrapped) domBuilder item, or `null` when `condition` is false.
 */
export function buildCheckboxTag({
  label,
  name,
  value = 1,
  checked = false,
  wrapperClass = null,
  addFormGroup = true,
  condition = true
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
    className: classnames('form-check', !addFormGroup && wrapperClass),
    children: [
      {
        tag: 'input',
        className: 'form-check-input',
        id: id,
        attrs: {
          type: 'checkbox',
          value: value,
          name: name,
          checked: checked
        }
      },
      `label.form-label[for:${id}] ${label}`,
    ]
  };

  if(addFormGroup) {
    return {
      className: classnames('form-group', wrapperClass),
      children: [ tag ]
    };

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
 * @param {string | number | null} args.defaultValue - textarea content.
 * @param {string | null} [args.wrapperClass=null] - optional class to be added to the `.form-group` wrapper.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @returns {DomBuilderItem|null} The `textarea` domBuilder item, or `null` when `condition` is false.
 */
export function buildTextareaTag({
  label,
  name,
  defaultValue,
  wrapperClass = null,
  condition = true
}) {

  if(!condition) {
    return null;
  }

  const id = randomId();

  return {
    className: classnames('form-group', wrapperClass),
    children: [
      `label.form-label[for:${id}] ${label}`,
      `textarea#${id}.form-control[name: ${name}] ${defaultValue}`
    ]
  };
}
