# @gift-sales/storage

SQLite-хранилище котировок и типы HTTP API.

## Quote

```ts
type Quote = {
  brand: string;
  face_value: number;
  face_currency: string;
  region: string;
  price_rub: number;
  price_rub_was: number | null;
  discount_pct: number | null;
  source: string;
  source_url: string | null;
  fetched_at: string; // ISO 8601 UTC
};
```

## HTTP API (Next.js Route Handlers)

Базовый путь приложения: `/gift-sales`. Эндпоинты ниже — относительно корня Next (`/api/...`), с учётом `basePath` полный URL: `/gift-sales/api/...`.

### Ошибки

Единый формат:

```json
{ "error": "Human-readable message", "code": "ERROR_CODE" }
```

| HTTP | code | Когда |
|------|------|-------|
| 400 | `MISSING_BRAND` | нет query `brand` |
| 400 | `INVALID_BRAND` | `brand` с недопустимыми символами |
| 400 | `INVALID_FACE_VALUE` | `face_value` не положительное число |
| 404 | `UNKNOWN_BRAND` | `brand` не в whitelist `brands.yaml` |
| 500 | `DB_ERROR` | сбой чтения SQLite |
| 500 | `CONFIG_ERROR` | сбой чтения `sources.yaml` |

### `GET /api/quotes`

Query:

- `brand` (обяз.) — бренд из `brands.yaml`
- `region` (опц.)
- `face_value` (опц.) — положительное число

Ответ `200`: JSON-массив `Quote[]` — последний snapshot по каждой паре (номинал + регион + источник). Пустой массив, если данных нет.

### `GET /api/quotes/best`

Query:

- `brand` (обяз.)

Ответ `200`: JSON-массив `Quote[]` — по одной записи на группу (номинал + регион) с минимальным `price_rub` среди источников на последнем snapshot; поле `source` — выбранный источник.

### `GET /api/sources`

Ответ `200`: JSON-массив:

```ts
type SourceCategoryResponse = {
  url: string;
  brand: string;
};

type SourceResponse = {
  id: string;
  base_url: string;
  categories: SourceCategoryResponse[];
  last_fetched_at: string | null; // MAX fetched_at в БД по id источника
};
```

Источники из `sources.yaml` (реестр `sources[]`) объединяются с записями в БД; без строк в БД — `last_fetched_at: null`.

## QuoteRepository

- `getLatestQuotes(filter?)` — последние котировки по `(brand, face_value, region, source)`
- `getBestQuotes(brand)` — лучшая цена по `(face_value, region)`
- `getSourceLastFetchedAt()` — `MAX(fetched_at)` по каждому `source`
