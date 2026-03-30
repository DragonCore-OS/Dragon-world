# Dragon-system 產品北極星

> 版本：0.1.0  
> 更新日期：2026-03-31

## 一句話定位

**Dragon-system = AI-first system control plane**

它不是一個「會聊天的大模型桌面助手」，而是一個分層的、確定性的、可長期演進的 AI 系統控制平面。

## 核心組成

由四個已驗證方向組成：

1. **Dragon-world** = deterministic kernel（確定性內核）
2. **TryVoice** = voice runtime shell（語音交互殼）
3. **DeerFlow** = agent harness / memory / skills / sandbox（智能體腦幹）
4. **Paperclip-inspired** = governance / scheduler / audit / agent registry（治理控制平面）

## 設計原則

- **Kernel 純潔性**：內核不直接調用 LLM，只接受上層編譯後的 action plan
- **單一 LLM Provider**：v1 只支持 Kimi，所有 LLM 調用必須走統一 abstraction
- **邊界優先於功能**：先確保模塊邊界清晰，再填充功能
- **工程記憶外部化**：所有重要決策必須落盤到 ADR / spec / state file，禁止只存在於聊天上下文

## 成功標準

1. 新開一個 Kimi CLI session，只靠 repo 內文件能在 5 分鐘內恢復完整上下文
2. 任何模塊的修改不會導致其他層的連鎖崩潰
3. 語音輸入 -> LLM 推理 -> 動作執行 -> 驗證反饋 的閉環可穩定運行
