import { useCallback, useRef } from 'react';

export function useAutoSelect() {
  const ref = useRef<HTMLInputElement>(null);
  const onFocus = useCallback(() => {
    requestAnimationFrame(() => ref.current?.select());
  }, []);
  return { ref, onFocus };
}
