# Dragon-system Phase 1 Execution Plan

> 版本：0.1.0  
> 更新日期：2026-03-31  
> 目標：打通「語音 -> Kimi -> Action compiler -> Browser/Desktop adapter -> Verifier」最小閉環

## 開發拓撲

本階段採用 **雙節點開發模型**（ADR-0007）：

- **Node A: Linux Authoring Node** — 負責代碼生成、schema 定義、provider SDK、action compiler、verifier contract、文檔與狀態維護
- **Node B: Windows Execution Node** — 負責真機執行 Playwright / pywinauto、截圖、回傳 execution result
- **GitHub** — 唯一共享真相源，兩節點通過 repo 同步

詳見 `docs/07_windows_execution_runner.md` 與 `specs/execution_result_schema.json`。

## Phase 1 範圍

**不做**：
- 完整 TryVoice 系統搬遷
- 微信/抖音/Pinterest 等特定業務 flow（先做黃金演示鏈）
- DeerFlow 完整 harness 接入
- Control Plane 治理功能
- OCR 主路徑

**要做**：
- Kimi provider SDK 實現（Linux）
- Action compiler（Linux）
- Browser/Desktop adapter **接口與契約**（Linux）
- Verification loop **框架**（Linux）
- Windows Execution Runner 最小實現（Windows）
- 三條黃金演示鏈的端到端驗證（雙節點協作）

---

## 技術棧

| 層級 | 組件 | 技術選型 | 負責節點 |
|------|------|---------|---------|
| Voice | STT / TTS | TryVoice adapter（最小子集） | Linux / Windows 協作 |
| LLM | Provider | `packages/provider-sdk` -> Kimi API | Linux |
| Harness | Action Compiler | Python，輕量 prompt + schema enforcement | Linux |
| Action | Browser Adapter | Playwright (Python) | Windows 執行，Linux 定義接口 |
| Action | Desktop Adapter | pywinauto (UIA backend) | Windows 執行，Linux 定義接口 |
| Action | Verification | Precondition / Postcondition runner | Linux 框架，Windows 實測 |
| Runner | Execution Result | `specs/execution_result_schema.json` | Windows |
| Kernel | State / Event | 現有 `crates/world-core` + `event-store` | Linux |

---

## 三條黃金演示鏈

### 演示鏈 A：瀏覽器搜索
**語音指令**：「打開瀏覽器，搜索『人工智慧』」

**預期流程**：
1. TryVoice 接收語音 -> STT 轉文本
2. Action Compiler 解析為 Action Schema
3. Linux Node 輸出 action plan
4. Windows Runner 執行 Playwright 啟動 Edge
5. 導航到 Bing
6. 在搜索框輸入「人工智慧」
7. 點擊搜索
8. Postcondition：頁面 URL 包含搜索關鍵詞
9. Windows Runner 回傳 result.json + 截圖

### 演示鏈 B：打開 Windows 應用並導航
**語音指令**：「打開記事本，輸入『Hello Dragon』」

**預期流程**：
1. 語音 -> STT
2. Action Compiler 生成桌面 action plan
3. Windows Runner 執行 `pywinauto` 啟動 `notepad.exe`
4. 定位編輯區域
5. 輸入文本「Hello Dragon」
6. Postcondition：窗口標題為「記事本」且文本內容匹配
7. Windows Runner 回傳 result.json

### 演示鏈 C：發送文本消息
**語音指令**：「打開微信，發送『晚上吃飯』給文件傳輸助手」

**預期流程**：
1. 語音 -> STT
2. Action Compiler 生成複合 action plan
3. Windows Runner 執行 `pywinauto` 啟動微信並激活窗口
4. 搜索「文件傳輸助手」
5. 點擊進入聊天
6. 輸入「晚上吃飯」
7. 點擊發送按鈕
8. Postcondition：聊天列表中出現最新消息
9. Windows Runner 回傳 result.json

> **注意**：演示鏈 C 是 Phase 1 的驗收標準，但不是第一個開發目標。應先完成 A 和 B，再挑戰 C。

---

## Phase 1 開發順序（雙 Track）

### Track A: Linux Authoring Node

#### Step A1: Provider SDK（P1-T1）
- 定義 `DragonLLMProvider` Protocol
- 實現 `KimiProvider`
- 環境變數 `KIMI_API_KEY` 加載
- 單元測試：mock 測試 + 最小真實調用測試

#### Step A2: Action Compiler 骨架（P1-T2）
- Prompt template：將自然語言翻譯為 Action Schema JSON
- JSON Schema validation
- 錯誤處理與 retry

#### Step A3: Adapter 接口與 Verifier Contract（P1-T3）
- 定義 `BrowserAdapter` / `DesktopAdapter` 抽象接口
- 定義 `PreconditionRunner` / `PostconditionRunner` 抽象接口
- 實現 mock adapter（用於 Linux 本地單元測試）
- 與 Action Schema 對接

#### Step A4: Execution Result Consumer（P1-T4）
- 解析 Windows Runner 回傳的 `execution_result_schema.json`
- 將成功/失敗反饋到 action compiler 調優邏輯
- 定義 artifact 歸檔規範

### Track B: Windows Execution Node

#### Step B1: Browser Smoke Runner（P1-T5）
- 在 Windows 11 上安裝 Playwright + Chromium
- 實現最小腳本：啟動 Edge -> 訪問 Bing -> 搜索關鍵詞 -> 截圖
- 輸出符合 `execution_result_schema.json` 的結果

#### Step B2: Desktop Smoke Runner（P1-T6）
- 在 Windows 11 上安裝 `pywinauto`
- 實現最小腳本：啟動記事本 -> 輸入文字 -> 讀取窗口標題 -> 截圖
- 輸出符合 `execution_result_schema.json` 的結果

#### Step B3: Execution Result Handoff（P1-T7）
- 建立 `runs/inbox/` 與 `runs/outbox/` 目錄規範
- 實現 Windows Runner 主循環：讀取 inbox -> 執行 -> 寫入 outbox -> commit & push
- 驗證 Linux Node 能正確消費回傳結果

### Track C: 集成與語音（最後做）

#### Step C1: TryVoice 最小橋接（P1-T8）
- 提取 TryVoice 的 STT/TTS 最小運行時
- 將語音輸入導入 Action Compiler
- 將 TTS 輸出綁定到執行結果

#### Step C2: 三條黃金演示鏈集成與穩定性測試（P1-T9）
- 每條鏈連續運行 20 次，成功率 >= 90%
- 所有執行結果與 artifacts 落盤到 repo

---

## 驗收標準

1. **Provider SDK**：`KimiProvider.chat()` 可穩定返回，單測通過（Linux）
2. **Action Compiler**：10 條不同自然語言指令，100% 輸出合法 Action Schema（Linux）
3. **Browser Smoke**：Windows Runner 能獨立完成 Edge 搜索並回傳標準 result JSON
4. **Desktop Smoke**：Windows Runner 能獨立完成 Notepad 輸入並回傳標準 result JSON
5. **雙節點 Handoff**：Linux 生成的 action plan 能在 Windows 上執行，結果能被 Linux 正確解析
6. **端到端**：從語音輸入到動作執行到語音反饋，延遲 < 15 秒（不含 LLM 生成時間）

---

## 風險與緩解

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| Windows 筆電不在線，無法及時驗證 | Track B 阻塞 | Linux 端先用 mock adapter 跑通接口，等 Windows 節點上線後補真機驗證 |
| pywinauto 對某些 UWP 應用支持不佳 | 演示鏈 C 失敗率高 | 先用記事本/計算器等系統應用驗證適配器 |
| Kimi API 延遲或限流 | 端到端體驗差 | 增加流式輸出、本地緩存 action template |
| Playwright 瀏覽器版本不匹配 | 瀏覽器演示鏈失敗 | 固定 Playwright 瀏覽器版本、自動安裝腳本 |
| 語音識別準確率低 | 指令理解錯誤 | 增加指令確認環節、支持文本備用輸入 |
| 雙機 Git 衝突 | 同步失敗 | Windows 節點只改 `runs/outbox/*`，不改 `src/` / `docs/` / `runtime/` |
