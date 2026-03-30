# Dragon-system Windows Execution Runner

> 版本：0.1.0  
> 更新日期：2026-03-31  
> 適用節點：Windows 11 Execution Node

## 定位

Windows Execution Runner 是 Dragon-system 在 Windows 11 筆電上的**最小執行器**。

它不是第二個「主腦」，也不維護獨立的 repo 語義。它的唯一職責是：

1. 接收來自 Linux Authoring Node 的結構化 action plan
2. 在 Windows 11 真機上實際執行（Playwright / pywinauto）
3. 收集執行結果、截圖、日誌、UI tree snapshot
4. 按照 `specs/execution_result_schema.json` 回傳結果
5. 將 artifacts 寫入 repo 規範路徑，並 push 回 GitHub

## 輸入格式

Windows Runner 接收一個符合 `specs/action_schema.json` 的 action plan 文件，通常位於：

```
runs/inbox/run_{timestamp}.json
```

示例：

```json
{
  "session_id": "P1-DEMO-A-001",
  "target_os": "windows11",
  "actions": [
    {
      "action_id": "a1",
      "type": "browser",
      "payload": {
        "kind": "launch",
        "browser": "edge",
        "url": "https://www.bing.com"
      }
    },
    {
      "action_id": "a2",
      "type": "browser",
      "payload": {
        "kind": "fill",
        "selector": "textarea[name='q']",
        "text": "人工智慧"
      }
    },
    {
      "action_id": "a3",
      "type": "browser",
      "payload": {
        "kind": "submit"
      }
    }
  ],
  "postcondition": {
    "assertions": [
      { "kind": "url_is", "target": "url", "value": "人工智慧" }
    ]
  }
}
```

## 輸出格式

Windows Runner 必須輸出符合 `specs/execution_result_schema.json` 的結果文件：

```
runs/outbox/run_{run_id}/result.json
runs/outbox/run_{run_id}/screenshots/
runs/outbox/run_{run_id}/logs/
```

示例 `result.json`：

```json
{
  "run_id": "win-run-001",
  "platform": "windows11",
  "status": "success",
  "started_at": "2026-03-31T12:00:00Z",
  "ended_at": "2026-03-31T12:00:08Z",
  "steps": [
    {
      "action_id": "a1",
      "status": "success",
      "observation": "Edge launched and navigated to https://www.bing.com"
    },
    {
      "action_id": "a2",
      "status": "success",
      "observation": "Typed '人工智慧' into search box"
    },
    {
      "action_id": "a3",
      "status": "success",
      "observation": "Submitted search query"
    }
  ],
  "postcondition_result": {
    "passed": true,
    "details": "URL contains '人工智慧'"
  },
  "artifacts": [
    "runs/outbox/run_win-run-001/screenshots/step_a1.png",
    "runs/outbox/run_win-run-001/screenshots/step_a3.png",
    "runs/outbox/run_win-run-001/logs/pywinauto.log",
    "runs/outbox/run_win-run-001/result.json"
  ],
  "error": null
}
```

## Artifact 規範

| Artifact | 路徑模板 | 說明 |
|----------|---------|------|
| result JSON | `runs/outbox/{run_id}/result.json` | 必須 |
| step screenshots | `runs/outbox/{run_id}/screenshots/step_{action_id}.png` | 每步建議一張 |
| failure screenshot | `runs/outbox/{run_id}/screenshots/failure.png` | 失敗時必須 |
| execution log | `runs/outbox/{run_id}/logs/runner.log` | 建議 |
| UI tree dump | `runs/outbox/{run_id}/logs/ui_tree_{action_id}.txt` | 可選 |

## 執行器職責邊界

### 執行器必須做的
- 解析 action plan
- 調用 Playwright 或 pywinauto
- 檢查 precondition / postcondition
- 截圖與記錄日誌
- 輸出標準化 result JSON
- 將 artifacts commit & push 回 GitHub

### 執行器禁止做的
- 直接調用 LLM 做推理
- 修改 Linux Authoring Node 的源代碼
- 維護獨立的 docs / runtime / handoff 狀態
- 繞過 GitHub 與 Linux 節點私下同步

## 最小運作流程

```
Linux Authoring Node
  ↓ 生成 action plan
  ↓ git push
GitHub
  ↓
Windows Execution Node (git pull)
  ↓ 讀取 runs/inbox/*.json
  ↓ 執行 Playwright / pywinauto
  ↓ 生成 runs/outbox/run_*/result.json + screenshots
  ↓ git add runs/outbox/run_*
  ↓ git commit -m "test(win): execution result for P1-DEMO-A-001"
  ↓ git push
GitHub
  ↓
Linux Authoring Node (git pull)
  ↓ 讀取 result.json
  ↓ 分析成功/失敗，調整 action compiler / adapter
```

## 推薦的 Windows 環境準備

```powershell
# 1. 安裝 Python 依賴
pip install playwright pywinauto Pillow

# 2. 安裝 Playwright 瀏覽器
playwright install chromium

# 3. 驗證最小腳本
python -c "from playwright.sync_api import sync_playwright; print('Playwright OK')"
python -c "import pywinauto; print('pywinauto OK')"
```

## 與 Linux Authoring Node 的協議

兩個節點之間只通過以下接口交互：

1. **Git repo 同步**（主要）
2. **action_schema.json**（輸入契約）
3. **execution_result_schema.json**（輸出契約）

不允許出現：
- 私有網盤傳文件
- 微信/QQ 傳截圖但不落盤
- Windows 本地改代碼但不 push

## 風險與緩解

| 風險 | 緩解 |
|------|------|
| Windows 筆電不在線，無法及時驗證 | Linux 端先用 mock / stub 跑通接口，等 Windows 節點上線後再補真機驗證 |
| Windows 執行結果 push 延遲 | 在 task_graph 中標記阻塞，不強行推進依賴真機結果的任務 |
| 雙機 Git 衝突 | Windows 節點只改 `runs/outbox/*`，不改 `src/`、`docs/`、`runtime/` |
