# gift-sales

Агрегатор цен на подарочные карты (Apple, Steam, …).

Стек: Next.js (App Router), React, TypeScript, Ant Design.

Сбор цен — collector по cron; UI — сравнение котировок из нескольких источников.

## Команды

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run collect -- --dry-run
```

- `npm run dev` — локальный dev-сервер Next.js (http://localhost:3000)
- `npm run build` — production-сборка
- `npm run lint` — ESLint по проекту
- `npm run collect` — сбор котировок из источников в `sources.yaml` в SQLite `data/quotes.db`
- `npm run collect -- --dry-run` — тот же прогон на fixture HTML без live HTTP (удобно локально и в CI)

## Структура

```
src/
  app/          — Next.js App Router (layout, страницы)
  components/   — React-компоненты UI
packages/
  collector/    — cron-сбор цен с источников
  adapters/     — адаптеры к внешним API и форматам
  storage/      — модель Quote и SQLite-репозиторий
```

Ant Design подключён в `src/app/layout.tsx` через `ConfigProvider` и `@ant-design/nextjs-registry`.

## HTTP API котировок

Базовый путь приложения: `/gift-sales`. Эндпоинты:

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/gift-sales/api/quotes` | Котировки по `brand` (+ опц. `region`, `face_value`) |
| GET | `/gift-sales/api/quotes/best` | Лучшая цена по каждой паре номинал+регион |
| GET | `/gift-sales/api/sources` | Источники и время последнего сбора |

Whitelist брендов — `brands.yaml`. Данные — SQLite `data/quotes.db` (пакет `@gift-sales/storage`).

Контракт ответов и коды ошибок — [packages/storage/README.md](packages/storage/README.md).

Примеры:

```bash
curl "http://localhost:3000/gift-sales/api/quotes?brand=apple"
curl "http://localhost:3000/gift-sales/api/quotes/best?brand=apple"
curl "http://localhost:3000/gift-sales/api/sources"
```

## Демо

Preview сборки по Goal #42: [http://202.71.15.138/gift-sales/preview/issue-42/](http://202.71.15.138/gift-sales/preview/issue-42/)
