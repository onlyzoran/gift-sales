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
| 400 | `MISSING_FACE_VALUE` | нет query `face_value` (только `/api/quotes/history`) |
| 400 | `INVALID_FACE_VALUE` | `face_value` не положительное число |
| 400 | `MISSING_REGION` | нет query `region` (только `/api/quotes/history`) |
| 400 | `INVALID_FROM` | `from` не валидная ISO 8601 UTC дата |
| 400 | `INVALID_TO` | `to` не валидная ISO 8601 UTC дата |
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

### `GET /api/quotes/history`

Query:

- `brand` (обяз.) — бренд из `brands.yaml`
- `face_value` (обяз.) — положительное число
- `region` (обяз.)
- `from` (опц.) — ISO 8601 UTC, нижняя граница `fetched_at` (включительно)
- `to` (опц.) — ISO 8601 UTC, верхняя граница `fetched_at` (включительно)

Ответ `200`: JSON-массив `Quote[]` — все snapshot'ы для тройки (brand, face_value, region), отсортированные по `fetched_at` по возрастанию. Пустая история — `200` с `[]`.

Пример:

```http
GET /gift-sales/api/quotes/history?brand=apple&face_value=100&region=US&from=2026-09-01T00:00:00.000Z&to=2026-09-02T00:00:00.000Z
```

```json
[
  {
    "brand": "apple",
    "face_value": 100,
    "face_currency": "USD",
    "region": "US",
    "price_rub": 9500,
    "price_rub_was": null,
    "discount_pct": null,
    "source": "kupikod",
    "source_url": "https://example.com",
    "fetched_at": "2026-09-01T10:00:00.000Z"
  }
]
```

Ошибки валидации:

```json
{ "error": "Query parameter \"face_value\" is required", "code": "MISSING_FACE_VALUE" }
```

```json
{ "error": "Query parameter \"from\" must be a valid ISO 8601 UTC datetime", "code": "INVALID_FROM" }
```

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
- `getQuoteHistory({ brand, face_value, region, from?, to? })` — история snapshot'ов по тройке (brand, face_value, region), опционально в диапазоне `from`/`to`, порядок `fetched_at ASC`
- `getSourceLastFetchedAt()` — `MAX(fetched_at)` по каждому `source`
