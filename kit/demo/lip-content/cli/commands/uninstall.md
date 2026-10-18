# lip uninstall

Uninstall packages.

## Synopsis

```shell
lip uninstall <PACKAGES> [options]
```

## Arguments

| Argument | Description |
| --- | --- |
| `<PACKAGES>` | The packages to uninstall, specified as Package Identifiers (`<path>` or `<path>#<variant>`). |

## Options

| Option | Description |
| --- | --- |
| `-n, --dry-run` | Run without making any changes. |
| `--ignore-scripts` | Skip running `pre_uninstall`, `uninstall`, and `post_uninstall` scripts. |
| `--no-dependencies` | Skip removing dependencies. |
