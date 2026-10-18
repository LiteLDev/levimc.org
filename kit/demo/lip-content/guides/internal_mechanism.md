# Internal Mechanism

This guide explains how lip works under the hood.

## Architecture

lip provides two primary entry points:

1.  **CLI (`lip`)**: The standalone command-line tool. It contains its own logic for package management and **does not** depend on the Daemon.
2.  **Daemon (`lipd`)**: A separate process designed for external applications (IDEs, GUIs, scripts) to interact with lip programmatically.

Both the CLI and the Daemon share the same core logic, ensuring consistent behavior regardless of which interface is used.

The Daemon (`lipd`) communicates via **JSON-RPC over stdio**, allowing tools to integrate with lip without spawning new processes for every command or parsing text output.

## Manifest Validation

lip uses JSON Schema to validate `tooth.json` files. The schema is defined in `schemas/tooth.v3.schema.json`.

-   **Validation**: When loading a manifest, lip checks it against this schema to ensure all required fields are present and have the correct types.
-   **Versioning**: The `format_version` field in `tooth.json` corresponds to the schema version. lip checks this version to know how to interpret the file. If the version is older than supported, you may need to run `lip migrate`.

## Workspace State

lip maintains the state of your installed packages in a local database (currently JSON-based) within the `.lip` directory. This tracks:
-   Which packages are explicitly requested versus implicit dependencies.
-   The exact versions installed.
-   Metadata about where and how files were placed.
