# DragonWorld 世界指南

## DragonWorld 是什么

DragonWorld 是一个**状态驱动的可交互世界系统**。它不是传统的聊天 UI，也不是简单的角色扮演游戏。在 DragonWorld 中，一切存在——房间、角色、物品、事件——都以结构化的状态形式被精确记录，并通过严格的事件日志逐步演化。

玩家通过命令行界面（CLI）与世界交互，发出的每一条命令都会被解析为 `WorldEvent`，写入事件存储（Event Store），并可能触发世界状态的变更。世界的"真相"不由任何单一角色的台词决定，而由**当前状态 + 完整事件历史**共同定义。

## 为什么它不是普通聊天 UI

普通聊天 UI 的对话是流动的、易逝的。一旦会话结束，之前的互动往往只以非结构化的文本形式留存，甚至完全丢失。

DragonWorld 则不同：

- **每一条交互都是事件**：玩家的 `/look`、`/talk`、`/move` 都会被记录为结构化事件。
- **状态是世界的唯一真相**：房间里有谁、有什么物品、某个角色的当前位置，都由状态机精确维护。
- **历史可回溯**：通过事件日志，可以重建世界在任意时刻的完整快照。
- **角色不是 LLM 的傀儡**：Agent 的回应基于其技能、记忆、所在房间和当前世界状态，而不是随意的生成。

## 核心概念

### 房间（Room）

房间是世界的基本空间单元。每个房间有：

- 唯一的 `id`
- 名称、描述、环境文本
- 出口（exits）连接到其他房间
- 当前存在的物品（objects）和角色（agents）

玩家始终位于某个房间中，只能与同一房间内的实体直接交互。

### 角色（Agent）

Agent 是世界中具有行为能力的实体。每个 Agent 有：

- 固定的所属房间（`owner_room`）
- 角色定位（`role`）与技能列表（`skills`）
- 对话模板（greeting、fallback 等）
- 独立的记忆命名空间（`memory_namespace`）

Agent 的回应是**确定性的**（deterministic），基于当前状态和预定义的对话素材，而非实时调用大模型。

### 物品（Object）

Object 是房间中的可交互实体。每个 Object 有：

- 类型、描述、状态文本
- 预定义的交互方式（inspect、touch、query 等）
- 与特定房间的绑定关系

Object 是玩家获取信息、触发事件、改变世界状态的重要媒介。

### 事件（Event）与状态（State）

DragonWorld 的核心哲学：

> **State 是真相，Event 是真相的演化轨迹。**

所有改变世界的事情都必须通过 Event 发生。Event 被追加到 Event Store 后，Reducer 会更新 World State。Snapshot Manager 则负责在关键节点保存状态快照，以便快速恢复。

## 房间、Agent、Object 的关系

```
World
├── Rooms
│   ├── core_room
│   │   ├── Agent: huaxia_zhenlongce
│   │   └── Object: matrix_brain
│   ├── archive_hall
│   │   ├── Agent: taishi_recorder
│   │   └── Object: archive_console
│   └── ...
├── Agents (跨房间移动受状态约束)
└── Objects (通常固定于特定房间)
```

- 一个房间可以包含多个 Agent 和 Object
- 一个 Agent 有默认的 `owner_room`，但在 Phase 2 可能支持移动
- 一个 Object 通常绑定于特定房间，但可以通过事件改变位置

## Phase 1 与 Phase 2 的区别

### Phase 1（当前）

Phase 1 的目标是建立一个**可运行的最小世界内核**：

- 6 个核心房间
- 5 个确定性 Agent
- 5 个可交互 Object
- 基础的 CLI 命令解析
- 简单的事件存储与状态更新
- 预定义的对话 stub（无 LLM 接入）

Phase 1 的重点是**验证架构**：状态机是否可靠、事件流是否清晰、CLI 体验是否顺畅。

### Phase 2（未来）

Phase 2 将在 Phase 1 的坚实基础上扩展：

- 接入 deer-flow bridge，支持基于上下文的智能对话生成
- Agent 获得更丰富的记忆层（L0-L4）
- 支持世界补丁（Patch）的提案、表决与应用
- Dashboard 可视化世界状态与事件流
- 更复杂的物品制作、角色移动与任务系统

## 快速开始

1. 启动 CLI，你会出现在 `core_room`
2. 输入 `/look` 查看当前房间
3. 输入 `/talk 华夏真龙策` 与书记官对话
4. 输入 `/south` 移动到档案大厅
5. 输入 `/inspect archive_console` 查看档案控制台

更多命令示例请参阅 [CLI_EXAMPLES.md](./CLI_EXAMPLES.md)。
