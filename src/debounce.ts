export type DebouncedFunction<Arguments extends unknown[]> = (...args: Arguments) => void;

export function debounce<Arguments extends unknown[]>(
  fn: (...args: Arguments) => void,
  delay: number,
): DebouncedFunction<Arguments> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Arguments) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
