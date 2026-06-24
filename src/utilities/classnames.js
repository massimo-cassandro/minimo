export function classnames(...args) {
  return args.flat().filter(x => {
    if (x && typeof x !== 'string') {
      // eslint-disable-next-line no-console
      console.error('[classnames] valore non stringa ignorato in ', ...args);
      return false;
    }
    return Boolean(x);
  }).join(' ');
}

export function classnamesNull(...args) {
  return classnames(...args) || null;
}
