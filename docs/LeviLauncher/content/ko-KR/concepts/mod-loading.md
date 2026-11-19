# 모드 로드 방식

Minecraft Bedrock은 자체적으로 모드를 지원하지 않습니다. 모드는 게임이 시작될 때 로더가 게임 프로세스에 넣는 네이티브 코드입니다. 이 페이지는 LeviLauncher가 어떤 로더를 쓰는지, 모드가 어디에 있는지, 모드를 추가하는 여러 방법이 어떻게 맞물리는지 설명합니다.

## 모드가 있는 곳 <Badge platform="windows" />

모든 인스턴스에는 `mods\` 폴더가 있습니다([폴더 및 파일](../reference/files) 참조). 각 모드는 그 안의 폴더 하나이며, 모드를 설명하는 `manifest.json`이 있습니다.

| 필드 | 의미 |
| --- | --- |
| `name` | 모드 이름 |
| `entry` | 로더가 로드하는 파일, 모드 폴더 기준 상대 경로(`.dll`) |
| `version` | 모드 버전 |
| `type` | 어떤 로더가 로드하는지: `preload-native`는 LeviLauncher의 네이티브 로더, LeviLamina용 모드는 자체 타입을 가집니다. |
| `author` | 제작자(선택) |

모드는 하나의 인스턴스에 속합니다. 게임 데이터에만 관련된 [격리](./isolation)의 영향을 받지 않습니다.

**모드 끄기**(**모드 관리**에서, 또는 `LeviLauncher.exe mod disable`)는 그 `manifest.json`의 이름을 `manifest.json.close`로 바꾸고, 켜면 원래 이름으로 되돌립니다. 모드 파일은 그대로 있고, `manifest.json`을 찾는 로더는 그 모드를 더 이상 찾지 못합니다.

## 두 로더 <Badge platform="windows" />

### LeviLauncher의 네이티브 로더

LeviLauncher는 인스턴스를 설치하거나 준비할 때 자체 로더인 `LeviLauncher.dll`을 게임 실행 파일 옆에 두고 실행 파일의 가져오기 목록에 추가해, Windows가 게임과 함께 로드하도록 합니다. 이는 x64 빌드에서 GDK와 UWP 모두에 적용되며, [격리](./isolation)도 이것으로 동작합니다.

게임이 시작되면 네이티브 로더는 `mods\` 안의 폴더를 이름 순서로 살펴보고, `type`이 `preload-native`인 각 모드의 `entry`를 로드합니다. `manifest.json`이 없는 폴더와 다른 타입의 모드는 건너뜁니다. 인스턴스에 다른 프리로더(게임 옆의 `preloader.dll`)가 있으면, 네이티브 로더는 모든 모드 로드를 그 프리로더에 맡깁니다. 네이티브 로더에는 Visual C++ 런타임(x64)이 필요하며, LeviLauncher가 이를 확인하고 설치를 제안합니다.

### LeviLamina

[LeviLamina](https://levimc.org/LeviLamina/)는 LeviMC의 모드 로더입니다. [LeviMC Mods](https://levimc.org/mods/)의 모드 대부분은 LeviLamina 모드로, 인스턴스의 게임 버전을 지원하는 버전의 LeviLamina가 필요합니다. LeviLauncher는 지원되는 버전의 GDK 인스턴스에 LeviLamina를 내장 패키지 관리자의 패키지로 설치합니다(버전을 설치할 때의 **LeviLamina 설치** 스위치, 또는 **인스턴스 설정**의 **로더** 탭).

## 모드를 추가하는 세 가지 방법 <Badge platform="windows" />

| 추가하는 것 | LeviLauncher가 하는 일 |
| --- | --- |
| **LeviMC Mods**의 모드(또는 `mod install owner/repo`) | [lip](https://github.com/LiteLDev/lip) 호환 내장 패키지 관리자로 패키지로 설치합니다. 이 플랫폼용 릴리스를 다운로드하고, 의존하는 패키지를 설치하고, 인스턴스의 `.lip\state.json`에 기록합니다. 모드에 LeviLamina가 필요한데 설치된 것이 맞지 않거나 설치되어 있지 않으면, 먼저 호환되는 LeviLamina를 설치합니다. 이렇게 설치한 모드는 패키지로 업데이트하고 제거할 수 있습니다. |
| `.mcmod` 패키지(또는 `.zip`) | `mods\` 안의 새 폴더에 압축을 풉니다. 압축 파일에는 `manifest.json`이 있어야 합니다. |
| 단일 `.dll` | `mods\` 안의 새 폴더에 넣고 `manifest.json`을 작성합니다. 기본값은 파일 이름을 이름으로, `preload-native`를 타입으로, `0.0.0`을 버전으로 합니다. |

패키지는 `lip.toml`과 `.lip\state.json`에서 `side`(`client` 또는 `server`)와 `platform`(예: `win-x64`)으로 실행 위치를 나타냅니다. 클라이언트에는 LeviLauncher가 모드의 `client` 변형이 있으면 그것을, 없으면 기본 변형을 설치합니다. 이전 패키지의 마이그레이션을 포함한 자세한 내용은 [모드 및 통합](../guide/mods-integrations)을 참조하세요.

## Android <Badge platform="android" />

Android 버전은 게임 프로세스에서 실행되는 `.so` 라이브러리인 네이티브 모드를 로드합니다. 모드를 적용한 환경은 격리된 버전에 두고, 신뢰할 수 있는 출처의 모드만 설치하세요. 직접 만들려면 LeviLamina 문서의 [Android native mods](https://levimc.org/LeviLamina/developer_guides/android/)를 따르세요.

## 관련 페이지

- [모드 및 통합](../guide/mods-integrations)
- [인스턴스와 게임 버전](./instances)
- [명령줄](../reference/command-line)
