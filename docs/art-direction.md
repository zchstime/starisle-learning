# 原创美术记录

生成方式：OpenAI 内置 imagegen 工具。2026-10-27。两幅最终原图已复制到工程资源目录，运行时不依赖外部生成目录。参考用户上传的明亮、柔和、奶油石材、金色细节、浮岛与陪伴角色的方向；没有将参考图直接当作游戏背景。

## 岛屿背景

文件：`assets/resources/art/island.png`。

最终提示词：

Use case: stylized-concept. Asset type: production background art for a Cocos 2.5D educational adventure game, landscape 16:9. Create a polished charming floating island in a luminous turquoise sea and soft blue sky with fluffy clouds, toy-like premium 3D animation art, warm creamy stone, lush rounded mint green foliage, tiny white flowers, golden accents, soft ambient occlusion. Elevated isometric camera. Island occupies middle 80% of image with open sky at top 18% for game HUD, clear path and water in bottom 20% for overlay UI. Layout for clickable game landmarks: left third at 35% height a small cream observatory with brass telescope and turquoise rounded roof; center at 42% height a circular tranquil lagoon and curved footbridge; right third at 30% height a large lush magical tree with warm glowing star fruit; right at 65% height a cream stone circular portal with subtle lavender glow; left at 65% height an open little research camp with books and weather instruments. A winding pale sand path connects these places. Distant tiny floating islets and waterfalls. Bright morning daylight, inviting calm sense of discovery. Original scene inspired by cozy educational fantasy island games. No characters, absolutely no text, no letters, no labels, no buttons, no HUD, no watermark. All locations visible, crisp high quality detailed environment, not a UI mockup. Save generated asset for project use.

实际产出中地标位置与提示不完全一致，游戏热点按实际画面安排。

## 星宝向导

文件：`assets/resources/art/guide.png`。透明背景保留。

最终提示词：

Use case: stylized-concept. Asset type: transparent game character sprite, original friendly little guide for a floating-island learning adventure. Single full body character centered with generous transparent margins, facing slightly right toward viewer. A tiny cream-white round star spirit with TWO large shiny midnight blue eyes, coral cheeks, small happy smile, stubby feet, wearing a short teal explorer cape with gold star clasp and holding a small brass lantern with warm star light. Charming high-end soft toy-like 3D animated film render, warm natural lighting from upper left, ivory, mint, teal and soft gold palette, smooth tactile surfaces, adorable but sophisticated, clear silhouette. Full body visible. No background, no pedestal, no environment, no text or watermark, no other objects or characters. Actual transparent alpha background. Production sprite to be composited on a bright cozy 2.5D island map.

## 代码绘制资产

星光十进位积木、星章、花盆、微粒和 UI 均由 Cocos Graphics 原生绘制，可以随游戏状态改变。角色浮动、地图移动、信标和庆祝效果由 Tween 驱动。短音效为数学合成音，无第三方音乐素材。
