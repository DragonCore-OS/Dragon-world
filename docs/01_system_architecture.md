# Dragon-system 系統架構

> 版本：0.1.0  
> 更新日期：2026-03-31

## 五層架構

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Experience Shell                                    │
│ 主控制台 / 對話面板 / 任務面板 / 技能中心 / 日誌與回放 / 配置中心   │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Control Plane                                       │
│ scheduler / heartbeat / budgets / quotas / agent registry    │
│ audit log / task queue / approvals / session monitor         │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Action Plane                                        │
│ 語音輸入 / TTS / wakeword / PTT / screen capture             │
│ OCR / UI parsing / browser automation / desktop automation   │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Agent Harness                                       │
│ lead agent / subagents / sandbox / skills / memory           │
│ MCP/tool bridge / artifact output / thread isolation         │
├─────────────────────────────────────────────────────────────┤
│ Layer 0: Deterministic Kernel                                │
│ system state / command schema / event ledger / snapshots     │
│ resource registry / task state machine / executor contracts  │
└─────────────────────────────────────────────────────────────┘
```

## 各層職責與來源

### Layer 0: Deterministic Kernel
- **來源**：Dragon-world（現有 Rust workspace）
- **職責**：狀態機、事件賬本、快照、指令解析、確定性執行器
- **約束**：不直接調用 LLM，不引入非確定性邏輯

### Layer 1: Agent Harness
- **來源**：DeerFlow
- **職責**：推理、任務分解、技能裝配、記憶注入、子 agent 編排
- **約束**：不直接操作桌面，只輸出 action plan 到 Action Plane

### Layer 2: Action Plane
- **來源**：TryVoice + 自研桌面/瀏覽器自動化適配器
- **職責**：真實操作執行、感知反饋、驗證循環
- **約束**：每個 action 必須有 precondition / postcondition / failure_reason

### Layer 3: Control Plane
- **來源**：Paperclip 設計思想（選擇性吸收）
- **職責**：治理、排程、觀測、權限與成本控制
- **約束**：不參與具體推理，只管理元數據與生命周期

### Layer 4: Experience Shell
- **來源**：自研（參考 Mother UI 概念）
- **職責**：用戶交互界面、可視化、配置管理
- **約束**：只調用 Control Plane 與 Agent Harness 的公開 API，不繞過治理層

## 數據流向

```
Voice/Shell Input
        ↓
  Experience Shell
        ↓
   Control Plane (權限/預算/排程檢查)
        ↓
   Agent Harness (推理 -> action plan)
        ↓
   Action Plane (執行 + 驗證)
        ↓
   Deterministic Kernel (狀態更新 + 事件記錄)
        ↓
   反饋沿原路返回
```

## 目錄對應

```text
dragon-system/
├── apps/
│   ├── cli/              # Layer 0 入口 + 最小演示
│   ├── server/           # Layer 3 API + Layer 4 BFF
│   ├── voice-runtime/    # Layer 2 語音部分（基於 TryVoice）
│   └── harness-gateway/  # Layer 1 Gateway（基於 DeerFlow）
├── bridges/
│   ├── deerflow/         # DeerFlow 接入合約
│   └── paperclip/        # Paperclip 治理模式參考
├── crates/
│   ├── world-core/       # Layer 0 核心
│   ├── world-loader/     # Layer 0 加載器
│   ├── command-parser/   # Layer 0 命令解析
│   ├── event-store/      # Layer 0 事件存儲
│   └── snapshot/         # Layer 0 快照
├── packages/
│   ├── provider-sdk/     # Kimi provider abstraction（待建）
│   ├── skill-sdk/        # 技能開發 SDK（待建）
│   └── event-sdk/        # 事件發布 SDK（待建）
├── ui/                   # Layer 4 前端（待擴展）
├── world/                # Layer 0 seed 數據
├── docs/                 # 架構文檔 + ADR
├── runtime/              # 工程狀態文件
├── handoff/              # 會話交接包
├── specs/                # JSON Schema
└── scripts/              # 上下文維護腳本
```
