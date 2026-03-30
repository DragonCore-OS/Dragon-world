# Dragon-system 模塊邊界

> 版本：0.1.0  
> 更新日期：2026-03-31

## 硬性不變量（Hard Invariants）

以下規則任何時候都不可違反：

1. **Kernel 純潔性**：`crates/*`（Layer 0）永遠不能 import `agent-harness` 或任何 LLM client
2. **單一 Provider**：任何 LLM 調用只能經過 `packages/provider-sdk`，禁止模塊內寫死 provider
3. **事件強制性**：每個模塊的關鍵狀態變更必須寫入 `event-store`
4. **Handoff 強制性**：每次開發 session 結束後必須更新 `runtime/system_state.yaml` 和 `handoff/latest_boot_packet.md`
5. **ADR 強制性**：任何架構決策必須在 24 小時內寫入 `docs/adr/`

## 模塊邊界矩陣

| 模塊 | 允許調用誰 | 禁止調用誰 | 備註 |
|------|-----------|-----------|------|
| `crates/world-core` | `crates/event-store`, `crates/snapshot` | `apps/*`, `bridges/*`, LLM | 純 Rust，無 async IO |
| `crates/command-parser` | `crates/world-core` | 外部網絡、LLM | 純本地解析 |
| `apps/cli` | `crates/*` | `bridges/*`（暫時） | 最小演示入口 |
| `apps/server` | `crates/*`, `bridges/*`, `packages/*` | 直接調用 Kimi API | 必須通過 provider-sdk |
| `bridges/deerflow` | DeerFlow 外部倉庫接口 | 直接修改 `crates/*` | 翻譯層 |
| `bridges/paperclip` | Paperclip 概念/合約 | 直接嵌入 Paperclip server | 只參考設計 |
| `packages/provider-sdk` | `openai` / `kimi` HTTP client | 業務邏輯 | 純 provider abstraction |
| `ui/*` | `apps/server` API | 直接調用 kernel | 所有請求走 server |

## 依賴方向

```
ui → apps/server → packages/provider-sdk
                    ↓
              bridges/deerflow
                    ↓
              crates/world-core
                    ↓
              crates/event-store
```

不允許出現反向依賴（例如 kernel 調用 server）。

## 接口文件優先級

每個模塊必須維護自己的接口定義：

- Rust crates: `src/lib.rs` 的 public API
- Python bridges: `CONTRACT.md` 或 `__init__.py` 的 type stubs
- TS/JS packages: `index.ts` + `package.json` exports

新增接口必須在 `docs/03_interfaces_and_contracts.md` 中登記。
