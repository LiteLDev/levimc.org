# 配置

lip 将配置存储在 `liprc.json` 中。

## 文件位置

| 平台 | 路径 |
| --- | --- |
| Windows | `%APPDATA%\\lip\\liprc.json` |
| Linux / macOS | `$XDG_CONFIG_HOME/lip/liprc.json`（通常为 `~/.config/lip/liprc.json`） |

当 lip 首次运行时，会自动创建该文件并写入默认值。

## 配置键

| 键 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `github_proxy` | `string?` | `null` | GitHub 请求与下载的代理 URL。 |
| `go_module_proxy` | `string` | `"https://goproxy.io"` | 用于包解析的 Go module 代理 URL。 |

## 管理方式

使用 [`lip config`](commands/config.md) 管理配置值。
