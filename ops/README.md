# gift-sales collector (systemd timer)

Периодический сбор котировок на VPS **без** конфликта с My Machines (`cursor-worker.service`), `board-watch` и `git pull` в `/opt/cursor-workers/gift-sales`.

## Runtime отдельно от worker-клона

| Путь | Назначение |
|------|------------|
| `/var/lib/gift-sales/app/` | Код приложения после `install-collect.sh` + `npm ci` |
| `/var/lib/gift-sales/data/quotes.db` | SQLite с котировками |
| `/var/lib/gift-sales/sources.yaml` | Конфиг источников |

`WorkingDirectory` сервиса — `/var/lib/gift-sales/app`, **не** `/opt/cursor-workers/gift-sales`. Обновление worker-клона для Cursor не затрагивает runtime и БД.

`cursor-worker.service`, `board-watch.*` и `--worker-dir` оркестратора **не меняем**.

## Установка (один раз, от root)

Из checkout репозитория на VPS (например после merge в `main`):

```bash
chmod +x ops/install-collect.sh
sudo ops/install-collect.sh
sudo systemctl enable --now gift-sales-collect.timer
```

Скрипт создаёт каталоги, копирует код в `/var/lib/gift-sales/app/`, ставит `sources.yaml`, unit-файлы в `/etc/systemd/system/`, делает `daemon-reload`.

Секреты (если понадобятся адаптерам) — только через `EnvironmentFile=-/etc/cursor-worker.env`; сам `cursor-worker.service` не редактируется.

## Таймер

- `gift-sales-collect.timer` — **30 минут после окончания** предыдущего прогона (`OnUnitInactiveSec=30min`), без наложения запусков.
- `gift-sales-collect.service` — `Type=oneshot`, пользователь `cursor-worker`.

## Проверка

```bash
# статус таймера и следующий запуск
systemctl list-timers gift-sales-collect.timer

# ручной прогон
systemctl start gift-sales-collect.service

# лог последнего сбора
journalctl -u gift-sales-collect.service -n 50 --no-pager

# код выхода oneshot-сервиса
systemctl status gift-sales-collect.service
```

Успешный прогон пишет сводку collector в journal; БД растёт в `/var/lib/gift-sales/data/quotes.db`.

## Обновление кода collector

После pull/merge новой версии на VPS:

```bash
sudo ops/install-collect.sh
```

Перезапускать `cursor-worker` не нужно.
