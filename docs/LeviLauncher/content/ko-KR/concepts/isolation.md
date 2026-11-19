# 인스턴스 격리

Minecraft는 기기마다 하나의 게임 데이터 폴더에 월드, 팩, 설정을 저장합니다. **인스턴스 격리**(앱에서는 **인스턴스 설정**의 **격리 활성화**, 그리고 버전을 설치할 때의 **인스턴스 격리**)는 인스턴스에 인스턴스 안에 있는 자체 게임 데이터 폴더를 줍니다. 명령줄은 이 두 방식을 *own data*(자체 데이터)와 *shared data*(공유 데이터)라고 부릅니다.

## 공유 데이터와 자체 데이터

=== "Windows"

    **격리하지 않은** 인스턴스는 이 PC에서 Minecraft가 평소에 쓰는 게임 데이터를 사용합니다. Microsoft Store의 게임, 그리고 격리하지 않은 같은 종류의 다른 인스턴스와 같은 월드, 팩, 설정을 씁니다.

    **격리한** 인스턴스는 게임 데이터를 자체 폴더에 저장합니다. 월드, 리소스 팩, 행동 팩, 스킨 팩, 스크린샷, 서버 목록, 게임 설정이 다른 모든 인스턴스 및 Microsoft Store의 게임과 분리됩니다.

    | 인스턴스 | 공유 데이터(격리 꺼짐) | 자체 데이터(격리 켜짐) |
    | --- | --- | --- |
    | GDK, 정식판 | `%APPDATA%\Minecraft Bedrock` | `<인스턴스>\Minecraft Bedrock` |
    | GDK, 프리뷰 | `%APPDATA%\Minecraft Bedrock Preview` | `<인스턴스>\Minecraft Bedrock Preview` |
    | UWP, 정식판 | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<인스턴스>\Minecraft Bedrock` |
    | UWP, 프리뷰 | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState` | `<인스턴스>\Minecraft Bedrock Preview` |
    | UWP, Beta | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<인스턴스>\Minecraft Bedrock Beta` |

    `<인스턴스>`는 `Instances` 안의 인스턴스 폴더입니다([폴더 및 파일](../reference/files) 참조). GDK 데이터 폴더 안에서 게임은 각 플레이어의 데이터를 `Users\` 아래에 둡니다([플레이어 프로필](./instances#player-profiles) 참조). UWP 데이터 폴더 안에서는 `games\com.mojang\` 아래에 둡니다.

=== "Android"

    버전 격리는 한 버전의 게임 데이터(월드, 팩, 설정)를 다른 버전 및 Google Play에서 설치한 Minecraft와 분리합니다. 한 인스턴스에서 이 설정을 바꿔도 다른 인스턴스에는 영향이 없습니다. 가져온 버전은 실행하려면 격리가 필요한 경우가 많습니다.

## 동작 방식 <Badge platform="windows" />

게임 자체는 인스턴스에 대해 알지 못합니다. LeviLauncher는 인스턴스를 설치할 때 자체 로더인 `LeviLauncher.dll`을 게임 실행 파일 옆에 둡니다([모드 로드 방식](./mod-loading) 참조). 격리가 켜진 상태로 게임이 시작되면, 로더는 게임이 데이터를 찾는 폴더(애플리케이션 데이터 폴더와 임시 폴더)를 인스턴스의 데이터 폴더로 리디렉션합니다. 아무것도 복사하거나 연결하지 않으며, 게임은 그냥 그곳에서 읽고 씁니다.

격리가 바꾸지 않는 것:

- **모드**는 격리 여부와 관계없이 항상 인스턴스별로 인스턴스의 `mods\` 폴더에 있습니다.
- **Microsoft 계정**과 런처 자체의 설정은 모든 인스턴스에서 같습니다.
- Windows **등록**([인스턴스와 게임 버전](./instances#registration-with-windows) 참조)은 격리와 별개입니다.

## 제한 <Badge platform="windows" />

- GDK 인스턴스는 모든 버전에서 격리를 지원하고, UWP 인스턴스는 1.19.70.2부터 x64에서만 지원합니다.
- 격리를 켜도 아무것도 복사되지 않습니다. 인스턴스는 빈 게임 데이터로 시작합니다. 기존 데이터로 시작하려면 버전을 설치할 때 데이터 복사를 선택하거나(이 PC에 설치된 게임 또는 같은 종류의 다른 격리 인스턴스에서), 나중에 `LeviLauncher.exe instance copy-data`로 복사하세요(GDK).
- 격리를 끄면 인스턴스는 다시 공유 데이터를 사용합니다. 자체 데이터 폴더는 인스턴스 폴더에 그대로 남습니다.
- 인스턴스를 삭제하면 그 폴더가 삭제되며, **자체 데이터의 월드도 함께 삭제됩니다**. 중요한 월드는 먼저 백업하세요([월드 도구](../guide/world-tools) 참조).
- 콘텐츠는 자체 데이터를 가진 인스턴스, 또는 같은 데이터 폴더를 쓰지 않는 UWP 인스턴스로만 복사할 수 있습니다.

## 언제 사용하나요

격리는 다음과 같은 경우에 유용합니다.

- 버전마다 다른 콘텐츠 구성을 쓰고 싶을 때
- 모드나 Minecraft 프리뷰 빌드를 더 안전하게 테스트하고 싶을 때
- 한 환경이 다른 환경에 영향을 줄 위험을 줄이고 싶을 때

잘 맞는 구성: 일반 플레이용 격리 정식판 인스턴스 하나, 필요할 때만 쓰는 격리 프리뷰 인스턴스 하나, 모드나 문제 해결용 임시 테스트 인스턴스 하나.

## 관련 페이지

- [버전 관리](../guide/version-management)
- [콘텐츠 관리](../guide/content-management)
- [인스턴스와 게임 버전](./instances)
