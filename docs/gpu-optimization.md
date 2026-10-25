# GTX 1060 本機 AI 加速紀錄

驗證日期：2026-10-24，Asia/Taipei。

## 實際環境與範圍

- NVIDIA GeForce GTX 1060 6GB；驅動 582.78。
- 完整原生 Ollama 0.40.10 已安裝於 `%LOCALAPPDATA%/Programs/Ollama`，包含 CUDA 後端。原有共用服務正在使用這套程式，並非專案的 CPU 精簡版。
- `nomic-embed-text:latest`，137M、F16、768 維；目前模型 context 為 2048，維持不變。
- GPU 日誌確認 13/13 層 offload；`ollama ps` 顯示 100% GPU；API 回報模型配置約 320.20 MiB VRAM。這不是整台電腦的顯存總用量。
- 本次僅優化既有本機 RAG。未安裝其他生成模型、替換驅動、超頻或更改電源設定。

## 實測結果

同一模型 digest `0a109f422b47e3a30ba2b10eca18548e944e8a23073ee3f3e947efcf3c45e59f`，固定合成文字，每組先暖機一次，再測三次，以端到端請求時間中位數比較。CPU 使用 `num_gpu=0`，GPU 使用完整 offload；每組均檢查實際 GPU 配置及 768 維有限數值輸出。

| 工作負載 | CPU 中位數 | GPU 中位數 | 加速比 |
|---|---:|---:|---:|
| 單筆，159 tokens | 340.97 ms | 89.06 ms | 3.83 倍 |
| 8 筆，合計 1272 tokens | 2474.78 ms | 477.05 ms | 5.19 倍 |

GPU 批次吞吐量約 16.77 筆/秒。CPU/GPU 第一筆向量的 cosine similarity 約 0.99999987。以上為本機合成文字暖機測試，不包含模型載入，也不代表整個 RAG、所有輸入或其他 AI 應用的加速比。沒有測試更大批次，因此不宣稱 8 為最大吞吐量設定。

可重跑 `node tools/rag/benchmark.mjs`；數據保存於忽略的 `.local/rag/gpu-benchmark.json`。測試會短暫切換該嵌入模型的 CPU/GPU 配置，結束時恢復 GPU 暖機狀態，建議在沒有其他索引工作時執行。

## 已保存的設定

- `scripts/rag.ps1` 優先選用完整原生 Ollama，找不到時才使用專案 CPU 精簡版。
- SocratiCode 批次設定為 `EMBEDDING_BATCH_SIZE=8`，HTTP 連線上限 `OLLAMA_MAX_CONNECTIONS=1`。這是偏向互動與顯存餘裕的保守設定，讓 RAG 與 3D 畫面共享顯卡；不是硬性全機顯存限制。
- 設定已加入查詢 helper、MCP 啟動腳本及專案 Codex 設定。helper 的實際搜尋已驗證；既有長時間執行的 MCP 程序要在下一次重新連線後才讀取新環境變數。
- 當啟動腳本自行啟動 Ollama 時，使用單一模型、單一平行請求、5 分鐘 keep-alive，並以 `OLLAMA_GPU_OVERHEAD=536870912` 預留 512 MiB 的排程估算餘裕；維持 localhost 與 cloud disabled。
- 既有共用 Ollama 服務沒有被重啟，也未修改全域環境變數。上述服務啟動參數只對腳本新啟動的服務生效，不宣稱已套用到現有共用程序。
- `scripts/install-rag.ps1 -Gpu` 支援在新機器重建完整 GPU 版本；本機因已安裝而未重複下載。

## 驗證與回復

`./scripts/rag.ps1 gpu` 與實際 RAG 搜尋均通過。可用 `ollama ps` 或 `/api/ps` 檢查模型是否仍在 GPU；閒置超時卸載屬正常行為。

如需撤回批次限制，移除三處 `EMBEDDING_BATCH_SIZE` 與 `OLLAMA_MAX_CONNECTIONS` 設定，並重新啟動相應 MCP 程序。保留模型名稱、維度與現有索引；不需刪除或重建 Qdrant。

參考：[Ollama GPU 支援](https://docs.ollama.com/gpu)、[Ollama 記憶體與並行設定](https://docs.ollama.com/faq)、[嵌入 API](https://docs.ollama.com/api/embed)。
