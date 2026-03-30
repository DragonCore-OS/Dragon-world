# Open Questions

> 更新日期：2026-03-31

## 當前未決問題

1. **桌面自動化適配器選型**
   - 選項 A: `pyautogui` + `Pillow`（簡單、跨平台、不穩定）
   - 選項 B: `playwright`（僅瀏覽器）
   - 選項 C: `Appium` / `WinAppDriver`（Windows 原生）
   - 選項 D: 自研基於 OS API 的適配器（長期正確、短期成本高）
   - **影響**：阻塞 Phase 1 的桌面操作流

2. **OCR 後端選型**
   - 選項 A: `paddleocr`（中文強、重）
   - 選項 B: `easyocr`（中等）
   - 選項 C: 調用 Kimi 多模態 API（簡單、有成本、有延遲）
   - 選項 D: `tesseract`（輕量、中文弱）
   - **影響**：阻塞 Phase 2 的 verification loop

## 已解決問題（歸檔區）

_暫無_
