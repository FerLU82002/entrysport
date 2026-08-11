import { useState, useEffect } from 'react';

export function useDelayedLoading(isLoading: boolean, delay = 400): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [isLoading, delay]);

  return show;
}
