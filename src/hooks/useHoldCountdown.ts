import { useEffect, useState } from 'react';
import { formatRemaining, useCartStore } from '@/stores/cart.store';

export function useHoldCountdown(): string | null {
  const expiresAt = useCartStore((s) => s.expiresAt);
  const tick = useCartStore((s) => s.tick);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (expiresAt === null) return;
    const id = setInterval(() => {
      const t = Date.now();
      tick(t);
      setNow(t);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, tick]);

  return expiresAt === null ? null : formatRemaining(expiresAt, now);
}
