
/**
 * Input tag builder
 *
 * @param {Object} args
 * @param {string} args.classname - table classname.
 * @param {object | null}  [args.attrs={}] - Optional table attributes object.
 * @param {object | null}  [args.thead={}] - Optional table thead object.

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
export function buildTableTag({
  classname = 'table',
  attrs = {},
  thead = {},
  tbody = {},
  tfoot = {}
}) {

}
