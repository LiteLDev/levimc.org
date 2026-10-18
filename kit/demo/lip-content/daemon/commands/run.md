# lipd run

Starts the lip daemon JSON-RPC server.

## Synopsis

```bash
lipd run [options]
```

## Description

The `run` command starts the `lipd` process in server mode. It listens for JSON-RPC 2.0 messages on standard input (stdin) and writes responses to standard output (stdout).

This command is intended to be used by automated tools, IDE plugins, and scripts that need programmatic access to lip's package management capabilities.

## Options

*Currently, this command accepts no specific options.*

## Examples

Start the daemon:

```bash
lipd run
```
