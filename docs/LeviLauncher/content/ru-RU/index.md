# LeviLauncher

Лаунчер Minecraft Bedrock для Windows и Android: устанавливайте, управляйте, изолируйте, модифицируйте и запускайте Minecraft Bedrock Edition на ПК с Windows или устройстве Android.

**Скачать:** [LeviLauncher для Windows](https://github.com/LiteLDev/LeviLauncher/releases/latest) · [LeviLauncher для Android](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) · на странице [Загрузки](./download) указано, что нужно каждой версии, и перечислены другие источники загрузки.

::: info Windows и Android
У LeviLauncher есть **версия для Windows** для Minecraft Bedrock Edition (GDK / UWP) и **версия для Android** для официального Minecraft из Google Play. Для обеих нужна легальная лицензионная копия игры. Версии для iOS нет, и она не планируется.
:::

::: tip Начните здесь
Впервые пользуетесь LeviLauncher? Руководство [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/) (на английском) проведёт вас от загрузки LeviLauncher до первой игры с модами.
:::

## Что умеет LeviLauncher

- **Управление версиями.** Устанавливайте, переименовывайте, запускайте и удаляйте версии Minecraft Release или Preview, сохраняя полный контроль над каждой сборкой. Каждая установленная копия — это *инстанс*: см. [Управление версиями](./guide/version-management) и [Инстансы и версии игры](./concepts/instances).
- **Чистая изоляция.** Храните миры, паки и файлы игры отдельно от стандартной установки в AppData, обеспечивая безопасное рабочее пространство: см. [Изоляция инстансов](./concepts/isolation).
- **Инструменты контента.** Управляйте мирами, ресурс-паками, поведенческими паками, паками скинов, скриншотами и списком серверов в одном месте: см. [Управление контентом](./guide/content-management).
- **Поддержка модов.** Импортируйте пакеты модов `.mcmod`, просматривайте CurseForge и устанавливайте LeviLamina и пакеты LIP встроенным менеджером пакетов: см. [Моды и интеграции](./guide/mods-integrations) и [Как загружаются моды](./concepts/mod-loading).
- **Утилиты для миров.** Экспортируйте резервные копии, анализируйте данные мира и редактируйте выбранные поля `level.dat` без выхода из лаунчера: см. [Инструменты для миров](./guide/world-tools).
- **Настройки для пользователя.** Настраивайте язык, внешний вид, поведение загрузок, параметры конфиденциальности, каналы обновлений и управление пакетами: см. [Настройки и персонализация](./guide/settings-personalization) и [Все настройки](./reference/settings).
- **Возможности Android.** Переключение аккаунтов Xbox и URI-действия быстрого запуска в том же лаунчере: см. [Аккаунты и быстрый запуск](./guide/accounts-quick-launch).

## Короткий пример

В Windows всё, что делает окно лаунчера, можно сделать и из терминала. Эти три команды устанавливают новейшую версию Minecraft Release как новый инстанс с LeviLamina и делают его инстансом по умолчанию, добавляют в него мод из [LeviMC Mods](https://levimc.org/mods/) и запускают игру:

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe play
```

Для установки версии GDK нужен вход в аккаунт Microsoft, которому принадлежит Minecraft (`LeviLauncher.exe account login`). В окне те же шаги — это страница **Скачать**, страница **LeviMC Mods** и кнопка **Запуск**. В справочнике [Командная строка](./reference/command-line) перечислены все команды.

## Что охватывает этот сайт

Эта документация написана для **игроков и конечных пользователей**, а не для разработчиков.

- **Руководства**: одна задача на страницу. Получите приложение на странице [Загрузки](./download), затем [управляйте версиями](./guide/version-management), [загрузками и зеркалами](./guide/downloads-mirrors), [контентом](./guide/content-management), [аккаунтами и быстрым запуском](./guide/accounts-quick-launch) (Android), [модами](./guide/mods-integrations), [мирами](./guide/world-tools) и [настройками](./guide/settings-personalization). Группа «Помощь» посвящена [обновлению и устранению неполадок](./guide/update-troubleshooting) и [сообществу и обратной связи](./guide/faq-community-feedback).
- **Концепции**: как устроен LeviLauncher: [инстансы и версии игры](./concepts/instances) (Release и Preview, GDK и UWP, Windows и Android), [изоляция инстансов](./concepts/isolation) и [как загружаются моды](./concepts/mod-loading).
- **Справочник**: [командная строка](./reference/command-line), [все настройки](./reference/settings), [папки и файлы](./reference/files), которые использует LeviLauncher, [URI быстрого запуска](./reference/quick-launch-uri) для Android и [политика конфиденциальности](./privacy-policy) версии для Android.

Рекомендуемый порядок чтения: руководство [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/), затем [Управление версиями](./guide/version-management) и [Управление контентом](./guide/content-management).

## Каналы загрузки

- **Релизы GitHub (загрузка LeviLauncher):** [LiteLDev/LeviLauncher Releases](https://github.com/LiteLDev/LeviLauncher/releases)
- **Зеркало Lanzou:** [levimc.lanzoue.com/b016ke39hc](https://levimc.lanzoue.com/b016ke39hc) — пароль: `levi`
- **Версия для Android:** [LiteLDev/LeviLauncher-Android Releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

## Сообщество и обратная связь

- **Официальный Discord:** [discord.gg/v5R5P4vRZk](https://discord.gg/v5R5P4vRZk)
- **Личный Discord:** [discord.gg/VqQaC8vWz8](https://discord.gg/VqQaC8vWz8)
- **Группа QQ:** [458083875](https://qm.qq.com/q/1z791rJgJG)
- **Трекер ошибок:** [GitHub Issues](https://github.com/LiteLDev/LeviLauncher/issues)
