# deer-flow Bridge 接口契约

**版本**：v0.1-draft  
**状态**：设计稿，未实现  
**目的**：定义 DragonWorld 内核与未来 deer-flow 服务之间的数据交换格式，防止接口漂移。

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
  "thread_id": "uuid-of-conversation-thread",
  "current_room": {
    "id": "core_room",
    "name": "核心控制室",
    "description": "DragonWorld 的心脏...",
    "ambient_text": "矩阵脑核发出低沉的嗡鸣..."
  },
  "visible_agents": [
    {
      "id": "huaxia_zhenlongce",
      "name": "华夏真龙策",
      "title": "世界书记",
      "role": "secretary",
      "greeting": "书记者已在案。请吩咐。",
      "memory_namespace": "huaxia_zhenlongce"
    }
  ],
  "visible_objects": [
    {
      "id": "matrix_brain",
      "name": "矩阵脑核",
      "type": "core_computing",
      "status_text": "矩阵脑核运行正常，世界版本稳定。"
    }
  ],
  "player_message": "告诉我当前世界的稳定指数。",
  "memory_hints": {
    "l0_context": ["玩家刚刚查看了矩阵脑核", "玩家连续第三次询问系统状态"],
    "l1_session": {"player_focus": "system_status", "mood": "curious"},
    "l2_agent_notebook": ["该玩家偏好精确的数据回答", "避免使用过于诗意的修辞"],
    "l3_recent_events": [
      {"type": "PlayerInspected", "target": "matrix_brain", "timestamp": "..."}
    ],
    "l4_canon_facts": ["矩阵脑核是 DragonWorld 的中央处理器"]
  },
  "skill_scope": ["record_keeping", "state_inquiry"],
  "target_agent_id": "huaxia_zhenlongce",
  "world_version": "1.0.0-alpha.3",
  "timestamp": "2024-01-15T08:30:00Z"
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `thread_id` | string | 对话线程唯一标识，用于 deer-flow 维护多轮上下文 |
| `current_room` | object | 玩家当前所在房间的完整信息 |
| `visible_agents` | array | 当前房间中可见的 Agent 列表 |
| `visible_objects` | array | 当前房间中可见的 Object 列表 |
| `player_message` | string | 玩家发送给目标 Agent 的原始消息 |
| `memory_hints` | object | 各层记忆的摘要提示，deer-flow 可选择性使用 |
| `skill_scope` | array | 目标 Agent 的技能列表，用于约束回复范围 |
| `target_agent_id` | string | 玩家正在对话的目标 Agent ID |
| `world_version` | string | 当前世界版本号 |
| `timestamp` | string | ISO 8601 格式的时间戳 |

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
  "reply_text": "根据矩阵脑核的最新读数，当前世界稳定指数为 98.7%，所有核心系统运行正常。",
  "artifact_refs": [
    {
      "type": "object",
      "id": "matrix_brain",
      "reason": "回复中引用了该物品的状态数据"
    }
  ],
  "memory_updates": {
    "l0_context": "玩家关注系统稳定性",
    "l2_agent_notebook": "记录玩家偏好精确数据"
  },
  "proposed_world_patch": null,
  "tool_trace_summary": [
    {"tool": "state_query", "target": "matrix_brain", "result": "stable_index: 98.7%"}
  ],
  "meta": {
    "model": "deer-flow-v1",
    "latency_ms": 340,
    "finish_reason": "stop"
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `reply_text` | string | Agent 回复玩家的最终文本 |
| `artifact_refs` | array | 回复中引用的世界实体，用于内核做链接高亮 |
| `memory_updates` | object | deer-flow 建议更新的记忆摘要 |
| `proposed_world_patch` | object/null | 如果对话触发了世界变更，返回建议的补丁 |
| `tool_trace_summary` | array | deer-flow 内部调用的工具/查询摘要，用于审计 |
| `meta` | object | 生成元数据，可选 |

---

## proposed_world_patch 格式

当玩家对话可能触发世界状态变更时（如"打开那扇门"、"批准这个提案"），deer-flow 可以返回一个建议补丁：

```json
{
  "proposed_world_patch": {
    "patch_id": "patch-uuid",
    "patch_type": "OBJECT_STATE_CHANGE",
    "target": {
      "type": "object",
      "id": "archive_console"
    },
    "changes": {
      "status_text": "档案控制台已解锁，正在加载加密档案..."
    },
    "reasoning": "玩家获得了太史录官的授权，请求解锁档案控制台。",
    "required_governance": false
  }
}
```

### 补丁类型枚举

- `OBJECT_STATE_CHANGE` — 改变 Object 状态
- `AGENT_MEMORY_UPDATE` — 更新 Agent Notebook
- `ROOM_OCCUPANCY_CHANGE` — 改变房间内的 Agent/Object 分布
- `GOVERNANCE_PROPOSAL` — 发起需要表决的治理提案

---

## 安全与约束

1. **deer-flow 不直接修改世界状态**：它只能返回 `proposed_world_patch`，最终是否应用由内核决定。
2. **技能边界**：deer-flow 必须根据 `skill_scope` 约束回复内容，不能赋予 Agent 超出其技能的能力。
3. **记忆提示非强制**：`memory_hints` 是提示而非指令，deer-flow 可以选择性忽略。
4. **超时策略**：内核应设置合理的请求超时（建议 10 秒），超时后回退到 deterministic stub 回复。

---

## 变更日志

- **v0.1-draft** (2024-01-15): 初始契约草稿
