import { useEffect, useRef, type RefObject } from 'react';

export const useMultiselectScrollReflow = <T>(selection: T[]): RefObject<HTMLUListElement> => {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Floating UI's autoUpdate listens to window resize to reposition the popover.
    // Dispatching a resize event on selection change ensures the portal realigns
    // regardless of whether the filtered list is scrollable.
    window.dispatchEvent(new Event('resize'));
  }, [selection]);

  return listRef;
};
