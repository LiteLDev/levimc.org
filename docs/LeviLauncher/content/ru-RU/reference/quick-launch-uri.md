---
platforms: [android]
---
# URI быстрого запуска

**Быстрый запуск** в версии для Android запускает Minecraft с URI `minecraft://`, который сообщает игре, что открыть сначала. Каждое действие экрана быстрого запуска строит один из URI ниже; **Пользовательский URI** принимает любой URI, начинающийся с `minecraft://`. Что игра сделает с URI, решает Minecraft.

LeviLauncher также открывает ссылки `minecraft://` из других приложений: Android предлагает его среди приложений, которые могут их открыть.

## Действия

| Действие | URI | Запрашивает |
| --- | --- | --- |
| **Как играть** | `minecraft://?showHowToPlayScreen=1` | — |
| **Вкладка серверов** | `minecraft://openServersTab` | — |
| **Профиль / Гардеробная** | `minecraft://showProfileScreen` | — |
| **Главная Рынка** | `minecraft://openStore` | — |
| **Minecoins** | `minecraft://?showMineCoinOffers=1` | — |
| **Marketplace Pass** | `minecraft://?openCsbPDPScreen=<tab>` | Вкладку: `Home`, `Content`, `Faq` или `Subscribe` |
| **Подключиться к серверу** | `minecraft://connect/?serverUrl=<адрес>&serverPort=<порт>` | Адрес и порт сервера (по умолчанию `19132`) |
| **Добавить внешний сервер** | `minecraft://?addExternalServer=<имя>\|<адрес>:<порт>` | Имя, адрес и порт (по умолчанию `19132`) |
| **Присоединиться к Realm** | `minecraft://acceptRealmInvite?inviteID=<код>` | Код приглашения в Realm |
| **Загрузить мир** | `minecraft://connect/?localWorld=<мир>` | Имя локального мира |
| **Выполнить команду** | `minecraft://?slashcommand=<команда>` | Команду для выполнения в игре |
| **Пользовательский URI** | любой `minecraft://…` | URI |

Имя сервера, имя мира и команда кодируются как URL (пробел становится `%20`, `/` — `%2F`).

## Пример

Чтобы зайти на сервер `play.example.org` с портом `19132`, выберите **Подключиться к серверу** или откройте на устройстве эту ссылку:

```text
minecraft://connect/?serverUrl=play.example.org&serverPort=19132
```

Остальные функции, доступные только на Android, описаны в разделе [Аккаунты и быстрый запуск](../guide/accounts-quick-launch).
