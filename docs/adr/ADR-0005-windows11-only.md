# ADR-0005: v1 Platform Scope = Windows 11 Only

## 狀態
Accepted

## 背景
早期討論中曾將 v1 目標平台設為 macOS，原因是參考視頻截圖顯示為 macOS 桌面環境。但實際開發與測試設備為 Windows 11 筆記本。選擇一個沒有實機的平台作為 v1 主戰場，會嚴重阻塞迭代速度與驗證閉環。

## 決策
- **v1 目標平台正式鎖定為 Windows 11 only**
- **瀏覽器目標鎖定為 Chromium 系（Chrome / Edge）**
- **桌面自動化主路徑採用 Windows UI Automation (UIA)**
- **macOS / Linux 支持明確推遲到 v2 之後**
- 所有 Phase 1 的演示鏈、測試、文檔均以 Windows 11 為準

## 後果

### 正面
- 開發者可在真機上實時調試與驗證
- 避免跨平台抽象過早引入的複雜度
- Action Plane 選型更聚焦（Playwright + UIA）

### 負面
- 未來遷移 macOS 時需要重寫 Action Plane 適配器
- 無法直接複製參考視頻中的 macOS 特定 UI 流程

## 相關文件
- `docs/05_action_plane_selection.md`
- `docs/06_phase1_execution_plan.md`
- `runtime/open_questions.md`
