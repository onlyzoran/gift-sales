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
```

- `npm run dev` — локальный dev-сервер Next.js (http://localhost:3000)
- `npm run build` — production-сборка
- `npm run lint` — ESLint по проекту

## Структура

```
src/
  app/          — Next.js App Router (layout, страницы)
  components/   — React-компоненты UI
packages/
  collector/    — cron-сбор цен с источников
  adapters/     — адаптеры к внешним API и форматам
```

Ant Design подключён в `src/app/layout.tsx` через `ConfigProvider` и `@ant-design/nextjs-registry`.
