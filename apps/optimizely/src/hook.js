import { useRef, useEffect, useCallback } from 'react';

export const useLatest = (value) => {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return useCallback(() => {
    return ref.current;
  }, []);
}
