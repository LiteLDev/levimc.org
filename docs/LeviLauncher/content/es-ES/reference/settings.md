---
platforms: [windows]
---
# Todos los ajustes

Todos los ajustes de la página **Configuración** de la versión para Windows, pestaña por pestaña, según LeviLauncher 1.1.0, con la clave de `config` que lo cambia desde la [línea de comandos](./command-line) cuando existe. El campo de búsqueda de la parte superior de la página encuentra un ajuste por su nombre. Para consejos sobre qué cambiar, consulta [Ajustes y personalización](../guide/settings-personalization).

## Configuración básica

| Ajuste | Qué hace | Clave |
| --- | --- | --- |
| **Rutas de contenido → Raíz base** | La raíz de datos: la carpeta que contiene las instancias, las descargas y las copias de seguridad (consulta [Carpetas y archivos](./files)). **Aplicar** guarda una carpeta nueva y **Restablecer** vuelve a la predeterminada. Debajo se muestran las carpetas de **Instaladores** y **Versiones**. Los datos existentes no se mueven. | `data-root` |
| **Idioma** | El idioma del lanzador. | — |
| **Discord Rich Presence** | Muestra el estado de tu partida en Discord. Activado por defecto. | `discord` |
| **Al iniciar Minecraft** | Qué hace el lanzador cuando se inicia Minecraft: **Minimizar el iniciador** (predeterminado), **Ocultar el iniciador**, **Cerrar el iniciador** o **Mantener el iniciador abierto**. | `on-game-launch` |
| **Al cerrar Minecraft** | Qué hace el lanzador cuando se cierra Minecraft: **Volver a abrir el iniciador** (predeterminado), **No hacer nada** o **Cerrar el iniciador**. | `on-game-exit` |
| **Ocultar en la bandeja al cerrar** | El botón de cerrar oculta el lanzador en la bandeja del sistema en lugar de salir; el botón de minimizar sigue minimizando a la barra de tareas. Desactivado por defecto. | `close-to-tray` |

## Personalización

La pestaña tiene cuatro partes. Los ajustes de personalización (colores, opacidad, etc.) se guardan por separado para el tema claro y el oscuro (**Ajustes por modo**): elige **Modo claro** o **Modo oscuro** para editar uno de ellos.

### Tema y colores

| Ajuste | Qué hace |
| --- | --- |
| **Modo de tema** | **Modo claro**, **Modo oscuro**, **Programación manual** (oscuro entre una **Hora de inicio del modo oscuro** y una **Hora de fin del modo oscuro**), **Amanecer/Atardecer** (según las horas locales de salida y puesta del sol, calculadas en el dispositivo) o **Seguir sistema** (el ajuste de Windows). |
| **Color del tema** | El color de acento: uno de los **Colores preestablecidos**, uno de **Más colores** o un **Color personalizado**. |
| **Modo base** | Un color sólido bajo la imagen de fondo, para dar contraste: **Ninguno**, **Seguir color del tema** o **Color personalizado**, con su **Opacidad base**. |

### Diseño y animaciones

| Ajuste | Qué hace |
| --- | --- |
| **Usar barra de navegación superior** | Una barra de navegación arriba en lugar de la barra lateral vertical. |
| **Desactivar animaciones** | Desactiva las animaciones de transición de la interfaz. |

### Fondo de pantalla

| Ajuste | Qué hace |
| --- | --- |
| **Imagen de fondo** | Una carpeta de imágenes para usar como fondo: **Seleccionar carpeta**, **Abrir carpeta**, **Limpiar carpeta**, y **Siguiente imagen** cuando la carpeta tiene varias imágenes. |
| **Modo de ajuste** | **Inteligente**, **Centro**, **Ajustar**, **Estirar**, **Mosaico**, **Superior izquierda** o **Superior derecha**. |
| **Orden de reproducción** | **Aleatorio** o **Secuencial** (orden natural de los nombres de archivo). |
| **Desenfoque de fondo**, **Brillo de fondo**, **Opacidad de fondo** | Cómo se muestra la imagen. |

### Materiales y legibilidad

| Ajuste | Qué hace |
| --- | --- |
| **Material de la interfaz** | El aspecto de la navegación, las tarjetas, las pestañas, los controles y las ventanas emergentes sobre el fondo. **Ajustes de material**: **Equilibrado** (predeterminado), **Nítido** o **Sólido**. |
| **Opacidad de la interfaz**, **Desenfoque de la interfaz**, **Capa sobre el fondo** | Ajustan el material. |
| **Protección de legibilidad** | Mantiene el texto legible con un tinte mínimo de superficie, según el tema, el brillo de la imagen y el desenfoque. |
| **Restablecer este tema** | Restaura el material del tema que se está editando. |

[Ajustes y personalización](../guide/settings-personalization#fondo-de-pantalla-y-material-de-la-interfaz) explica cada uno de ellos.

## Gestión de paquetes

| Ajuste | Qué hace | Clave |
| --- | --- | --- |
| **Limpiar caché** | Borra los archivos de paquetes descargados por el gestor de paquetes; úsalo cuando fallen las descargas de paquetes. | `cache clean packages` |
| **Usar servidores espejo** | Descarga las actualizaciones del lanzador, los paquetes y las listas de versiones desde espejos alojados en China continental. Activado por defecto para usuarios de China continental. | `mirror` |
| **Proxy de GitHub** | El proxy de GitHub para descargar paquetes, visible mientras **Usar servidores espejo** está activado: un preajuste, o **Personalizado** para escribir una URL. Vacío restaura el valor predeterminado (`https://gh-proxy.org/https://github.com`). | `github-proxy` |

## Otros

| Ajuste | Qué hace |
| --- | --- |
| **Gestor de procesos → Escanear procesos** | Lista los procesos de Minecraft en ejecución; **Finalizar tarea** termina uno y **Finalizar todos los procesos** todos ellos. Se puede perder el progreso de juego no guardado. |
| **Funciones experimentales → Copia de seguridad de instancia (Experimental)** | Añade acciones de copia de seguridad y restauración a **Configuración de instancia**. Al activarlo se muestra antes una advertencia. |

## Privacidad

| Ajuste | Qué hace |
| --- | --- |
| **Estadísticas de uso (Google Analytics)** | Envía estadísticas de uso que ayudan a mejorar el lanzador. Puedes desactivarlo en cualquier momento. Enlaza a los **Términos de Google Analytics** y a la **Política de privacidad de Google**. |

## Actualizaciones

| Ajuste | Qué hace | Clave |
| --- | --- | --- |
| **Recibir actualizaciones Beta** | Ofrece también las actualizaciones preliminares del lanzador. Desactivado por defecto. | `beta-updates` |
| **Versión actual → Verificar actualización** | Muestra la versión del lanzador y busca una más reciente. | `self-update --check` |

## Acerca de

Los créditos del lanzador y enlaces a LiteLDev en GitHub y a la comunidad de Discord.

## Claves de la línea de comandos {#command-line-keys}

`LeviLauncher.exe config list` muestra cada clave con su valor y de dónde procede el valor: `set` (guardado), `default` (predeterminado), `auto` (detectado) o `lip` (el propio `config.toml` de lip). `config set <key> <value>` cambia una clave y `config unset <key>` la devuelve a su valor predeterminado.

| Clave | Valores | Significado |
| --- | --- | --- |
| `data-root` | una carpeta | Dónde están las instancias, las descargas y las copias de seguridad (los datos existentes no se mueven) |
| `default-instance` | una instancia | La instancia que usan los comandos cuando no se indica ninguna (igual que `use`) |
| `mirror` | `on`, `off` | Descargar desde espejos de China continental (sin establecer: se detecta por región) |
| `github-proxy` | una URL http(s) | Proxy de GitHub para descargar mods (se usa mientras los espejos están activados, salvo que se establezca) |
| `beta-updates` | `on`, `off` | Ofrecer actualizaciones preliminares del lanzador (predeterminado `off`) |
| `discord` | `on`, `off` | Mostrar Discord Rich Presence al jugar, solo desde la ventana del lanzador (predeterminado `on`) |
| `on-game-launch` | `minimize`, `hide`, `close`, `keep` | Qué hace la ventana del lanzador cuando se inicia el juego (predeterminado `minimize`) |
| `on-game-exit` | `reopen`, `keep`, `close` | Qué hace la ventana del lanzador cuando se cierra el juego (predeterminado `reopen`) |
| `close-to-tray` | `on`, `off` | Al cerrar la ventana del lanzador, este se queda en la bandeja (predeterminado `off`) |

Claves de solo lectura, que muestran `config list` y `config get`: `instances-dir`, `installers-dir`, `backups-dir`, `cache-dir`, `logs-dir` (las carpetas de [Carpetas y archivos](./files)) y `config-file` (el archivo de configuración, `%APPDATA%\LeviLauncher\config.json`).
