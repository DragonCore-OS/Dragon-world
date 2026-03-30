# ADR-0003: Kernel 與 Agent Harness 嚴格分離

## 狀態
Accepted

## 背景
Dragon-world 的核心設計原則是「確定性、可測試、可運行」。如果將 LLM 推理直接嵌入 kernel，會導致：
1. 測試結果不可復現
2. 邊界模糊，難以定位問題
3. 違反 Dragon-world 的原始定位

## 決策
- **Kernel（Layer 0）永遠不直接調用 LLM**
- Kernel 只接受上層編譯後的 `action plan`（符合 `specs/action_schema.json`）
- Agent Harness（Layer 1）負責所有非確定性推理，並將結果翻譯為 kernel 可執行的命令
- 兩者之間通過 `bridges/deerflow` 進行協議翻譯

## 後果

### 正面
- Kernel 保持 100% 確定性，可單獨單元測試
- LLM 的幻覺不會直接污染世界狀態
- 未來可替換 Agent Harness 而不影響 Kernel

### 負面
- 增加了 bridge 層的維護成本
- 延遲略增（推理 -> 翻譯 -> 執行）

## 相關文件
- `docs/01_system_architecture.md`
- `bridges/deerflow/CONTRACT.md`
- `docs/02_module_boundaries.md`
