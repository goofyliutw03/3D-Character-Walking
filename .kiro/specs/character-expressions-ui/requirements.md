# Requirements Document

## Project Description (Input)
使用者需要表達人物情緒與對話；目前沒有角色 anchor、情緒或泡泡。依 docs/development-plan.md 里程碑 5，提供人物上方 emoji／情緒圖示與可編輯對話泡泡、可見控制、資產載入回饋呈現與無障礙改善。依賴 character-movement 的 anchor 與動作介面，鏡頭控制整合依賴 camera-modes。編輯文字時不得觸發人物移動；載入器與錯誤事件由 rigged-character-assets 擁有，本 spec 負責 UI 呈現，最終須真實載入驗收。共用 main.ts、ViewerApp.ts 必須依序修改，不可平行。

## Requirements
<!-- Will be generated in /kiro-spec-requirements phase -->



