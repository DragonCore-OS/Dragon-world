# Dragon-system Boot Protocol

> 版本：0.1.0  
> 更新日期：2026-03-31

## 核心原則

**大型智能體系統最先死的，通常不是能力不夠，而是工程記憶斷裂。**

本協議強制將「開發上下文」外部化到 repo 中，確保任何開發者（包括 Kimi CLI）在任意 session 都能快速恢復狀態。

---

## Session 啟動流程

每次開始新的開發 session（包括 Kimi CLI 新對話），必須按順序執行：

### Step 1: 運行啟動腳本
```bash
python scripts/bootstrap_context.py
```
此腳本會讀取核心狀態文件並輸出「本 session 啟動摘要」。

### Step 2: 必讀四個文件
按順序閱讀：
1. `runtime/system_state.yaml`
2. `docs/01_system_architecture.md`
3. `runtime/task_graph.yaml`
4. `handoff/latest_boot_packet.md`

**不讀不開工。**

### Step 3: 確認當前目標
根據 `runtime/system_state.yaml` 中的 `current_goal`，明確本次 session 的具體任務。

### Step 4: 檢查阻塞項
查看 `runtime/system_state.yaml` 中的 `blocked_by`，確認是否有前置依賴需要解決。

---

## Session 結束流程

每次結束開發 session 前，必須按順序執行：

### Step 1: 更新狀態文件
```bash
python scripts/update_state.py
```
此腳本會引導更新 `runtime/system_state.yaml` 和 `runtime/task_graph.yaml`。

### Step 2: 生成交接包
```bash
python scripts/generate_handoff.py
```
此腳本會根據當前狀態生成 `handoff/latest_boot_packet.md`。

### Step 3: 檢查 ADR
確認本次 session 中做出的所有架構決策都已寫入 `docs/adr/`。

### Step 4: 提交到 Git
```bash
git add runtime/ handoff/ docs/adr/ specs/ scripts/
git commit -m "docs: update engineering state and handoff packet"
```

---

## Handoff 規範

`handoff/latest_boot_packet.md` 必須包含以下章節：

1. **Session 時間戳**：開始與結束時間
2. **本次完成的事項**：條列式，不超過 10 條
3. **當前系統狀態摘要**：引用 `runtime/system_state.yaml` 的關鍵字段
4. **下一個優先任務**：明確的下一步
5. **已知風險與阻塞**：技術債、未解決的問題
6. **需要特別注意的文件**：本次修改過的關鍵文件路徑

---

## State File 更新規範

### `runtime/system_state.yaml`
- 必須是機器可讀的 YAML
- 禁止寫成散文
- 每次更新必須修改 `last_updated` 字段
- `phases` 狀態只能是 `pending` | `in_progress` | `done` | `blocked`

### `runtime/task_graph.yaml`
- 使用樹狀結構表示任務依賴
- 每個任務必須有 `id`, `title`, `status`, `owner`
- `status` 只能是 `pending` | `in_progress` | `done` | `blocked`

---

## ADR 寫法

- 文件名：`ADR-XXXX-short-title.md`
- 必須包含：狀態、背景、決策、後果（正面+負面）、相關文件
- 狀態只能是：`Proposed` | `Accepted` | `Deprecated` | `Superseded`

---

## Task Graph 維護規範

- 新任務必須分配唯一 ID（格式：`P{phase}-M{module}-T{task}`）
- 任務完成後必須更新 `status` 和 `completed_at`
- 阻塞中的任務必須填寫 `blocked_by` 字段
- 每週至少進行一次 task graph 清理（歸檔已完成任務到 `runtime/task_graph_archive/`）

---

## Kimi CLI 特別指令

當用戶要求 Kimi CLI 開始 Dragon-system 的開發工作時，Kimi CLI 必須：

1. 先執行 `python scripts/bootstrap_context.py`
2. 讀取四個必讀文件
3. 向用戶簡要匯報當前系統狀態和目標
4. 徵得用戶確認後再開始寫代碼

當 session 結束時，Kimi CLI 必須：

1. 主動提醒用戶運行 `python scripts/update_state.py` 和 `python scripts/generate_handoff.py`
2. 確認 ADR 和 Git 提交狀態
