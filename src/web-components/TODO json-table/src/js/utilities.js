export function isFunction (item) { return item && typeof item === 'function';}

export function titleCase(str) {
  return str.at(0).toUpperCase() + str.substring(1);
}
