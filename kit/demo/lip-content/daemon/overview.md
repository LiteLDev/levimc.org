# lipd Overview

`lipd` uses standard input/output (stdio) for communication, making it easy to integrate with any language or tool that can spawn a subprocess and redirect streams.

## Quickstart

To start the daemon, simply run:

```bash
lipd run
```

This will start the JSON-RPC server, listening on `stdin` and writing responses to `stdout`.

## Connecting

### Protocol Overview

-   **Protocol**: [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
-   **Transport**: Standard Input/Output (stdio)
-   **Encoding**: UTF-8 (lines separated by `\n` or purely streaming JSON objects)

::: tip
It is recommended to use a JSON-RPC library for your programming language to handle message framing and parsing reliably.
:::

## Client Contract

When connecting to `lipd`, your client should be prepared to handle notifications sent by the daemon. These notifications provide feedback on operations, such as progress updates or log messages.

Common notifications include:

-   `PrintInfo`
-   `PrintSuccess`
-   `PrintWarning`
-   `PrintError`
-   `ReportProgress`

See the [OpenRPC Specification](/daemon/json_rpc_spec) for rigorous definitions of these methods.
