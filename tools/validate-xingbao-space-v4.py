"""Structural checks for a self-contained refined GLB including facial morphs."""
import json,struct,hashlib,math
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'art-source/xingbao-space-v4'
p=OUT/'xingbao-space-v4.glb';data=p.read_bytes();magic,version,length=struct.unpack_from('<4sII',data)
assert magic==b'glTF' and version==2 and length==len(data)
n,kind=struct.unpack_from('<II',data,12);assert kind==0x4e4f534a
g=json.loads(data[20:20+n]);start=20+n;bn,btype=struct.unpack_from('<II',data,start);assert btype==0x004e4942
binary=memoryview(data)[start+8:start+8+bn];assert len(binary)==bn
assert all('uri' not in b for b in g.get('buffers',[]))
for view in g.get('bufferViews',[]):assert view.get('byteOffset',0)+view['byteLength']<=bn
for image in g.get('images',[]):assert 'bufferView' in image and 'uri' not in image
sizes={5121:1,5123:2,5125:4,5126:4};formats={5121:'B',5123:'H',5125:'I',5126:'f'}
def elements(aidx,width):
 a=g['accessors'][aidx];fmt=formats[a['componentType']];sz=sizes[a['componentType']]
 result=[tuple(0 for _ in range(width)) for _ in range(a['count'])]
 if 'bufferView' in a:
  v=g['bufferViews'][a['bufferView']];stride=v.get('byteStride',width*sz);offset=v.get('byteOffset',0)+a.get('byteOffset',0)
  result=[struct.unpack_from('<'+fmt*width,binary,offset+i*stride) for i in range(a['count'])]
 if 'sparse' in a:
  sp=a['sparse'];ii=sp['indices'];iv=g['bufferViews'][ii['bufferView']];io=iv.get('byteOffset',0)+ii.get('byteOffset',0);ic=ii['componentType'];vv=sp['values'];view=g['bufferViews'][vv['bufferView']];vo=view.get('byteOffset',0)+vv.get('byteOffset',0)
  for i in range(sp['count']):
   j=struct.unpack_from('<'+formats[ic],binary,io+i*sizes[ic])[0];assert j<a['count'];result[j]=struct.unpack_from('<'+fmt*width,binary,vo+i*sz*width)
 return result
triangles=0;vertices=0
for m in g['meshes']:
 for prim in m['primitives']:
  pos=elements(prim['attributes']['POSITION'],3);assert all(math.isfinite(c) for xyz in pos for c in xyz);vertices+=len(pos)
  if 'indices' in prim:
   inds=elements(prim['indices'],1);assert max(x[0] for x in inds)<len(pos)
   if prim.get('mode',4)==4:assert len(inds)%3==0;triangles+=len(inds)//3
assert len(g.get('skins',[]))==1
assert {'Idle','Wave','Celebrate','Blink','Happy','Think','Focus','Surprise','Talk_A','Talk_O'} <= {a['name'] for a in g.get('animations',[])}
for skin in g['skins']:
 assert all(0<=j<len(g['nodes']) for j in skin['joints'])
 for row in elements(skin['inverseBindMatrices'],16):assert all(math.isfinite(x) for x in row)
for m in g['meshes']:
 for prim in m['primitives']:
  weights=elements(prim['attributes']['WEIGHTS_0'],4);joints=elements(prim['attributes']['JOINTS_0'],4)
  assert all(abs(sum(w)-1)<.001 for w in weights)
  assert all(0<=j<len(g['skins'][0]['joints']) for row in joints for j in row)
for a in g['animations']:
 for sm in a['samplers']:
  times=[r[0] for r in elements(sm['input'],1)];assert all(b>a for a,b in zip(times,times[1:]));assert times[-1]>times[0]
  accessor=g['accessors'][sm['output']];width={'SCALAR':1,'VEC3':3,'VEC4':4}[accessor['type']]
  assert all(math.isfinite(x) for row in elements(sm['output'],width) for x in row)
morphs={}
for m in g['meshes']:
 names=m.get('extras',{}).get('targetNames',[])
 if not names:continue
 morphs[m['name']]=names
 for prim in m['primitives']:
  count=g['accessors'][prim['attributes']['POSITION']]['count']
  assert len(prim['targets'])==len(names)
  for target in prim['targets']:
   for attr,aidx in target.items():
    assert g['accessors'][aidx]['count']==count
    assert all(math.isfinite(x) for row in elements(aidx,3) for x in row)
assert any({'Blink_L','Blink_R','Happy','Think','Focus','Surprise','Talk_A','Talk_O'} <= set(names) for names in morphs.values())
for m in g['meshes']:
 for prim in m['primitives']:
  material=g['materials'][prim['material']];pbr=material.get('pbrMetallicRoughness',{})
  if 'baseColorTexture' in pbr:
   assert 'TEXCOORD_0' in prim['attributes']
   uv=elements(prim['attributes']['TEXCOORD_0'],2)
   assert max(x[0] for x in uv)-min(x[0] for x in uv)>.1
   assert max(x[1] for x in uv)-min(x[1] for x in uv)>.1
r={'morph_targets':'pass','morph_names':morphs,'texture_coordinates':'pass','skin_weights':'pass','animation_channels':'pass','bones':len(g['skins'][0]['joints']),'header_and_chunks':'pass','finite_positions':'pass','triangle_indices':'pass','embedded_images':'pass','external_dependencies':0,'bytes':len(data),'meshes':len(g['meshes']),'materials':len(g['materials']),'images':len(g.get('images',[])),'triangles':triangles,'vertices':vertices,'animations':len(g.get('animations',[])),'sha256':hashlib.sha256(data).hexdigest()}
(OUT/'validation.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
