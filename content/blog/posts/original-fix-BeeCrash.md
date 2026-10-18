---
title: 蜂巢崩服问题的解决
author: Dofes
date: 2023-07-26 18:28:00
tags: [Bedrock Dedicated Server, LiteLoaderBDS]
category: Bedrock Dedicated Server
---
记录一下BDS有关BlockEventDispatcherToken::unregister的一个崩服问题

### 起因
当初有人反馈,大型服务器在长期运行的时候,在关服的时候会出现崩服问题(0xc0000005错误),而崩服很显然,会导致地图损失等问题, ~~再加上当初闲得无聊~~ ,就着手开展了对这个的研究.

### 研究
<details>
<summary>当时的崩服Log: </summary>

``` bash
......
[2023-06-07 06:00:49.138] [info] 
[2023-06-07 06:00:49.138] [info] Last Assembly: 
[2023-06-07 06:00:49.138] [info]   0x7FF7CCAA92BE --> mov rax, [rcx+0x08]
[2023-06-07 06:00:49.138] [info] 
[2023-06-07 06:00:49.138] [info] Stacktrace: 
[2023-06-07 06:00:49.169] [info]   #0 at pc 0x7FF7CCAA9230 bedrock_server_mod.exe -> BlockEventDispatcherToken::unregister+0x8E
......
```

</details>

很明显的看到和BlockEventDispatcherToken有关, 所以显而易见的得去ida里看这个函数的问题
但是由于一系列问题,最初是并没有定位到出问题的本质的 ~~(菜)~~

后续,在多次定位后无果,尝试去探寻一下这个的复现方法,于是在调用堆栈里发现这个的调用和BlockBreakSensorComponent有关,而这个又和数据驱动的[minecraft:block_sensor](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_block_sensor)有关.  
查阅可知,这个组件和蜜蜂,猪灵的攻击仇恨有关,具体就是蜂箱和金块之类的方块被破坏时,蜜蜂这些拥有该组件的实体会对破坏者产生敌意,并攻击破坏者.  
那这个为什么又会导致崩服呢?问题来到了实体上面.  
根据经验,这种情况一般是实体销毁导致的问题,于是,笔者便开始了测试,尝试在本地复现该问题.  
经过多次测试,发现利用蜂蜜快速死亡+反复生成的情况下,stop可以导致崩服,而且复现概率很高.

在查阅ida的反汇编后,得到BlockEventDispatcherToken::unregister的逻辑如下:
``` cpp
void __fastcall BlockEventDispatcherToken::unregister(BlockEventDispatcherToken *this)
{
  unsigned int v1; // r8d
  _QWORD *v3; // r9
  __int64 v4; // rdx
  __int64 *v5; // rcx
  __int64 v6; // rax
  __int64 v7; // rcx
  unsigned int v8; // [rsp+20h] [rbp-18h] BYREF

  v1 = *(_DWORD *)this;
  if ( *(_DWORD *)this == -1 )
    return;
  v3 = (_QWORD *)*((_QWORD *)this + 1);
  v8 = *(_DWORD *)this;
  v4 = v3[1];
  v5 = (__int64 *)(v3[3]
                 + 16
                 * ((0x100000001B3i64
                   * (((unsigned __int64)v1 >> 24) ^ (0x100000001B3i64
                                                    * (BYTE2(v1) ^ (0x100000001B3i64
                                                                  * ((0x100000001B3i64
                                                                    * ((unsigned __int8)v1 ^ 0xCBF29CE484222325ui64)) ^ BYTE1(v1))))))) & v3[6]));
  v6 = v5[1];
  if ( v6 == v4 )
    goto LABEL_7;
  v7 = *v5;
  if ( v1 != *(_DWORD *)(v6 + 16) )
  {
    while ( v6 != v7 )
    {
      v6 = *(_QWORD *)(v6 + 8);
      if ( v1 == *(_DWORD *)(v6 + 16) )
        goto LABEL_8;
    }
LABEL_7:
    v6 = 0i64;
  }
LABEL_8:
  if ( !v6 )
    v6 = v3[1];
  if ( v6 != v4 )
    std::_Hash<std::_Umap_traits<int,std::unique_ptr<ListenerInfo>,std::_Uhash_compare<int,std::hash<int>,std::equal_to<int>>,std::allocator<std::pair<int const,std::unique_ptr<ListenerInfo>>>,0>>::_Erase<int>(
      v3,
      &v8);
  *(_DWORD *)this = -1;
}
```

而问题出现在

``` cpp
v6 = v3[1]
```

于是,很显然,这与v3有关

### 修复
在恢复了BlockEventDispatcherToken的结构后,发现其拥有两个成员  
``` cpp
class BlockEventDispatcherToken {
  ListenerHandle handle;  
  BlockEventDispatcher *dispatcher;
}
```

而BlockEventDispatcher也有一个成员
``` cpp
class BlockEventDispatcher {
  std::unordered_map<int, std::unique_ptr<ListenerInfo>> listeners;
}
```
很明显,从v3上分析,崩服问题和umap逃不了关系.  
于是,在unregister伪代码的研究下,我们得到了正常情况下,BlockEventDispatcherToken::unregister的大致逻辑
``` cpp
void BlockEventDispatcherToken::unregister() {
  if (this->handle != -1){
    auto it = this->dispatcher->listeners.find(this->handle);
    if (it != this->dispatcher->listeners.end())
        this->dispatcher->listeners.erase(it);
    this->handle = -1;
  }
}
```
于是,我们大致知道了问题的所在,便可以着手修复工作了.

由于该问题的特殊性,引起该问题的本身就是内存回收和销毁的问题,而笔者并没有权限对源码进行阅读和查看,基于Windows平台本身在线程死亡后,便会自行清理,于是该问题的最容易解决的方案也就很明显了.  
笔者采用了直接对BlockEventDispatcherToken::unregister进行hook,自行实现了上面的伪代码中的清理部分的功能, 并且为了方便和稳定,在关服状态下便不主动对listeners进行回收,防止因为关服回收内存时候dispatcher出现问题.

``` cpp
TInstanceHook(void,"?unregister@BlockEventDispatcherToken@@QEAAXXZ",BlockEventDispatcherToken){
  if (this->handle != -1)
  {
    if(ll::globalRuntimeConfig.serverStatus == ll::LLServerStatus::Stopping){
      logger.debug("BlockEventDispatcherToken::unregister ignore unregister when server stopping");
      this->handle = -1;
      return;
    }
    auto it = this->dispatcher->listeners.find(this->handle);
    if (it != this->dispatcher->listeners.end())
        this->dispatcher->listeners.erase(it);
    this->handle = -1;
    return;
  }
}
```

### 总结
该问题的出现和修复其实并没有那么快速,前期因为经验不足而走错了方向.  
但是,该问题的出现也让笔者对BDS的内存管理方面有了更深的认识,也算是有点收获了.





