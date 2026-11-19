# Instancias y versiones del juego

LeviLauncher instala cada copia de Minecraft como una **instancia**: una versión del juego con su propio nombre, su propia configuración y, si quieres, sus propios datos de juego. Puedes tener varias instancias a la vez, de la misma versión del juego o de versiones distintas, e iniciar la que necesites. La aplicación las muestra en la página **Instancias**.

## Qué es una instancia

=== "Windows"

    Una instancia es una carpeta dentro de la carpeta `Instances` del lanzador (consulta [Carpetas y archivos](../reference/files)). Su nombre es el nombre de la carpeta. La carpeta contiene:

    - los archivos del juego de una compilación de Minecraft, extraídos de su instalador;
    - `.levilauncher\instance.json`, lo que el lanzador sabe de la instancia: la versión del juego, el canal, si guarda sus propios datos de juego y las opciones de inicio (consola, modo editor, argumentos de inicio, variables de entorno);
    - `mods\`, los mods de la instancia, y `.lip\`, el estado de los paquetes instalados con el gestor de paquetes integrado (consulta [Cómo se cargan los mods](./mod-loading));
    - los datos de juego propios de la instancia (mundos, paquetes, ajustes) cuando tiene el [aislamiento](./isolation) activado.

    Los mods siempre pertenecen a una instancia. Los datos de juego solo pertenecen a una instancia cuando el aislamiento está activado; si no, la instancia usa los datos de juego que Minecraft usa normalmente en este PC.

=== "Android"

    Una instancia es un APK oficial de Minecraft que importas en LeviLauncher. Se ejecuta dentro del lanzador, sin instalarse en el sistema. El Minecraft de Google Play (1.21.80 o posterior) debe seguir instalado en el dispositivo; LeviLauncher lo muestra junto a las versiones que has importado.

    El aislamiento de versiones mantiene los mundos, paquetes y ajustes de una versión importada separados de la versión instalada de Google Play. Las versiones importadas suelen necesitar el aislamiento para iniciarse.

## Release y Preview

Cada compilación de Minecraft pertenece a un **canal**:

| Canal | Qué es |
| --- | --- |
| Release (oficial) | El juego estable que usa la mayoría de los jugadores. |
| Preview (vista previa) | Compilaciones de versiones futuras, para pruebas. Pueden romper mundos, paquetes o mods con más frecuencia. |
| Beta | Compilaciones de prueba publicadas solo para UWP. <Badge platform="windows" /> |

En Windows, Release y Preview tienen cada uno su propia carpeta de datos de juego (`Minecraft Bedrock` y `Minecraft Bedrock Preview`), así que una instancia Preview sin aislamiento no comparte mundos con una instancia Release.

## Compilaciones GDK y UWP <Badge platform="windows" />

Minecraft para Windows se ha publicado en dos formatos de paquete, y LeviLauncher instala ambos. Cuando una versión existe en los dos, se elige GDK.

| | GDK | UWP |
| --- | --- | --- |
| Instalador | `.msixvc`, descargado de un espejo que LeviLauncher mide y elige | `.appx` / `.msix` (o un paquete agrupado), descargado de Windows Update |
| Para instalar | Una cuenta de Microsoft con sesión iniciada que tenga Minecraft | — |
| Para ejecutar | Microsoft Gaming Services y Microsoft GameInput | El modo de desarrollador de Windows, para registrar el paquete en Windows |
| Datos de juego compartidos | `%APPDATA%\Minecraft Bedrock` (Preview: `Minecraft Bedrock Preview`), una carpeta por perfil de jugador en `Users\` | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` (Preview: `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`) |
| Aislamiento | Todas las versiones | Versiones x64 1.19.70.2 y posteriores |
| LeviLamina | Lo instala LeviLauncher en las versiones que admite | LeviLauncher no lo instala |
| Argumentos de inicio y variables de entorno | Sí | No |

Un instalador local que importes (`.msixvc`, `.appx`, `.msix`, `.appxbundle` o `.msixbundle`) se instala como GDK o UWP según su extensión.

### Perfiles de jugador {#player-profiles}

Una instancia GDK guarda los mundos, las capturas de pantalla y la lista de servidores por **perfil de jugador**: una carpeta en `Users\` con el ID del jugador como nombre, mostrada con su gamertag cuando el lanzador lo conoce. Los paquetes de recursos y de comportamiento los comparten todos los perfiles (`Users\Shared\`); los paquetes de skins se comparten a partir del juego 1.26 y antes van por perfil. Las instancias UWP no tienen perfiles.

## Registro en Windows <Badge platform="windows" /> {#registration-with-windows}

Windows conoce un único Minecraft instalado por canal. **Registrar** una instancia hace que Windows la trate como ese Minecraft: el menú Inicio, los enlaces `minecraft://` y las funciones de Xbox pasan a usarla. El registro sustituye al titular actual del puesto Release o Preview (el juego de Microsoft Store u otra instancia), cuyos datos se conservan. Registrar o anular el registro nunca toca los datos de juego.

Las instancias UWP se registran automáticamente al iniciarlas. Una instancia registrada debe anular su registro antes de poder renombrarla o eliminarla.

## Páginas relacionadas

- [Gestión de versiones](../guide/version-management)
- [Aislamiento de instancias](./isolation)
- [Carpetas y archivos](../reference/files)
