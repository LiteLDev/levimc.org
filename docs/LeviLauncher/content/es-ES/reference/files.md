---
platforms: [windows]
---
# Carpetas y archivos

Todos los archivos y carpetas que lee y escribe la versión para Windows de LeviLauncher, según LeviLauncher 1.1.0. El lanzador no escribe nada en la carpeta temporal del sistema (`%TEMP%`).

## Resumen

| Carpeta | Ubicación | Contiene |
| --- | --- | --- |
| Carpeta de configuración | `%APPDATA%\LeviLauncher\` | Solo `config.json`: pequeño, y se mueve con tu perfil de Windows |
| Carpeta local | `%LOCALAPPDATA%\LeviLauncher\` | Registros, la cuenta de Microsoft, los datos WebView2 de la ventana; también es la raíz de datos predeterminada |
| Raíz de datos | la carpeta local, salvo que elijas otra (**Raíz base** en **Configuración → Configuración básica**, o `config set data-root`) | `Instances\`, `Backups\`, `Cache\` |

```text
%APPDATA%\LeviLauncher\
  config.json                      la configuración del lanzador
%LOCALAPPDATA%\LeviLauncher\        la raíz de datos predeterminada
  Logs\startup.log                 el registro del lanzador, y antes startup.1.log … startup.4.log
  Accounts\                        la cuenta de Microsoft y los registros del dispositivo, cifrados para tu usuario de Windows
  WebView2\                        los datos de la ventana del lanzador
  storage-migration.json           el registro del traslado desde la estructura antigua (ver abajo)
<raíz de datos>\
  Instances\<instancia>\           una instancia (ver abajo)
  Backups\
    Worlds\<instancia>\<carpeta>_<mundo>\<mundo>_<yyyyMMdd-HHmmss>.mcworld
    Instances\<instancia>\<instancia>_<yyyyMMdd-HHmmss>.zip
  Cache\
    Installers\                    instaladores del juego, y los de Visual C++ y WebView2
    Updates\                       actualizaciones del lanzador; se borran una vez instaladas
    Downloads\                     archivos descargados para una importación; se limpian al iniciar tras 1 día
    Imports\                       archivos entregados para una importación; se limpian al iniciar tras 1 día
    gdk-pending-versions.json
    gamertags.json                 los gamertags de los perfiles de jugador que ha visto el lanzador
```

Todo lo que hay en `Cache\` se puede borrar sin perder nada. `LeviLauncher.exe cache clean` borra la caché de paquetes, los archivos descargados para importaciones y las descargas sin terminar, y `LeviLauncher.exe installer remove` borra los instaladores del juego descargados. Cambiar la raíz de datos solo apunta el lanzador a otra carpeta: las instancias, descargas y copias de seguridad existentes no se mueven.

## La carpeta de una instancia

```text
Instances\<instancia>\
  Minecraft.Windows.exe …          los archivos del juego de la compilación
  LeviLauncher.dll                 el cargador nativo de LeviLauncher (compilaciones x64)
  .levilauncher\                   el estado del lanzador en la instancia (oculto)
    instance.json                  nombre, versión del juego, canal, aislamiento y opciones de inicio
    icon.ico                       el icono de la instancia, generado a partir del LargeLogo.png del juego
    xbox-auth-key-v1               una marca de las instancias UWP para el inicio de sesión de Xbox
  .lip\                            el estado de los paquetes instalados en la instancia (formato de lip)
  mods\                            los mods (ver Cómo se cargan los mods)
  Minecraft Bedrock\               los datos de juego, con el aislamiento activado (Preview: Minecraft Bedrock Preview)
```

Consulta [Aislamiento de instancias](../concepts/isolation) para las carpetas de datos de juego de instancias con y sin aislamiento, y [Cómo se cargan los mods](../concepts/mod-loading) para `mods\`.

## Fuera de las carpetas de LeviLauncher

| Ruta | Qué es |
| --- | --- |
| `Minecraft - <instancia>.lnk` en tu escritorio | El acceso directo de una instancia (**Crear acceso directo en el escritorio**, o `instance shortcut`). Abre el lanzador con `--launch=<instancia>`. Solo se escribe en tu propio escritorio, no en el público. |
| `%APPDATA%\lip\` | La configuración de lip: `config.toml`, por ejemplo su `github_proxy`, que también lee el gestor de paquetes integrado. |
| `%LOCALAPPDATA%\lip\Cache\` | La caché de paquetes del gestor de paquetes integrado, la misma que la de lip. **Limpiar caché** en **Configuración → Gestión de paquetes** la vacía. |
| `%APPDATA%\Minecraft Bedrock\`, `%APPDATA%\Minecraft Bedrock Preview\` | Los datos de juego compartidos de las instancias GDK sin aislamiento. |
| `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\` (Preview: `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`) | Los datos de juego compartidos de las instancias UWP sin aislamiento. |

## Cómo se escriben los archivos

- Un archivo se escribe junto a su lugar final como `<nombre>.<aleatorio>.tmp` y luego se renombra a su sitio, de modo que nunca se ve un archivo a medio escribir. Una descarga sin terminar que se puede reanudar se guarda como `<nombre>.partial.tmp`.
- Los nombres que eliges (instancias, mundos) se limpian con las reglas de Windows: se quitan los caracteres `<>:"/\|?*` y los puntos y espacios finales, y se evitan nombres reservados como `CON` o `NUL`.
- Los archivos que crea el lanzador se llaman `<nombre>_<yyyyMMdd-HHmmss>.<extensión>`, por ejemplo `MyWorld_20261107-142301.mcworld`.

## La estructura antigua

LeviLauncher anterior a 1.1.0 guardaba todo en `%APPDATA%\<nombre del programa>\` (por ejemplo `%APPDATA%\levilauncher.exe\`), con las carpetas `versions\`, `backups\`, `installers\`, `updates\`, `logs\` y los archivos `config.json`, `user_gamertag_map.json` y `gdk_pending_versions.json`. Las instancias contenían `version.json` y `LargeLogo.ico`.

En su primer inicio, LeviLauncher 1.1.0 o posterior traslada estos datos una sola vez a la estructura de arriba, sin borrar nada: los datos de la misma unidad se renombran a su sitio, los de otra unidad se copian y se conserva el original, y el antiguo `config.json` pasa a llamarse `config.migrated.json`. Una raíz de datos que hubieras elegido se queda donde está. Si algo no se puede trasladar (por ejemplo porque el juego se está ejecutando desde una instancia), se deshacen todos los pasos y el lanzador funciona con la estructura antigua hasta el siguiente inicio. `storage-migration.json` registra qué se trasladó y adónde; después se actualizan los accesos directos del escritorio a las nuevas ubicaciones.
