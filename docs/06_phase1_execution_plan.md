# Dragon-system Phase 1 Execution Plan

> 版本：0.1.0  
> 更新日期：2026-03-31  
> 目標：打通「語音 -> Kimi -> Action compiler -> Browser/Desktop adapter -> Verifier」最小閉環

## Phase 1 範圍

**不做**：
- 完整 TryVoice 系統搬遷
- 微信/抖音/Pinterest 等特定業務 flow
- DeerFlow 完整 harness 接入
- Control Plane 治理功能
- OCR 主路徑

**要做**：
- TryVoice 最小語音橋接（STT + TTS）
- Kimi provider SDK 實現
- Action compiler（自然語言 -> Action Schema）
- Windows Action Plane 最小適配器（Playwright + pywinauto）
- Verification loop（pre/post condition）
- 三條黃金演示鏈

---

## 技術棧

| 層級 | 組件 | 技術選型 |
|------|------|---------|
| Voice | STT / TTS | TryVoice adapter（本地運行最小子集） |
| LLM | Provider | `packages/provider-sdk` -> Kimi API |
| Harness | Action Compiler | Python，輕量 prompt + schema enforcement |
| Action | Browser | Playwright (Python) |
| Action | Desktop | pywinauto (UIA backend) |
| Action | Verification | Precondition / Postcondition runner |
| Kernel | State / Event | 現有 `crates/world-core` + `event-store` |

---

## 三條黃金演示鏈

### 演示鏈 A：瀏覽器搜索
**語音指令**：「打開瀏覽器，搜索『人工智慧』」

**預期流程**：
1. TryVoice 接收語音 -> STT 轉文本
2. Action Compiler 解析為 Action Schema
3. Playwright 啟動 Edge
4. 導航到 Bing/Google
5. 在搜索框輸入「人工智慧」
6. 點擊搜索
7. Postcondition：頁面 URL 包含搜索關鍵詞

### 演示鏈 B：打開 Windows 應用並導航
**語音指令**：「打開記事本，輸入『Hello Dragon』」

**預期流程**：
1. 語音 -> STT
2. Action Compiler 生成桌面 action
3. `pywinauto` 啟動 `notepad.exe`
4. 定位編輯區域
5. 輸入文本「Hello Dragon」
6. Postcondition：窗口標題為「記事本」且文本內容匹配

### 演示鏈 C：發送文本消息
**語音指令**：「打開微信，發送『晚上吃飯』給文件傳輸助手」

**預期流程**：
1. 語音 -> STT
2. Action Compiler 生成複合 action（啟動 + 搜索聯繫人 + 輸入 + 發送）
3. `pywinauto` 啟動微信並激活窗口
4. 搜索「文件傳輸助手」
5. 點擊進入聊天
6. 輸入「晚上吃飯」
7. 點擊發送按鈕
8. Postcondition：聊天列表中出現最新消息

> **注意**：演示鏈 C 是 Phase 1 的驗收標準，但不是第一個開發目標。應先完成 A 和 B，再挑戰 C。

---

## 開發順序

### Step 1: Provider SDK（P1-T2）
- 定義 `DragonLLMProvider` Protocol
- 實現 `KimiProvider`
- 環境變數 `KIMI_API_KEY` 加載
- 單元測試：mock 測試 + 最小真實調用測試

### Step 2: Action Compiler 骨架（P1-T3 前置）
- Prompt template：將自然語言翻譯為 Action Schema JSON
- JSON Schema validation
- 錯誤處理與 retry

### Step 3: Browser Adapter（Playwright）
- 封裝 `BrowserAdapter` 類
- 方法：`launch(url)`, `fill(selector, text)`, `click(selector)`, `assert_url_contains(url)`
- 與 Action Schema 對接

### Step 4: Desktop Adapter（pywinauto）
- 封裝 `DesktopAdapter` 類
- 方法：`start_app(path)`, `connect_window(title)`, `click_control(name)`, `type_text(text)`, `assert_window_title(title)`
- 與 Action Schema 對接

### Step 5: Verifier
- 實現 `PreconditionRunner` 和 `PostconditionRunner`
- 支持 `element_exists`, `window_title`, `url_is`, `text_contains`
- 截圖與日誌記錄

### Step 6: TryVoice 最小橋接
- 提取 TryVoice 的 STT/TTS 最小運行時
- 將語音輸入導入 Action Compiler
- 將 TTS 輸出綁定到執行結果

### Step 7: 三條黃金演示鏈集成與穩定性測試
- 每條鏈連續運行 20 次，成功率 >= 90%

---

## 驗收標準

1. **Provider SDK**：`KimiProvider.chat()` 可穩定返回，單測通過
2. **Action Compiler**：10 條不同自然語言指令，100% 輸出合法 Action Schema
3. **Browser Adapter**：演示鏈 A 連續 20 次成功率 >= 90%
4. **Desktop Adapter**：演示鏈 B 連續 20 次成功率 >= 90%
5. **端到端**：從語音輸入到動作執行到語音反饋，延遲 < 15 秒（不含 LLM 生成時間）

---

## 風險與緩解

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| pywinauto 對某些 UWP 應用支持不佳 | 演示鏈 C 失敗率高 | 先用記事本/計算器等系統應用驗證適配器 |
| Kimi API 延遲或限流 | 端到端體驗差 | 增加流式輸出、本地緩存 action template |
| Playwright 瀏覽器版本不匹配 | 瀏覽器演示鏈失敗 | 固定 Playwright 瀏覽器版本、自動安裝腳本 |
| 語音識別準確率低 | 指令理解錯誤 | 增加指令確認環節、支持文本備用輸入 |
