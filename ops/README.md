# gift-sales ops (VPS)

Периодический collector и prod Next.js на VPS **без** конфликта с My Machines (`cursor-worker.service`), `board-watch` и `git pull` в `/opt/cursor-workers/gift-sales`.

## Единая prod SQLite

| Путь | Назначение |
|------|------------|
| `/var/lib/gift-sales/app/` | Код collector после `install-collect.sh` + `npm ci` |
| `/var/lib/gift-sales/data/quotes.db` | **Общая** SQLite: collector пишет, Next.js читает |
| `/var/lib/gift-sales/sources.yaml` | Конфиг источников для collector |
| `/opt/cursor-workers/gift-sales` | Worker-клон Next.js (git pull оркестратора) |

Collector и Next.js используют один файл БД. В приложении путь задаётся переменной **`GIFT_SALES_DB`** (fallback: `QUOTES_DB_PATH`, затем `data/quotes.db` в cwd). Prod: `GIFT_SALES_DB=/var/lib/gift-sales/data/quotes.db`.

`cursor-worker.service`, `board-watch.*` и `--worker-dir` оркестратора **не меняем**.

## Bootstrap collector (один раз, от root)

Из checkout репозитория на VPS (например после merge в `main`):

```bash
chmod +x ops/install-collect.sh
sudo ops/install-collect.sh
sudo systemctl enable --now gift-sales-collect.timer
```

Скрипт создаёт каталоги, копирует код в `/var/lib/gift-sales/app/`, ставит `sources.yaml`, unit-файлы collector в `/etc/systemd/system/`, делает `daemon-reload`.

Секреты (если понадобятся адаптерам) — только через `EnvironmentFile=-/etc/cursor-worker.env`; сам `cursor-worker.service` не редактируется.

## Prod Next.js (systemd)

Пример unit — `ops/gift-sales.service.example`. Применение на VPS:

```bash
sudo cp ops/gift-sales.service.example /etc/systemd/system/gift-sales.service
sudo systemctl daemon-reload
sudo systemctl enable --now gift-sales.service
```

Перед первым запуском в worker-клоне:

```bash
cd /opt/cursor-workers/gift-sales
npm ci
npm run build
```

Unit задаёт `WorkingDirectory=/opt/cursor-workers/gift-sales` и `Environment=GIFT_SALES_DB=/var/lib/gift-sales/data/quotes.db`, чтобы API (`/api/sources`, `/api/quotes`, …) и UI читали ту же БД, что collector.

## Таймер collector

- `gift-sales-collect.timer` — **30 минут после окончания** предыдущего прогона (`OnUnitInactiveSec=30min`), без наложения запусков.
- `gift-sales-collect.service` — `Type=oneshot`, пользователь `cursor-worker`.

## Мониторинг collector

```bash
# статус таймера и следующий запуск
systemctl list-timers gift-sales-collect.timer

# лог последних прогонов
journalctl -u gift-sales-collect.service -n 50 --no-pager

# код выхода и краткий статус oneshot
systemctl status gift-sales-collect.service
```

Успешный прогон пишет сводку collector в journal; БД растёт в `/var/lib/gift-sales/data/quotes.db`.

### Exit code ≠ 0 (oneshot failed)

1. **Прочитать journal** — полный traceback и сообщение collector:
   ```bash
   journalctl -u gift-sales-collect.service -n 100 --no-pager
   ```
2. **Ручной прогон** после исправления причины:
   ```bash
   sudo systemctl start gift-sales-collect.service
   systemctl status gift-sales-collect.service
   ```
3. **Типичные причины:**
   - **Сеть** — таймаут HTTP к источнику; проверить egress VPS, повторить ручной `systemctl start`.
   - **Парсинг** — изменилась вёрстка источника; правка адаптера в репо, `install-collect.sh`, ручной прогон.
   - **Права на `/var/lib/gift-sales/data/`** — каталог и `quotes.db` должны быть доступны пользователю `cursor-worker` (`install-collect.sh` создаёт с нужным владельцем).
   - **Конфиг** — ошибка в `sources.yaml`; сообщение в journal начинается с `sources.yaml:`.
4. **Timer vs конфиг:** при разовом сбое (сеть) достаточно дождаться следующего срабатывания timer или ручного `start`. При ошибке конфига или кода — править репо, снова `sudo ops/install-collect.sh`, затем ручной прогон; **перезапускать timer не обязательно**, если unit-файлы не менялись.

## Обновление кода collector

После pull/merge новой версии на VPS:

```bash
sudo ops/install-collect.sh
```

Перезапускать `cursor-worker` не нужно.

## Обновление Next.js

После merge в worker-клон:

```bash
cd /opt/cursor-workers/gift-sales
git pull
npm ci
npm run build
sudo systemctl restart gift-sales.service
```
