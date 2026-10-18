# lip update

Update packages.

## Synopsis

```shell
lip update <PACKAGES> [options]
```

## Arguments

| Argument | Description |
| --- | --- |
| `<PACKAGES>` | The packages to update. Accepts the same formats as [`lip install`](./install.md#arguments). |

## Options

| Option | Description |
| --- | --- |
| `-n, --dry-run` | Run without making any changes. |
| `--ignore-scripts` | Skip running install and uninstall lifecycle scripts while updating packages. |
