# Aislamiento de instancias

Minecraft guarda sus mundos, paquetes y ajustes en una carpeta de datos de juego por dispositivo. El **aislamiento de instancias** (en la aplicación: **Habilitar aislamiento** en **Configuración de instancia**, y **Aislamiento de instancia** al instalar una versión) da a una instancia una carpeta de datos de juego propia, dentro de la instancia. La línea de comandos llama a los dos modos *own data* (datos propios) y *shared data* (datos compartidos).

## Datos compartidos y datos propios

=== "Windows"

    Una instancia **sin aislamiento** usa los datos de juego que Minecraft usa normalmente en este PC: los mismos mundos, paquetes y ajustes que el juego de Microsoft Store y que cualquier otra instancia del mismo tipo sin aislamiento.

    Una instancia **con aislamiento** guarda sus datos de juego en su propia carpeta. Sus mundos, paquetes de recursos, paquetes de comportamiento, paquetes de skins, capturas de pantalla, lista de servidores y ajustes del juego están separados de cualquier otra instancia y del juego de Microsoft Store.

    | Instancia | Datos compartidos (aislamiento desactivado) | Datos propios (aislamiento activado) |
    | --- | --- | --- |
    | GDK, Release | `%APPDATA%\Minecraft Bedrock` | `<instancia>\Minecraft Bedrock` |
    | GDK, Preview | `%APPDATA%\Minecraft Bedrock Preview` | `<instancia>\Minecraft Bedrock Preview` |
    | UWP, Release | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<instancia>\Minecraft Bedrock` |
    | UWP, Preview | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState` | `<instancia>\Minecraft Bedrock Preview` |
    | UWP, Beta | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<instancia>\Minecraft Bedrock Beta` |

    `<instancia>` es la carpeta de la instancia en `Instances` (consulta [Carpetas y archivos](../reference/files)). Dentro de una carpeta de datos GDK, el juego guarda los datos de cada jugador en `Users\` (consulta [perfiles de jugador](./instances#player-profiles)); dentro de una UWP, en `games\com.mojang\`.

=== "Android"

    El aislamiento de versiones mantiene los datos de juego de una versión (mundos, paquetes y ajustes) separados de las demás versiones y del Minecraft instalado desde Google Play. Cambiarlo en una instancia no afecta a las demás. Las versiones importadas suelen necesitar el aislamiento para iniciarse.

## Cómo funciona <Badge platform="windows" />

El juego en sí no sabe nada de instancias. Cuando LeviLauncher instala una instancia, coloca su cargador, `LeviLauncher.dll`, junto al ejecutable del juego (consulta [Cómo se cargan los mods](./mod-loading)). Cuando el juego se inicia con el aislamiento activado, el cargador redirige las carpetas donde el juego busca sus datos (las carpetas de datos de aplicación y la carpeta temporal) a la carpeta de datos de la instancia. No se copia ni se enlaza nada: el juego simplemente lee y escribe allí.

Lo que el aislamiento no cambia:

- **Los mods** siempre van por instancia, en la carpeta `mods\` de la instancia, con o sin aislamiento.
- **La cuenta de Microsoft** y la configuración del propio lanzador son las mismas para todas las instancias.
- **El registro** en Windows (consulta [Instancias y versiones del juego](./instances#registration-with-windows)) es independiente del aislamiento.

## Límites <Badge platform="windows" />

- Las instancias GDK admiten el aislamiento en todas las versiones; las UWP, desde la versión 1.19.70.2 y solo en x64.
- Activar el aislamiento no copia nada: la instancia empieza con datos de juego vacíos. Para partir de datos existentes, elige copiar datos al instalar la versión (del juego instalado en este PC, o de otra instancia aislada del mismo tipo), o cópialos después con `LeviLauncher.exe instance copy-data` (GDK).
- Desactivar el aislamiento hace que la instancia vuelva a usar los datos compartidos; su carpeta de datos propios se queda en la carpeta de la instancia.
- Eliminar una instancia borra su carpeta, **incluidos los mundos de sus datos propios**. Haz antes una copia de seguridad de los mundos importantes (consulta [Herramientas para mundos](../guide/world-tools)).
- El contenido solo se puede copiar de una instancia a otra si el destino tiene datos propios, o si es una instancia UWP que no usa la misma carpeta de datos.

## Cuándo usarlo

El aislamiento es útil cuando quieres:

- conjuntos de contenido distintos para versiones distintas
- probar mods o versiones Preview de Minecraft con más seguridad
- menos riesgo de que una configuración afecte a otra

Una combinación que funciona bien: una instancia Release aislada para jugar normalmente, una instancia Preview aislada solo cuando haga falta y una instancia temporal de pruebas para mods o para solucionar problemas.

## Páginas relacionadas

- [Gestión de versiones](../guide/version-management)
- [Gestión de contenido](../guide/content-management)
- [Instancias y versiones del juego](./instances)
