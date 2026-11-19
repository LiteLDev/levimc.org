---
platforms: [android]
---
# URI de inicio rápido

El **Lanzamiento Rápido** de la versión para Android inicia Minecraft con una URI `minecraft://`, que indica al juego qué abrir primero. Cada acción de la pantalla de Lanzamiento Rápido construye una de las URI de abajo; **URI Personalizada** acepta cualquier URI que empiece por `minecraft://`. Lo que el juego haga con una URI depende de Minecraft.

LeviLauncher también abre enlaces `minecraft://` desde otras aplicaciones: Android lo ofrece como una de las aplicaciones que pueden abrirlos.

## Acciones

| Acción | URI | Pide |
| --- | --- | --- |
| **Cómo Jugar** | `minecraft://?showHowToPlayScreen=1` | — |
| **Pestaña Servidores** | `minecraft://openServersTab` | — |
| **Perfil / Vestidor** | `minecraft://showProfileScreen` | — |
| **Inicio del Mercado** | `minecraft://openStore` | — |
| **Minecoins** | `minecraft://?showMineCoinOffers=1` | — |
| **Marketplace Pass** | `minecraft://?openCsbPDPScreen=<tab>` | La pestaña: `Home`, `Content`, `Faq` o `Subscribe` |
| **Conectar a Servidor** | `minecraft://connect/?serverUrl=<dirección>&serverPort=<puerto>` | La dirección y el puerto del servidor (predeterminado `19132`) |
| **Añadir Servidor Externo** | `minecraft://?addExternalServer=<nombre>\|<dirección>:<puerto>` | Un nombre, la dirección y el puerto (predeterminado `19132`) |
| **Unirse a Realm** | `minecraft://acceptRealmInvite?inviteID=<código>` | El código de invitación del Realm |
| **Cargar Mundo** | `minecraft://connect/?localWorld=<mundo>` | El nombre de un mundo local |
| **Ejecutar Comando** | `minecraft://?slashcommand=<comando>` | Un comando que ejecutar en el juego |
| **URI Personalizada** | cualquier `minecraft://…` | La URI |

El nombre del servidor, el nombre del mundo y el comando se codifican como URL (un espacio se convierte en `%20` y `/` en `%2F`).

## Ejemplo

Para unirte a un servidor en `play.example.org` con el puerto `19132`, elige **Conectar a Servidor**, o abre este enlace en el dispositivo:

```text
minecraft://connect/?serverUrl=play.example.org&serverPort=19132
```

Consulta [Cuentas e inicio rápido](../guide/accounts-quick-launch) para el resto de funciones exclusivas de Android.
