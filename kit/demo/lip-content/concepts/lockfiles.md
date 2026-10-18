# Lockfiles

`lip` uses a lockfile to maintain the state of the current workspace. This file records exactly which packages are installed, their specific versions, the variants used, and the files they placed on the disk.

## Purpose

The lockfile serves several critical purposes in `lip`:

1.  **State Tracking**: It acts as the single source of truth for what is currently installed in the workspace.
2.  **Reproducibility**: By recording the exact version and variant of every installed package, the lockfile ensures that the workspace state is deterministic.
3.  **Uninstallation**: `lip` tracks every file written to disk by a package. This allows `lip remove` to cleanly delete all files associated with a package, preventing "file rot" in the workspace.
4.  **Dependency Graph**: It distinguishes between packages explicitly installed by the user and those installed implicitly as dependencies. This allows `lip` to perform operations like "autoremove" (removing unused dependencies) and to generate dependency graphs.

## Structure

The lockfile is a JSON file with the following high-level structure:

```json
{
  "format_version": 3,
  "format_uuid": "289f771f-2c9a-4d73-9f3f-8492495a924d",
  "packages": [
    ...
  ]
}
```

### Fields

*   **`format_version`**: An integer indicating the version of the lockfile format (currently `3`).
*   **`format_uuid`**: A unique identifier ensuring the file type is correct.
*   **`packages`**: A list of `WorkspaceStatePackage` objects representing the installed packages.

### Package Entry

Each entry in the `packages` list represents a single installed package and contains:

*   **`manifest`**: The full content of the package's manifest (`lip.json`). This ensures `lip` has all metadata about the installed package without needing to query a registry.
*   **`variant`**: The specific variant of the package that was installed (e.g., `default`, `debug`).
*   **`locked`**: A boolean flag.
    *   `true`: The package was explicitly installed by the user (e.g., `lip install <package>`).
    *   `false`: The package was installed implicitly as a dependency of another package.
*   **`files`**: A list of file paths (relative to the workspace root) that belong to this package. This list is used during uninstallation to remove the package's files.

## Example

An example entry for a package `example/cli` might look like this:

```json
{
  "manifest": {
    "name": "cli",
    "version": "1.0.0",
    "description": "An example CLI tool",
    ...
  },
  "variant": "default",
  "locked": true,
  "files": [
    "bin/example.exe",
    "lib/example.dll"
  ]
}
```
