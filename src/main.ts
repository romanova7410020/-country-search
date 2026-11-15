import { debounce } from './debounce';
import {
  createCombinedSignal,
  isAbortError,
  isHttpError,
  isTimeoutError,
  searchCountries,
  type CountryCard,
} from './api';
import './styles.css';

const SEARCH_DELAY = 350;
const REQUEST_TIMEOUT = 8000;

const app = document.createElement('main');
app.id = 'app';
document.body.append(app);

const heading = document.createElement('h1');
heading.textContent = 'Поиск стран';
const form = document.createElement('form');
const input = document.createElement('input');
input.type = 'search';
input.placeholder = 'Введите название страны';
input.setAttribute('aria-label', 'Название страны');
const status = document.createElement('p');
status.className = 'status';
const results = document.createElement('section');
results.className = 'results';
results.setAttribute('aria-live', 'polite');
const details = document.createElement('aside');
details.className = 'details';

autoFocusInput();
form.append(input);
app.append(heading, form, status, results, details);

let activeController: AbortController | undefined;
let lastQuery = '';
let latestRequest = 0;

function autoFocusInput(): void {
  input.autocomplete = 'off';
}

function setStatus(message: string, type = ''): void {
  status.textContent = message;
  status.className = `status ${type}`.trim();
}

function clearElement(element: Element): void {
  while (element.firstChild) element.removeChild(element.firstChild);
}

function renderResults(countries: CountryCard[]): void {
  clearElement(results);
  countries.forEach((country) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'country-card';
    const flag = document.createElement('img');
    flag.src = country.flag;
    flag.alt = `${country.name} flag`;
    const name = document.createElement('strong');
    name.textContent = country.name;
    const facts = document.createElement('span');
    facts.textContent = `${country.capital} · ${country.region} · ${country.population.toLocaleString()}`;
    card.append(flag, name, facts);
    card.addEventListener('click', () => renderDetails(country));
    results.append(card);
  });
}

function renderDetails(country: CountryCard): void {
  clearElement(details);
  const title = document.createElement('h2');
  title.textContent = country.name;
  const description = document.createElement('p');
  description.textContent = country.description || 'Подробное описание отсутствует.';
  const facts = document.createElement('dl');
  const entries: [string, string][] = [
    ['Столица', country.capital],
    ['Регион', country.region],
    ['Площадь', `${country.area.toLocaleString()} км²`],
    ['Границы', country.borders.join(', ') || 'Нет'],
    ['Языки', country.languages.join(', ') || 'Нет данных'],
    ['Валюта', country.currencies.join(', ') || 'Нет данных'],
  ];
  entries.forEach(([label, value]) => {
    const term = document.createElement('dt');
    term.textContent = label;
    const definition = document.createElement('dd');
    definition.textContent = value;
    facts.append(term, definition);
  });
  details.append(title, description, facts);
}

async function runSearch(query: string): Promise<void> {
  const normalizedQuery = query.trim();
  lastQuery = normalizedQuery;
  activeController?.abort();
  activeController = undefined;
  const requestId = ++latestRequest;

  if (!normalizedQuery) {
    clearElement(results);
    clearElement(details);
    setStatus('');
    return;
  }

  const controller = new AbortController();
  activeController = controller;
  setStatus('Загрузка…', 'loading');

  try {
    const signal = createCombinedSignal(controller.signal, REQUEST_TIMEOUT);
    const countries = await searchCountries(normalizedQuery, signal);
    if (requestId !== latestRequest) return;
    renderResults(countries);
    setStatus(countries.length ? '' : 'Ничего не найдено', countries.length ? '' : 'empty');
  } catch (error: unknown) {
    if (requestId !== latestRequest || isAbortError(error)) return;
    if (isTimeoutError(error)) {
      showRetry('Запрос выполняется слишком долго.');
    } else if (isHttpError(error)) {
      showRetry(`Сервер вернул ошибку ${error.status}.`);
    } else {
      showRetry('Не удалось выполнить поиск. Проверьте соединение.');
    }
  } finally {
    if (activeController === controller) activeController = undefined;
  }
}

function showRetry(message: string): void {
  setStatus('', 'error');
  const text = document.createElement('span');
  text.textContent = message;
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Повторить';
  retry.addEventListener('click', () => void runSearch(lastQuery));
  status.append(text, retry);
}

const scheduleSearch = debounce((query: string) => void runSearch(query), SEARCH_DELAY);
input.addEventListener('input', () => {
  activeController?.abort();
  activeController = undefined;
  scheduleSearch(input.value);
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  void runSearch(input.value);
});
