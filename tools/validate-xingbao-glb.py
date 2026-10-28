"""Structural checks for a self-contained static review GLB."""
import json,struct,hashlib,math
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'art-source/xingbao-v3'
p=OUT/'xingbao-review-v3.glb';data=p.read_bytes();magic,version,length=struct.unpack_from('<4sII',data)
assert magic==b'glTF' and version==2 and length==len(data)
n,kind=struct.unpack_from('<II',data,12);assert kind==0x4e4f534a
g=json.loads(data[20:20+n]);start=20+n;bn,btype=struct.unpack_from('<II',data,start);assert btype==0x004e4942
binary=memoryview(data)[start+8:start+8+bn];assert len(binary)==bn
assert all('uri' not in b for b in g.get('buffers',[]))
for view in g.get('bufferViews',[]):assert view.get('byteOffset',0)+view['byteLength']<=bn
for image in g.get('images',[]):assert 'bufferView' in image and 'uri' not in image
sizes={5121:1,5123:2,5125:4,5126:4};formats={5121:'B',5123:'H',5125:'I',5126:'f'}
def elements(aidx,width):
 a=g['accessors'][aidx];v=g['bufferViews'][a['bufferView']];fmt=formats[a['componentType']];sz=sizes[a['componentType']];stride=v.get('byteStride',width*sz);offset=v.get('byteOffset',0)+a.get('byteOffset',0)
 return [struct.unpack_from('<'+fmt*width,binary,offset+i*stride) for i in range(a['count'])]
triangles=0;vertices=0
for m in g['meshes']:
 for prim in m['primitives']:
  pos=elements(prim['attributes']['POSITION'],3);assert all(math.isfinite(c) for xyz in pos for c in xyz);vertices+=len(pos)
  if 'indices' in prim:
   inds=elements(prim['indices'],1);assert max(x[0] for x in inds)<len(pos)
   if prim.get('mode',4)==4:assert len(inds)%3==0;triangles+=len(inds)//3
r={'header_and_chunks':'pass','finite_positions':'pass','triangle_indices':'pass','embedded_images':'pass','external_dependencies':0,'bytes':len(data),'meshes':len(g['meshes']),'materials':len(g['materials']),'images':len(g.get('images',[])),'triangles':triangles,'vertices':vertices,'animations':len(g.get('animations',[])),'sha256':hashlib.sha256(data).hexdigest()}
(OUT/'validation.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
