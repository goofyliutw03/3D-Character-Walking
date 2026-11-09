# Research & Design Decisions
## Summary
Extension，整合導向light discovery。沿用Three0.186.1、GLTFLoader及現有Blender5.2.2，無新依賴。已讀cc-sdd init／requirements／design／tasks／impl／review／validate-impl／status及review gates；依使用者禁止委派在本context inline執行，不用--auto／batch。
## Research Log
- docs/asset-pipeline.md及rigged-character-assets validation證明既有Blender授權，這次--version再次確認5.2.2。profile限定.local/blender-profile，factory-startup／disable-autoexec／background。
- CityScene建築位於x±12.1、z[-20,-7,7,20]，行走範圍x±8.3；建築本體之外的地表、樹／凳／水障礙保持原有。八棟GLB保留同一量尺與座標，無新可走表面。
- CharacterController已以walkableWorld.groundHeight貼地。新增位置提交直接由此權威驗證；不從UI直接改Object3D。避免navigation→controller反向依賴，controller直接使用motion型別／radius檢查。
- GLTFLoader parseAsync／loadAsync、Mesh與disposeModel沿用本機原始碼及角色管線。CameraObstruction每幀遍歷environment，SceneAppearance支援新增模型；以八個建築個別root掛到environment，避免透明模式一次淡出整個街區。FollowCamera保留原碰撞構圖代理。
## Design Decisions
採本機原創建築而非第三方下載。Blender輸出每棟按material合併，減少draws，無texture／external URI，產生.blend及GLB與SHA256manifest。原始腳本是重建來源。runtime僅服務GLB／attribution／manifest，.blend放blender/不發佈。
狀態快照與草稿分離：XYZ即時讀數使用output，只有Read current主動填草稿。Y可指定地表至+10m，snap checkbox預設on。手動Walk速度屬controller，可影響walk intent；Run仍4，導航使用明確傳入速度，維持其權威。
## Risks
新增GLB非整座Blender城市原檔；文件明示混合街景。資產晚到／dispose後需釋放且不掛回scene，重試不重複載入。地表為既有解析高度，不聲稱任意GLB網格raycast貼地。無外部API／新library因此無額外網路查詢。
