const fs=require('node:fs'),path=require('node:path');const out=path.resolve(__dirname,'../build/web-desktop');const p=path.join(out,'index.html');
let html=fs.readFileSync(p,'utf8');
html=html.replace(/<title>.*?<\/title>/,'<title>星屿学园 · 全学科探索</title>').replace('name="screen-orientation" content="portrait"','name="screen-orientation" content="landscape"').replace('cc_exact_fit_screen="false"','cc_exact_fit_screen="true"');
if(!html.includes('id="starisle-shell"'))html=html.replace('</head>',`<style id="starisle-shell">html,body{margin:0!important;padding:0!important;width:100%;height:100%;overflow:hidden;background:#B7E5E9!important}h1.header,p.footer{display:none!important}#GameDiv{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;margin:0!important;border:0!important;box-shadow:none!important}#Cocos3dGameContainer{width:100%;height:100%}canvas{outline:0!important;touch-action:none}#rotate-tip{display:none;position:fixed;bottom:18px;left:10%;width:80%;box-sizing:border-box;padding:16px 20px;border-radius:20px;background:#fffdf5;color:#173f4c;font:600 17px system-ui;text-align:center;pointer-events:none;box-shadow:0 4px 24px #173f4c22}@media(orientation:portrait) and (max-width:700px){#rotate-tip{display:block}}</style></head>`);
if(!html.includes('id="rotate-tip"'))html=html.replace('</body>','<div id="rotate-tip">↻ 横过来玩，星光积木看得更清楚</div></body>');fs.writeFileSync(p,html);
console.log('Prepared responsive game shell');

fs.cpSync(path.resolve(__dirname,'../web/auth'),path.join(out,'auth'),{recursive:true});
fs.copyFileSync(path.resolve(__dirname,'../assets/resources/art/island.png'),path.join(out,'auth/island.png'));
fs.copyFileSync(path.resolve(__dirname,'../assets/resources/art/guide.png'),path.join(out,'auth/guide.png'));
if(!html.includes('/auth/loading.css'))html=html.replace('</head>','<link rel="stylesheet" href="/auth/loading.css"><link rel="stylesheet" href="/auth/auth.css"></head>');
if(!html.includes('/auth/auth.js'))html=html.replace('<body>','<body><script src="/auth/loading.js"></script><script src="/auth/cloud.js"></script><script src="/auth/profile.js"></script><script src="/auth/auth.js"></script>');
fs.writeFileSync(p,html);

// Photo learning is a scene-owned home action in JourneyMap, not a global floating link.

// Disable the engine splash in each generated Web settings file. Keep this in
// the build hook so rebuilding in Creator cannot restore the official logo.
let splashCount=0;
for(const name of fs.readdirSync(path.join(out,'src'))){
 if(!/^settings(?:\.[\w-]+)?\.json$/.test(name))continue;
 const file=path.join(out,'src',name),settings=JSON.parse(fs.readFileSync(file,'utf8'));
 settings.splashScreen={...settings.splashScreen,totalTime:0,logo:{type:'none'},watermarkLocation:'none'};
 fs.writeFileSync(file,JSON.stringify(settings));splashCount++;
}
if(!splashCount)throw new Error('No Cocos Web settings found: splash removal was not applied');
console.log('Disabled Cocos launch splash in '+splashCount+' Web settings file(s)');

require('./prepare-picture.cjs');
// Physics playground: local open-source engine and CC0 models, no runtime CDN.
fs.cpSync(path.resolve(__dirname,'../web/arcade'),path.join(out,'arcade'),{recursive:true});
if(!html.includes('/arcade/launcher.js'))html=html.replace('</body>','<script src="/arcade/launcher.js"></script></body>');
fs.writeFileSync(p,html);

fs.cpSync(path.resolve(__dirname,'../web/stages'),path.join(out,'stages'),{recursive:true});
fs.copyFileSync(path.resolve(__dirname,'../assets/resources/art/planet.png'),path.join(out,'stages/planet.png'));
if(!html.includes('/stages/stages.css'))html=html.replace('</head>','<link rel="stylesheet" href="/stages/stages.css"></head>');
if(!html.includes('/stages/stages.js'))html=html.replace('<body>','<body><script src="/stages/stages.js"></script>');
fs.writeFileSync(p,html);

// Shared authenticated dialogue shell. API and assets are served by the Node companion handler.
require('./build-companion.cjs');
if(!html.includes('/companion/app.js'))html=html.replace('</body>','<script src="/companion/app.js"></script></body>');
fs.writeFileSync(p,html);
