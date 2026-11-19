# LeviLauncher

Lanzador de Minecraft Bedrock para Windows y Android: instala, gestiona, aísla, modifica e inicia Minecraft Bedrock Edition en tu PC con Windows o en tu dispositivo Android.

**Descargar:** [LeviLauncher para Windows](https://github.com/LiteLDev/LeviLauncher/releases/latest) · [LeviLauncher para Android](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) · la página de [Descargas](./download) indica qué necesita cada versión y las demás fuentes de descarga.

::: info Windows y Android
LeviLauncher tiene una **versión para Windows** para Minecraft Bedrock Edition (GDK / UWP) y una **versión para Android** para el Minecraft oficial de Google Play. Ambas requieren una **licencia original** del juego. No existe una versión para iOS y no está prevista.
:::

::: tip Empieza aquí
¿Eres nuevo en LeviLauncher? El tutorial [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/) (en inglés) te lleva desde la descarga de LeviLauncher hasta tu primera partida con mods.
:::

## Qué hace LeviLauncher

- **Centrado en versiones.** Instala, renombra, inicia y elimina versiones oficiales (Release) o de vista previa (Preview) de Minecraft manteniendo cada configuración bajo control. Cada copia instalada es una *instancia*: consulta [Gestión de versiones](./guide/version-management) e [Instancias y versiones del juego](./concepts/instances).
- **Aislamiento limpio.** Mantén los mundos, los paquetes y los archivos del juego separados de tu instalación de AppData predeterminada cuando quieras un espacio de trabajo más seguro: consulta [Aislamiento de instancias](./concepts/isolation).
- **Gestión de contenido.** Administra mundos, paquetes de recursos, paquetes de comportamiento, paquetes de skins, capturas de pantalla y listas de servidores desde un único lugar: consulta [Gestión de contenido](./guide/content-management).
- **Capacidades para Mods.** Importa paquetes de Mods `.mcmod`, explora CurseForge e instala LeviLamina y paquetes LIP con el gestor de paquetes integrado para configuraciones avanzadas: consulta [Mods e integraciones](./guide/mods-integrations) y [Cómo se cargan los mods](./concepts/mod-loading).
- **Herramientas para mundos.** Exporta copias de seguridad, consulta los datos del mundo y edita ciertos campos de `level.dat` sin salir del lanzador: consulta [Herramientas para mundos](./guide/world-tools).
- **Configuración de usuario.** Ajusta el idioma, la apariencia, el comportamiento de las descargas, las opciones de privacidad, los canales de actualización y la gestión de paquetes: consulta [Ajustes y personalización](./guide/settings-personalization) y [Todos los ajustes](./reference/settings).
- **Extras de Android.** Cambio de cuentas de Xbox y acciones URI de inicio rápido, en el mismo lanzador: consulta [Cuentas e inicio rápido](./guide/accounts-quick-launch).

## Un ejemplo breve

En Windows, todo lo que hace la ventana del lanzador también se puede hacer desde una terminal. Estos tres comandos instalan la versión oficial más reciente de Minecraft como una nueva instancia con LeviLamina y la convierten en la instancia predeterminada, le añaden un mod de [LeviMC Mods](https://levimc.org/mods/) e inician el juego:

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe play
```

Para instalar una versión GDK hace falta haber iniciado sesión con una cuenta de Microsoft que tenga Minecraft (`LeviLauncher.exe account login`). En la ventana, los mismos pasos son la página **Descargar**, la página **LeviMC Mods** y el botón **Iniciar**. La referencia de la [Línea de comandos](./reference/command-line) enumera todos los comandos.

## Qué cubre este sitio

Esta documentación está escrita para **usuarios finales**, no para mantenedores ni desarrolladores.

- **Guías**: una tarea por página. Obtén la aplicación en la página de [Descargas](./download) y luego [gestiona versiones](./guide/version-management), [descargas y espejos](./guide/downloads-mirrors), [contenido](./guide/content-management), [cuentas e inicio rápido](./guide/accounts-quick-launch) (Android), [mods](./guide/mods-integrations), [mundos](./guide/world-tools) y [ajustes](./guide/settings-personalization). El grupo Ayuda trata las [actualizaciones y la solución de problemas](./guide/update-troubleshooting) y la [comunidad y los comentarios](./guide/faq-community-feedback).
- **Conceptos**: cómo funciona LeviLauncher: [instancias y versiones del juego](./concepts/instances) (Release y Preview, GDK y UWP, Windows y Android), el [aislamiento de instancias](./concepts/isolation) y [cómo se cargan los mods](./concepts/mod-loading).
- **Referencia**: la [línea de comandos](./reference/command-line), [todos los ajustes](./reference/settings), las [carpetas y archivos](./reference/files) que usa LeviLauncher, las [URI de inicio rápido](./reference/quick-launch-uri) de Android y la [política de privacidad](./privacy-policy) de Android.

Orden de lectura recomendado: el tutorial [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/), luego [Gestión de versiones](./guide/version-management) y [Gestión de contenido](./guide/content-management).

## Canales de descarga

- **GitHub Releases (Descargas de LeviLauncher):** [Versiones de LiteLDev/LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases)
- **Mirror en Lanzou:** [levimc.lanzoue.com/b016ke39hc](https://levimc.lanzoue.com/b016ke39hc) — contraseña: `levi`
- **Versión para Android:** [LiteLDev/LeviLauncher-Android Releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

## Comunidad y comentarios

- **Discord oficial:** [discord.gg/v5R5P4vRZk](https://discord.gg/v5R5P4vRZk)
- **Canal personal de Discord:** [discord.gg/VqQaC8vWz8](https://discord.gg/VqQaC8vWz8)
- **Grupo de QQ:** [458083875](https://qm.qq.com/q/1z791rJgJG)
- **Informar de problemas:** [GitHub Issues](https://github.com/LiteLDev/LeviLauncher/issues)
