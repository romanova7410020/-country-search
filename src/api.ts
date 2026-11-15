export interface CountryApiResponse {
  name: string | { common?: string; official?: string };
  flags?: { svg?: string; png?: string; alt?: string };
  capital?: string | string[];
  region?: string;
  population?: number;
  area?: number;
  borders?: string[];
  languages?: Record<string, string> | Array<{ name?: string; common?: string }>;
  currencies?: Record<string, { name?: string; symbol?: string }> | Array<{ name?: string; symbol?: string }>;
  description?: string;
}

export interface CountryCard {
  name: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  area: number;
  borders: string[];
  languages: string[];
  currencies: string[];
  description: string;
}

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Request failed with status ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

function getName(raw: CountryApiResponse): string {
  if (typeof raw.name === 'string') return raw.name;
  return raw.name.common ?? raw.name.official ?? 'Unknown country';
}

function getCapital(raw: CountryApiResponse): string {
  if (Array.isArray(raw.capital)) return raw.capital[0] ?? 'No capital';
  return raw.capital ?? 'No capital';
}

function getLanguages(raw: CountryApiResponse): string[] {
  if (Array.isArray(raw.languages)) {
    return raw.languages.map((language) => language.name ?? language.common ?? '').filter(Boolean);
  }
  return Object.values(raw.languages ?? {});
}

function getCurrencies(raw: CountryApiResponse): string[] {
  if (Array.isArray(raw.currencies)) {
    return raw.currencies.map((currency) => currency.name ?? currency.symbol ?? '').filter(Boolean);
  }
  return Object.values(raw.currencies ?? {}).map(
    (currency) => currency.name ?? currency.symbol ?? '',
  ).filter(Boolean);
}

export function mapCountryResponse(raw: CountryApiResponse): CountryCard {
  return {
    name: getName(raw),
    flag: raw.flags?.svg ?? raw.flags?.png ?? '',
    capital: getCapital(raw),
    region: raw.region ?? 'Unknown region',
    population: raw.population ?? 0,
    area: raw.area ?? 0,
    borders: raw.borders ?? [],
    languages: getLanguages(raw),
    currencies: getCurrencies(raw),
    description: raw.description ?? '',
  };
}

export async function searchCountries(query: string, signal: AbortSignal): Promise<CountryCard[]> {
  const response = await fetch(`https://countries.dev/name/${encodeURIComponent(query)}`, { signal });

  if (response.status === 404) return [];
  if (!response.ok) throw new HttpError(response.status);

  const raw = (await response.json()) as CountryApiResponse[];
  return raw.map(mapCountryResponse);
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'TimeoutError';
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function createCombinedSignal(signal: AbortSignal, timeoutMs: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return AbortSignal.any([signal, timeoutSignal]);
}
