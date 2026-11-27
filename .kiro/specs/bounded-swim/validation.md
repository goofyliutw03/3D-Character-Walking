# [1Y-16] 有限水池審閱與驗證

## 基線與範圍

從 9ab7abbb6f6df3838bc7d5cd1177c04b9332552a 建立同 repo 的隔離 worktree 與 codex/bounded-swim 分支，保留 main 的五個既有修改。Node 24.22.3、pnpm 11.25.0。依固定 lockfile 還原 Viewer 依賴，套件安裝腳本關閉。

## Inline 審閱

- 1.1 通過。水位、池底、池緣與盒體共用場景資料。低幀率或高速移動走相同膠囊掃掠。水紋只影響外觀。
- 2.1 通過。三種膠囊測試包含走入水池、浮力恢復、無效座標、最高速度、池壁與池底，以及指定池緣的到達、拒絕和合法出水。另以起點合法的超高膠囊驗證攀出路徑的上方淨空會阻止出水。
- 3.1 通過。Environment、Profiles v1、既有垂直輸入及相機切換已整合。SceneSwitch 失敗測試驗證原場景、水時鐘、霧和角色狀態保留，候選場景釋放。
- 完整單元測試 230/230 通過，TypeScript／Vite 正式建置通過，onboarding 腳本 17/17 synthetic 檢查通過。Vite 仍提示既有大 chunk。

## 4.1 正式瀏覽器驗證

Needle Engine 與 legacy 各自使用實際 runtime 啟動狀態判定。兩路都通過 Chrome headless／SwiftShader 的正式建置預覽，涵蓋從乾地走入水中、鍵盤與 CDP 觸控下潛、遠離指定池緣的出水拒絕、合法返回乾地，以及 cave、terrain、flight、city 往返。CDP 未觀察到 Runtime 例外或 shader／INVALID_OPERATION 訊息。另以單元測試注入 bind 失敗驗證復原。獨立瀏覽器執行注入 PoolScene 模組載入失敗，確認城市位置保留並可接續切換洞穴。驗證腳本位於本 worktree 的 .local/pool-smoke.mjs，故障注入加上 --failure-only。

## 5.1 交付與索引

本地功能驗證通過，部署限制見下一節。SocratiCode 為隔離 worktree 建立索引，初次索引已完成，191 檔、709 chunks。依專案忽略規則排除資產、依賴與機密檔案。最終程式差異以增量更新確認。

## 發佈與限制

交接指定本環境不執行原工作站專用 Release。現有 Release 資產也早於交接基線，本階段只驗證隔離 worktree 的正式建置。泳姿沿用既有 Jump 動畫 fallback。本地水面為固定水位加水紋。保留手機真機、跨 GPU 與正式效能驗收。無 commit 或 push。
