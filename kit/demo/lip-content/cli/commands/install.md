# lip install

Install packages.

## Synopsis

```shell
lip install <PACKAGES> [options]
```

## Arguments

| Argument | Description |
| --- | --- |
| `<PACKAGES>` | The packages to install. |

Each package argument is parsed in the following order:

1. **Package Specification** — `<path>@<version>` (e.g. `github.com/user/repo@1.0.0`)
2. **Package Identifier** — `<path>` or `<path>#<variant>` (resolves to latest version)
3. **Local File** — Path to a local archive file (e.g. `./package.zip`)
4. **Remote URL** — URL to a remote archive (e.g. `https://example.com/package.zip`)

Variant can be appended with `#<variant>` (e.g. `github.com/user/repo#my_variant@1.0.0`).

## Options

| Option | Description |
| --- | --- |
| `-n, --dry-run` | Run without making any changes. |
| `--ignore-scripts` | Skip running `pre_install`, `install`, and `post_install` scripts. |
| `--no-dependencies` | Skip installing dependencies. |
