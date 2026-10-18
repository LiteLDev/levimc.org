# lip migrate

Migrate a package manifest to the current format version.

## Synopsis

```shell
lip migrate <FILE> <OUTPUT>
```

## Arguments

| Argument | Description |
| --- | --- |
| `<FILE>` | The input manifest file to migrate. |
| `<OUTPUT>` | The output file path for the migrated manifest. |

## Description

Reads a `tooth.json` from an older format version, converts it to the current format (version 3), and writes the result to the output path.
