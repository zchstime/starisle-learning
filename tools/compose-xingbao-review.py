"""Contact sheets of actual model renders; no generated replacement of geometry."""
from PIL import Image,ImageOps,ImageDraw,ImageFont
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;PRE=ROOT/'previews/xingbao-space-v2'
font='/System/Library/Fonts/STHeiti Light.ttc'
def f(n):return ImageFont.truetype(font,n)
bg=(249,247,242);ink=(43,74,100);muted=(114,119,122)
# Eight facial states, including independently rendered mouth shapes.
items=[('front','自然微笑'),('happy','开心笑眼'),('think','好奇思考'),('focus','专注挑战'),('blink','完整眨眼'),('surprise','惊讶'),('talk-a','A 口型'),('talk-o','O 口型')]
w,h=1720,970;sheet=Image.new('RGB',(w,h),bg);d=ImageDraw.Draw(sheet);d.text((45,25),'星宝 · 实际 3D 表情对照',font=f(34),fill=ink);d.text((45,72),'由最终 GLB 回导后设置真实表情变形并渲染',font=f(20),fill=muted)
for i,(name,label) in enumerate(items):
 im=Image.open(PRE/('glb-'+name+'.png')).convert('RGB').crop((145,55,855,580));im=ImageOps.contain(im,(390,310),Image.Resampling.LANCZOS)
 x=40+(i%4)*420;y=125+(i//4)*405;sheet.paste(im,(x+(390-im.width)//2,y));d.text((x+195,y+325),label,font=f(26),fill=ink,anchor='mt')
sheet.save(PRE/'expressions.jpg',quality=95)
# Reference and both actual model generations, shown as an inspection aid.
sheet=Image.new('RGB',(1500,1030),bg);d=ImageDraw.Draw(sheet);d.text((40,25),'星宝 · 外观还原对照',font=f(34),fill=ink);d.text((40,75),'左为定稿正面参考，中、右为实际导出模型渲染；各自保留原始比例',font=f(20),fill=muted)
images=[Image.open(ROOT/'art-source/xingbao-space-v2/approved-concept.png').crop((790,205,1100,625)),Image.open(ROOT/'previews/xingbao-space-v1/glb-front.png').crop((150,50,850,970)),Image.open(PRE/'glb-front.png').crop((150,50,850,950))]
for i,(im,label) in enumerate(zip(images,['定稿参考','上一版 v1','外观与表情精修 v2'])):
 im=ImageOps.contain(im.convert('RGB'),(450,790),Image.Resampling.LANCZOS);x=25+i*495;sheet.paste(im,(x+(450-im.width)//2,150+790-im.height));d.text((x+225,965),label,font=f(27),fill=ink,anchor='mt')
sheet.save(PRE/'reference-comparison.jpg',quality=95)
# Three dimensional volume check from reimported geometry.
sheet=Image.new('RGB',(1600,690),bg);d=ImageDraw.Draw(sheet);d.text((35,20),'星宝 · 实际模型四视角',font=f(32),fill=ink)
for i,(name,label) in enumerate([('front','正面'),('hero','招手姿态'),('side','侧面'),('back','背面')]):
 im=Image.open(PRE/('glb-'+name+'.png')).convert('RGB');im=ImageOps.contain(im,(390,555),Image.Resampling.LANCZOS);x=5+400*i;sheet.paste(im,(x+(390-im.width)//2,75));d.text((x+195,630),label,font=f(26),fill=ink,anchor='mt')
sheet.save(PRE/'multiview.jpg',quality=95)
print('Contact sheets saved')
