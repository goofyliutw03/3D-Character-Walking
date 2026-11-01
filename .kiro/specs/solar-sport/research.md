# Research
2026-11-01：已讀kiro init/requirements/design/tasks/impl/review/validate/verify技能及核心steering。依專案授權使用inline審閱、順序實作，無委派／自動commit。
CityScene既有sun為固定DirectionalLight，night用藍光；solar需獨立停用地平線下直射但保留preset。ViewerApp集中更新實際相機，UI已有abort清理。
數學來源：https://gml.noaa.gov/grad/solcalc/solareqns.PDF 及 https://pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/sun-position/basic-solar-position-models/ 。採標準緯度／赤緯／時角轉換，僅代表季節的場景太陽時間，不實作民用時區與折射。
Design inline審閱APPROVED：邊界及資料方向明確；使用既有光源和animation loop；不新增library；極地以向量避免除法奇異；相機俯視退化保留heading。
