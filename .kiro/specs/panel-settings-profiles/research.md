# Research
2026-11-09 integration discovery：已讀kiro init/requirements/design/tasks/impl/review/verify/validate指引與核心steering，依授權採依序inline、不委派與不commit。
現有 main 多種設定、headlamp無固定id、particle有Apply草稿；採權威快照加明確草稿。SceneSwitch離開洞穴會dispose，需先保存設定；新場景隨機光源不算dirty。
[OPFS getDirectory](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/getDirectory) 限安全環境；LAN HTTP使用IndexedDB，不同origin各自儲存。
[W3C Pointer Lock](https://www.w3.org/TR/pointerlock/) 需要使用者啟動，以change/error判定結果，兼容Promise及void。鎖定以movementX/Y連續轉向，未鎖定維持舊每段上限。
無新增依賴；主要風險是async場景、寫入競態及UI/runtime不同步，以串行與完整快照驗證。
