# Phase 2：DragonWorld ↔ DeerFlow Bridge 接口冻结清单

**版本**：v1.0-freeze  
**日期**：2025-03-29  
**状态**：已冻结，进入执行阶段  

---

## 一、Phase 2 总目标

把 DragonWorld 和 DeerFlow 的关系固定成：

- **DragonWorld** = deterministic kernel（确定性世界内核）
- **DeerFlow** = agent runtime / model runtime（外部推理引擎）

**不允许 DeerFlow 直接改 `WorldState`。**
它只能：
1. 读取世界上下文
2. 产生对话回复
3. 提交“候选世界变更提案”（patch proposal）

最终是否改世界，仍由 DragonWorld Kernel + 治理层决定。

---

## 二、四条核心边界（已冻结）

### 边界 1：内核真相边界
世界真相只能来自 DragonWorld：
- `WorldState`
- `WorldEvent`
- `Room` / `Agent` / `Object`
- `current_room`
- `ledger_offset`
- `version`

**禁止 DeerFlow 自己维护另一份“世界真相”。**

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

## 三、Bridge 三段式数据流

```
┌─────────────────┐     Read Context      ┌─────────────────┐
│  DragonWorld    │ ─────────────────────>│    DeerFlow     │
│     Kernel      │                       │    Runtime      │
│                 │<──────────────────────│                 │
└─────────────────┘    Runtime Response    └─────────────────┘
         │
         │ Kernel Decision
         ▼
   ┌─────────────┐
   │  显示文本    │
   │ 记 bridge 事件│
   │ 如有 patch， │
   │ 交治理层审批 │
   └─────────────┘
```

---

## 四、契约文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| Bridge 接口契约 | `bridges/deerflow/CONTRACT.md` | Request/Response 格式、字段说明、权限矩阵 |
| Patch Proposal 规范 | `proposals/README.md` | proposal 文件命名、格式、审批流程 |
| 协议示例 | `protocol_examples/` | 6 个完整 JSON 示例 |

---

## 五、交互模式（已冻结为 3 种）

### mode 1: `agent_dialogue`
与房间内 Agent 对话。
- 示例：`/talk 華夏真龍策` → `/say 幫我整理最近三次改動`
- 输出：`reply.text`
- 可选：`memory_updates`
- **不应输出 `patch_proposals`**，除非明确进入 forge 类请求

### mode 2: `world_query`
查询世界，不修改世界。
- 示例：“目前房间有哪些可见 agent？”
- **规则**：能由 kernel 直接回答的查询，优先不调 runtime。
- 输出：`reply.text` 或 `query_result`

### mode 3: `forge_request`
只有在明确请求建造 / 生成时才允许。
- 示例：“新增一个培育房”、“创造一个审计型 agent”
- 输出：`patch_proposals`
- **禁止**：直接改世界

---

## 六、权限矩阵

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

## 七、Bridge MVP 目标

Phase 2 最小可交付版本只做三件事：

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

## 八、Phase 2 禁止事项

在接口冻结期间，以下事项一律不做：

- [ ] runtime 直接改 YAML
- [ ] auto-approve patch
- [ ] 多 agent 同时写世界
- [ ] 把 DeerFlow state 当作世界 state
- [ ] 自然语言直接映射为内核命令
- [ ] 把治理层塞进 `dragon-world` crate

---

## 九、下一步施工方向

### Kimi（本 agent）
- [ ] 细化 deer-flow bridge 的 Rust 数据结构定义（`crates/bridge-core` 或类似）
- [ ] 补全 CLI transcript 与 demo 资料
- [ ] 编写 bridge event 的序列化/反序列化逻辑

### Stitch
- [ ] 主界面 layout 草图
- [ ] 母体脑区块、房间信息区、agent 对话区
- [ ] 右侧状态栏、event timeline 面板
- **约束**：只做 UI 草图 / Web 界面探索，不碰世界真相

### DragonCore / taichu
- [ ] 审批 patch proposal 的治理规则
- [ ] Veto / Archive / Rollback 机制

---

## 十、变更日志

- **v1.0-freeze** (2025-03-29): 接口冻结清单落成，与 Phase 1 Recovery 内核对齐
