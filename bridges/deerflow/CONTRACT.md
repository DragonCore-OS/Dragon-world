# deer-flow Bridge 接口契约

**版本**：v1.0-freeze  
**状态**：已冻结，Phase 2 执行基准  
**目的**：钉死 DragonWorld 内核与 deer-flow runtime 之间的数据交换格式，防止接口漂移与越权修改。

---

## 架构定位

deer-flow 是 DragonWorld 的**外部推理引擎**。在 Phase 2，当玩家与 Agent 对话时，世界内核不会直接调用 LLM，而是将当前上下文打包发送给 deer-flow，由后者生成符合角色设定与世界状态的回复。

```
DragonWorld Kernel          deer-flow Service
       |                           |
       |---- Request Payload ----->|
       |                           |
       |<--- Response Payload -----|
       |                           |
```

**核心原则**：deer-flow 不直接修改世界状态，只能返回建议；世界变更的最终决定权在 DragonWorld Kernel + 治理层。

---

## 边界冻结声明

### 边界 1：内核真相边界
世界真相只能来自 DragonWorld：
- `WorldState`
- `WorldEvent`
- `Room` / `Agent` / `Object`
- `current_room`
- `ledger_offset`
- `version`

**禁止 deer-flow 自己维护另一份“世界真相”。**

### 边界 2：命令边界
内核 parser 只接受 Phase 1 命令：
- `/look`
- `/go <direction>` / `/north` / `/south` / `/east` / `/west`
- `/talk <agent>`
- `/inspect <object>`
- `/status`
- `/help`
- `exit` | `quit`

Bridge 层新增命令入口（不直接进 world-core）：
- `/say <text>`
- `/ask <text>`
- `/invoke <agent> <text>`

### 边界 3：事件边界
内核事件类型固定为 5 种：
- `world_initialized`
- `room_entered`
- `talk_attempted`
- `inspect_attempted`
- `command_rejected`

Bridge 事件单独存放，不混入内核事件 enum：
- `runtime_invoked`
- `runtime_replied`
- `runtime_failed`
- `memory_update_proposed`
- `world_patch_proposed`
- `world_patch_approved`
- `world_patch_rejected`

### 边界 4：Loader/Schema 边界
`world-loader` 当前为手写解析器，对格式敏感。Phase 2 期间：
- **禁止**扩展 YAML 结构
- **禁止**新增复杂嵌套格式
- **禁止**让 runtime 回写 seed world manifest

---

## 请求格式（Kernel → deer-flow）

### HTTP 方法

`POST /v1/agent/respond`

### Headers

```http
Content-Type: application/json
X-World-Version: <current_world_version>
X-Request-ID: <uuid>
```

### Body

```json
{
  "protocol_version": "dw-bridge-v1",
  "thread_id": "thread-001",
  "session_id": "session-001",
  "player": {
    "id": "creator",
    "display_name": "Creator"
  },
  "world": {
    "version": "0.1.0",
    "current_room": {
      "id": "core_room",
      "name": "母體室",
      "description": "中央懸浮一顆蠕動中的母體腦。"
    },
    "visible_exits": ["south", "east"],
    "visible_agents": [
      {
        "id": "huaxia_zhenlongce",
        "name": "華夏真龍策",
        "title": "書記官",
        "role": "memory_bridge"
      }
    ],
    "visible_objects": [
      {
        "id": "matrix_brain",
        "name": "母體腦",
        "object_type": "core_model_terminal",
        "status": "stable"
      }
    ]
  },
  "interaction": {
    "mode": "agent_dialogue",
    "target_agent_id": "huaxia_zhenlongce",
    "user_message": "整理最近三次世界改動"
  },
  "memory_hints": {
    "enabled": true,
    "top_notes": [
      "使用者正在建設 DragonWorld。",
      "華夏真龍策負責記憶橋接。"
    ]
  },
  "policy": {
    "allow_world_patch_proposal": true,
    "allow_direct_world_mutation": false,
    "allow_file_generation": false
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `protocol_version` | string | 是 | 固定为 `dw-bridge-v1` |
| `thread_id` | string | 是 | 对话线程唯一标识 |
| `session_id` | string | 是 | 当前会话唯一标识 |
| `player` | object | 是 | 玩家身份信息 |
| `world` | object | 是 | 当前世界上下文（只读快照） |
| `world.current_room` | object | 是 | 玩家当前所在房间 |
| `world.visible_exits` | array | 是 | 当前房间可见出口方向列表 |
| `world.visible_agents` | array | 是 | 当前房间可见 Agent 列表（精简字段） |
| `world.visible_objects` | array | 是 | 当前房间可见 Object 列表（精简字段） |
| `interaction` | object | 是 | 本次交互信息 |
| `interaction.mode` | string | 是 | 交互模式：`agent_dialogue` / `world_query` / `forge_request` |
| `interaction.target_agent_id` | string | 条件 | `agent_dialogue` 模式下必填 |
| `interaction.user_message` | string | 是 | 玩家发送的原始消息 |
| `memory_hints` | object | 否 | 记忆提示，runtime 可选择性使用 |
| `policy` | object | 否 | 权限策略声明 |
| `policy.allow_world_patch_proposal` | bool | 否 | 是否允许返回 patch proposal |
| `policy.allow_direct_world_mutation` | bool | 否 | **必须始终为 false** |
| `policy.allow_file_generation` | bool | 否 | 是否允许生成文件建议 |

### 请求约束

- **不传递**整个 `WorldState`
- **不传递**所有房间全文
- **不传递**整个事件 ledger
- **不传递**所有 agent notebook 内容

---

## 响应格式（deer-flow → Kernel）

### HTTP 状态码

- `200 OK` — 正常生成回复
- `400 Bad Request` — 请求格式错误
- `422 Unprocessable Entity` — 请求内容超出 Agent 能力范围
- `500 Internal Server Error` — deer-flow 内部错误
- `503 Service Unavailable` — 推理服务过载

### Body

```json
{
  "protocol_version": "dw-bridge-v1",
  "response_type": "agent_reply",
  "reply": {
    "text": "我已為你整理最近三次世界改動。",
    "style": "plain_text"
  },
  "memory_updates": [
    {
      "scope": "agent_notebook",
      "owner": "huaxia_zhenlongce",
      "summary": "使用者要求回顧最近三次世界改動。",
      "importance": "medium"
    }
  ],
  "patch_proposals": [
    {
      "proposal_id": "patch-001",
      "kind": "create_room",
      "summary": "在 core_room 南方新增培育房",
      "manifest_stub": {
        "room_id": "nursery_room_v2",
        "parent_room": "core_room",
        "direction": "south"
      }
    }
  ],
  "tool_trace_summary": [
    "memory lookup requested",
    "world patch proposed"
  ],
  "errors": []
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `protocol_version` | string | 固定为 `dw-bridge-v1` |
| `response_type` | string | `agent_reply` / `query_result` / `forge_proposal` / `runtime_error` |
| `reply` | object | 回复文本，`text` 为必填，`style` 可选 |
| `memory_updates` | array | 建议的记忆更新列表 |
| `patch_proposals` | array | 建议的世界变更补丁列表 |
| `tool_trace_summary` | array | 工具调用摘要，用于审计 |
| `errors` | array | 错误信息列表，非空时内核应降级处理 |

### 响应约束

**deer-flow 允许返回：**
- `reply.text`
- `memory_updates`
- `patch_proposals`
- `tool_trace_summary`
- `errors`

**deer-flow 不允许返回：**
- 完整替换后的 `WorldState`
- 直接修改后的 room graph
- 直接覆写 YAML 的内容
- 直接宣告“已创建房间”或“已写入世界”

**它只能说：“我提议”，不能说 “我已经改了”。**

---

## 交互模式定义

Bridge 只允许以下 3 种 `interaction.mode`：

### mode 1: `agent_dialogue`
与房间内 Agent 对话。
- 示例：`/talk 華夏真龍策` → `/say 幫我整理最近三次改動`
- 预期输出：`reply.text`
- 可选：`memory_updates`
- **不应输出 `patch_proposals`**，除非明确进入 forge 类请求

### mode 2: `world_query`
查询世界，不修改世界。
- 示例：“目前房间有哪些可见 agent？”
- **规则**：能由 kernel 直接回答的查询，优先不调 runtime。
- 预期输出：`reply.text` 或 `query_result`

### mode 3: `forge_request`
只有在明确请求建造 / 生成时才允许。
- 示例：“新增一个培育房”、“创造一个审计型 agent”
- 预期输出：`patch_proposals`
- **禁止**：直接改世界

---

## Patch Proposal 格式

```json
{
  "proposal_id": "patch-001",
  "kind": "create_room",
  "summary": "在 core_room 南方新增培育房",
  "manifest_stub": {
    "room_id": "nursery_room_v2",
    "parent_room": "core_room",
    "direction": "south"
  },
  "required_governance": true,
  "reasoning": "使用者要求擴展培育設施。"
}
```

### `kind` 枚举（Phase 2 冻结）

- `create_room` — 创建新房间
- `create_agent` — 创建新 Agent
- `create_object` — 创建新 Object
- `object_state_change` — 改变 Object 状态
- `agent_memory_update` — 更新 Agent Notebook（通过 proposal 形式）
- `governance_proposal` — 发起需要表决的治理提案

### Patch 处理流程

1. deer-flow 返回 `patch_proposals`
2. Kernel 将其序列化到 `proposals/patch-<id>.json`
3. **不直接 apply**
4. 由 DragonCore / taichu 治理层审批
5. 审批通过后，由 Kernel 执行并记录 `world_patch_approved` 事件
6. 审批拒绝则记录 `world_patch_rejected` 事件

---

## 权限矩阵

| 操作 | DragonWorld Kernel | deer-flow | DragonCore / taichu |
|------|-------------------|-----------|---------------------|
| 解析命令 | ✅ | ❌ | ❌ |
| 执行确定性行为（/go, /look） | ✅ | ❌ | ❌ |
| 更新 `current_room` | ✅ | ❌ | ❌ |
| 保存/加载 snapshot | ✅ | ❌ | ❌ |
| 生成对话文本 | ❌ | ✅ | ❌ |
| 生成记忆更新建议 | ❌ | ✅ | ❌ |
| 生成 patch proposal | ❌ | ✅ | ❌ |
| 审批 patch proposal | ❌ | ❌ | ✅ |
| Veto / Archive / Rollback | ❌ | ❌ | ✅ |

---

## Bridge MVP 目标

Phase 2 Bridge 最小可交付版本只做三件事：

1. **`/talk <agent>` 从 stub 升级为 bridge 调用**
   - Kernel 验证 agent 在房间内
   - 将请求送到 deer-flow
   - 收回 `reply.text` 显示给玩家

2. **`memory_updates` 先只写到暂存文件**
   - 不直接接正式记忆库
   - 暂存路径：`runtime_state/memory/<agent_id>/<timestamp>.json`

3. **`patch_proposals` 只落到文件系统**
   - 存储路径：`proposals/patch-<proposal_id>.json`
   - **禁止直接 apply**

---

## Phase 2 禁止事项

在接口冻结期间，以下事项一律不做：

- [ ] runtime 直接改 YAML
- [ ] auto-approve patch
- [ ] 多 agent 同时写世界
- [ ] 把 deer-flow state 当作世界 state
- [ ] 自然语言直接映射为内核命令
- [ ] 把治理层塞进 `dragon-world` crate

---

## 变更日志

- **v1.0-freeze** (2025-03-29): 接口冻结，与 Phase 1 Recovery 内核对齐，明确边界与权限矩阵
- **v0.1-draft** (2024-01-15): 初始契约草稿
