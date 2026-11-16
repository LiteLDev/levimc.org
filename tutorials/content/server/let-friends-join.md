# Let friends join your server

At the end of this tutorial a friend can join your server: first from another device on your home network, then over the internet, whether your router has a public IP address, your provider only lets you use certain ports, or you have no public IP at all and use a tunnel such as frp.

## What you need

- A server with LeviLamina that starts: see [Your first server](first-server.md).
- A second device with Minecraft Bedrock Edition, of the same version as the server, to test with.
- For play over the internet: access to the settings of your router, or to the control panel of your host or tunnel provider.

## How the server listens

Two settings in `server.properties`, in the folder of the server, decide which ports to open:

| Setting | Default | Protocol | Used for |
| --- | --- | --- | --- |
| `server-port` | `19132` | TCP and UDP | Joining the server |
| `server-udp-ports` | `19132` | UDP | The game traffic of NetherNet, the newer network transport of Bedrock |

So with the defaults, the rule is simple: **open port 19132, for both TCP and UDP.** The setting `transport` says which transport the server uses. `server-udp-ports` and the NetherNet patch of LeviLamina in steps 5 and 6 only matter when it is `nethernet`; with RakNet, the server uses `server-port` alone.

To change `server.properties`, stop the server first, then edit the file with a text editor, or on the **Game config** page of `lip`.

## 1. Find the address of the server

On the PC that runs the server, open a terminal:

::: code-group

```powershell [Windows]
ipconfig
```

```shell [Linux]
hostname -I
```

```shell [macOS]
ipconfig getifaddr en0
```

:::

Note the IPv4 address of your network adapter, such as `192.168.1.20`. This is the server's address on your home network.

## 2. Open the firewall

The first time the server starts on Windows, Windows Defender Firewall may ask whether to allow it. Allow it on **private networks**.

If you missed the question, or another firewall blocks the port, open it yourself. In PowerShell run as administrator:

```powershell
New-NetFirewallRule -DisplayName "Minecraft server (UDP)" -Direction Inbound -Protocol UDP -LocalPort 19132 -Action Allow
New-NetFirewallRule -DisplayName "Minecraft server (TCP)" -Direction Inbound -Protocol TCP -LocalPort 19132 -Action Allow
```

On Linux with ufw: `sudo ufw allow 19132`.

## 3. Join from your home network

1. Start the server and wait for `Server started.`
2. On the second device, in Minecraft, open **Play**, then **Servers**, then **Add Server**. Enter any name, the address from step 1 (`192.168.1.20`) and the port `19132`, and save.
3. Join the server. You should be in the world, and the command `list` on the server console should name you.

On the same network, the server may also show up under **Friends** as a LAN game.

::: tip The allowlist
If `allow-list` is `true` in `server.properties`, only players on the allowlist can join. Add your friends with the server command `allowlist add <gamertag>`, or on the **Allowlist** tab of the **Game config** page of `lip`.
:::

## 4. Join over the internet: a router with a public IP

This is the usual case at home.

1. Give the server PC a fixed address on your network, so the forwarding below keeps pointing at it. Most routers call this a DHCP reservation.
2. In the settings of your router, add a **port forwarding** rule: external port `19132` to `192.168.1.20`, port `19132`, for **TCP and UDP**.
3. Find your public IP address on the status page of your router.
4. Test from outside your network, for example from a phone on mobile data: add a server with your public IP and port `19132`. Many routers cannot reach their own public address from inside, so a test from home may fail even when everything works.
5. Give your friends the public IP and the port.

If the public IP on your router's status page differs from the one websites report, or starts with `100.64` to `100.127`, you have no public IP of your own: go to step 6.

## 5. When the provider decides the ports

On a rented machine or a host behind NAT, the provider usually maps an external port of its choice to your machine. Say it lets you use port `11451`.

1. Stop the server. In `server.properties`, set both ports to the allowed one:

   ```properties
   server-port=11451
   server-udp-ports=11451
   ```

2. In the provider's control panel, map external port `11451` to port `11451` of your machine, for **TCP and UDP**, and open it in the firewall as in step 2.
3. Start the server and connect with the provider's public IP and port `11451`.

::: warning The client fails with the error code "Door"
LeviLamina finds the public IP of the server through STUN servers. When that fails, clients cannot connect and show the error code `Door`. Then tell the server its public address yourself, in the form `<public IP>:<external port>:<local port>`:

```properties
server-udp-ports=203.0.113.4:11451:11451
```

and turn off the NetherNet patch of LeviLamina in `mods/LeviLamina/config/Config.json`, in the section `targeted`:

```json
"netherNetPatch": {
    "enable": false,
    "stunServers": ["stun:stun.l.google.com:19302", "stun:stun.miwifi.com:3478"]
}
```
:::

## 6. Without a public IP: a tunnel

When your connection has no public IP, a tunnel such as frp forwards a port of a machine that has one, the **exit node**, to your server. Say the tunnel gives you port `11451` on the exit node `203.0.113.4`.

1. Stop the server. In `server.properties`, set:

   ```properties
   server-port=11451
   server-udp-ports=203.0.113.4:11451:11451
   ```

2. In the tunnel software, forward port `11451` of the exit node to port `11451` of your machine, for **TCP and UDP**.
3. Turn off the NetherNet patch in `mods/LeviLamina/config/Config.json` as shown in the warning of step 5.
4. Start the server, and connect with `203.0.113.4` and port `11451`.

## What you have now

- A server that players on your network can join with its local address, and players on the internet with your public address or your tunnel's.
- The settings that decide this: `server-port` and `server-udp-ports`, plus the NetherNet patch of LeviLamina for servers behind NAT.

## Next steps

- Give your players something to do: [Install mods on your server](install-mods.md).
- Change the server name, the game mode, the allowlist and the permissions: [Game config](https://levimc.org/lip/interface/game_config.html).
- Keep the server running without a terminal: [A server from the command line](command-line.md#_4-keep-it-running-without-a-terminal).
- Error codes of LeviLamina: [Troubleshooting](https://levimc.org/LeviLamina/user_guides/troubleshooting/).
