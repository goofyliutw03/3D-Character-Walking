# occluded-character-xray 驗證紀錄

1M-1／CAM-04，2026-10-31。使用者核准整體方案與水／粒子／原始透明材質排除後實作；水景chat完成交付才修改共用檔案。HEAD cc52088，保留所有既有dirty；無委派、commit／push、模型切換、新依賴／素材。

## Implementation / Review
requirements→design→tasks→一次一項實作→validate-impl／verify-completion，均inline自動審閱，非使用者逐份人工核准。操作主角root由ViewerApp傳入，pass不擁有動畫或相機狀態；CameraObstruction在xray恢復normal材質，保持desired/rendered權威分離。前三模式不變。

深度mask區分environment與操作主角最前層，防止自遮擋。排除cameraObstruction=false祖先、透明flag／opacity<1／alphaHash／transmission>0及非Mesh。environment外的粒子、Target、標記不觸發。多材質按區段。alphaTest不透明裁切保留孔洞。透明角色自身仍可建立輪廓；本次排除條件指遮蔽物。

## Mechanical results
- `./scripts/project.ps1 release` exit0：93 tests／93 pass／0 fail／0 skip，tsc與Vite55modules成功。chunk>500kB為既有advisory。
- 初次sandbox build遭Vite spawn EPERM，宿主require_escalated重跑build與release成功；未繞過限制／改設定。
- 四個新增Node測試覆蓋逐材質排除／ancestor、例外還原、從transparent恢復原材質後xray、projection／First person bypass及cache pruning／自有資源冪等釋放。既有89條回歸通過。
- `git diff --check` exit0（既有LF→CRLF提示）；新runtime／test無TODO／FIXME／HACK／XXX／hardcoded secret命中。

## Actual GPU evidence
Chrome IAB／Windows／GTX1060 6GB／ANGLE D3D11，640×480 DPR1 deterministic fixture；使用實際WebGLRenderTarget讀回像素，不以字串測試代替GPU。原始報告見gpu-final.json；效能／循環見gpu-report.json。
- 無遮擋／自遮擋：變更像素0。
- 局部遮擋：右側9752、未遮擋左側0；完全遮擋：兩側各11236，合計22472。
- transparent、opacity<1、alphaHash、水標記、environment外物件及混合材質正面透明，各變更像素0。
- 魚眼局部遮擋右側864、左側0；魚眼無遮擋0。捕捉與合成同一160°投影，GL error0。
- 真實男／女／小孩GLB的Idle／Walk／Run／Jump，最前層骨架深度皆有正確輪廓（每姿勢2232–5646變更像素），魚眼均渲染成功。
- 共15項GPU checks通過。首次harness直接import three.module.js與Vite預打包three形成重複實例，instanceof錯誤令mask全空；改為相同bare import後重跑全通過，屬驗證fixture修正，未繞過產品檢查。
- 暖機後10次新pass建立／render／dispose回到相同4 geometries／6 textures／6 programs（包含保留的主pass／fisheye及fixture資源），無逐次累積。Node另驗cache移除舊材質。
- 簡單fixture單輪off/on，各150幀、前30幀暖機：median均13.3ms；P95 off13.5／on13.7ms。受約75Hz呈現上限，非GPU成本為0，也不是完整街道基準或手機推論。

## Production / Release
- 2026-10-31 06:08:17 +08:00發佈成功，Added5／Updated2／Skipped10；目的地固定Release，資產先、index最後，不刪既有hashed或陌生檔。
- `preview-release` localhost4174啟動session97910；開發5173為本chat新啟動session59028，未停止既有preview、未改防火牆。
- 正式產物WebGL2 ready／Rigged man Ready，第4選項與排除提示可操作。用鍵盤Move right移至建物旁，再Stop，Front可見被建物擋住的整個幽靈輪廓，露出的腳尖維持正常；截圖`.local/xray-validation/release-xray.png`。
- 四模式切換還原、Follow off/on保留xray、魚眼可用；First person提示策略暫停，切回Front恢復。390×844 resize後輪廓對齊，已還原viewport。console warn/error空。
- 真實GLB局部遮擋fixture截圖`.local/xray-validation/rigged-partial.png`。fixture GPU從最新source執行；正式Release另有上述整合操作證據，兩者不混稱同一產物。

## Coverage / Integration gate
| 條件 | 證據 |
|---|---|
| 1.1, 1.2 | GPU無／局部／完全遮擋像素對照、正式街道輪廓 |
| 1.3 | 三個真實skinned GLB×四動畫、程序fixture及既有fallback tests |
| 2.1 | 逐material排除tests、GPU水／粒子範圍／透明對照，水景既有tests回歸 |
| 2.2 | 同capture回呼、魚眼像素、First person門控／Follow／resize、GLB換模測試 |
| 2.3 | 既有89條回歸及正式四模式／移動／Stop操作 |
| 3.1 | 正式選單第四選項，初始zoom，提示同步 |
| 3.2 | 例外完整還原、mode材質還原、pruning、10次GPU資源循環 |
| 3.3 | 全套93 tests／build／GPU／正式Release |

DECISION GO／Verification VERIFIED（本機FEATURE_GO），3/3 requirement sections、9/9 criteria對應，無blocked task或LOCAL缺陷。File Structure Plan吻合，依賴方向與動畫／相機權威未變，新增pass獨立、資源屬於renderer。OWNERSHIP LOCAL、UPSTREAM_SPEC N/A。

## Limitations / Rollback
mask邊緣可能鋸齒；額外depth與合成有GPU成本，魚眼高解析度成本較大。未驗手機LAN／iPhone三瀏覽器、其他GPU／跨瀏覽器、M6／SCENE-05人工條件，維持原待辦。透明效果不列遮蔽物屬本次指定語義。回復僅本次差異並重建發佈，不重設既有修改、不刪舊hashed資產。

## Index / Token
2026-10-31 06:12 +08:00 codebase_status確認green／Incremental update completed：掃描103個可索引檔，新增2／更新8／移除0、55新chunks，總287chunks；graph84files／157edges。範圍為原專案遵守.gitignore／.socraticodeignore的可索引檔，不含外部Release；無錯誤、未重建／下載模型／安裝工具。文件補入後再次update／status確認。

本機官方rollout：C:/Users/goofy/.codex/sessions/2026/10/31/rollout-2026-10-31T00-08-31-01a18d91-e470-7c42-a255-1a4fd32816b4.jsonl，唯讀token_count。先前依交接日期10/30路徑查詢未找到，修正日期後取得可用基準。可確認區間UTC 2026-10-30T22:05:34.785Z→22:11:23.093Z（台北10/31 06:05:34→06:11:23）：input 1,093,906→5,610,989，output 11,523→23,922，total 1,105,429→5,634,911；差額input 4,517,083／output 12,399／total 4,529,482。cached input差額4,456,832已含input、reasoning差額2,446已含output，不重複加總。此區間僅本chat實作與驗證的一部分，不含較早規劃／實作及末點後索引紀錄／回覆；未與其他chat或水景階段重複計入。完整階段token用量：無法取得精確值（缺完整階段起點與尾段）；以上不是額度百分比或估算。

最後release：2026-10-31 06:11:20 +08:00，93/93 tests、build成功，Added0／Updated0／Skipped17。其後僅補驗證／索引紀錄及清除本次文件新增的EOF空行，runtime與Release產物未再變動。
