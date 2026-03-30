# Dragon-system (原 Dragon-world)

> **定位升級**：本倉庫已從單一的「世界內核」擴展為 **AI-first system control plane**（Dragon-system）。
> 原有 Dragon-world 的確定性內核（Layer 0）繼續作為整個系統的基石，上層逐步接入語音 runtime、agent harness、治理控制平面與體驗殼層。

## 核心組成

Dragon-system 由四個已驗證方向組成：

1. **Dragon-world** = deterministic kernel（確定性內核，Layer 0）
2. **TryVoice** = voice runtime shell（語音交互殼，Layer 2）
3. **DeerFlow** = agent harness / memory / skills / sandbox（智能體腦幹，Layer 1）
4. **Paperclip-inspired** = governance / scheduler / audit / agent registry（治理控制平面，Layer 3）

## 五層架構

```
Layer 4: Experience Shell        -> UI / 控制台 / 技能中心
Layer 3: Control Plane           -> 調度 / 預算 / 審計 / 註冊表
Layer 2: Action Plane            -> 語音 / 截圖 / OCR / 桌面自動化
Layer 1: Agent Harness           -> 推理 / 子 agent / 技能 / 記憶
Layer 0: Deterministic Kernel    -> 狀態 / 命令 / 事件 / 快照
```

詳見 `docs/01_system_architecture.md`。

## 開發協議（Anti-amnesia Protocol）

為了避免大型系統開發中常見的「上下文遺忘」問題，本倉庫強制執行工程記憶外部化協議：

### 每次開工前
```bash
python scripts/bootstrap_context.py
```
然後必讀：
1. `runtime/system_state.yaml`
2. `docs/01_system_architecture.md`
3. `runtime/task_graph.yaml`
4. `handoff/latest_boot_packet.md`

### 每次收工後
```bash
python scripts/update_state.py
python scripts/generate_handoff.py
```

詳見 `docs/dragon_system_boot_protocol.md`。

## 目錄結構

```text
.
├── Cargo.toml
├── README.md
├── apps/
│   ├── cli/              # Layer 0 最小 CLI 演示
│   └── server/           # Layer 3 API 服務
├── bridges/
│   ├── deerflow/         # DeerFlow 接入合約
│   └── paperclip/        # Paperclip 治理模式參考
├── crates/
│   ├── world-core/       # Layer 0 核心
│   ├── world-loader/     # Layer 0 加載器
│   ├── command-parser/   # Layer 0 命令解析
│   ├── event-store/      # Layer 0 事件存儲
│   └── snapshot/         # Layer 0 快照
├── packages/             # 跨層 SDK（待擴展）
├── ui/                   # Layer 4 前端（待擴展）
├── world/                # Layer 0 seed 數據
├── docs/                 # 架構文檔 + ADR
├── runtime/              # 工程狀態文件
├── handoff/              # 會話交接包
├── specs/                # JSON Schema
└── scripts/              # 上下文維護腳本
```

## 原有 Dragon-world Phase 1 能力（保留）

- Rust stable Cargo workspace（多 crate）
- 領域模型：`Room` / `Agent` / `Object` / `WorldEvent` / `WorldState`
- 世界加載器與校驗
- 命令解析（`/look` `/go` `/talk` `/inspect` `/status` `/help`）
- 動作執行器 + 事件寫入
- 快照保存/加載
- 單元測試

運行方式不變：
```bash
cargo run -p dragon-world-cli
cargo test
```

## 設計原則

- **Kernel 純潔性**：內核不直接調用 LLM
- **單一 Provider**：v1 只支持 Kimi，所有 LLM 調用走 `packages/provider-sdk`
- **邊界優先於功能**：先確保模塊邊界清晰
- **工程記憶外部化**：所有重要決策必須落盤到 ADR / spec / state file

## 下一階段計劃

見 `runtime/system_state.yaml` 與 `runtime/task_graph.yaml`。

當前優先目標（P0-M1）：建立 monorepo 骨架與上下文持久化協議。
