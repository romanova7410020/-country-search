import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  HttpError,
  createCombinedSignal,
  isAbortError,
  isHttpError,
  isTimeoutError,
  mapCountryResponse,
  searchCountries,
} from '../src/api';

afterEach(() => vi.restoreAllMocks());

describe('searchCountries', () => {
  it('maps successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ name: 'Spain', capital: ['Madrid'], languages: { spa: 'Spanish' } }]),
    }));
    await expect(searchCountries('spain', new AbortController().signal)).resolves.toEqual([
      expect.objectContaining({ name: 'Spain', capital: 'Madrid', languages: ['Spanish'] }),
    ]);
  });

  it('returns an empty array for 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(searchCountries('unknown', new AbortController().signal)).resolves.toEqual([]);
  });

  it('throws HttpError for other HTTP failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(searchCountries('spain', new AbortController().signal)).rejects.toEqual(
      new HttpError(500),
    );
  });
});

describe('mapCountryResponse', () => {
  it('converts API data into card data', () => {
    expect(mapCountryResponse({
      name: { common: 'Spain' },
      flags: { svg: '/spain.svg' },
      capital: ['Madrid'],
      region: 'Europe',
      population: 47000000,
      area: 505000,
      borders: ['FRA'],
      languages: { spa: 'Spanish' },
      currencies: { EUR: { name: 'Euro', symbol: '€' } },
    })).toEqual(expect.objectContaining({
      name: 'Spain', flag: '/spain.svg', capital: 'Madrid', region: 'Europe',
      languages: ['Spanish'], currencies: ['Euro'],
    }));
  });
});

describe('error classification', () => {
  it('distinguishes abort, timeout, and HTTP errors', () => {
    const abort = new DOMException('aborted', 'AbortError');
    const timeout = new DOMException('timed out', 'TimeoutError');
    expect(isAbortError(abort)).toBe(true);
    expect(isTimeoutError(abort)).toBe(false);
    expect(isTimeoutError(timeout)).toBe(true);
    expect(isHttpError(new HttpError(500))).toBe(true);
  });

  it('combines caller cancellation with timeout', () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const signal = createCombinedSignal(controller.signal, 1000);
    controller.abort();
    expect(signal.aborted).toBe(true);
    vi.useRealTimers();
  });
});


describe('request race cancellation', () => {
  it('passes a signal that can abort an in-flight request', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn((_url: string, options?: RequestInit) => new Promise<never>((_, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    vi.stubGlobal('fetch', fetchMock);
    const promise = searchCountries('old', controller.signal);
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
