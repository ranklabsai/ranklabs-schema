/**
 * @internal
 * Dev-only warning helper. Logs to `console.warn` unless
 * `NODE_ENV === 'production'`. Not part of the public API; exported so
 * tests and library internals can share a single implementation.
 */
export function devWarn(message: string): void {
  const env =
    typeof process !== 'undefined' && process && process.env && process.env.NODE_ENV;
  if (env === 'production') return;
  // eslint-disable-next-line no-console
  console.warn(`[ranklabs-schema] ${message}`);
}
