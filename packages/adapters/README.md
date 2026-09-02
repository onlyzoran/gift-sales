# @gift-sales/adapters

Адаптеры внешних источников котировок для gift-sales.

## User-Agent

HTTP-запросы к kupikod.com отправляются с заголовком:

```
gift-sales/0.1 (+https://github.com/onlyzoran/gift-sales; onlyzoran@gmail.com)
```

Переопределение через переменную окружения `GIFT_SALES_USER_AGENT`.

## kupikod

Модуль `kupikod` парсит каталог Apple App Store & iTunes на kupikod.com:

- каталог: JSON-LD `ItemList` → URL карточек;
- карточка: JSON-LD `Product.offers` → `price_rub`, slug → номинал/валюта/регион;
- опционально `oldPriceRub` из HTML → скидка.

Rate limit по умолчанию: ~2 req/s (500 ms между запросами).
