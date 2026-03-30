# ADR-0004: Dragon-world Repo Semantic Upgrade and Layer-0 Preservation

## 狀態
Accepted

## 背景
為了避免新建 `Dragon-system` 倉庫導致的同步摩擦與上下文斷裂，我們決定直接在現有 `Dragon-world` 倉庫上進行語義升級，將其擴展為 Dragon-system 的 monorepo。這帶來一個風險：外部貢獻者或 future agent 可能誤以為 kernel 與 control plane 是同一層，從而破壞 Dragon-world 原本的確定性邊界。

## 決策
1. **本倉庫的正式名稱升級為 Dragon-system**，但保留 `Dragon-world` 作為 GitHub org/repo 路徑（避免遷移成本）。
2. **Dragon-world 的確定性內核（Layer 0）繼續作為整個系統的基石**，其邊界與職責不變。
3. **任何上層模塊（Harness / Action / Control / Shell）不得反向 import `crates/*`**。
4. **README 與文檔必須同時保留兩層語義**：
   - 對外：這是 Dragon-system 控制平面倉庫
   - 對內：Layer 0 仍是獨立的 Dragon-world 確定性內核
5. **kernel 的 breaking change 必須獨立於上層進行版本控制與測試**。

## 後果

### 正面
- 避免倉庫分裂帶來的同步地獄
- 利用現有 CI、issue、branch 歷史
- kernel 邊界清晰，未來可獨立發布為 crate

### 負面
- 倉庫職責變重，新貢獻者需要更多時間理解分層
- 需要持續維護「雙重語義」的文檔

## 相關文件
- `docs/01_system_architecture.md`
- `docs/02_module_boundaries.md`
- `README.md`
