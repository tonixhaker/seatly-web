export { cn } from 'cn';

export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(
    cents / 100,
  );
}
