# Utils（工具函数）

`ll/api/utils/` · **通用**

## 概述

Utils 模块提供了各种实用函数，包括系统信息、字符串操作、哈希、随机数生成、文件 I/O、Base64 编码和错误处理。

## 头文件

| 头文件 | 说明 |
|--------|------|
| `ll/api/utils/SystemUtils.h` | 系统信息（操作系统、语言环境、环境变量、模块路径） |
| `ll/api/utils/StringUtils.h` | 字符串分割、替换、大小写与编码转换、数字解析 |
| `ll/api/utils/HashUtils.h` | 哈希工具 |
| `ll/api/utils/RandomUtils.h` | 随机数生成 |
| `ll/api/utils/ErrorUtils.h` | 错误提取和格式化 |
| `ll/api/utils/StacktraceUtils.h` | 堆栈跟踪生成 |
| `ll/api/utils/FontUtils.h` | 字体枚举 |
| `ll/api/io/FileUtils.h` | 文件 I/O 工具（`ll::file_utils`，见 [IO](io.zh.md)） |
| `ll/api/utils/Base64Utils.h` | Base64 编码/解码 |
| `ll/api/utils/CompressUtils.h` | 压缩与解压,支持流式和一次性两种用法 |

## 核心函数

### SystemUtils

```cpp
namespace ll::sys_utils {
using HandleT = void*;

std::string const& getSystemName();
std::string getSystemLocaleCode();
data::Version getSystemVersion();
data::TmWithMs getLocalTime();
bool isWine();

HandleT getCurrentModuleHandle();
HandleT getModuleHandle(void* addr);
std::optional<std::filesystem::path> getModulePath(HandleT handle, HandleT process = nullptr);
std::string getModuleFileName(HandleT handle, HandleT process = nullptr);

std::string getEnvironmentVariable(std::string_view name); // 未设置时返回空字符串
bool setEnvironmentVariable(std::string_view name, std::string_view value);
}
```

### StringUtils

```cpp
namespace ll::string_utils {
// 返回 std::vector<std::string_view>（str 为右值 std::string 时返回 std::vector<std::string>）
auto splitByPattern(auto&& str, std::string_view pattern, bool keepEmpty = false);
std::string& replaceAll(std::string& str, std::string_view oldValue, std::string_view newValue);
std::string replaceAll(std::string const& str, std::string_view oldValue, std::string_view newValue);
std::string toLowerCase(std::string_view str);
std::string toSnakeCase(std::string_view str);
std::string removeEscapeCode(std::string_view str);
std::wstring str2wstr(std::string_view str, uint codePage = CodePage::UTF8);
std::string wstr2str(std::wstring_view wstr, uint codePage = CodePage::UTF8);
Expected<bool> svtobool(std::string_view);
template <class T> Expected<T> svtonum(std::string_view str, size_t* idx = nullptr, ...);
}
```

### FileUtils

```cpp
// ll/api/io/FileUtils.h
namespace ll::file_utils {
std::filesystem::path u8path(std::string_view src);
std::optional<std::string> readFile(std::filesystem::path const& filePath, bool isBinary = false);
bool writeFile(std::filesystem::path const& filePath, std::string_view content, bool isBinary = false);
std::optional<data::Version> getVersion(std::filesystem::path const& filePath);
}
```

### HashUtils

```cpp
namespace ll::hash_utils {
constexpr uint64 doHash(std::string_view x);
constexpr uint64 doHash2(std::string_view x);
constexpr uint64 doHash3(std::string_view x);

class HashCombiner {
public:
    constexpr HashCombiner(size_t seed = 0);
    template <class T> constexpr HashCombiner& add(T const& v);       // 整数直接混入，其他类型使用 std::hash<T>
    template <class T> constexpr HashCombiner& addRange(T&& range);
    constexpr operator size_t() const;
    constexpr size_t hash() const;
};
}

namespace ll::hash_literals {
consteval uint64 operator""_h(char const* x, size_t len); // "key"_h == doHash("key")
}
```

### RandomUtils

```cpp
namespace ll::random_utils {
template <std::integral T>       T rand(T upBound = 0);   // [0, upBound)，为 0 时取整个值域
template <std::floating_point T> T rand();                // [0, 1)
template <std::floating_point T> T rand(T max);           // [0, max)
template <class T>               T rand(T min, T max);    // [min, max)
template <class T> T openIntervalRand(T min = 0, T max = 1);       // (min, max)
template <class T> T closeIntervalRand(T min = 0, T max = 1);      // [min, max]
template <class T> T leftCloseIntervalRand(T min = 0, T max = 1);  // [min, max)
template <class T> T rightCloseIntervalRand(T min = 0, T max = 1); // (min, max]
}
```

### Base64Utils

```cpp
namespace ll::base64_utils {
std::string encode(std::string_view data);
std::string decode(std::string_view data);
}
```

### CompressUtils

```cpp
namespace ll::compress_utils {
enum class CompressFormat : int { Gzip, Zlib };
enum class CompressLevel : int { Store, Fastest, Default, Best };

std::string_view extensionOf(CompressFormat format);

Expected<std::string> compress(std::string_view data, CompressFormat = CompressFormat::Gzip,
                               CompressLevel = CompressLevel::Default);
Expected<std::string> decompress(std::string_view data, CompressFormat = CompressFormat::Gzip,
                                 size_t maxSize = 0);

Expected<> compressFile(std::filesystem::path const& src, std::filesystem::path const& dst, ...);
Expected<> decompressFile(std::filesystem::path const& src, std::filesystem::path const& dst, ...);
}
```

## 使用方法

### 系统信息

```cpp
#include "ll/api/utils/SystemUtils.h"

void printSystemInfo() {
    auto osName = ll::sys_utils::getSystemName();
    auto locale = ll::sys_utils::getSystemLocaleCode();
    auto version = ll::sys_utils::getSystemVersion();
    
    // 获取环境变量
    auto path = ll::sys_utils::getEnvironmentVariable("PATH");
}
```

### 字符串操作

```cpp
#include "ll/api/utils/StringUtils.h"

void stringOps() {
    std::string text  = "Hello World";
    auto        lower = ll::string_utils::toLowerCase(text); // "hello world"
    
    auto parts = ll::string_utils::splitByPattern("a,b,c", ",");
    // parts == {"a", "b", "c"}
    
    std::string str = "foo bar foo";
    ll::string_utils::replaceAll(str, "foo", "baz");
    // str == "baz bar baz"
}
```

### 文件操作

```cpp
#include "ll/api/io/FileUtils.h"

void fileOps() {
    auto content = ll::file_utils::readFile("config.txt");
    if (content) {
        // 使用 *content
    }
    
    ll::file_utils::writeFile("output.txt", "Hello");
}
```

### 哈希

```cpp
#include "ll/api/utils/HashUtils.h"

void hashExample() {
    auto hash = ll::hash_utils::doHash("key");
    
    ll::hash_utils::HashCombiner combiner;
    combiner.add(std::string_view{"part1"}).add(42).add(3.14);
    size_t combined = combiner;
}
```

### 随机数

```cpp
#include "ll/api/utils/RandomUtils.h"

void randomExample() {
    int dice = ll::random_utils::rand<int>(1, 7);           // 1..6
    double chance = ll::random_utils::rand<double>(0.0, 1.0); // [0, 1)
}
```

### Base64

```cpp
#include "ll/api/utils/Base64Utils.h"

void base64Example() {
    std::string encoded = ll::base64_utils::encode("Hello");
    std::string decoded = ll::base64_utils::decode(encoded);
}
```

### 压缩

```cpp
#include "ll/api/utils/CompressUtils.h"

void compressExample() {
    using namespace ll::compress_utils;

    auto packed = compress("hello hello hello");
    if (!packed) {
        return;
    }
    auto original = decompress(*packed);
}
```

数据较大时改用流式,这样两侧都不会整块驻留内存。按需多次调用 `write` 推入数据,最后调用一次 `finish`:

```cpp
#include "ll/api/utils/CompressUtils.h"

ll::Expected<> compressToSocket(std::string_view chunk1, std::string_view chunk2) {
    using namespace ll::compress_utils;

    Compressor codec{[&](std::string_view out) -> ll::Expected<> {
        // 每次有输出产生时都会被调用
        return sendBytes(out);
    }};
    if (auto res = codec.status(); !res) {
        return res;
    }
    if (auto res = codec.write(chunk1); !res) {
        return res;
    }
    if (auto res = codec.write(chunk2); !res) {
        return res;
    }
    return codec.finish();
}
```

文件到文件的场景用 `compressFile` 和 `decompressFile`,它们基于同一套机制,并且先写入临时文件再改名,
因此中途被打断不会留下半个文件。

`decompress` 默认不限制输出大小，只有传入 `maxSize` 时才会限制。数据来源不可信时请传入它，因为很小的输入也可能解压出极大的数据。

## 相关模块

- [IO & Logger（输入输出与日志）](io.zh.md) — 文件工具补充日志文件输出
