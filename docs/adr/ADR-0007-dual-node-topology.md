# ADR-0007: Dual-Node Development Topology

## 狀態
Accepted

## 背景
Dragon-system 的 v1 目標平台是 Windows 11（ADR-0005），但主開發環境（Kimi CLI、GitHub 同步中樞、文檔與狀態維護）運行在 Linux 伺服器上。這帶來一個拓撲問題：如果強求所有開發都在 Windows 上進行，會失去 Linux 端的穩定控制中樞；如果完全忽視 Windows，又無法驗證 Playwright / pywinauto / UIA 的真機行為。

## 決策
採用 **雙節點開發模型（Dual-Node Development Topology）**：

- **Node A: Linux Authoring Node**
  - 職責：Kimi CLI 主運行、repo 主工作樹、docs/runtime/handoff/ADR 維護、provider-sdk、action compiler、schema 定義、verifier contract、mock tests、boot integrity
  - 不直接執行 Windows 桌面操作

- **Node B: Windows Execution Node**
  - 職責：Playwright 真機瀏覽器驗證、pywinauto / UIA 真機桌面驗證、微信/記事本/Edge 實際跑動、screenshot / fallback OCR 驗證、回傳 execution logs / artifacts / traces
  - 不做「主腦」，只做「執行器」

- **GitHub: Single Source of Truth**
  - 兩個節點都 clone 同一個 repo、同一個 branch
  - 所有變更必須 commit / push 回 GitHub 才能被另一個節點消費
  - Windows execution 產生的 logs、screenshots、result JSON 必須寫入 repo 規範路徑後再 push

## 執行規則

1. **Linux 產生動作意圖**：輸出結構化 action plan（符合 `specs/action_schema.json`）
2. **Windows 執行動作**：接收 plan，實際調用 Playwright / pywinauto，回傳 `specs/execution_result_schema.json`
3. **所有 Windows-specific action plane 驗證必須在 Windows execution node 完成**
4. **禁止在 Windows 建立第二套脫節的主工作樹**
5. **禁止把 Kimi CLI 主開發環境遷移到 Windows（除非必要）**

## 後果

### 正面
- Linux 端保持穩定的代碼生成與狀態管理能力
- Windows 端專注於真機驗證，職責單一
- 通過 GitHub 同步，避免雙機失聯

### 負面
- 雙機之間存在延遲（需要 push/pull 或文件 handoff）
- Windows execution node 必須有人工或自動化觸發機制

## 相關文件
- `docs/06_phase1_execution_plan.md`
- `docs/07_windows_execution_runner.md`
- `specs/execution_result_schema.json`
