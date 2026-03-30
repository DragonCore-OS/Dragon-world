# Dragon-system 接口與合約

> 版本：0.1.0  
> 更新日期：2026-03-31

## 核心接口清單

### 1. DragonLLMProvider（Python Protocol）

所有 LLM 調用的唯一入口。

```python
from typing import Protocol, AsyncIterable

class DragonLLMProvider(Protocol):
    async def chat(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        stream: bool = False,
        **kwargs
    ) -> str | AsyncIterable[str]: ...

    async def embed(self, texts: list[str]) -> list[list[float]]: ...

    async def transcribe(self, audio_bytes: bytes, **kwargs) -> str: ...

    async def rerank(self, query: str, docs: list[str]) -> list[tuple[int, float]]: ...
```

**實現要求**：
- v1 只實現 `KimiProvider`
- 封裝 `kimi.com` API key（環境變數 `KIMI_API_KEY`）
- 統一重試、超時、日誌、token 計數

### 2. Action Schema（JSON Schema）

見 `specs/action_schema.json`。

核心字段：
- `action_id`: UUID
- `type`: `browser` | `desktop` | `voice` | `kernel`
- `precondition`: 執行前斷言
- `payload`: 具體參數
- `postcondition`: 執行後斷言
- `failure_strategy`: `retry` | `fallback` | `abort` | `escalate`

### 3. Event Schema（JSON Schema）

見 `specs/event_schema.json`。

核心字段：
- `event_id`: UUID
- `timestamp`: ISO8601
- `source_layer`: 0-4
- `source_module`: 模塊名
- `event_type`: `state_change` | `action_executed` | `error` | `audit`
- `payload`: 任意 JSON
- `correlation_id`: 關聯追蹤 ID

### 4. Skill Schema（JSON Schema）

見 `specs/skill_schema.json`。

核心字段：
- `skill_id`: 唯一標識
- `version`: semver
- `entrypoint`: 調用路徑
- `input_schema`: JSON Schema
- `output_schema`: JSON Schema
- `sandbox_policy`: 權限聲明

### 5. Kernel API（Rust）

`crates/world-core/src/lib.rs` 公開接口：

```rust
pub struct WorldKernel;
impl WorldKernel {
    pub fn load(seed_path: &Path) -> Result<WorldState, LoadError>;
    pub fn execute(&mut self, cmd: Command) -> Vec<WorldEvent>;
    pub fn snapshot(&self) -> Snapshot;
    pub fn state(&self) -> &WorldState;
}
```

**穩定性承諾**：此接口在 Phase 1 結束前凍結，不進行 breaking change。

### 6. DeerFlow Bridge Contract

見 `bridges/deerflow/CONTRACT.md`。

職責：
- 將 DeerFlow 的 `action plan` 翻譯為 Dragon-system 的 `Action Schema`
- 將 Kernel 的 `WorldEvent` 翻譯為 DeerFlow 的 `observation`

### 7. Paperclip Bridge Contract

見 `bridges/paperclip/CONTRACT.md`。

職責：
- 只吸收 governance / scheduler / audit 的設計模式
- 不直接嵌入 Paperclip 的 Node.js server 代碼

## 版本控制策略

- `specs/*.json` 使用 semver
- 當前所有 schema 為 `0.1.0`
- breaking change 必須：
  1. 更新 schema version
  2. 寫入 ADR
  3. 更新 `runtime/module_registry.yaml`
