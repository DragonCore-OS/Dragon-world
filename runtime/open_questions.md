# Open Questions

> 更新日期：2026-03-31

## 當前未決問題

_暫無阻塞性未決問題。選型已在 ADR-0005、ADR-0006 和 docs/05_action_plane_selection.md 中凍結。_

## 已解決問題（歸檔區）

### 1. 桌面自動化適配器選型 ✅
**決策日期**：2026-03-31  
**決策結果**：
- **v1 平台**：Windows 11 only
- **Browser**：Playwright (Python)
- **Desktop**：`pywinauto` with UIA backend
- **輔助**：`pyautogui` 僅用於全局快捷鍵/截圖
- **兜底**：純座標點擊（標記為 fragile）

**參考文件**：`docs/adr/ADR-0005-windows11-only.md`、`docs/adr/ADR-0006-windows-action-plane.md`、`docs/05_action_plane_selection.md`

### 2. OCR 後端選型 ✅
**決策日期**：2026-03-31  
**決策結果**：
- **OCR 不做主路徑**，只做 fallback
- **Fallback 首選**：Kimi 多模態 API（截圖 -> 文字描述/定位）
- **本地備用**：PaddleOCR（網絡不穩或成本敏感時啟用）

**參考文件**：`docs/adr/ADR-0006-windows-action-plane.md`、`docs/05_action_plane_selection.md`
