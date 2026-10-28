# 学科浮岛背景 · 2026-10-28

内置imagegen创作10套学科背景，保存assets/resources/art/world-subject-*.png，提示词与来源记录见subject-art-prompts.json。数学保留六套年级地图，其他学科使用独立主题图，年级切换保留六套路径坐标；当前不是66套独立背景。新增SubjectWorlds统一解析首页、游戏和目录主题。按需缓存，销毁场景及过期异步回调不覆盖新场景。

test-subject-worlds验证66组映射及全部资源；test-map-layout验证六套布局；Cocos构建通过。实际切换科学、英语、音乐显示相应主题，截图qa/subject-worlds；后续语文试玩亦通过，截图qa/play-lab/restored.png。未外网发布。
