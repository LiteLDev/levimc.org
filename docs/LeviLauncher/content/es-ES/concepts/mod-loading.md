# Cómo se cargan los mods

Minecraft Bedrock no admite mods por sí mismo: un mod es código nativo que un cargador introduce en el proceso del juego cuando este se inicia. Esta página explica qué cargadores usa LeviLauncher, dónde están los mods y cómo encajan las distintas formas de añadir un mod.

## Dónde están los mods <Badge platform="windows" />

Cada instancia tiene una carpeta `mods\` (consulta [Carpetas y archivos](../reference/files)). Cada mod es una carpeta dentro de ella, con un `manifest.json` que lo describe:

| Campo | Significado |
| --- | --- |
| `name` | El nombre del mod. |
| `entry` | El archivo que carga el cargador, relativo a la carpeta del mod (un `.dll`). |
| `version` | La versión del mod. |
| `type` | Qué cargador lo carga: `preload-native` para el cargador nativo de LeviLauncher; los mods para LeviLamina tienen sus propios tipos. |
| `author` | Quién lo hizo (opcional). |

Los mods pertenecen a una instancia. No les afecta el [aislamiento](./isolation), que solo se refiere a los datos de juego.

**Desactivar un mod** (en **Gestionar Mods**, o con `LeviLauncher.exe mod disable`) cambia el nombre de su `manifest.json` a `manifest.json.close`; activarlo lo devuelve a su nombre. Los archivos del mod se quedan donde están, y un cargador que busca `manifest.json` ya no encuentra el mod.

## Los dos cargadores <Badge platform="windows" />

### El cargador nativo de LeviLauncher

Cuando LeviLauncher instala o prepara una instancia, coloca su cargador, `LeviLauncher.dll`, junto al ejecutable del juego y lo añade a las importaciones del ejecutable, para que Windows lo cargue con el juego. Esto funciona en las compilaciones x64, tanto GDK como UWP; es también lo que hace posible el [aislamiento](./isolation).

Cuando el juego se inicia, el cargador nativo recorre las carpetas de `mods\` por orden de nombre y carga el `entry` de cada mod cuyo `type` es `preload-native`. Se omiten las carpetas sin `manifest.json` y los mods de otros tipos. Si la instancia tiene otro precargador (un `preloader.dll` junto al juego), el cargador nativo le deja toda la carga de mods. El cargador nativo necesita el runtime de Visual C++ (x64), que LeviLauncher comprueba y ofrece instalar.

### LeviLamina

[LeviLamina](https://levimc.org/LeviLamina/) es el cargador de mods de LeviMC. La mayoría de los mods de [LeviMC Mods](https://levimc.org/mods/) son mods de LeviLamina: necesitan LeviLamina en una versión que admita la versión del juego de la instancia. LeviLauncher instala LeviLamina en las instancias GDK de las versiones que admite (el interruptor **Instalar LeviLamina** al instalar una versión, o la pestaña **Cargador** de **Configuración de instancia**), como un paquete de su gestor de paquetes integrado.

## Tres formas de añadir un mod <Badge platform="windows" />

| Añades | Lo que hace LeviLauncher |
| --- | --- |
| Un mod de **LeviMC Mods** (o `mod install owner/repo`) | Lo instala como paquete con el gestor de paquetes integrado, compatible con [lip](https://github.com/LiteLDev/lip): descarga la versión publicada para esta plataforma, instala los paquetes de los que depende y lo registra en el `.lip\state.json` de la instancia. Si el mod necesita LeviLamina y el instalado no encaja (o no hay ninguno), primero se instala un LeviLamina compatible. Estos mods se pueden actualizar y eliminar como paquetes. |
| Un paquete `.mcmod` (o un `.zip`) | Lo extrae en una carpeta nueva de `mods\`. El archivo debe contener un `manifest.json`. |
| Un único `.dll` | Lo coloca en una carpeta nueva de `mods\` y escribe un `manifest.json` para él: por defecto, el nombre del archivo como nombre, `preload-native` como tipo y `0.0.0` como versión. |

Un paquete indica dónde se ejecuta con `side` (`client` o `server`) y `platform` (como `win-x64`), en su `lip.toml` y en `.lip\state.json`. Para el cliente, LeviLauncher instala la variante `client` del mod si la tiene y, si no, su variante predeterminada. Consulta [Mods e integraciones](../guide/mods-integrations) para los detalles, incluida la migración de paquetes antiguos.

## Android <Badge platform="android" />

La versión para Android carga mods nativos: bibliotecas `.so` que se ejecutan en el proceso del juego. Mantén las configuraciones con mods en versiones aisladas e instala solo mods de fuentes de confianza. Para crear uno, sigue [Android native mods](https://levimc.org/LeviLamina/developer_guides/android/) en la documentación de LeviLamina.

## Páginas relacionadas

- [Mods e integraciones](../guide/mods-integrations)
- [Instancias y versiones del juego](./instances)
- [Línea de comandos](../reference/command-line)
