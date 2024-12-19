export function timeFunction<T, A extends unknown[]>(
  name: string,
  fn: (...args: A) => T,
  ...args: A
): T {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();

  const time = end - start;
  if (time > 5) {
    console.log(`${name} took ${time} ms`);
  }
  return result;
}
