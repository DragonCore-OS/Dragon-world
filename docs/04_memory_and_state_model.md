# Dragon-system 記憶與狀態模型

> 版本：0.1.0  
> 更新日期：2026-03-31

## 三層記憶

### 1. 工程記憶（Engineering Memory）
**目的**：防止開發過程中的上下文遺忘。

| 載體 | 格式 | 更新頻率 | 責任人 |
|------|------|---------|--------|
| `runtime/system_state.yaml` | YAML | 每次 session 結束 | 開發者 / Kimi CLI |
| `runtime/task_graph.yaml` | YAML | 每次任務狀態變更 | 開發者 / Kimi CLI |
| `handoff/latest_boot_packet.md` | Markdown | 每次 session 結束 | `scripts/generate_handoff.py` |
| `docs/adr/*.md` | Markdown | 每次架構決策 | 開發者 |

**原則**：
- 機器可讀優先（YAML/JSON）
- 人類可讀輔助（Markdown 摘要）
- 任何決策不落盤 = 未發生

### 2. 系統記憶（System Memory）
**目的**：Dragon-system 運行時的長期記憶。

| 層級 | 載體 | 來源 |
|------|------|------|
| 短期記憶 | Session thread / conversation buffer | Agent Harness |
| 工作記憶 | Sandbox workspace / artifact files | Agent Harness |
| 長期記憶 | Vector store + structured event ledger | Agent Harness + Event Store |
| 世界狀態 | `WorldState` + snapshots | Deterministic Kernel |

**原則**：
- Kernel 只記錄確定性狀態（房間、物品、agent 位置）
- Harness 負責語義記憶（embedding、檢索、摘要）
- Action Plane 負責感知記憶（截圖、OCR、UI 元素）

### 3. 用戶記憶（User Memory）
**目的**：個性化、偏好、歷史交互。

- 用戶偏好表（結構化 JSON）
- 用戶行為模式（從 event ledger 中提取）
- 用戶自定義技能與操作流

## 狀態一致性模型

### Kernel 狀態（強一致性）
- 單線程執行
- 命令 -> 事件 -> 狀態更新，原子性保證
- 快照為不可變（immutable）

### Harness 狀態（最終一致性）
- 異步推理
- action plan 可能失敗，需要 retry / fallback
- 通過 `correlation_id` 與 Kernel 事件對齊

### Control Plane 狀態（最終一致性）
- 調度隊列、預算計數、agent 註冊表
- 允許短暫不一致，但必須有 audit trail

## 狀態同步機制

```
Agent Harness 生成 action plan
        ↓
Action Plane 執行並產生 observation
        ↓
Kernel 更新 WorldState 並生成 WorldEvent
        ↓
Event Store 持久化
        ↓
Control Plane 讀取 event 更新調度狀態
        ↓
Harness 在下一輪推理中讀取 observation + event
```

## 持久化策略

| 數據 | 存儲 | 備註 |
|------|------|------|
| WorldState | 內存 + 快照文件 | 定期寫入 `snapshots/` |
| Event Ledger | JSON Lines / SQLite | append-only |
| Session Thread | 臨時文件 / 數據庫 | 可配置 TTL |
| Vector Memory | 本地向量庫（待選型） | 可選遠程 |
| User Preferences | JSON / SQLite | 輕量 |
| Engineering State | Git 倉庫 | 與代碼一起版本控制 |
