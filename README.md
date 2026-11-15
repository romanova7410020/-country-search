# Country Search

Живой поиск стран по названию через [countries.dev](https://countries.dev).

## Запуск

```bash
npm install
npm run dev
```

Откройте адрес, который покажет Vite.

## Проверка

```bash
npm test
npm run lint
npm run build
```

## Возможности

- поиск с debounce;
- настоящая отмена устаревших запросов через `AbortController`;
- таймаут запросов;
- отдельная обработка `AbortError`, `TimeoutError`, `HttpError` и ответа 404;
- карточки стран и подробная информация;
- тесты на debounce, API, преобразование данных и отмену запросов.

Архитектура и обоснование решений описаны в [DESIGN.md](DESIGN.md).

## Структура

- `src/api.ts` — API, ошибки и преобразование ответа;
- `src/debounce.ts` — самописный debounce;
- `src/main.ts` — интерфейс и состояния приложения;
- `tests/` — тесты Vitest.
