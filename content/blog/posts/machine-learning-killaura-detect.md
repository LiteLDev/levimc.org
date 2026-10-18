---
title: 使用机器学习检测杀戮光环
author: PA733
date: 2023-07-31 14:03:00
tags: [Bedrock Dedicated Server, LiteLoaderBDS]
category: Bedrock Dedicated Server
---
本文将介绍一种基于机器学习的反作弊思路，它利用玩家的行为数据来训练一个神经网络模型，从而有效地识别出作弊的玩家。  

## 引言

### 杀戮光环简介
杀戮光环是一种外挂，它可以让玩家自动攻击周围的实体（其他玩家、怪物等）。杀戮光环的检测一直是一个难题，因为杀戮光环的行为和正常玩家的行为非常相似。  
目前市面上的杀戮光环检测方法主要有以下几种：  

1. 基于行为的检测：分析玩家的攻击频率、攻击间隔等指标。  
2. 基于数据包的检测：分析玩家攻击数据包的间隔等特征。  

传统方法有一些局限性，比如容易受到网络延迟的影响，或者被一些高级的外挂绕过。  

## 特征分析

### 玩家行为
玩家攻击时，通常要先瞄准目标，再点击鼠标。  
但杀戮光环不需要瞄准，它通过发送攻击数据包，来快速攻击周围的实体。  
因此，分析玩家看的方向和玩家攻击的实体的方向，有多大的偏差，即可判断玩家是否用了杀戮光环。  
在实战中，我们发现这个偏差与玩家的攻击距离有关，因此接下来我们将同时收集角度和距离的特征。  

### 数据收集
借助LiteLoaderBDS SDK，使用以下代码，即可获取到玩家的视线向量：  
```cpp
Event::PlayerAttackEvent::subscribe([](const Event::PlayerAttackEvent& ev) {
    Vec3 playerLookDir = ev.mPlayer->getHeadLookVector(1.0);
    return true;
});
```
随后使用以下代码计算玩家到实体的向量和距离：  
```cpp
Event::PlayerAttackEvent::subscribe([](const Event::PlayerAttackEvent& ev) {
    Vec3 playerEyeLoc = ev.mPlayer->getCameraPos();
    Vec3 entityLoc = ev.mTarget->getPos();
    Vec3 playerEntityDir = entityLoc - playerEyeLoc;
    double playerEntityDist = playerEntityDir.length();
    return true;
});
```
接着，我们计算出夹角：  
```cpp
double cosAngle = playerEntityDir.angle(playerLookDir);
double angle = acos(cosAngle);
```
至此，我们已经获得了关键数据。  

### 数据可视化
将数据导入至MATLAB，使用以下代码，即可绘制出玩家攻击距离和玩家攻击角度的散点图：  
```matlab
%% Read the csv files
vanillaData = readmatrix('data.desktop.vanilla.csv');
horionData = readmatrix('data.desktop.horion.csv');

%% Plot the data in a scatter plot
scatter(vanillaData, 'g');
scatter(horionData, 'r', 'x');
```
![MATLAB绘制的散点图](https://s2.loli.net/2023/07/31/3RwnGp9VqgZby8t.jpg)  
观察发现，两类数据有着较明显的区别。其中，原版客户端对应点分布于图像左下角；而杀戮光环对应点分布较散。  

## 模型训练

### 神经网络的选择
在本次案例中，我们选择了DNN神经网络，原因如下：  

   1. DNN网络在大量数据的情况下表现较好。在Minecraft中，玩家攻击数据收集成本较低。  
   2. DNN网络可以较容易地移植到C++上，减小开发难度。  

### 神经网络训练
读入数据后，我们使用以下MATLAB代码创建一个DNN神经网络：
```matlab
net = patternnet(hiddenLayerSize);
```
接着，开始训练：
```matlab
net = train(net, P_train, T_train);
```
在实战中，测试集报告的分类准确度达到了87%，符合预期。  

## 实践

### 神经网络移植
使用MATLAB中的`save`函数，我们可以保存训练好的模型的权重等数据。  
在C++中实现相关逻辑后，即可用于新数据的分类：  
```cpp
double DNN(const std::vector<double>& X) {
    // ===== SIMULATION ========
    // Dimensions
    int Q = X[0].size();
    // Input 1
    std::vector<double> Xp1 = mapminmax_apply(X, x1_step1);
    // Layer 1
    double a1 = logsigApply(matlab::matrixAddition(matlab::repmat(b1, Q), matlab::matrixMultiply(LW1_1, Xp1)));
    
    return a1;
}
```

### 检测实现
使用 “特征分析”-“数据收集” 章节中，我们收集到玩家的攻击数据，即可进行分类：  
```cpp
std::vector<double> playerData = {};
playerData.push_back(playerEntityDist);
playerData.push_back(angle);
double results = DNN(playerData);
```
神经网络返回数据分类为1的概率。  

## 总结与展望

### 主要贡献
机器学习在游戏中的主要贡献如下：  

   1. 我们只需要找到玩家行为的量化方法，即可进行异常检测。  
   2. 如果外挂进行了升级，借助机器学习较高的灵活性与可扩展性，我们可以通过增加数据量或数据维度的方式，及时地做出应对。  

### 未来的发展方向
反作弊作为一种保证玩家游戏公平的手段，能够帮助广大服主建立良好的游玩体验，提高用户的满意度和留存率。  
但随着作弊手段的日益进步与玩家需求的变化，反作弊也面临着新的挑战与机遇，未来的发展方向主要有以下几个方面：  

   1. 机器学习的引入。机器学习能带来更高的检测率与更低的误报率，并及时对新兴作弊手段进行响应。  
   2. 更多判定角度。反作弊可引入更多的玩家特征信息进行判断，进一步增强反作弊能力。  

## 致谢
感谢 [LiteLDev](https://github.com/LiteLDev/) 的各位，他们开发出的LiteLoaderBDS极大地简化了数据采集与分析的难度。  
感谢 [Futrime](https://github.com/Futrime) ，他对本实践提出了很多建设性的意见。  
感谢 [ShrBox](https://github.com/ShrBox) 和 [Dofes](https://github.com/dofes) ，他们为本项目的推广提供了很大的帮助。  
感谢 [KawaiiNahida](https://github.com/KawaiiNahida)、[Redbeanw44602](https://github.com/Redbeanw44602)和[RimuruChan](https://github.com/RimuruChan) ，他们为我的开发给予了精神上的鼓励与支持。
