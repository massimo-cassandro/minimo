/**
 * Uses the ResizeObserver API to observe changes within the given HTML Element DOM Rect.
 * @param elementRef
 * @author Massimo Cassandro (forked from https://github.com/antonioru/beautiful-react-hooks/blob/master/src/useResizeObserver.ts)
 * @returns {object}
 */

import { useRef, useEffect, useState} from 'react';

export function useResizeObserver(elementRef) {

  const [DOMRect, setDOMRect] = useState(null),
    observerRef = useRef();

  // init
  useEffect(() => {
    observerRef.current = new ResizeObserver( entries => {
      const { bottom, height, left, right, top, width } = entries[0].contentRect;
      setDOMRect({ bottom, height, left, right, top, width });
    });
  }, []);

  // observe
  useEffect(() => {
    observerRef.current.observe(elementRef.current);
  }, [elementRef]);

  return DOMRect;
}
