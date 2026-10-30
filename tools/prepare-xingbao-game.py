"""Adapt the refined GLB to Cocos 3.8's supported vertex attributes."""
import json,struct
from pathlib import Path
root=Path(__file__).resolve().parent.parent
src=root/'art-source/xingbao-space-v5/xingbao-game-v5.glb'
b=src.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);tail=b[20+n:]
# Cocos unlit explicitly decodes vertex color as sRGB; glTF stores it linear.
tail=bytearray(tail)
for ai in {p['attributes']['COLOR_0'] for m in g['meshes'] for p in m['primitives'] if 'COLOR_0' in p['attributes']}:
 a=g['accessors'][ai];v=g['bufferViews'][a['bufferView']]
 width=3 if a['type']=='VEC3' else 4;fmt,size,scale={5126:('f',4,1),5123:('H',2,65535),5121:('B',1,255)}[a['componentType']];stride=v.get('byteStride',width*size);offset=8+v.get('byteOffset',0)+a.get('byteOffset',0)
 for i in range(a['count']):
  for j in range(3):
   at=offset+i*stride+j*size;x=struct.unpack_from('<'+fmt,tail,at)[0]/scale;x=12.92*x if x<=.0031308 else 1.055*x**(1/2.4)-.055;x=min(1,max(0,x))*scale;struct.pack_into('<'+fmt,tail,at,x if fmt=='f' else round(x))
for mesh in g['meshes']:
 for primitive in mesh['primitives']:
  for key in list(primitive['attributes']):
   if key.startswith('COLOR_') and key!='COLOR_0':del primitive['attributes'][key]
# Cocos uses core metallic/roughness PBR; retain those fallbacks.
unsupported={'KHR_materials_clearcoat','KHR_materials_specular','KHR_materials_sheen','KHR_materials_emissive_strength','KHR_materials_ior'}
g.setdefault('extensionsUsed',[]).append('KHR_materials_unlit')
for mat in g['materials']:
 mat.setdefault('extensions',{})['KHR_materials_unlit']={}
 if 'emissiveTexture' in mat:
  mat['pbrMetallicRoughness']={'baseColorTexture':mat.pop('emissiveTexture'),'metallicFactor':0,'roughnessFactor':1}
  mat.pop('emissiveFactor',None)
  mat.setdefault('extensions',{})['KHR_materials_unlit']={}
 for key in list(mat.get('extensions',{})):
  if key in unsupported:del mat['extensions'][key]
 if not mat.get('extensions'):mat.pop('extensions',None)
for key in ['extensionsUsed','extensionsRequired']:
 if key in g:
  g[key]=[x for x in g[key] if x not in unsupported]
  if not g[key]:del g[key]
j=json.dumps(g,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
out=struct.pack('<4sII',b'glTF',2,20+len(j)+len(tail))+struct.pack('<II',len(j),0x4e4f534a)+j+tail
(root/'assets/resources/characters/xingbao.glb').write_bytes(out)
print('Prepared Xingbao Space V5 for Cocos:',len(out),'bytes')
