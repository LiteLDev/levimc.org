# Configuration

lip stores its configuration in `liprc.json`.

## File Location

| Platform | Path |
| --- | --- |
| Windows | `%APPDATA%\lip\liprc.json` |
| Linux / macOS | `$XDG_CONFIG_HOME/lip/liprc.json` (typically `~/.config/lip/liprc.json`) |

The file is created automatically with default values when lip first runs.

## Keys

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `github_proxy` | `string?` | `null` | Proxy URL for GitHub requests and downloads. |
| `go_module_proxy` | `string` | `"https://goproxy.io"` | Go module proxy URL for package resolution. |

## Management

Use [`lip config`](commands/config.md) to manage configuration values.
