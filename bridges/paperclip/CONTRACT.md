# paperclip / Dashboard 只读数据契约

**版本**：v0.1-draft  
**状态**：设计稿，未实现  
**目的**：定义未来 Dashboard 从 DragonWorld 内核读取数据时的接口格式，确保可视化层与世界层解耦。

---

## 架构定位

paperclip 是 DragonWorld 的**只读可视化层**。它通过查询内核暴露的只读 API，将世界状态、事件流、治理进度等信息以 Dashboard 形式呈现给用户。

```
Dashboard (paperclip)          DragonWorld Kernel
       |                               |
       |---- Read Query -------------->|
       |                               |
       |<--- Read-Only Response -------|
       |                               |
```

**核心原则**：paperclip 只读不写，所有状态变更必须通过 CLI 或未来 API 触发。

---

## API 端点

### 1. 获取世界概览

`GET /v1/world/overview`

#### 响应

```json
{
  "world_version": "1.0.0-alpha.3",
  "world_status": "stable",
  "active_room_count": 6,
  "active_agent_count": 5,
  "active_object_count": 5,
  "current_timestamp": "2024-01-15T08:30:00Z",
  "uptime_seconds": 86400
}
```

---

### 2. 获取房间占用情况

`GET /v1/world/rooms/occupancy`

#### 响应

```json
{
  "rooms": [
    {
      "id": "core_room",
      "name": "核心控制室",
      "agents": ["huaxia_zhenlongce"],
      "objects": ["matrix_brain"],
      "player_present": true
    },
    {
      "id": "archive_hall",
      "name": "档案大厅",
      "agents": ["taishi_recorder"],
      "objects": ["archive_console"],
      "player_present": false
    }
  ]
}
```

---

### 3. 获取最近事件时间线

`GET /v1/world/events/recent?limit=20`

#### 响应

```json
{
  "events": [
    {
      "event_id": "evt-1847",
      "event_type": "PlayerMoved",
      "timestamp": "2024-01-15T08:29:45Z",
      "payload": {
        "player": "alice",
        "from": "core_room",
        "to": "archive_hall"
      },
      "room_context": "archive_hall"
    },
    {
      "event_id": "evt-1846",
      "event_type": "AgentTalked",
      "timestamp": "2024-01-15T08:29:30Z",
      "payload": {
        "agent_id": "huaxia_zhenlongce",
        "player": "alice",
        "message_preview": "告诉我当前世界的稳定指数。"
      },
      "room_context": "core_room"
    }
  ]
}
```

---

### 4. 获取待处理补丁列表

`GET /v1/world/patches/pending`

#### 响应

```json
{
  "pending_patches": [
    {
      "patch_id": "patch-uuid-1",
      "patch_type": "OBJECT_STATE_CHANGE",
      "target": "archive_console",
      "proposed_by": "taishi_recorder",
      "proposed_at": "2024-01-15T08:20:00Z",
      "status": "awaiting_review",
      "summary": "解锁档案控制台的加密档案访问权限"
    }
  ]
}
```

---

### 5. 获取治理状态

`GET /v1/world/governance/status`

#### 响应

```json
{
  "governance_status": "active",
  "active_proposals": 1,
  "completed_proposals_today": 3,
  "rejected_proposals_today": 0,
  "quorum_required": 3,
  "current_participants": ["huaxia_zhenlongce", "xuanshu_guard", "taishi_recorder"]
}
```

---

### 6. 获取 Agent 状态摘要

`GET /v1/world/agents/summary`

#### 响应

```json
{
  "agents": [
    {
      "id": "huaxia_zhenlongce",
      "name": "华夏真龙策",
      "current_room": "core_room",
      "status": "idle",
      "last_interaction_at": "2024-01-15T08:29:30Z",
      "memory_namespace": "huaxia_zhenlongce"
    },
    {
      "id": "nuwa",
      "name": "女娲",
      "current_room": "nursery_room",
      "status": "working",
      "last_interaction_at": "2024-01-15T08:15:00Z",
      "memory_namespace": "nuwa"
    }
  ]
}
```

---

### 7. 获取 Object 状态摘要

`GET /v1/world/objects/summary`

#### 响应

```json
{
  "objects": [
    {
      "id": "matrix_brain",
      "name": "矩阵脑核",
      "type": "core_computing",
      "room": "core_room",
      "status_text": "矩阵脑核运行正常，世界版本稳定。",
      "last_inspected_at": "2024-01-15T08:29:10Z"
    },
    {
      "id": "embryo_pool",
      "name": "胚胎池",
      "type": "biological_vessel",
      "room": "nursery_room",
      "status_text": "胚胎池温度 37.2°C，pH 值稳定，三个胚胎发育正常。",
      "last_inspected_at": "2024-01-15T08:10:00Z"
    }
  ]
}
```

---

## 数据字段总览

Dashboard 可能需要的所有只读数据字段如下：

| 字段 | 来源端点 | 说明 |
|------|----------|------|
| `world_version` | /overview | 当前世界版本 |
| `world_status` | /overview | 世界整体状态 |
| `active_room_count` | /overview | 活跃房间数量 |
| `active_agent_count` | /overview | 活跃 Agent 数量 |
| `current_room_occupancy` | /rooms/occupancy | 每个房间的当前 occupants |
| `recent_event_timeline` | /events/recent | 最近发生的事件流 |
| `pending_patches` | /patches/pending | 等待处理的补丁 |
| `governance_status` | /governance/status | 治理系统当前状态 |

---

## 推送机制（可选）

除了轮询 API，未来 Dashboard 也可以通过 WebSocket 订阅实时更新：

```json
// WebSocket 事件示例
{
  "channel": "world.events",
  "event_type": "PlayerMoved",
  "payload": { ... },
  "timestamp": "2024-01-15T08:30:00Z"
}
```

订阅频道建议：

- `world.events` — 所有世界事件
- `room.<room_id>` — 特定房间的事件
- `agent.<agent_id>` — 特定 Agent 的交互事件

---

## 安全约束

1. **只读保证**：paperclip API 不接受任何写操作请求。
2. **数据脱敏**：Agent Notebook 等私有记忆不会暴露给 Dashboard。
3. **权限隔离**：未来可能根据用户身份返回不同级别的数据视图。

---

## 变更日志

- **v0.1-draft** (2024-01-15): 初始契约草稿
