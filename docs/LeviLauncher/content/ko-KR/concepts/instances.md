# 인스턴스와 게임 버전

LeviLauncher는 Minecraft의 각 사본을 **인스턴스**로 설치합니다. 인스턴스는 자체 이름과 자체 설정, 그리고 원한다면 자체 게임 데이터를 가진 하나의 게임 버전입니다. 같은 게임 버전이든 다른 게임 버전이든 여러 인스턴스를 나란히 두고 필요한 것을 실행할 수 있습니다. 앱은 **인스턴스** 페이지에 인스턴스를 나열합니다.

## 인스턴스란

=== "Windows"

    인스턴스는 런처의 `Instances` 폴더 안에 있는 폴더입니다([폴더 및 파일](../reference/files) 참조). 인스턴스의 이름은 폴더의 이름입니다. 폴더에는 다음이 들어 있습니다.

    - 설치 패키지에서 풀어낸 Minecraft 빌드 하나의 게임 파일
    - `.levilauncher\instance.json`: 런처가 인스턴스에 대해 아는 정보. 게임 버전, 채널, 자체 게임 데이터를 쓰는지 여부, 실행 옵션(콘솔, 편집기 모드, 실행 인수, 환경 변수)
    - `mods\`: 인스턴스의 모드, `.lip\`: 내장 패키지 관리자로 설치한 패키지의 상태([모드 로드 방식](./mod-loading) 참조)
    - [격리](./isolation)가 켜져 있을 때 인스턴스 자체의 게임 데이터(월드, 팩, 설정)

    모드는 항상 하나의 인스턴스에 속합니다. 게임 데이터는 격리가 켜져 있을 때만 하나의 인스턴스에 속하며, 그렇지 않으면 인스턴스는 이 PC에서 Minecraft가 평소에 쓰는 게임 데이터를 사용합니다.

=== "Android"

    인스턴스는 LeviLauncher로 가져온 공식 Minecraft APK입니다. 시스템에 설치하지 않고 런처 안에서 실행됩니다. 기기에는 여전히 Google Play의 Minecraft(1.21.80 이상)가 설치되어 있어야 하며, LeviLauncher는 이를 가져온 버전들과 함께 표시합니다.

    버전 격리는 가져온 버전의 월드, 팩, 설정을 설치된 Google Play 버전과 분리합니다. 가져온 버전은 실행하려면 격리가 필요한 경우가 많습니다.

## 정식판과 프리뷰

모든 Minecraft 빌드는 하나의 **채널**에 속합니다.

| 채널 | 설명 |
| --- | --- |
| Release(정식판) | 대부분의 플레이어가 쓰는 안정적인 게임입니다. |
| Preview(프리뷰) | 출시 예정 버전의 테스트용 빌드입니다. 월드, 팩, 모드가 더 자주 깨질 수 있습니다. |
| Beta | UWP용으로만 배포된 테스트 빌드입니다. <Badge platform="windows" /> |

Windows에서는 정식판과 프리뷰가 각각 자체 게임 데이터 폴더(`Minecraft Bedrock`과 `Minecraft Bedrock Preview`)를 가지므로, 격리하지 않은 프리뷰 인스턴스도 정식판 인스턴스와 월드를 공유하지 않습니다.

## GDK 빌드와 UWP 빌드 <Badge platform="windows" />

Windows용 Minecraft는 두 가지 패키지 형식으로 배포되어 왔으며, LeviLauncher는 둘 다 설치합니다. 한 버전이 두 형식으로 모두 있으면 GDK를 선택합니다.

| | GDK | UWP |
| --- | --- | --- |
| 설치 패키지 | `.msixvc`, LeviLauncher가 측정해 고른 미러에서 다운로드 | `.appx` / `.msix`(또는 번들), Windows 업데이트에서 다운로드 |
| 설치에 필요 | Minecraft를 소유한, 로그인된 Microsoft 계정 | — |
| 실행에 필요 | Microsoft Gaming Services와 Microsoft GameInput | 패키지를 Windows에 등록하기 위한 Windows 개발자 모드 |
| 공유 게임 데이터 | `%APPDATA%\Minecraft Bedrock`(프리뷰: `Minecraft Bedrock Preview`), `Users\` 아래 플레이어 프로필마다 폴더 하나 | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState`(프리뷰: `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`) |
| 격리 | 모든 버전 | 1.19.70.2 이상의 x64 버전 |
| LeviLamina | 지원되는 버전에서 LeviLauncher가 설치 | LeviLauncher가 설치하지 않음 |
| 실행 인수와 환경 변수 | 지원 | 미지원 |

가져온 로컬 설치 패키지(`.msixvc`, `.appx`, `.msix`, `.appxbundle`, `.msixbundle`)는 확장자에 따라 GDK 또는 UWP로 설치됩니다.

### 플레이어 프로필 {#player-profiles}

GDK 인스턴스는 월드, 스크린샷, 서버 목록을 **플레이어 프로필**별로 저장합니다. 플레이어 프로필은 `Users\` 아래에 플레이어 ID를 이름으로 하는 폴더이며, 런처가 게이머태그를 알면 게이머태그로 표시됩니다. 리소스 팩과 행동 팩은 모든 프로필이 공유하고(`Users\Shared\`), 스킨 팩은 게임 1.26부터 공유되며 그 이전에는 프로필별로 저장됩니다. UWP 인스턴스에는 프로필이 없습니다.

## Windows 등록 <Badge platform="windows" /> {#registration-with-windows}

Windows는 채널마다 설치된 Minecraft 하나만 압니다. 인스턴스를 **등록**하면 Windows가 그 인스턴스를 해당 Minecraft로 취급합니다. 시작 메뉴, `minecraft://` 링크, Xbox 기능이 그 인스턴스를 사용하게 됩니다. 등록은 정식판 또는 프리뷰 자리의 현재 주인(Microsoft Store의 게임 또는 다른 인스턴스)을 대체하며, 그 데이터는 보존됩니다. 등록과 등록 해제는 게임 데이터를 절대 건드리지 않습니다.

UWP 인스턴스는 실행할 때 자동으로 등록됩니다. 등록된 인스턴스는 이름을 바꾸거나 삭제하기 전에 등록을 해제해야 합니다.

## 관련 페이지

- [버전 관리](../guide/version-management)
- [인스턴스 격리](./isolation)
- [폴더 및 파일](../reference/files)
