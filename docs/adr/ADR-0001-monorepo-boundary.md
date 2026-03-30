# ADR-0001: Monorepo 邊界與組織方式

## 狀態
Accepted

## 背景
Dragon-system 需要整合四個不同來源的子系統（Dragon-world、TryVoice、DeerFlow、Paperclip-inspired）。為了避免「硬糊成一坨」導致的升級困難和邊界崩潰，必須明確 monorepo 的組織邊界。

## 決策
採用「分層整合 + 明確邊界」的 monorepo 組織方式：

- `apps/`: 可獨立運行的應用程序
- `bridges/`: 與外部系統的翻譯/適配層
- `crates/`: Rust 庫（Layer 0 Deterministic Kernel）
- `packages/`: 跨語言共享的 SDK 與接口定義
- `ui/`: 前端界面（Layer 4）
- `docs/`, `runtime/`, `handoff/`, `specs/`, `scripts/`: 工程基礎設施

## 後果

### 正面
- 各層可獨立開發、測試、部署
- 升級外部依賴時只需修改對應 bridge
- 新開發者能快速定位代碼

### 負面
- 需要維護多語言構建工具鏈（Cargo、Node、Python）
- 跨層調試時需要更多上下文切換

## 相關文件
- `docs/01_system_architecture.md`
- `docs/02_module_boundaries.md`
