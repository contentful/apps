import { useEffect, useRef, type RefObject } from 'react';

export const useMultiselectScrollReflow = <T>(selection: T[]): RefObject<HTMLUListElement> => {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (listRef.current) {
      const element = listRef.current;
      const currentScroll = element.scrollTop;
      const maxScroll = element.scrollHeight - element.clientHeight;

      if (currentScroll >= maxScroll) {
        element.scrollTop = currentScroll - 1;
      } else {
        element.scrollTop = currentScroll + 1;
      }

      element.scrollTop = currentScroll;
    }
  }, [selection]);

  return listRef;
};
