# 内部机制

本指南说明 lip 的底层工作方式。

## 架构

lip 提供两个主要入口：

1. **CLI（`lip`）**：独立命令行工具，内置包管理逻辑，**不依赖**守护进程。
2. **Daemon（`lipd`）**：独立进程，供外部应用（IDE、GUI、脚本）以编程方式调用 lip。

CLI 与 Daemon 共享同一套核心逻辑，保证无论通过哪种接口，行为都一致。

Daemon（`lipd`）通过 **stdio 上的 JSON-RPC** 通信，使工具无需为每个命令反复拉起进程，也无需解析文本输出。

## 清单校验

lip 使用 JSON Schema 校验 `tooth.json`，schema 位于 `schemas/tooth.v3.schema.json`。

- **校验**：加载清单时，lip 会按 schema 检查必填字段和类型是否正确。
- **版本**：`tooth.json` 中的 `format_version` 对应 schema 版本。lip 通过该值判断如何解释文件。若版本过旧，可能需要运行 `lip migrate`。

## 工作区状态

lip 会在 `.lip` 目录下使用本地数据库（当前为 JSON）维护已安装包状态，记录：
- 用户显式请求的包与隐式依赖；
- 精确安装版本；
- 文件放置位置与方式等元数据。
