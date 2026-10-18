---
title: 通过Patch修复BDS的空包刷屏问题
date: 2024-08-11 09:51:07
author: ShrBox
tags: [Bedrock Dedicated Server, LeviLamina]
category: Bedrock Dedicated Server
---
> Mojang已经在1.21.20.03中修复了此问题

本文将介绍我通过[LeviLamina](https://github.com/LiteLDev/LeviLamina)以及[libhat](https://github.com/BasedInc/libhat)通过Patch的方式解决Bedrock Dedicated Server(以下简称BDS)中服务端收到空包会在控制台刷`ATTENTION! Received EMPTY UDP packet - potential UDP ports scanning.`的问题。  

## 起因

在BDS的早期版本中，存在着非常多的严重的远程崩服漏洞，空包崩服就是其中一种，自某个版本后Mojang便修复了此漏洞，但同时又在RakNet中拉了一坨`printf`来提醒使用者服务器收到了空包，但这又导致了另一个问题，就是攻击者可以通过频繁地发送空包来造成主线程堵塞。此问题已经由社区向反馈差不多一年时间了，Mojang仍然没有在公开的BDS版本中修复此问题，鉴于前些日子官方和MCC合作的活动服务器是由BDS+ScriptAPI驱动的，但活动服中并无此问题，由此可见Mojang早就知道BDS有这个问题，但却迟迟不修复。于是，我们只能自己动手来修复这一问题。

## 寻找`printf`函数所在位置

首先编写一个发送空包到BDS端口的脚本，这里选择使用Python。
```py
import socket

s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
i = 0
while i < 10000: # 发送10000个空包到BDS
    s.sendto(
        "",
        ("127.0.0.1", 19132),
    )
    i = i + 1

```
将脚本保存为`empty.py`。  
然后通过Visual Studio打开/挂载BDS进程，选用其它调试器例如x64dbg也可以。
运行此脚本：`py empty.py`  
此时在控制台观察到大量的`ATTENTION! Received EMPTY UDP packet - potential UDP ports scanning.`输出，通过Visual Studio或其它调试器暂停主线程，我们可以看到如下堆栈：
```cpp
 	ntdll.dll!NtWaitForSingleObject()
 	KernelBase.dll!WaitForSingleObjectEx()
 	bedrock_server.exe!RakNet::UpdateNetworkLoop(void *)
 	ucrtbase.dll!thread_start<unsigned int (__cdecl*)(void *),1>()
 	kernel32.dll!BaseThreadInitThunk()
>	ntdll.dll!RtlUserThreadStart()
```
嗯？似乎没有看到任何有关输出流的调用？没关系，让我们再试一次。
```cpp
>	ntdll.dll!NtWriteFile()
 	KernelBase.dll!WriteFile()
 	ucrtbase.dll!write_text_ansi_nolock()
 	ucrtbase.dll!_write_nolock()
 	ucrtbase.dll!_write_internal()
 	ucrtbase.dll!write_buffer_nolock<char>()
 	ucrtbase.dll!common_flush_and_write_nolock<char>()
 	ucrtbase.dll!__crt_stdio_output::stream_output_adapter<char>::write_character_without_count_update()
 	ucrtbase.dll!__crt_stdio_output::output_processor<char,__crt_stdio_output::stream_output_adapter<char>,__crt_stdio_output::standard_base<char,__crt_stdio_output::stream_output_adapter<char>>>::process()
 	ucrtbase.dll!<lambda>(void)()
 	ucrtbase.dll!__crt_seh_guarded_call<int>::operator()<<lambda_d854c62834386a3b23916ad6dae2782d>,<lambda>(void) &,<lambda>(void)>()
 	ucrtbase.dll!__stdio_common_vfprintf()
 	bedrock_server.exe!printf()
 	bedrock_server.exe!RakNet::RNS2_Berkley::RecvFromLoopInt(void)
 	bedrock_server.exe!RakNet::RNS2_Berkley::RecvFromLoop(void *)
 	ucrtbase.dll!thread_start<unsigned int (__cdecl*)(void *),1>()
 	kernel32.dll!BaseThreadInitThunk()
 	ntdll.dll!RtlUserThreadStart()

```
这次我们得到了我们想要的东西，我们看到了我们期望的`printf`，以及`printf`在`RakNet::RNS2_Berkley::RecvFromLoopInt(void)`中调用的有效信息，现在，我们可以打开IDA或其它同类型的反编译软件来具体查看`RakNet::RNS2_Berkley::RecvFromLoopInt(void)`中`printf`的具体位置了。
```cpp
unsigned RakNet::RNS2_Berkley::RecvFromLoopInt(RakNet::RNS2_Berkley *this)
{
  // 略...
  while ( !*((_BYTE *)this + 260) )
  {
    v5 = *((_QWORD *)this + 30);
    if ( v5 )
    {
      v6 = (*(__int64 (__fastcall **)(__int64, const char *, __int64))(*(_QWORD *)v5 + 24i64))(
             v5,
             "D:\\a\\_work\\1\\s\\handheld\\src-deps\\raknet\\raknet\\RakNetSocket2.cpp",
             388i64);
      v7 = v6;
      if ( v6 )
      {
        // 略...
        if ( v12 <= 0 )
        {
          // 略...
          if ( v14 )
            (*(void (__fastcall **)(__int64, __int64, const char *, __int64))(*(_QWORD *)v14 + 16i64))(
              v14,
              v7,
              "D:\\a\\_work\\1\\s\\handheld\\src-deps\\raknet\\raknet\\RakNetSocket2.cpp",
              408i64);
          printf("\n\n  ATTENTION! Received EMPTY UDP packet - potential UDP ports scanning.\n\n"); // 找到Mojang拉的屎了
        }
        else
        {
          v13 = *((_QWORD *)this + 30);
          if ( v13 )
            (*(void (__fastcall **)(__int64, __int64))(*(_QWORD *)v13 + 8i64))(v13, v7);
        }
      }
    }
  }
  RakNet::LocklessUint32_t::Decrement((RakNet::RNS2_Berkley *)((char *)this + 256));
  if ( v18 )
  {
    if ( _InterlockedExchangeAdd(v18 + 2, 0xFFFFFFFF) == 1 )
    {
      (**(void (__fastcall ***)(volatile signed __int32 *))v18)(v18);
      if ( _InterlockedExchangeAdd(v18 + 3, 0xFFFFFFFF) == 1 )
        (*(void (__fastcall **)(volatile signed __int32 *))(*(_QWORD *)v18 + 8i64))(v18);
    }
  }
  return 0i64;
}
```
通过IDA伪代码，我们可以看到Mojang确确实实在`RecvFromLoopInt`里面拉了坨大的，现在我们要做的事就是Patch掉这坨了。  
切换到IDA View，右键选择**Synchrnoize with**->**Pseudocode-A**，我们就可以看到罪魁祸首的汇编了：
```asm
loc_14232424B:
lea     rcx, aAttentionRecei ; "\n\n  ATTENTION! Received EMPTY UDP pac"...
call    printf
jmp     short loc_1423242B9
```
我们需要将`lea`和`call`给Patch为空字节，接下来切换到Hex View，同样右键选择**Synchrnoize with**->**Pseudocode-A**，我们就找到了罪魁祸首的16进制：
```
48 8D 0D 9E DB B7 00 E8 D9 EB FD FF
```

## 通过LeviLamina和libhat进行Patch

现在就是我们通过LeviLamina和libhat来大展拳脚的时候了
```cpp
#include "libhat/Scanner.hpp"
#include "libhat/Signature.hpp"
#include "ll/api/memory/Memory.h"

void consoleSpamPatch() {
    std::byte*     funcBegin = (std::byte*)LL_RESOLVE_SYMBOL("?RecvFromLoopInt@RNS2_Berkley@RakNet@@IEAAIXZ");
    constexpr auto pattern   = hat::compile_signature<"48 8D 0D 9E DB B7 00 E8 D9 EB FD FF">();
    auto           result    = hat::find_pattern(funcBegin, funcBegin + 0x250, pattern);
    if (!result.has_result()) {
        std::cout << "Can't find signature for RecvFromLoopInt\n";
    }
    std::byte* patchLocation = (std::byte*)result.get();
    size_t     patchLength   = 12;
    ll::memory::modify(patchLocation, oatchLength, [&]() {
        std::memset(patchLocation, 0x90 /* nop */, oatchLength);
    });
}
```
我们也可以改用模糊匹配，将一些可能会变动的字节改为`??`
```cpp
#include "libhat/Scanner.hpp"
#include "libhat/Signature.hpp"
#include "ll/api/memory/Memory.h"

void consoleSpamPatch() {
    std::byte*     funcBegin = (std::byte*)LL_RESOLVE_SYMBOL("?RecvFromLoopInt@RNS2_Berkley@RakNet@@IEAAIXZ");
    constexpr auto pattern   = hat::compile_signature<"48 8D 0D ?? ?? ?? 00 E8 ?? ?? FD FF">();
    auto           result    = hat::find_pattern(funcBegin, funcBegin + 0x250, pattern);
    if (!result.has_result()) {
        std::cout << "Can't find signature for RecvFromLoopInt\n";
    }
    std::byte* patchLocation = (std::byte*)result.get();
    size_t     patchLength   = 12;
    ll::memory::modify(patchLocation, oatchLength, [&]() {
        std::memset(patchLocation, 0x90 /* nop */, oatchLength);
    });
}
```
将代码嵌入Mod中，然后将Mod安装进带有LeviLamina的服务端中。  
重新执行发送空包的Python脚本，服务器的控制台无事发生，就证明我们的Patch已经生效了。
