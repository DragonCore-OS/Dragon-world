# Patch Proposal 目录规范

**版本**：v1.0-freeze  
**状态**：已冻结  
**用途**：定义 deer-flow runtime 生成的 world patch proposal 的存储格式与命名规则。

---

## 核心原则

1. **只存建议，不直接应用**：`proposals/` 目录只存放 deer-flow 返回的 patch proposal 文件，Kernel 不会自动读取并应用它们。
2. **治理层审批**：所有 proposal 必须经过 DragonCore / taichu 治理层审批后，才能由 Kernel 执行。
3. **不可变历史**：一旦生成的 proposal 文件不应被修改，审批结果通过 bridge event 记录，而非回写 proposal 文件。

---

## 文件命名规则

```
proposals/patch-<proposal_id>.json
```

### `proposal_id` 格式建议

```
patch-<YYYYMMDD>-<NNN>
```

例如：
- `patch-20250329-001.json`
- `patch-20250329-002.json`

---

## 文件格式

每个 proposal 文件必须是一个合法的 JSON 对象，包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `proposal_id` | string | 是 | 唯一标识符，与文件名一致 |
| `kind` | string | 是 | 补丁类型，见下方枚举 |
| `summary` | string | 是 | 人类可读的补丁摘要 |
| `manifest_stub` | object | 是 | 补丁的具体内容存根 |
| `required_governance` | bool | 是 | 是否需要治理层审批 |
| `reasoning` | string | 否 | deer-flow 提出该补丁的理由 |
| `proposed_at` | string | 否 | ISO 8601 时间戳 |
| `proposed_by` | string | 否 | 提出该补丁的 agent ID |

### `kind` 枚举（Phase 2 冻结）

- `create_room` — 创建新房间
- `create_agent` — 创建新 Agent
- `create_object` — 创建新 Object
- `object_state_change` — 改变 Object 状态
- `agent_memory_update` — 更新 Agent Notebook（通过 proposal 形式）
- `governance_proposal` — 发起需要表决的治理提案

---

## 示例

### create_room

```json
{
  "proposal_id": "patch-20250329-001",
  "kind": "create_room",
  "summary": "在 core_room 南方新增高級培育房",
  "manifest_stub": {
    "room_id": "advanced_nursery",
    "parent_room": "core_room",
    "direction": "south",
    "name": "高級培育房",
    "description": "配備強化胚胎池的進階培育設施。"
  },
  "required_governance": true,
  "reasoning": "使用者主動要求擴展基礎設施。",
  "proposed_at": "2025-03-29T08:00:00Z",
  "proposed_by": "huaxia_zhenlongce"
}
```

### object_state_change

```json
{
  "proposal_id": "patch-20250329-003",
  "kind": "object_state_change",
  "summary": "將母體腦狀態從 stable 改為 syncing",
  "manifest_stub": {
    "object_id": "matrix_brain",
    "field": "status",
    "new_value": "syncing"
  },
  "required_governance": false,
  "reasoning": "系統正在進行例行同步。",
  "proposed_at": "2025-03-29T08:15:00Z",
  "proposed_by": "tiangong_supervisor"
}
```

---

## 审批流程

1. deer-flow 返回 `patch_proposals`
2. Kernel 将每个 proposal 序列化为 `proposals/patch-<id>.json`
3. 治理层（DragonCore / taichu）读取并审批
4. 审批通过后，Kernel 执行变更，并记录 `world_patch_approved` bridge event
5. 审批拒绝后，记录 `world_patch_rejected` bridge event，proposal 文件保留作为历史记录

---

## 禁止事项

- [ ] **禁止** Kernel 自动 apply 任何 proposal
- [ ] **禁止** runtime 直接修改此目录外的任何文件
- [ ] **禁止** 在 proposal 文件中嵌入可执行代码或脚本
- [ ] **禁止** 修改已生成的 proposal 文件（审批结果应记录在 event ledger 中）
