# dragon-world

DragonWorld Phase 1 世界内核仓库：提供**确定性、可测试、可运行**的最小闭环，不承担治理编排或模型 runtime 职责。

## 项目定位

- 本仓库只实现世界内核（world kernel）：状态、命令、事件、快照、seed loader。
- 治理流程与宪制规则继续由 DragonCore / taichu 维护。
- deer-flow 在后续阶段作为 agent runtime bridge 接入。

## Phase 1 范围

已实现：

- Rust stable Cargo workspace（多 crate）
- 领域模型：`Room` / `Agent` / `Object` / `WorldEvent` / `WorldState`
- 世界加载器与校验（唯一 ID、出口有效性、所属房间有效性）
- 命令解析（`/look` `/go` `/north` `/south` `/east` `/west` `/talk` `/inspect` `/status` `/help`）
- 动作执行器 + 事件写入
- 快照保存/加载
- 最小 CLI demo
- 单元测试

## 目录结构

```text
.
├── Cargo.toml
├── README.md
├── docs/
│   └── ARCHITECTURE.md
├── apps/
│   └── cli/
├── crates/
│   ├── world-core/
│   ├── world-loader/
│   ├── command-parser/
│   ├── event-store/
│   └── snapshot/
├── world/
│   ├── rooms/
│   ├── agents/
│   ├── objects/
│   └── seeds/
└── tests/
```

## 如何运行

```bash
cargo run -p dragon-world-cli
```

CLI 启动后自动加载 `world/` seed 数据，输入命令进行交互；输入 `exit` 或 `quit` 退出。

## 如何测试

```bash
cargo test
```

## 已实现命令

- `/look`
- `/go <direction>`
- `/north` `/south` `/east` `/west`
- `/talk <agent>`（deterministic stub）
- `/inspect <object>`（deterministic stub）
- `/status`
- `/help`

## 已知限制

- `/talk` 与 `/inspect` 仅为规则化 stub，不调用任何模型。
- 事件存储当前为内存账本，不含持久化 ledger 服务。
- 单玩家、单进程执行，不涉及并发同步与网络通信。
- 未实现治理审批、补丁 forge、前端 UI。

## 下一阶段计划（Phase 2 建议）

1. deer-flow runtime bridge 接入（仍保持 world kernel 与 runtime 解耦）。
2. 可选的 ledger 文件持久化（JSON Lines）。
3. 更细粒度的命令权限与房间策略。
4. 多会话世界实例管理。
