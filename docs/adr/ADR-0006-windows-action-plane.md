# ADR-0006: Windows Action Plane = UIA-First, OCR Fallback Only

## 狀態
Accepted

## 背景
Action Plane 需要與 Windows 桌面應用交互。常見思路是「截圖 + OCR + 座標點擊」，但這條路在 Windows 上極不穩定：分辨率變化、DPI 縮放、窗口遮擋、主題變更都會導致失效。Windows 本身提供了結構化的 UI Automation (UIA) API，應優先使用。

## 決策
1. **Action Plane 在 Windows 上的主路徑是結構化控件操作，不是 OCR/座標**：
   - Browser: Playwright（DOM 優先）
   - Desktop: Windows UI Automation (UIA) / `pywinauto` (UIA backend)
   - System: 少量 `pyautogui` 僅用於全局快捷鍵或截圖
2. **OCR 明確降級為 fallback**：
   - 僅在 UIA / DOM 無法定位目標時啟用
   - 用於驗證輔助（如確認某段文字確實出現在屏幕上）
3. **純座標點擊作為最後兜底**，且必須標記為 `fragile` 並附帶截圖驗證
4. **每個 action 必須包含 precondition / postcondition / failure_strategy**

## 後果

### 正面
- 穩定性顯著高於 OCR-first 方案
- 可驗證、可調試、可維護
- 與 Windows 無障礙生態對齊

### 負面
- 部分老舊 Win32 應用對 UIA 支持不佳，需要個別適配
- 需要學習 UIA tree 結構與 `pywinauto` API

## 相關文件
- `docs/05_action_plane_selection.md`
- `specs/action_schema.json`
- `runtime/open_questions.md`
