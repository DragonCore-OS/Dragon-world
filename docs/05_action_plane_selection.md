# Dragon-system Action Plane 選型分析（Windows 11）

> 版本：0.1.0  
> 更新日期：2026-03-31  
> 適用平台：Windows 11 only

## 核心原則

**結構化優先，視覺兜底。**

正確優先級：
1. **Browser DOM**（Playwright）
2. **Windows UI Automation (UIA)**（`pywinauto`）
3. **OCR / Screenshot**（fallback 驗證）
4. **純座標點擊**（最後兜底，標記為 fragile）

---

## 1. Browser Automation

### 選項比較

| 方案 | 優點 | 缺點 | 結論 |
|------|------|------|------|
| **Playwright** | 穩定、DOM 可讀、多語言支持、錄製工具 | 僅限瀏覽器 | **選定** |
| Selenium | 生態大 | 配置繁瑣、穩定性差 | 否決 |
| Puppeteer | JS 原生 | 僅 Node.js 生態 | 否決 |
| CDP Raw | 靈活 | 維護成本高 | 否決 |

### 鎖定決策
- **v1 Browser Target**: Microsoft Edge（Windows 11 預裝，Chromium 核心）
- **備用**: Google Chrome（若 Edge 被企業策略限制）
- **工具**: Playwright for Python
- **驗證方式**: DOM selector + URL assertion + 截圖輔助

---

## 2. Desktop Automation（Windows 11）

### 選項比較

| 方案 | 優點 | 缺點 | 結論 |
|------|------|------|------|
| **pywinauto (UIA)** | 原生 UIA 封裝、結構化控件、中文支持好 | 學習曲線、部分老應用支持差 | **選定主路徑** |
| `uiautomation` (第三方庫) | 更輕量、純 Python | 文檔較少、社區較小 | 備用 |
| `pyautogui` | 簡單、跨平台 | 純座標、極不穩定 | 僅用於全局快捷鍵/截圖 |
| WinAppDriver | 微軟官方、類 Selenium | 已停止維護、配置重 | 否決 |
| Appium + WinAppDriver | 標準化 | 過重、啟動慢 | 否決 |
| 自研 C++ COM | 性能最好 | 開發周期長 | v2 再考慮 |

### 鎖定決策
- **v1 Desktop Target**: Windows 11 only
- **主路徑**: `pywinauto` with UIA backend
- **輔助**: `pyautogui` 僅用於截圖和全局快捷鍵
- **兜底**: 純座標點擊（必須標記 `fragile`）

### pywinauto 能力覆蓋

| 能力 | 支持度 | 用途 |
|------|--------|------|
| 啟動應用 | ✅ | `Application().start()` |
| 連接已運行應用 | ✅ | `Application().connect()` |
| 窗口切換 | ✅ | `window.set_focus()` |
| 按鈕點擊 | ✅ | `button.click()` |
| 文本輸入 | ✅ | `edit.type_keys()` |
| 菜單導航 | ✅ | `menu_select()` |
| 讀取控件文本 | ✅ | `window_text()` |
| 滾動 / 列表 | ⚠️ | 部分應用需個別調適 |

---

## 3. OCR 策略

### 選項比較

| 方案 | 優點 | 缺點 | 結論 |
|------|------|------|------|
| **Kimi 多模態 API** | 無需本地安裝、理解力強 | 有成本、有延遲 | **fallback 首選** |
| PaddleOCR | 中文強、開源 | 包體大、依賴重 | 本地 fallback 備用 |
| EasyOCR | 中等 | 首次加載慢 | 否決 |
| Tesseract | 輕量 | 中文弱、準確率低 | 否決 |

### 鎖定決策
- **OCR 不做主路徑**
- **Fallback 首選**: 調用 Kimi 多模態 API（截圖 -> 文字描述/定位）
- **本地備用**: PaddleOCR（若網絡不穩定或成本敏感時啟用）
- **使用場景**: 
  1. UIA 無法識別的控件區域
  2. Postcondition 驗證（確認某文字出現在屏幕上）

---

## 4. Verification Loop 設計

每個 action 必須攜帶驗證契約：

```json
{
  "precondition": {
    "assertions": [
      { "kind": "window_title", "target": "微信", "value": "微信" },
      { "kind": "element_exists", "target": "搜索框" }
    ],
    "timeout_ms": 5000
  },
  "postcondition": {
    "assertions": [
      { "kind": "element_exists", "target": "聊天列表" }
    ],
    "timeout_ms": 10000
  },
  "failure_strategy": {
    "mode": "retry",
    "max_retries": 2,
    "fallback_action_id": "..."
  }
}
```

### Verifier 實現策略

| 斷言類型 | Windows 實現 |
|----------|-------------|
| `element_exists` | `pywinauto` 查找控件 |
| `window_title` | `pywinauto` 讀取窗口標題 |
| `url_is` | Playwright `page.url` |
| `text_contains` | Playwright `page.content()` 或 OCR fallback |
| `file_exists` | Python `pathlib.Path.exists()` |

### 失敗處理流程

1. **Precondition 失敗** -> 等待/重試 -> 仍失敗則觸發 `failure_strategy`
2. **Action 執行失敗** -> 截圖 + 記錄錯誤 -> 觸發 `failure_strategy`
3. **Postcondition 失敗** -> 截圖 + 標記 observation -> 觸發 `failure_strategy`
4. **Recovery**: `retry` -> `fallback` -> `escalate` -> `abort`

---

## 5. 總結

| 組件 | 選定方案 | 備註 |
|------|---------|------|
| OS | Windows 11 | v1 唯一目標 |
| Browser | Edge / Chrome | Chromium 系 |
| Browser Automation | Playwright (Python) | DOM-first |
| Desktop Automation | pywinauto (UIA backend) | 結構化控件-first |
| OCR | Kimi 多模態 API / PaddleOCR | Fallback only |
| 座標點擊 | pyautogui | 最後兜底，標記 fragile |
| 截圖 | Pillow / pyautogui | 驗證輔助 |
