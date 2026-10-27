/* eslint-disable @typescript-eslint/no-explicit-any */
export function track(name: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, properties);
  }
}