import { useInBrowser } from '~/hooks/useInBrowser';

export function useContentfulAutoResizer() {
  useInBrowser(() => {
    // eslint-disable-next-line no-unsafe-optional-chaining
    const { startAutoResizer } = window?.__SDK__?.window;
    if (typeof startAutoResizer === 'function') {
      startAutoResizer();
    }
  }, [typeof window !== 'undefined']);
}
