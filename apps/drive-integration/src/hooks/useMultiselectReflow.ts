import { useEffect, useRef, type RefObject } from 'react';

export const useMultiselectScrollReflow = <T>(selection: T[]): RefObject<HTMLUListElement> => {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (listRef.current) {
      const element = listRef.current;
      const currentScroll = element.scrollTop;
      const maxScroll = element.scrollHeight - element.clientHeight;

      if (maxScroll > 0) {
        if (currentScroll >= maxScroll) {
          element.scrollTop = currentScroll - 1;
        } else {
          element.scrollTop = currentScroll + 1;
        }
        element.scrollTop = currentScroll;
      } else {
        // When the filtered list is too short to scroll, the nudge above produces no scroll
        // event, so Floating UI never repositions the popover. Dispatching a resize event
        // is the reliable fallback — autoUpdate listens to window resize by default.
        window.dispatchEvent(new Event('resize'));
      }
    }
  }, [selection]);

  return listRef;
};
