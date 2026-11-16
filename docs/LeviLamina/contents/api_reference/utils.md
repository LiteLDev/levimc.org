# Utils

`ll/api/utils/` · **Common**

## Overview

The Utils module provides various utility functions for system information, string manipulation, hashing, random number generation, file I/O, Base64 encoding, and error handling.

## Headers

| Header | Description |
|--------|-------------|
| `ll/api/utils/SystemUtils.h` | System info (OS, locale, env vars, module paths) |
| `ll/api/utils/StringUtils.h` | String splitting, replacing, case and encoding conversion, number parsing |
| `ll/api/utils/HashUtils.h` | Hash utilities |
| `ll/api/utils/RandomUtils.h` | Random number generation |
| `ll/api/utils/ErrorUtils.h` | Error extraction and formatting |
| `ll/api/utils/StacktraceUtils.h` | Stack trace generation |
| `ll/api/utils/FontUtils.h` | Font enumeration |
| `ll/api/io/FileUtils.h` | File I/O utilities (`ll::file_utils`, see [IO](io.md)) |
| `ll/api/utils/Base64Utils.h` | Base64 encoding/decoding |
| `ll/api/utils/CompressUtils.h` | Compression and decompression, streaming or one-shot |

## Key Functions

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

std::string getEnvironmentVariable(std::string_view name); // empty if unset
bool setEnvironmentVariable(std::string_view name, std::string_view value);
}
```

### StringUtils

```cpp
namespace ll::string_utils {
// std::vector<std::string_view> (std::vector<std::string> when str is an rvalue std::string)
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
    template <class T> constexpr HashCombiner& add(T const& v);       // integers mixed in directly, other types via std::hash<T>
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
template <std::integral T>       T rand(T upBound = 0);   // [0, upBound), full range when 0
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

## Usage

### System Information

```cpp
#include "ll/api/utils/SystemUtils.h"

void printSystemInfo() {
    auto osName = ll::sys_utils::getSystemName();
    auto locale = ll::sys_utils::getSystemLocaleCode();
    auto version = ll::sys_utils::getSystemVersion();
    
    // Get environment variable
    auto path = ll::sys_utils::getEnvironmentVariable("PATH");
}
```

### String Manipulation

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

### File Operations

```cpp
#include "ll/api/io/FileUtils.h"

void fileOps() {
    auto content = ll::file_utils::readFile("config.txt");
    if (content) {
        // Use *content
    }
    
    ll::file_utils::writeFile("output.txt", "Hello");
}
```

### Hashing

```cpp
#include "ll/api/utils/HashUtils.h"

void hashExample() {
    auto hash = ll::hash_utils::doHash("key");
    
    ll::hash_utils::HashCombiner combiner;
    combiner.add(std::string_view{"part1"}).add(42).add(3.14);
    size_t combined = combiner;
}
```

### Random Numbers

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

### Compression

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

For anything large, stream it instead so neither side is held in memory. Push input with `write` as
often as needed, then call `finish` once:

```cpp
#include "ll/api/utils/CompressUtils.h"

ll::Expected<> compressToSocket(std::string_view chunk1, std::string_view chunk2) {
    using namespace ll::compress_utils;

    Compressor codec{[&](std::string_view out) -> ll::Expected<> {
        // Called repeatedly as output becomes available.
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

`compressFile` and `decompressFile` wrap the same machinery for the file-to-file case, completing
under a temporary name so an interrupted run leaves no half-written output behind.

`decompress` does not limit its output unless given a `maxSize`. Pass one for data from an untrusted
source, since a small input can expand enormously.

## Related

- [IO & Logger](io.md) — File utilities complement logger file sinks
