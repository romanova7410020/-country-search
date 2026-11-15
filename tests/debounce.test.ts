import { describe, expect, it, vi, afterEach } from 'vitest';
import { debounce } from '../src/debounce';

describe('debounce', () => {
  afterEach(() => vi.useRealTimers());

  it('delays execution and keeps the latest arguments', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 250);
    debounced('old');
    vi.advanceTimersByTime(200);
    debounced('latest');
    vi.advanceTimersByTime(249);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('latest');
  });
});
