# Discovery / Synthesis
2026-10-31；extension、integration-focused light discovery，無新增library。

- 已讀ViewerApp、AnchorProjection、ExpressionOverlay、FunctionTree、controlPanelContent、InputManager及水霧／夜間validation。使用本機kiro init／requirements／design／tasks／impl／review／validate／verify流程，遵守AGENTS授權覆蓋第三方逐階段停等及委派／commit預設。
- projectAnchor已對應rendered perspective與160°魚眼，重用而不創第二相機。ViewerApp每幀在obstruction後提供camera。
- 城市Scene包含環境、角色、lightRoots及動態粒子，遍歷實際graph避免手寫漏登錄；DOM label不入graph。WeakMap保留存續ID但不保留移除物件。
- 採原生details／summary為可鍵盤操作的巢狀disclosure；不假冒需完整Arrow roving的ARIA tree widget。textContent避免物件名稱注入HTML。
- Build vs adopt：重用Three／projectAnchor／DOM，無新UI library。model/UI兩個具體模組足夠，不引入event bus或debug框架。
- 綜合決策：label控制共同收斂為master AND checkbox AND regex AND range AND effectiveVisible；只影響overlay。
- 風險：重疊原點、原生regex耗時、全樹DOM成本如design明示；不擴張為物件編輯器或label碰撞引擎。
