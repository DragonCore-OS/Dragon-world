# DragonWorld Phase 1 Architecture

## 核心边界

`dragon-world` 是世界内核仓库，目标是提供确定性的状态机闭环：

- seed world -> `WorldState`
- command -> action execution
- action -> event ledger
- state -> snapshot save/load

这保证了 Phase 1 可以在不依赖外部系统的情况下稳定回归测试。

## 为什么 dragon-world 是世界内核 repo

- 世界内核关注**状态与行为确定性**，是后续所有上层能力的执行地基。
- 将核心执行逻辑独立出来，可保证测试可控、版本演进清晰。
- 降低治理、模型、前端变更对底层可预测性的影响。

## 为什么不把治理塞进这个 repo

- 治理规则是策略层（policy layer），变更频率和复杂度都高于世界状态机。
- 若将治理逻辑与内核耦合，会导致内核难以做稳定回归。
- Phase 1 目标是最小闭环，不引入策略编排复杂度。

## 为什么 DragonCore 继续做治理

- DragonCore 已承担治理工作流、提案审批、规则执行边界。
- 将治理持续放在 DragonCore 可以保持职责单一：
  - DragonCore：governance orchestration
  - dragon-world：deterministic world kernel

## 为什么 deer-flow 未来做 agent runtime bridge

- deer-flow 适合承接模型 runtime 与 agent runtime。
- world kernel 只暴露稳定、可测试的状态操作接口。
- 通过 bridge 连接可避免模型调用污染内核纯度。

## 为什么 taichu 继续做 persona / constitution

- persona、constitution 属于长期身份与规范层。
- 这些内容并非内核状态机必须条件，应该继续在 taichu 演进。
- world kernel 仅消费其结果（如身份/规则映射），不在此重写。

## 为什么 Phase 1 不接前端和 LLM

- 前端与 LLM 都引入高不确定性和额外故障面。
- Phase 1 验收标准是 `cargo test` 与 CLI 可运行。
- 先完成可复现的 engine，再逐层扩展体验与智能能力。

## 模块拆分

- `crates/world-core`: 领域模型、动作执行器、事件类型。
- `crates/world-loader`: YAML seed world 加载与一致性校验。
- `crates/command-parser`: 命令解析。
- `crates/event-store`: 事件账本抽象（append-only）。
- `crates/snapshot`: `WorldState` 快照读写。
- `apps/cli`: 端到端最小可运行演示。

## 数据流

1. CLI 启动 -> `world-loader` 读取 `world/seeds/world.yaml`。
2. 生成 `WorldState` 后由 `ActionExecutor` 写入 `world_initialized`。
3. 用户命令由 `command-parser` 解析。
4. `ActionExecutor` 执行动作并写入事件：
   - 成功移动：`room_entered`
   - 对话成功：`talk_attempted`
   - 检视成功：`inspect_attempted`
   - 失败命令：`command_rejected`
5. 退出时可保存快照。
