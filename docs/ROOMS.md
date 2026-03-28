# 房间说明文档

DragonWorld Phase 1 包含 6 个核心房间，构成世界的基础空间骨架。

---

## core_room · 核心控制室

**类型**：control  
**位置**：世界中心

DragonWorld 的心脏。四壁由暗金色合金铸成，中央悬浮着缓慢脉动的矩阵脑核。这里是世界状态的最终锚点，所有重大决策与系统补丁都从这里发出。

**常驻角色**：华夏真龙策  
**关键物品**：矩阵脑核  
**出口**：south → archive_hall, east → nursery_room

---

## archive_hall · 档案大厅

**类型**：archive  
**位置**：核心控制室南侧

环形巨大厅堂，墙壁上排列着无数发光的档案格。保存着 DragonWorld 自诞生以来的所有事件记录、记忆碎片与治理决议。太史录官常驻于此。

**常驻角色**：太史录官  
**关键物品**：档案控制台  
**出口**：north → core_room, east → council_hall

---

## nursery_room · 培育室

**类型**：biological  
**位置**：核心控制室东侧

温暖而湿润的房间，四壁覆盖生物发光苔藓。中央是巨大的胚胎池，淡绿色营养液中漂浮着尚未激活的生命原型。女娲守护于此。

**常驻角色**：女娲  
**关键物品**：胚胎池  
**出口**：west → core_room, south → workshop

---

## council_hall · 议事厅

**类型**：governance  
**位置**：档案大厅东侧

八角形宏伟厅堂，地面镶嵌代表不同治理领域的符文石板。DragonWorld 的决策中枢，重大提案在此讨论、表决并转化为世界补丁。

**常驻角色**：玄枢守卫  
**关键物品**：锻造台（用于封装治理决议）  
**出口**：west → archive_hall, north → observatory

---

## workshop · 工坊

**类型**：production  
**位置**：培育室南侧

充满金属敲击声与电弧光芒的房间，四周摆满半成品装置与工具架。天工监理监督世界基础设施的建造与维护。

**常驻角色**：天工监理  
**关键物品**：锻造台  
**出口**：north → nursery_room, east → observatory

---

## observatory · 观星台

**类型**：observation  
**位置**：工坊东侧 / 议事厅北侧

穹顶透明的圆形高塔，星图盘悬浮于中央，投射 DragonWorld 之外的无尽虚空。观察世界边界、监测外部威胁与推演未来走向的地方。

**常驻角色**：华夏真龙策（偶尔巡视）  
**关键物品**：星图盘  
**出口**：west → workshop, south → council_hall

---

## 房间连接图

```
                    [observatory]
                         ^
                         |
[core_room] --east--> [nursery_room] --south--> [workshop]
     |                                          |
  south                                       east
     |                                          |
[archive_hall] --east--> [council_hall] <------+
```
