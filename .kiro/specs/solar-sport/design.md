# Technical Design
## 1. Boundary Commitments
SolarPosition擁有純太陽時間／季節數學及方位投影；CityScene擁有光照及路燈；ViewerApp提供設定及實際相機方向快照；SolarControls擁有DOM、pointer capture、鍵盤及指北針。main只組裝。無相機控制行為變更。
Out of Boundary：天文精度、民用時區、GPS、自動播放、其他水／粒子／交通行為。Allowed Dependencies：既有Three.js及DOM。Revalidation Triggers：CityScene光照更動須回歸night-lighting；實際相機讀取須驗各preset及俯視。
## 2. 計算與狀態
北=-Z、東=+X、上=+Y。四季赤緯0/+23.44/0/-23.44度；時角15*(hour-12)。方向由緯度與赤緯的標準球面轉換取得，無時差／折射。時間0≤hour<24；緯度[-90,90]。先完整驗證後原子更新。預設關閉、12:00、spring、25度。
太陽高度[-6,12]度插值夜／暮／日色；高度≤-6為night，-6到10為evening，其餘day。太陽直射高度≤0為零；路燈在night啟動。離開solar恢復所選預設。太陽位置距原點55m，維持既有shadow camera覆蓋；無新增光源。
指北針根據實際相機getWorldDirection的XZ投影計算heading atan2(x,-z)，退化保留上次值。圓盤反向heading旋轉。
## 3. File Structure Plan
- 新增src/scene/SolarPosition.ts：型別、驗證、方向、轉盤角度／heading純函數。
- 新增src/ui/SolarControls.ts：HTML及控制類別，mount/dispose、signal事件、pointercancel/lostcapture、鍵盤及更新；以ViewerApp公開API注入。
- 修改src/scene/CityScene.ts：solar設定快照、光照套用、模式切換。
- 修改src/engine/ViewerApp.ts：API及每幀回報，沿用集中animation loop，不增RAF。
- 修改src/main.ts、src/ui/controlPanelContent.ts、src/style.css：組裝、呈現及清理。
- 新增tests/solar-sport.test.mjs：數學、原子拒絕、日夜與預設回歸。
## 4. Interfaces
SolarSettings {enabled:boolean,hour:number,season:Season,latitude:number}；configureSolar(patch):boolean；getSolarSettings():副本；getTimeOfDay():TimeOfDay；setSolarReport(callback|null)回報heading及高度，dispose清除。SolarControls接收app API、host、onChange，onChange同步舊路燈UI。
## 5. Testing Strategy
需求1：角度0/90/180/270及午夜映射、鍵盤／拖曳／cancel runtime。
需求2：北東南西heading、退化、實際相機模式runtime。
需求3：春秋東昇西落、夏冬高度與晝長、極地有限。
需求4：night/day切換、六路燈選擇回歸、錯誤原子拒絕、snapshot、dispose；全套tests/build、production smoke。無新增測試依賴。
