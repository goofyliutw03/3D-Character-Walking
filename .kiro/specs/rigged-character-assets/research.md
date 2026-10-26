# Asset discovery / download audit

## 授權與狀態
2026-10-26使用者確認里程碑5並要求繼續；已提出里程碑6七項規劃，使用者明確「許可下載」兩個Quaternius官方免費資產包。允許範圍為取得／檢查候選，不安裝Blender、不使用付費包、不commit／push。
本報告只記錄資產調查；spec仍initialized，尚未產生或核准requirements／design／tasks。小孩及Jump策略尚有必要輸入，不能假造最終驗收。

## Official sources
- Men：https://quaternius.com/packs/ultimatemodularcharacters.html
- Women：https://quaternius.com/packs/ultimatemodularwomen.html
- 兩官方頁面於查核時均標示CC0及glTF格式。官方下載連至公開Google Drive資料夾。
- Drive回傳Quota exceeded，包含License.txt與男女Casual模型；回應雖為HTTP成功，內容實為HTML。已識別且保存為*-download-error.html，沒有當作模型或授權檔使用，也沒有繞過配額。

## Creator alternate publication
作者Quaternius在Poly Pizza發布同名資產包：
- https://poly.pizza/bundle/Ultimate-Modular-Men-Pack-ZiH8muWqwQ
- https://poly.pizza/bundle/Ultimate-Modular-Women-Pack-aCBDXDdTNN
Poly Pizza女性整包頁混列CC-BY與CC0，不能宣稱整包全部CC0。此次僅下載下表三個個別頁面明確標示CC0 1.0的候選，全部作者為Quaternius。

| 檔案 | 來源頁 | 大小bytes | SHA256 |
|---|---|---:|---|
| men-casual.glb | https://poly.pizza/m/kZ3DmIoGip | 1430660 | FEA7E71271203E7073F1A073FA1208DE7402DF276F87F80E149BF7589B5D46B4 |
| women-animated-a.glb | https://poly.pizza/m/nIItLV9nxS | 1491780 | A6522FE53D15DE21130A957D1BF2B8A9A58D4E4E9A12AF646645B667A9BB2D17 |
| women-animated-b.glb | https://poly.pizza/m/qJ2gsTUBHL | 1530616 | A2212729826B718E59E698211ED3951C22459B48733B1EE6A24FAC0ABF74DCA8 |

Attribution候選文字：Casual Character / Animated Woman by Quaternius, via Poly Pizza, CC0 1.0。尚未修改模型；正式納入時保存來源、授權及修改紀錄。

## Local isolation and mechanical inspection
檔案與來源頁保存在忽略目錄`.local/asset-audit/milestone-6/`，未放入public/assets、未改runtime。未下載整包所有FBX／Blend／模型；只取得三個GLB候選，不能聲稱整包完整下載。
- magic glTF、version2與header／JSON可解析。
- 使用專案已安裝Three.js GLTFLoader.parseAsync實際載入，三者PASS，無安裝新依賴。
- 4個skin記錄、各62個joint，實際場景含10／10／9個SkinnedMesh。
- bind/rest bounding height約1.8235／1.8003／1.8095m，需後續視覺確認比例／朝向／腳底／眼位。
- 三者各24段動畫，含CharacterArmature|Idle、Idle_Neutral、Walk、Run；三者均無Jump。沒有external buffer，未要求外部貼圖下載。
- 完整parse與clip duration紀錄：`.local/asset-audit/milestone-6/inspection.json`；檔案hashes.json另存。未做骨架動畫視覺、root motion／retarget相容或production runtime驗收。

## Remaining necessary decisions
- 目前兩包未取得小孩專用模型。需決定補找專用免費骨架資產，或明確接受調整比例／外觀的CC0衍生角色；單純縮小成人不能冒稱專用小孩資產。
- 三候選無Jump。可補找授權清楚且可retarget的Jump clip，或在既有骨架上製作專案動畫並實際驗證；不可偷偷用Idle替代Jump。
- 已唯讀確認另有作者2019 Animated Men包聲稱含Jump（https://www.patreon.com/quaternius/posts/free-animated-24703403），但不是本次兩個2022包，未下載且未驗證骨架相容。
- 原Front近距幾何遮擋仍為上游camera-modes調查候選，不因這次資產取得而默默修正。

## Git / verification limits
main，HEAD af73f11fe44c406ec784aeb9e496a710b2c6c939。保留既有修改。只新增本research與忽略目錄下載證據，未stage／commit／push。這次僅資產下載與parse，不重跑build、不宣稱里程碑6完成。

## 2026-10-26 continuation / user decisions
使用者要求優先找專用資產，找不到合適者接受明確標示衍生角色／動畫，允許現有Blender5.2；實查版本5.2.2LTS。
專用Jump候選Man HMnuH5geEG（https://poly.pizza/m/HMnuH5geEG）已由作者CC0頁面下載與解析，含Man_Jump，但31-joint舊骨架與現有62-joint層級／rest axes不同，不能直接套用。未把它冒稱已retarget；採專案製作目標骨架Jump。
兩輪bounded搜尋涵蓋Quaternius／Poly Pizza／OpenGameArt與其它模型catalog，結果包含商業listing、生成工具與仍待獨立來源／骨架驗證的目錄；未取得可直接確認適配的獨立小孩。因此按使用者備案從現有CC0男模型製作頭／軀幹／腿比例不同的小孩，不只是縮小成人；UI與attribution明示derived。
最終選source man-casual及women-animated-b，保存tools/assets/source；可重建Blender腳本tools/assets/prepare_characters.py。四clips與本機尺寸／pose驗證見validation。此段取代上方尚待決定與spec initialized的舊時點狀態。
Synthesis：採現有Three.js loader/mixer，無新dependency。採in-place骨架動畫並維持CharacterController為motion權威。Loader orchestration使用injected factory／release，與DOM分離；無每角色cache或第二個loop。
