# lip migrate

将包清单迁移到当前格式版本。

## 概要

```shell
lip migrate <FILE> <OUTPUT>
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<FILE>` | 要迁移的输入清单文件。 |
| `<OUTPUT>` | 迁移后输出文件路径。 |

## 说明

读取旧版本格式的 `tooth.json`，转换为当前格式（版本 3），并将结果写入输出路径。
