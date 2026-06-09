// https://frontendcoding.com/getting-the-height-of-a-hidden-element/
export function getHiddenHeight(el) {
  if(!el?.cloneNode) {
    return null;
  }

  const clone = el.cloneNode(true);

  Object.assign(clone.style, {
    overflow: 'visible',
    height: 'auto',
    maxHeight: 'none',
    opacity: '0',
    visibility: 'hidden',
    display: 'block',
  });

  el.after(clone);
  const height = clone.offsetHeight;

  clone.remove();

  return height;
}
