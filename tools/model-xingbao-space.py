"""Editable geometric Xingbao space uniform, original construction from approved concept.
Blender 5.2: blender -b --python tools/model-xingbao-space.py
XB_RENDER=front,hero,side,back XB_SAMPLES=32 XB_RES=1000
"""
import bpy, math, os, json, random
import numpy as np
from mathutils import Vector, Quaternion
from mathutils.bvhtree import BVHTree
from pathlib import Path
from math import sin,cos,pi,sqrt
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'art-source/xingbao-space-v1'; PRE=ROOT/'previews/xingbao-space-v1'
OUT.mkdir(parents=True,exist_ok=True);PRE.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=int(os.getenv('XB_SAMPLES','32'));scene.cycles.use_denoising=True
scene.render.resolution_x=scene.render.resolution_y=int(os.getenv('XB_RES','1000'));scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.78,.86,1,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
char=bpy.data.collections.new('Xingbao_Space_Character');scene.collection.children.link(char)
studio=bpy.data.collections.new('Studio');scene.collection.children.link(studio)
def move(o,c=char):
 for cc in list(o.users_collection):cc.objects.unlink(o)
 c.objects.link(o)
def mat(name,color,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
cream=mat('Skin | warm ivory',(.96,.87,.72),.48);ivory=mat('Uniform | ivory',(.93,.88,.77),.63)
blue=mat('Uniform | sky blue',(.23,.52,.86),.55);blue2=mat('Uniform | powder blue trim',(.12,.34,.64),.48)
gold=mat('Emblem | champagne gold',(.88,.55,.15),.25,.65);ink=mat('Eye rims',(.016,.007,.009),.36)
mouthmat=mat('Mouth cavity',(.16,.014,.012),.7);tongue=mat('Tongue',(.85,.18,.19),.5)
white=mat('Eye catchlight',(1,.98,.92),.2);browmat=mat('Eyebrow',(.27,.10,.043),.65)
# Bone ownership is recorded per component; all geometry is exported as real meshes.
parts={}
def own(o,bone):parts[o.name]=bone;return o
def mesh(name,v,f,m,bone='Spine'):
 d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);char.objects.link(o)
 if m:d.materials.append(m)
 for p in d.polygons:p.use_smooth=True
 return own(o,bone)
def finish(o,name,m,bone):
 o.name=name;move(o);o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return own(o,bone)
def ell(name,loc,scale,m,bone='Spine',seg=32,rings=20):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc);o=finish(bpy.context.object,name,m,bone);o.scale=scale;return o
def bevelbox(name,loc,scale,r,m,bone='Spine'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=finish(bpy.context.object,name,m,bone);o.scale=scale
 bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=o.modifiers.new('Rounded moulding','BEVEL');mod.width=r;mod.segments=5;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name);return o
def cat(points,steps=8,closed=True):
 pts=[Vector(p) for p in points];out=[]
 for i in range(len(pts) if closed else len(pts)-1):
  a,b,c,d=[pts[j%len(pts)] if closed else pts[max(0,min(j,len(pts)-1))] for j in [i-1,i,i+1,i+2]]
  for k in range(steps):
   t=k/steps;out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
 if not closed:out.append(pts[-1])
 return out
def tube(name,pts,r,m,bone='Head',cyclic=False):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=3;d.use_fill_caps=True;s=d.splines.new('POLY');s.points.add(len(pts)-1)
 for p,co in zip(s.points,pts):p.co=(*co,1)
 s.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,d);char.objects.link(o);d.materials.append(m);return own(o,bone)
def star(name,loc,r,m,bone='Head',depth=.022):
 c=cat([(cos(pi/2+k*pi/4)*(r if k%2==0 else r*.36),sin(pi/2+k*pi/4)*(r if k%2==0 else r*.36)) for k in range(8)],4)
 v=[(0,-depth,0)];N=len(c);f=[]
 for fac,y in [(.45,-depth*.95),(.85,-depth*.5),(1,0),(.75,depth*.35)]:v.extend((p.x*fac,y,p.y*fac) for p in c)
 for k in range(N):f.append((0,1+k,1+(k+1)%N))
 for j in range(3):
  for k in range(N):a=1+j*N+k;b=1+j*N+(k+1)%N;f.append((a,a+N,b+N,b))
 f.append(tuple(reversed(range(1+3*N,1+4*N))));o=mesh(name,v,f,m,bone);o.location=loc;return o
# A custom continuous closed head volume; silhouette deliberately follows new front view.
outline=[(-.62,2.85),(-.70,2.88),(-.73,2.98),(-.70,3.10),(-.58,3.18),(-.43,3.18),(-.25,3.11),(-.03,2.94),(.20,2.79),(.43,2.73),(.66,2.76),(.85,2.75),(.91,2.66),(.85,2.50),(.74,2.37),(.77,2.18),(.74,1.98),(.63,1.82),(.43,1.72),(.15,1.67),(-.14,1.68),(-.39,1.76),(-.54,1.88),(-.63,2.03),(-.86,2.13),(-1.00,2.25),(-.94,2.36),(-.76,2.46),(-.59,2.61),(-.48,2.79),(-.47,2.90),(-.52,2.95),(-.58,2.94),(-.60,2.87)]
cont=cat(outline,5);DX=.014;xs=np.arange(-1.06,.97,DX);zs=np.arange(1.60,3.24,DX);X,Z=np.meshgrid(xs,zs);inside=np.zeros_like(X,dtype=bool)
for a,b in zip(cont,cont[1:]+cont[:1]):inside^=((a.y>Z)!=(b.y>Z))&(X<(b.x-a.x)*(Z-a.y)/(b.y-a.y+1e-15)+a.x)
h=np.zeros_like(X)
for it in range(1600):
 h[1:-1,1:-1]=(h[:-2,1:-1]+h[2:,1:-1]+h[1:-1,:-2]+h[1:-1,2:]+DX*DX)*.25;h*=inside
h=np.sqrt(np.maximum(h,0));h*=.48/h.max();v=[];f=[];idx={}
for j in range(len(zs)):
 for i in range(len(xs)):
  if inside[j,i]:
   for s in [0,1]:idx[j,i,s]=len(v);v.append((xs[i],-h[j,i] if s==0 else h[j,i]*.95,zs[j]))
for j in range(len(zs)-1):
 for i in range(len(xs)-1):
  q=[(j,i),(j+1,i),(j+1,i+1),(j,i+1)]
  if all((a,b,0) in idx for a,b in q):f.append(tuple(idx[a,b,0] for a,b in q));f.append(tuple(idx[a,b,1] for a,b in reversed(q)))
edges={}
for face in f[::2]:
 for a,b in zip(face,face[1:]+face[:1]):
  key=tuple(sorted((a,b)))
  if key in edges:del edges[key]
  else:edges[key]=(a,b)
for a,b in edges.values():f.append((b,a,a+1,b+1))
head=mesh('Head | continuous curled star sculpt',v,f,cream,'Head');bpy.context.view_layer.objects.active=head;head.select_set(True)
mod=head.modifiers.new('Closed smooth sculpt','REMESH');mod.mode='VOXEL';mod.voxel_size=.012;bpy.ops.object.modifier_apply(modifier=mod.name)
mod=head.modifiers.new('Relax silhouette','SMOOTH');mod.factor=.6;mod.iterations=65;bpy.ops.object.modifier_apply(modifier=mod.name)
mod=head.modifiers.new('Game surface density','DECIMATE');mod.ratio=.48;bpy.ops.object.modifier_apply(modifier=mod.name)
for p in head.data.polygons:p.use_smooth=True
bpy.context.view_layer.update();bvh=BVHTree.FromObject(head,bpy.context.evaluated_depsgraph_get())
def front(x,z):
 q,_,_,_=bvh.ray_cast(Vector((x,-3,z)),Vector((0,1,0)))
 if q is None:raise RuntimeError('Head projection missed '+str((x,z)))
 return q.y
# Vertex-colored blush is preserved by glTF export.
skin=cream.copy();skin.name='Skin | ivory with integrated blush';head.data.materials[0]=skin
attr=head.data.color_attributes.new(name='SkinColor',type='FLOAT_COLOR',domain='POINT')
for vtx in head.data.vertices:
 x,y,z=vtx.co;w=0
 if y<0:
  for cx in [-.48,.45]:w=max(w,math.exp(-2*(((x-cx)/.15)**2+((z-2.04)/.10)**2))*.73)
 attr.data[vtx.index].color=(*(a*(1-w)+b*w for a,b in zip((.96,.87,.72),(1,.32,.32))),1)
n=skin.node_tree.nodes;l=skin.node_tree.links;vc=n.new('ShaderNodeVertexColor');vc.layer_name='SkinColor';l.new(vc.outputs['Color'],n['Principled BSDF'].inputs['Base Color'])
star('Forehead gold star',(-.20,front(-.20,2.72)-.012,2.72),.13,gold)
# Packed iris texture, portable standard PBR; geometry conforms to curved head.
N=256;arr=np.zeros((N,N,4),dtype=np.float32)
for yy in range(N):
 for xx in range(N):
  u=(xx/(N-1)-.5)*2;w=(yy/(N-1)-.5)*2;r=sqrt(u*u+w*w);base=np.array([.035,.075,.23]);t=max(0,-w)*max(0,1-r*.45);c=base+np.array([.04,.58,.72])*t
  radial=(sin(math.atan2(w,u)*47+r*19)*.5+.5)*.025*max(0,1-r)*max(0,-w+.2);c+=radial
  arr[yy,xx]=(*c,1)
im=bpy.data.images.new('Sapphire_Iris',width=N,height=N,alpha=True);im.pixels.foreach_set(arr.ravel());im.filepath_raw=str(OUT/'iris.png');im.file_format='PNG';im.save();im.pack()
iris=mat('Eyes | sapphire gradient',(.01,.03,.1),.23);n=iris.node_tree.nodes;tx=n.new('ShaderNodeTexImage');tx.image=im;iris.node_tree.links.new(tx.outputs['Color'],n['Principled BSDF'].inputs['Base Color']);n['Principled BSDF'].inputs['Coat Weight'].default_value=.28
for side,cx in [('R',-.335),('L',.32)]:
 cz=2.27;rx=.184;rz=.225
 def ep(u,w,extra=0):
  x=cx+u*rx;z=cz+w*rz;return (x,front(x,z)-.016-.025*max(0,1-u*u-w*w)-extra,z)
 vs=[ep(0,0)];uvs=[(.5,.5)];fs=[];R=10;S=48
 for j in range(1,R+1):
  for k in range(S):a=k*2*pi/S;u=j/R*cos(a);w=j/R*sin(a);vs.append(ep(u,w));uvs.append(((u+1)/2,(w+1)/2))
 for k in range(S):fs.append((0,1+k,1+(k+1)%S))
 for j in range(R-1):
  for k in range(S):a=1+j*S+k;b=1+j*S+(k+1)%S;fs.append((a,b,b+S,a+S))
 eye=mesh('Eye.'+side,vs,fs,iris,'Head');uv=eye.data.uv_layers.new(name='UVMap')
 for poly in eye.data.polygons:
  for li in poly.loop_indices:uv.data[li].uv=uvs[eye.data.loops[li].vertex_index]
 tube('Eyelid rim.'+side,[ep(1.025*cos(k*2*pi/72),1.025*sin(k*2*pi/72),-.004) for k in range(72)],.009,ink,'Head',True)
 for u,w,r in [(-.22,.56,.041),(.45,.25,.013)]:ell('Catchlight.'+side,ep(u,w,.007),(r,.006,r*1.1),white,'Head',20,12)
 for u,w,r in [(.12,-.13,.033),(-.37,-.55,.024),(.48,-.48,.017)]:star('Iris sparkle.'+side,ep(u,w,.006),r,white if w<-.2 else gold,'Head',.002)
 # Eyebrows follow the forehead surface and remain simple geometry.
 pts=[]
 for t in np.linspace(0,1,18):
  x=cx-.078+.145*t;z=2.57+.021*sin(t*pi);pts.append((x,front(x,z)-.014,z))
 tube('Brow.'+side,pts,.012,browmat)
# Smile surface with rounded inner tongue, seated on head rather than floating disc.
c=cat([(-.13,2.13),(-.055,2.115),(.005,2.13),(.075,2.14),(.125,2.16),(.12,2.06),(.07,1.995),(0,1.98),(-.075,2.01),(-.12,2.07)],6)
vs=[(0,front(0,2.07)-.012,2.07)]+[(p.x,front(p.x,p.y)-.013,p.y) for p in c];fs=[(0,k+1,(k+1)%len(c)+1) for k in range(len(c))];mesh('Smile cavity',vs,fs,mouthmat,'Head')
ell('Smile tongue',(0,front(0,2.025)-.019,2.025),(.068,.012,.035),tongue,'Head')
# Torso rings: same surface, material regions instead of overlapping clothes.
S=64;profiles=[(.56,.30,.235),(.64,.43,.30),(.79,.48,.33),(1.00,.49,.34),(1.20,.46,.32),(1.36,.40,.28),(1.48,.30,.23),(1.53,.21,.18)]
vs=[];fs=[]
for z,rx,ry in profiles:
 for k in range(S):a=2*pi*k/S;vs.append((rx*cos(a),ry*sin(a),z + (.055*cos(a)**2 if 1.19<z<1.37 else 0)))
for j in range(len(profiles)-1):
 for k in range(S):a=j*S+k;b=j*S+(k+1)%S;fs.append((a,b,b+S,a+S))
fs.extend([tuple(reversed(range(S))),tuple((len(profiles)-1)*S+k for k in range(S))]);body=mesh('Uniform torso',vs,fs,ivory)
body.data.materials.append(blue)
for p in body.data.polygons:
 z=sum(body.data.vertices[i].co.z for i in p.vertices)/len(p.vertices);x=sum(body.data.vertices[i].co.x for i in p.vertices)/len(p.vertices)
 p.material_index=1 if z>1.23 or z<.73  else 0
mod=body.modifiers.new('Tailored smooth torso','SUBSURF');mod.levels=2;bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=mod.name)
# Curved sky-blue side inserts sit on the torso surface, no thick armor pieces.
bpy.context.view_layer.update();bodybvh=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
for sign in [-1,1]:
 contour=cat([(sign*.32,.82),(sign*.44,.82),(sign*.45,.94),(sign*.41,1.08),(sign*.32,1.15),(sign*.35,.99)],5)
 cx=sign*.385;cz=.97
 def bodypoint(x,z):
  q,_,_,_=bodybvh.ray_cast(Vector((x,-2,z)),Vector((0,1,0)))
  return (x,q.y-.012,z)
 pv=[bodypoint(cx,cz)];pf=[];nn=len(contour)
 for j in range(1,13):
  t=j/12
  for p in contour:pv.append(bodypoint(cx+(p.x-cx)*t,cz+(p.y-cz)*t))
 for k in range(nn):pf.append((0,k+1,(k+1)%nn+1))
 for j in range(11):
  for k in range(nn):a=1+j*nn+k;b=1+j*nn+(k+1)%nn;pf.append((a,b,b+nn,a+nn))
 mesh('Curved blue waist inset '+str(sign),pv,pf,blue)
# Low collar, shaped as two curved ivory flaps over a blue collar base.
tube('Collar blue inner rim',[(.235*cos(a),.18*sin(a),1.50) for a in np.linspace(0,2*pi,72)],.037,blue2,'Spine',True)
for s in [-1,1]:
 pts=[(s*.02,-.26,1.33),(s*.11,-.255,1.38),(s*.23,-.20,1.46),(s*.23,-.09,1.51)]
 path=cat(pts,8,False);v=[];f=[]
 for j,p in enumerate(path):
  t=j/(len(path)-1);w=.025+.038*sin(pi*t)
  for k in range(8):a=2*pi*k/8;v.append((p.x+w*cos(a),p.y+.018*sin(a),p.z+.028*cos(a)))
 for j in range(len(path)-1):
  for k in range(8):a=j*8+k;b=j*8+(k+1)%8;f.append((a,b,b+8,a+8))
 mesh('Collar ivory flap '+str(s),v,f,ivory)
# Rounded shoulder/sleeve volumes and attached cream mittens; bone-jointed components.
def segment(name,a,b,r1,r2,m,bone,N=32):
 a=Vector(a);b=Vector(b);d=(b-a).normalized();u=d.cross(Vector((0,1,0))).normalized();w=d.cross(u).normalized();vs=[];fs=[]
 for j in range(9):
  t=j/8;p=a.lerp(b,t);r=(r1*(1-t)+r2*t)*(1+.07*sin(pi*t))
  for k in range(N):q=p+r*(cos(k*2*pi/N)*u+sin(k*2*pi/N)*w);vs.append(q)
 for j in range(8):
  for k in range(N):i=j*N+k;n=j*N+(k+1)%N;fs.append((i,n,n+N,i+N))
 fs.extend([tuple(reversed(range(N))),tuple(8*N+k for k in range(N))]);return mesh(name,vs,fs,m,bone)
for s,label in [(-1,'R'),(1,'L')]:
 bone='Arm.'+label;shoulder=(s*.35,0,1.34);elbow=(s*.64,-.005,1.15);wrist=(s*.76,-.01,1.04)
 ell('Shoulder.'+label,shoulder,(.22,.205,.22),blue,bone)
 segment('Sleeve.'+label,shoulder,elbow,.205,.157,blue,bone)
 segment('Cuff.'+label,(s*.60,-.004,1.19),(s*.66,-.006,1.13),.165,.165,blue2,bone)
 o=ell('Mitten.'+label,(s*.744,-.015,1.04),(.145,.145,.205),cream,bone);o.rotation_euler[1]=s*-.63
 ell('Thumb.'+label,(s*.69,-.127,1.095),(.067,.06,.089),cream,bone)
 bone='Leg.'+label
 segment('Trouser.'+label,(s*.235,.015,.70),(s*.25,.0,.38),.225,.19,blue,bone)
 # Boot and sole: flattened rounded shapes, no floating leg pieces.
 bootrings=[(.035,.185,.245),(.055,.216,.278),(.10,.219,.28),(.19,.211,.27),(.28,.19,.22),(.35,.18,.18),(.40,.18,.18)]
 bv=[];bf=[]
 for zz,rx,ry in bootrings:
  for k in range(40):
   a=k*2*pi/40;bv.append((s*.255+rx*cos(a),-.055+ry*sin(a),zz))
 for j in range(len(bootrings)-1):
  for k in range(40):a=j*40+k;b=j*40+(k+1)%40;bf.append((a,b,b+40,a+40))
 bf.extend([tuple(reversed(range(40))),tuple(240+k for k in range(40))])
 boot=mesh('Boot.'+label,bv,bf,ivory,bone);boot.data.materials.append(blue);boot.data.materials.append(blue2)
 for poly in boot.data.polygons:
  center=sum((boot.data.vertices[i].co for i in poly.vertices),Vector())/len(poly.vertices)
  poly.material_index=2 if center.z<.10 else 0
 mod=boot.modifiers.new('Smooth boot silhouette','SUBSURF');mod.levels=1;bpy.context.view_layer.objects.active=boot;bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.context.view_layer.update();bootbvh=BVHTree.FromObject(boot,bpy.context.evaluated_depsgraph_get())
 def bootpoint(u,w):
  xx=s*.255+u*.165;zz=.18+w*.08;q,_,_,_=bootbvh.ray_cast(Vector((xx,-2,zz)),Vector((0,1,0)))
  return(xx,q.y-.007,zz)
 pv=[bootpoint(0,0)];pf=[]
 for j in range(1,7):
  for k in range(40):a=k*2*pi/40;pv.append(bootpoint(j/6*cos(a),j/6*sin(a)))
 for k in range(40):pf.append((0,k+1,(k+1)%40+1))
 for j in range(5):
  for k in range(40):a=1+j*40+k;b=1+j*40+(k+1)%40;pf.append((a,b,b+40,a+40))
 mesh('Boot curved toe panel.'+label,pv,pf,blue,bone)
 segment('Boot cuff.'+label,(s*.25,-.025,.35),(s*.25,-.025,.415),.193,.193,blue,bone)
# Waist band follows elliptical torso.
tube('Waist integrated band',[(.456*cos(a),.318*sin(a),.73) for a in np.linspace(0,2*pi,96)],.025,blue2,'Spine',True)
bevelbox('Chest emblem ivory mount',(0,-.322,1.28),(.29,.075,.29),.07,ivory)
ell('Chest emblem blue inset',(0,-.369,1.28),(.113,.016,.113),blue,'Spine')
star('Chest emblem star',(0,-.395,1.28),.085,gold,'Spine',.022)
# Single tool pod on anatomical left hip; round shallow molded container.
bevelbox('Hip tool pod',( .49,-.045,.79),(.16,.235,.27),.058,blue,'Spine')
bevelbox('Hip pod closure',(.577,-.06,.82),(.022,.137,.045),.014,ivory,'Spine')
o=star('Shoulder mission star',(-.44,-.176,1.39),.055,gold,'Arm.R',.009);o.rotation_euler[1]=-.3
# Convert, apply transforms, normal correction. Join by bone/material for sensible draw count.
bpy.ops.object.select_all(action='DESELECT')
for o in list(char.objects):
 if o.type not in {'MESH','CURVE'}:continue
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 if o.type=='CURVE':bpy.ops.object.convert(target='MESH')
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
# Seat head against collar, matching the approved compact silhouette.
for o in char.objects:
 if o.type=='MESH' and parts.get(o.name)=='Head':
  for v in o.data.vertices:v.co.z-=.15
# Minimal deformation rig, easy to refine in Blender. Fixed accessories move with their body bone.
arm=bpy.data.armatures.new('Xingbao_Skeleton');rig=bpy.data.objects.new('Xingbao_Rig',arm);char.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
bones=[('Root',(0,0,0),(0,0,.25),None),('Spine',(0,0,.65),(0,0,1.48),'Root'),('Head',(0,0,1.48),(0,0,2.45),'Spine'),('Arm.R',(-.35,0,1.34),(-.77,0,1.04),'Spine'),('Arm.L',(.35,0,1.34),(.77,0,1.04),'Spine'),('Leg.R',(-.235,0,.68),(-.255,0,.15),'Root'),('Leg.L',(.235,0,.68),(.255,0,.15),'Root')]
for name,h,t,parent in bones:
 b=arm.edit_bones.new(name);b.head=h;b.tail=t
 if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
for o in list(char.objects):
 if o.type!='MESH':continue
 bone=parts[o.name];vg=o.vertex_groups.new(name=bone);vg.add(list(range(len(o.data.vertices))),1,'REPLACE');o.parent=rig
 mod=o.modifiers.new('Xingbao armature','ARMATURE');mod.object=rig
# Consolidate all meshes. Material slots remain separate, rig retained.
bpy.ops.object.select_all(action='DESELECT');objs=[o for o in char.objects if o.type=='MESH']
for o in objs:o.select_set(True)
bpy.context.view_layer.objects.active=head;bpy.ops.object.join();character=bpy.context.object;character.name='Xingbao_Space_Mesh';character.select_set(False)
mod=character.modifiers.new('Realtime density optimization','DECIMATE');mod.ratio=.57;bpy.context.view_layer.objects.active=character;bpy.ops.object.modifier_apply(modifier=mod.name)
def turn_arm(label,angle):
 pb=rig.pose.bones['Arm.'+label];axis=pb.bone.matrix_local.to_3x3().inverted()@Vector((0,1,0));pb.rotation_euler=Quaternion(axis,angle).to_euler()
# Three looping/action samples; preserve neutral bind pose in source.
scene.render.fps=30
for name,end,kind in [('Idle',90,'idle'),('Wave',60,'wave'),('Celebrate',60,'celebrate')]:
 rig.animation_data_create();action=bpy.data.actions.new(name);rig.animation_data.action=action
 for frame in range(1,end+1,3):
  t=(frame-1)/(end-1)*2*pi
  for pb in rig.pose.bones:pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
  rig.pose.bones['Spine'].rotation_euler[1]=.025*sin(t);rig.pose.bones['Head'].rotation_euler[1]=.035*sin(t+.5)
  if kind=='wave':turn_arm('L',-.9+.22*sin(t*3))
  if kind=='celebrate':
   turn_arm('L',-1.);turn_arm('R',1.);rig.pose.bones['Root'].location.y=.12*(1-cos(t*2));rig.pose.bones['Head'].rotation_euler[0]=.07*sin(t*2)
  for pb in rig.pose.bones:pb.keyframe_insert('rotation_euler',frame=frame);pb.keyframe_insert('location',frame=frame)
 # Explicit final key matches first for loop continuity.
 scene.frame_set(1)
 for pb in rig.pose.bones:pb.keyframe_insert('rotation_euler',frame=end);pb.keyframe_insert('location',frame=end)
 track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action);track.mute=True
 rig.animation_data.action=None
for pb in rig.pose.bones:pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
scene.frame_set(1)
# Export before studio creation; retain standard PBR and embedded iris image.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);character.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(OUT/'xingbao-space-v1.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_skins=True,export_yup=True)
# Review stage is excluded from exported file.
floorMat=mat('Studio ivory',(.83,.80,.72),.8)
n=floorMat.node_tree.nodes;l=floorMat.node_tree.links;p=n['Principled BSDF'];out=n['Material Output'];ao=n.new('ShaderNodeAmbientOcclusion');ao.inputs['Color'].default_value=(.95,.90,.81,1);ao.inputs['Distance'].default_value=.6
em=n.new('ShaderNodeEmission');em.inputs['Strength'].default_value=1.;l.new(ao.outputs['Color'],em.inputs['Color']);lp=n.new('ShaderNodeLightPath');mix=n.new('ShaderNodeMixShader');l.new(lp.outputs['Is Camera Ray'],mix.inputs[0]);l.new(p.outputs[0],mix.inputs[1]);l.new(em.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],out.inputs['Surface'])
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;move(floor,studio);floor.data.materials.append(floorMat)
def area(name,loc,power,size,color):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);studio.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1.6))-o.location).to_track_quat('-Z','Y').to_euler()
area('Key',(-3,-4,6),500,4,(1,.90,.78));area('Fill',(3,-4,3.5),230,3,(.78,.87,1));area('Rim',(2,3,5),650,3,(1,.92,.8))
camd=bpy.data.cameras.new('ReviewCamera');cam=bpy.data.objects.new('ReviewCamera',camd);studio.objects.link(cam);scene.camera=cam;camd.type='ORTHO';camd.ortho_scale=3.75
views={'front':((0,-9,2.2),(0,0,1.55)),'hero':((3,-8,3.2),(0,0,1.65)),'side':((8,0,2.2),(0,0,1.55)),'back':((0,9,2.2),(0,0,1.55))}
def camera(name):
 loc,target=views[name];cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.data.images.load(str(OUT/'approved-concept.png')).pack()
camera('hero');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'xingbao-space-v1.blend'))
for name in os.getenv('XB_RENDER','front,hero,side,back').split(','):
 if not name:continue
 camera(name);scene.render.filepath=str(PRE/(name+'.png'));bpy.ops.render.render(write_still=True)
character.data.calc_loop_triangles();report={'triangles':len(character.data.loop_triangles),'vertices':len(character.data.vertices),'materials':len(character.data.materials),'bones':len(arm.bones),'animations':['Idle','Wave','Celebrate'],'reference':'approved-concept.png','source':'Real Blender geometry, not image projection','limitations':['Component-based rig; shoulder deformation needs animation review','No facial blendshapes yet','Concept multi-view differences resolved in actual geometry']}
(OUT/'model-report.json').write_text(json.dumps(report,indent=2));print('SPACE_MODEL_COMPLETE',report,flush=True)
