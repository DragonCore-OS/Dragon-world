# ADR-0002: v1 只支持 Kimi 作為 LLM Provider

## 狀態
Accepted

## 背景
用戶已經訂閱 Kimi CLI / kimi.com API key。在 v1 階段引入多供應商會增加不必要的抽象複雜度，並分散測試和調優精力。

## 決策
- v1 只支持 **Kimi** 作為 LLM provider
- 所有 LLM 調用必須經過 `packages/provider-sdk` 的統一接口
- 禁止任何模塊直接寫死 Kimi API 細節（如 base URL、模型名稱）
- 環境變數 `KIMI_API_KEY` 由 `provider-sdk` 統一讀取

## 後果

### 正面
- 減少 v1 的測試矩陣
- 統一 prompt 調優和 token 成本控制
- 後續若需擴展供應商，只需在 `provider-sdk` 中新增實現

### 負面
- 短期內無法利用其他模型的獨特能力（如 GPT-4o 的語音原生）
- 對 Kimi API 的可用性有強依賴

## 相關文件
- `docs/03_interfaces_and_contracts.md`
- `specs/provider_schema.json`
