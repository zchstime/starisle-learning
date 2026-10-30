"""Xingbao detailed sculpt v2: measured concept silhouette, continuous uniform, facial morphs.
blender -b --python tools/model-xingbao-space-v2.py
XB_VIEWS=hero,front,side,back XB_RES=1100 XB_SAMPLES=40
"""
import bpy, math, os, json, random
import numpy as np
from pathlib import Path
from math import sin,cos,pi,sqrt
from mathutils import Vector, Quaternion
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'art-source/xingbao-space-v2';PRE=ROOT/'previews/xingbao-space-v2'
OUT.mkdir(parents=True,exist_ok=True);PRE.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=int(os.getenv('XB_SAMPLES','40'));scene.cycles.use_denoising=True
scene.render.resolution_x=scene.render.resolution_y=int(os.getenv('XB_RES','1100'));scene.render.resolution_percentage=100
scene.render.fps=30;scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.76,.84,1,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.17
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.3
char=bpy.data.collections.new('XINGBAO | blue explorer refined');scene.collection.children.link(char)
studio=bpy.data.collections.new('STUDIO | not exported');scene.collection.children.link(studio)
parts={};face_parts=[];EXP=['Blink_L','Blink_R','Happy','Think','Focus','Surprise','Talk_A','Talk_O']
def linear(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def rgb(c):return tuple(linear(x) for x in c)
def mat(name,c,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*rgb(c),1);p=m.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=m.diffuse_color;p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
skin=mat('01 Cream soft skin',(.985,.923,.82),.43);cloth=mat('02 Uniform ivory cloth',(.98,.948,.884),.66)
blue=mat('03 Sky blue cloth',(.28,.57,.93),.56);trim=mat('04 Deep powder blue',(.15,.43,.84),.51)
gold=mat('05 Warm gold',(.98,.70,.28),.27,.55);ink=mat('06 Natural upper lash',(.12,.055,.026),.32)
sclera=mat('07 Warm ivory eye edge',(1,.97,.88),.3);mouthmat=mat('08 Mouth interior',(.31,.045,.042),.66);tongue=mat('09 Tongue',(.98,.33,.39),.5)
browmat=mat('10 Eyebrows',(.43,.20,.085),.6);white=mat('11 Softbox catchlight',(1,1,.98),.12)
p=skin.node_tree.nodes['Principled BSDF'];p.inputs['Subsurface Weight'].default_value=.07;p.inputs['Subsurface Radius'].default_value=(1,.5,.24);p.inputs['Subsurface Scale'].default_value=.04
for m in [skin,cloth,blue,trim]:
 n=m.node_tree.nodes;l=m.node_tree.links;p=n['Principled BSDF'];tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=230;tex.inputs['Detail'].default_value=2
 bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.18 if m==skin else .15;bump.inputs['Distance'].default_value=.004 if m==skin else .002;l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal']);p.inputs['Sheen Weight'].default_value=.15

def move(o,col=char):
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o)
def own(o,bone='Spine'):parts[o.name]=bone;return o
def mesh(name,vs,fs,m,bone='Spine'):
 d=bpy.data.meshes.new(name);d.from_pydata(vs,[],fs);d.update();o=bpy.data.objects.new(name,d);char.objects.link(o)
 if m:d.materials.append(m)
 for p in d.polygons:p.use_smooth=True
 return own(o,bone)
def ell(name,loc,scale,m,bone='Spine',segments=40,rings=24):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc);o=bpy.context.object;o.name=name;move(o);o.scale=scale
 if m:o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return own(o,bone)
def apply(o):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 if o.type=='CURVE':bpy.ops.object.convert(target='MESH')
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);o.select_set(False)
def cat(points,steps=8,closed=True):
 ps=[Vector(p) for p in points];out=[]
 for i in range(len(ps) if closed else len(ps)-1):
  a,b,c,d=[ps[j%len(ps)] if closed else ps[max(0,min(j,len(ps)-1))] for j in [i-1,i,i+1,i+2]]
  for k in range(steps):
   t=k/steps;out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
 if not closed:out.append(ps[-1])
 return out

def tube(name,pts,r,m,bone='Spine',cyclic=False,radii=None):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=1;d.bevel_depth=r;d.bevel_resolution=3;d.use_fill_caps=True;s=d.splines.new('POLY');s.points.add(len(pts)-1)
 for i,(p,co) in enumerate(zip(s.points,pts)):p.co=(*co,1);p.radius=radii[i] if radii else 1
 s.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,d);char.objects.link(o);d.materials.append(m);return own(o,bone)
def box(name,loc,scale,r,m,bone='Spine'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;move(o);o.scale=scale;o.data.materials.append(m);own(o,bone);apply(o)
 bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Rounded moulding','BEVEL');mod.width=r;mod.segments=6;bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=True
 mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name);return o

def star(name,loc,r,m=gold,bone='Spine',depth=.02):
 c=cat([(cos(pi/2+k*pi/4)*(r if k%2==0 else r*.44),sin(pi/2+k*pi/4)*(r if k%2==0 else r*.44)) for k in range(8)],5);N=len(c);v=[(0,-depth,0)];f=[]
 for fac,y in [(.35,-depth*.96),(.72,-depth*.72),(.94,-depth*.25),(1,0),(.94,depth*.30),(.65,depth*.45)]:v.extend((p.x*fac,y,p.y*fac) for p in c)
 for k in range(N):f.append((0,1+k,1+(k+1)%N))
 for j in range(5):
  for k in range(N):a=1+j*N+k;b=1+j*N+(k+1)%N;f.append((a,b,b+N,a+N))
 f.append(tuple(reversed(range(1+5*N,1+6*N))));o=mesh(name,v,f,m,bone);o.location=loc;mod=o.modifiers.new('Soft jewel','SUBSURF');mod.levels=1;mod.render_levels=1;return o

def fuse(name,objects,voxel=.014,smooth=10,bone='Spine'):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:apply(o)
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;own(o,bone)
 mod=o.modifiers.new('Continuous sculpt union','REMESH');mod.mode='VOXEL';mod.voxel_size=voxel;mod.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Relax sculpt','SMOOTH');mod.factor=.65;mod.iterations=smooth;bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=True
 o.select_set(False);return o
# Head silhouette measured from the approved front view. Local reference coordinates are diagnostic tracing only.
trace=[(160,110),(146,105),(139,88),(143,65),(166,42),(204,26),(241,28),(279,47),(325,79),(378,118),(434,155),(480,179),(534,193),(568,204),(581,222),(578,247),(560,276),(535,307),(511,329),(510,356),(504,389),(487,411),(455,427),(411,438),(357,444),(299,446),(235,444),(179,439),(141,430),(118,412),(106,389),(104,365),(81,353),(57,337),(35,315),(24,294),(24,278),(34,263),(67,246),(108,222),(150,191),(182,157),(198,127),(201,108),(196,97),(187,92),(179,95),(174,107)]
def ref(px,py):return ((px-310)/260,(814-py)/260)
contour=cat([ref(x,z) for x,z in trace],5);DX=.0105;xs=np.arange(-1.15,1.10,DX);zs=np.arange(1.36,3.09,DX);X,Z=np.meshgrid(xs,zs);inside=np.zeros_like(X,dtype=bool)
for a,b in zip(contour,contour[1:]+contour[:1]):inside^=((a.y>Z)!=(b.y>Z))&(X<(b.x-a.x)*(Z-a.y)/(b.y-a.y+1e-15)+a.x)
h=np.zeros_like(X)
for it in range(2200):h[1:-1,1:-1]=(h[:-2,1:-1]+h[2:,1:-1]+h[1:-1,:-2]+h[1:-1,2:]+DX*DX)*.25;h*=inside
thick=np.power(np.maximum(h,0)/h.max(),.36)*.50
# Broad rounded cheeks and a gently flattened face plane keep the side volume organic.
cheek=.045*np.exp(-(((X+.03)/.67)**2+((Z-1.83)/.35)**2))*inside
index={};vs=[];fs=[]
for j in range(len(zs)):
 for i in range(len(xs)):
  if inside[j,i]:
   for s in [0,1]:index[j,i,s]=len(vs);vs.append((xs[i],-thick[j,i]-cheek[j,i] if s==0 else thick[j,i]*.88,zs[j]))
for j in range(len(zs)-1):
 for i in range(len(xs)-1):
  q=[(j,i),(j+1,i),(j+1,i+1),(j,i+1)]
  if all((a,b,0) in index for a,b in q):fs.extend([tuple(index[a,b,0] for a,b in q),tuple(index[a,b,1] for a,b in reversed(q))])
edges={}
for face in fs[::2]:
 for a,b in zip(face,face[1:]+face[:1]):
  key=tuple(sorted((a,b)))
  if key in edges:del edges[key]
  else:edges[key]=(a,b)
for a,b in edges.values():fs.append((b,a,a+1,b+1))
head=mesh('Head | reference-traced rounded star',vs,fs,skin,'Head');bpy.context.view_layer.objects.active=head
mod=head.modifiers.new('Unify surface','REMESH');mod.mode='VOXEL';mod.voxel_size=.009;mod.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=mod.name)
mod=head.modifiers.new('Smooth contour','SMOOTH');mod.factor=.6;mod.iterations=26;bpy.ops.object.modifier_apply(modifier=mod.name)
mod=head.modifiers.new('Fine sculpt topology','DECIMATE');mod.ratio=.62;bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.context.view_layer.update();bvh=BVHTree.FromObject(head,bpy.context.evaluated_depsgraph_get())
def front(x,z):
 q,n,i,d=bvh.ray_cast(Vector((x,-3,z)),Vector((0,1,0)))
 if q is None:raise ValueError('Surface miss '+str((x,z)))
 return q.y
# Integrated soft blush, with actual vertex colors for the glTF export.
skinface=skin.copy();skinface.name='01b Cream skin with blush';head.data.materials[0]=skinface
att=head.data.color_attributes.new(name='SkinColor',type='FLOAT_COLOR',domain='POINT')
for v in head.data.vertices:
 x,y,z=v.co;weight=0
 if y<0:
  for cx,cz in [ref(179,385),ref(447,381)]:weight=max(weight,.94*math.exp(-1.65*(((x-cx)/.15)**2+((z-cz)/.116)**2)))
 c=tuple(a*(1-weight)+b*weight for a,b in zip(rgb((.985,.923,.82)),rgb((1,.42,.45))))
 att.data[v.index].color=(*c,1)
n=skinface.node_tree.nodes;l=skinface.node_tree.links;vc=n.new('ShaderNodeVertexColor');vc.layer_name='SkinColor';l.new(vc.outputs['Color'],n['Principled BSDF'].inputs['Base Color'])
# Small plush cheek-lift morph on head surface.
head.shape_key_add(name='Basis');key=head.shape_key_add(name='Happy')
for v,k in zip(head.data.vertices,key.data):
 x,y,z=v.co;w=math.exp(-(((abs(x)-.47)/.18)**2+((z-1.68)/.16)**2)) if y<0 else 0;k.co.y-=.013*w;k.co.z+=.012*w
x,z=ref(280,189);star('Forehead | rounded gold four-point',(x,front(x,z)-.012,z),.15,gold,'Head',.035)
# Rich sapphire texture: no horizontal color band, nebula radiance, radial iris fibers and tiny stars.
N=512;yy,xx=np.mgrid[0:N,0:N];U=(xx/(N-1)-.5)*2;V=(yy/(N-1)-.5)*2;R=np.sqrt(U*U+V*V);A=np.arctan2(V,U)
noise=np.zeros_like(U)
for freq,amp,phase in [(7,.11,.3),(17,.055,1.6),(37,.03,2.7),(71,.012,.9)]:noise+=amp*np.sin(U*freq+np.sin(V*freq*.7+phase))*np.cos(V*freq*.9+phase)
lower=np.exp(-((U/.85)**2+((V+.68)/.52)**2));rim=np.clip(1-R,0,1);fib=(.5+.5*np.sin(A*67+R*22))*.07
color=np.zeros((N,N,4),dtype=np.float32);color[:,:,0]=.012+.025*lower;color[:,:,1]=.028+lower*(.43+noise*.4+fib);color[:,:,2]=.09+lower*(.62+noise*.4+fib)
pupil=np.exp(-((U/.57)**2+((V-.15)/.65)**2));color[:,:,:3]*=(1-.70*pupil[:,:,None]);color[:,:,:3]*=np.clip((1-R)*6,0,1)[:,:,None]*.72+.28
rng=random.Random(88)
for j in range(95):
 u=rng.uniform(-.83,.83);v=rng.uniform(-.78,.88)
 if u*u+v*v>.84:continue
 rr=rng.uniform(.003,.012);spot=np.exp(-((U-u)**2+(V-v)**2)/(rr*rr));color[:,:,:3]+=spot[:,:,None]*np.array([.26,.50,.86])*rng.uniform(.2,.7)
color[:,:,3]=1;color[:,:,:3]=np.clip(color[:,:,:3],0,1)
im=bpy.data.images.new('Sapphire_nebula_512',width=N,height=N,alpha=True);im.pixels.foreach_set(color.ravel());im.filepath_raw=str(OUT/'sapphire-iris.png');im.file_format='PNG';im.save();im.pack()
eyegold=mat('13 Eye starlight',(1,.72,.20),.35);ep=eyegold.node_tree.nodes['Principled BSDF'];ep.inputs['Emission Color'].default_value=(*rgb((1,.68,.14)),1);ep.inputs['Emission Strength'].default_value=1.4
iris=mat('12 Sapphire nebula eyes',(.02,.06,.18),.20);n=iris.node_tree.nodes;l=iris.node_tree.links;tex=n.new('ShaderNodeTexImage');tex.image=im;uvnode=n.new('ShaderNodeUVMap');uvnode.uv_map='UVMap';l.new(uvnode.outputs['UV'],tex.inputs['Vector']);l.new(tex.outputs['Color'],n['Principled BSDF'].inputs['Base Color']);p=n['Principled BSDF'];p.inputs['Coat Weight'].default_value=.18;p.inputs['Coat Roughness'].default_value=.12;p.inputs['Specular IOR Level'].default_value=.23;l.new(tex.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.35
p=mouthmat.node_tree.nodes['Principled BSDF'];p.inputs['Specular IOR Level'].default_value=0;p.inputs['Roughness'].default_value=1
p=white.node_tree.nodes['Principled BSDF'];p.inputs['Emission Color'].default_value=(1,1,.95,1);p.inputs['Emission Strength'].default_value=.4
# Facial mesh assembly. Every layer shares the same morph names and transforms.
def facial(name,base,faces,material,variants,uvs=None):
 o=mesh(name,base,faces,material,'Head');o.shape_key_add(name='Basis')
 for e in EXP:
  key=o.shape_key_add(name=e)
  coords=variants.get(e,base)
  for k,co in zip(key.data,coords):k.co=co
 if uvs:
  uv=o.data.uv_layers.new(name='UVMap')
  for p in o.data.polygons:
   for li in p.loop_indices:uv.data[li].uv=uvs[o.data.loops[li].vertex_index]
 face_parts.append(o);return o

def eye_coord(cx,cz,rx,rz,u,w,e='',extra=0):
 closed=e in ['Happy'] or (e=='Blink_L' and cx>0) or (e=='Blink_R' and cx<0)
 wide=1.12 if e=='Surprise' else (1.025 if e=='Think' else 1.)
 # Happy closes into an upwards crescent; blinking closes into a relaxed arc.
 if closed:
  x=cx+u*rx;z=cz+(.060*(1-u*u) if e=='Happy' else -.016*(1-u*u));bulge=0
 else:
  pinch=.85 if e=='Focus' else 1.;x=cx+u*rx*wide;z=cz+w*rz*wide*pinch
  if e=='Think':x+=.018;z+=.015
  if e=='Focus':z+=.018*u*(-1 if cx<0 else 1)
  bulge=.047*max(0,1-u*u-w*w)
 return (x,front(x,z)-.019-bulge-extra,z)
for side,(px,py) in [('R',(218,323)),('L',(407,317))]:
 cx,cz=ref(px,py);rx=.168;rz=.193;NS=64;NR=14
 params=[(0,0)]+[(j/NR*cos(k*2*pi/NS),j/NR*sin(k*2*pi/NS)) for j in range(1,NR+1) for k in range(NS)]
 fs=[(0,1+k,1+(k+1)%NS) for k in range(NS)]
 for j in range(NR-1):
  for k in range(NS):a=1+j*NS+k;b=1+j*NS+(k+1)%NS;fs.append((a,b,b+NS,a+NS))
 def coords(e='',edge=False):return [eye_coord(cx,cz,rx*(1.12 if edge else 1),rz*(1.07 if edge else 1),u,w,e,-.020 if edge else 0) for u,w in params]
 facial('Eye sclera.'+side,coords(edge=True),fs,sclera,{e:coords(e,True) for e in EXP})
 facial('Sapphire lens.'+side,coords(),fs,iris,{e:coords(e) for e in EXP},[((u+1)/2,(w+1)/2) for u,w in params])
 # Fine lash rim with full round section; thicker upper eyelid and thin warm lower edge.
 rp=[(cos(k*2*pi/NS),sin(k*2*pi/NS)) for k in range(NS)];rimfaces=[]
 for j in range(NS):
  for k in range(8):a=j*8+k;b=j*8+(k+1)%8;rimfaces.append((a,b,(b+8)%(NS*8),(a+8)%(NS*8)))
 def rimcoords(e=''):
  vv=[]
  for u,w in rp:
   q=Vector(eye_coord(cx,cz,rx*1.055,rz*1.035,u,w,e,-.002));r=.006+.006*max(0,w)
   for j in range(8):a=j*2*pi/8;vv.append(tuple(q+Vector((u*r*cos(a),-r*sin(a),w*r*cos(a)))))
  return vv
 facial('Sculpted lash.'+side,rimcoords(),rimfaces,ink,{e:rimcoords(e) for e in EXP})
 # Lens glints and inflated four-point stars lie on the lens, following facial keys.
 for gi,(u,w,rad,typ) in enumerate([(-.17,.54,.043,'round'),(.47,.20,.012,'round'),(-.15,-.08,.034,'star'),(-.48,-.53,.023,'star'),(.48,-.53,.011,'star')]):
  local=[(0,0)]
  if typ=='round':out=[(cos(k*2*pi/40)*rad,sin(k*2*pi/40)*rad) for k in range(40)]
  else:out=[tuple(p) for p in cat([(cos(pi/2+k*pi/4)*(rad if k%2==0 else rad*.30),sin(pi/2+k*pi/4)*(rad if k%2==0 else rad*.30)) for k in range(8)],4)]
  local+=out;ff=[(0,k+1,(k+1)%len(out)+1) for k in range(len(out))]
  def glint(e=''):
   closed=e=='Happy' or (e=='Blink_L' and cx>0) or (e=='Blink_R' and cx<0)
   return [eye_coord(cx,cz,rx,rz,u+(dx/rx)*(0 if closed else 1),w+(dz/rz)*(0 if closed else 1),e,.008) for dx,dz in local]
  facial('Eye highlight '+side+str(gi),glint(),ff,white if typ=='round' or gi>3 else eyegold,{e:glint(e) for e in EXP})
 # Tapered arched brow, expression-specific center and angle.
 browfaces=[];NN=25
 for j in range(NN-1):
  for k in range(8):a=j*8+k;b=j*8+(k+1)%8;browfaces.append((a,b,b+8,a+8))
 def brows(e=''):
  vv=[]
  for j in range(NN):
   t=j/(NN-1);x=cx+(t-.5)*.13;z=cz+.292+.015*sin(pi*t)
   if e=='Think':z+=.045 if cx>0 else -.015;z+=(t-.5)*(.06 if cx>0 else .02)
   if e=='Focus':z-=.025;z+=(t-.5)*(-.13 if cx<0 else .13)
   if e=='Surprise':z+=.055
   if e=='Happy':z+=.025
   r=.002+.008*(sin(pi*t)**.7)
   for k in range(8):a=k*2*pi/8;xx=x;zz=z+r*cos(a);vv.append((xx,front(xx,zz)-.015-r*sin(a),zz))
  return vv
 facial('Brow.'+side,brows(),browfaces,browmat,{e:brows(e) for e in EXP})
# Sculpted smile, mouth opening morphs and tongue. UV parameters share topology.
mcx,mcz=ref(311,368);mouth_outline=[(-1,.50),(-.63,.43),(-.25,.53),(.12,.49),(.56,.57),(.94,.66),(1,.25),(.85,-.40),(.48,-.91),(0,-1),(-.48,-.84),(-.85,-.32)]
mc=cat(mouth_outline,5);NM=len(mc);NR=10;mp=[(0,0)]+[(p.x*j/NR,p.y*j/NR) for j in range(1,NR+1) for p in mc];mf=[(0,k+1,(k+1)%NM+1) for k in range(NM)]
for j in range(NR-1):
 for k in range(NM):a=1+j*NM+k;b=1+j*NM+(k+1)%NM;mf.append((a,b,b+NM,a+NM))
def mouthcoord(u,w,e='',tong=False):
 sx=.108;sz=.108;z=mcz
 if e=='Happy':sx*=1.18;sz*=1.10
 if e=='Think':sx*=.62;sz*=.13;z+=.006
 if e=='Focus':sx*=.86;sz*=.65
 if e in ['Surprise','Talk_O']:sx*=.62;sz*=1.14
 if e=='Talk_A':sx*=1.05;sz*=1.28
 x=mcx+u*sx;zz=z+w*sz
 return (x,front(x,zz)-.012-.014*(1-min(1,u*u+w*w))-(.010+.017*max(0,1-(u/.6)**2-((w+.57)/.35)**2) if tong else 0),zz)
facial('Smile interior', [mouthcoord(u,w) for u,w in mp],mf,mouthmat,{e:[mouthcoord(u,w,e) for u,w in mp] for e in EXP})
# Rounded tongue patch follows the lower interior in every expression.
tp=[(0,-.55)]+[(cos(k*2*pi/48)*.63,-.62+sin(k*2*pi/48)*.33) for k in range(48)];tf=[(0,k+1,(k+1)%48+1) for k in range(48)]
facial('Soft tongue',[mouthcoord(u,w,'',True) for u,w in tp],tf,tongue,{e:[mouthcoord(u,w,e,True) for u,w in tp] for e in EXP})
# A narrow cream lip follows the lower arc, adds sculptural presence without a painted outline.
# Continuous uniform body: torso, sleeve roots, short thighs united before color boundaries.
core=[ell('Torso sculpt',(0,.035,1.00),(.49,.345,.43),cloth)]
for s in [-1,1]:
 core.append(ell('Shoulder sculpt',(s*.39,.015,1.23),(.235,.27,.22),cloth))
 o=ell('Sleeve sculpt',(s*.56,.005,1.17),(.30,.235,.205),cloth);o.rotation_euler[1]=s*.40;core.append(o)
 core.append(ell('Thigh sculpt',(s*.255,.03,.56),(.235,.285,.24),cloth))
body=fuse('Uniform | continuous tailored suit',core,.012,14)
# Analytic smooth color boundaries, baked into a portable UV atlas.
body.data.materials.clear();uniformmat=cloth.copy();uniformmat.name='02b Uniform baked blue and ivory';body.data.materials.append(uniformmat)
n=uniformmat.node_tree.nodes;l=uniformmat.node_tree.links;p=n['Principled BSDF'];geo=n.new('ShaderNodeNewGeometry');sep=n.new('ShaderNodeSeparateXYZ');l.new(geo.outputs['Position'],sep.inputs[0])
def mathnode(op,a,b=None):
 nd=n.new('ShaderNodeMath');nd.operation=op
 if hasattr(a,'is_output'):l.new(a,nd.inputs[0])
 else:nd.inputs[0].default_value=a
 if b is not None:
  if hasattr(b,'is_output'):l.new(b,nd.inputs[1])
  else:nd.inputs[1].default_value=b
 return nd.outputs[0]
x=mathnode('ABSOLUTE',sep.outputs['X']);z=sep.outputs['Z'];xx=mathnode('MINIMUM',mathnode('DIVIDE',x,.6),1)
yoke=mathnode('ADD',1.15,mathnode('MULTIPLY',.11,mathnode('MULTIPLY',xx,xx)))
top=mathnode('GREATER_THAN',z,yoke);pants=mathnode('LESS_THAN',z,.70)
t=mathnode('MINIMUM',1,mathnode('MAXIMUM',0,mathnode('DIVIDE',mathnode('SUBTRACT',z,.72),.40)))
width=mathnode('ADD',.34,mathnode('MULTIPLY',.15,mathnode('SQRT',t)))
whitearea=mathnode('MULTIPLY',mathnode('LESS_THAN',x,width),mathnode('MULTIPLY',mathnode('GREATER_THAN',z,.70),mathnode('LESS_THAN',z,yoke)))
mask=mathnode('SUBTRACT',1,whitearea)
mix=n.new('ShaderNodeMixRGB');mix.blend_type='MIX';mix.inputs[1].default_value=cloth.diffuse_color;mix.inputs[2].default_value=blue.diffuse_color;l.new(mask,mix.inputs[0]);l.new(mix.outputs[0],p.inputs['Base Color'])
# Add one subdivision for actual smooth shading, no global decimation of details.
mod=body.modifiers.new('Uniform smooth finish','SUBSURF');mod.levels=1;mod.render_levels=1;bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=mod.name)
# Bake color only: precise curved boundaries without voxel-sized steps.
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
atlas=bpy.data.images.new('Uniform_Color_2048',width=2048,height=2048,alpha=False);target=n.new('ShaderNodeTexImage');target.image=atlas;n.active=target
scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True;scene.render.bake.margin=12
bpy.ops.object.bake(type='DIFFUSE');atlas.filepath_raw=str(OUT/'uniform-color.png');atlas.file_format='PNG';atlas.save();atlas.pack();l.new(target.outputs['Color'],p.inputs['Base Color']);body.select_set(False)
# Sleeve cuffs smoothly connect to fused mittens.
for s,label in [(-1,'R'),(1,'L')]:
 bone='Arm.'+label
 # End caps are circular in limb cross section, not flat block ends.
 axis=Vector((s*.90,0,-.435)).normalized();center=Vector((s*.735,-.005,1.075));u=Vector((0,1,0));v=axis.cross(u).normalized()
 cuffpts=[tuple(center+.184*(cos(a)*u+sin(a)*v)) for a in np.linspace(0,2*pi,64,endpoint=False)]
 cv=[];cf=[];NN=64
 for along,rr in [(-.033,.18),(-.025,.187),(.025,.187),(.033,.18)]:
  for k in range(NN):
   a=k*2*pi/NN;cv.append(tuple(center+axis*along+rr*(cos(a)*u+sin(a)*v)))
 for j in range(3):
  for k in range(NN):a=j*NN+k;b=j*NN+(k+1)%NN;cf.append((a,b,b+NN,a+NN))
 mesh('Sleeve cuff.'+label,cv,cf,trim,bone)
 hand=ell('Mitten sculpt.'+label,(s*.917,-.015,.987),(.235,.157,.153),skin,bone);hand.rotation_euler[1]=s*.40
 thumb=ell('Thumb sculpt.'+label,(s*.86,-.14,1.075),(.092,.074,.105),skin,bone)
 hand=fuse('Mitten.'+label,[hand,thumb],.009,10,bone)
 # Compact rounded short boots, soft toe and flattened sole.
 rings=[(.025,.204,.263),(.045,.223,.285),(.095,.226,.286),(.16,.222,.278),(.23,.21,.25),(.30,.19,.205),(.38,.185,.19)]
 vv=[];ff=[];NN=64
 for z,rx,ry in rings:
  for k in range(NN):
   a=2*pi*k/NN;vv.append((s*.275+rx*cos(a),-.055+ry*sin(a),z))
 for j in range(len(rings)-1):
  for k in range(NN):a=j*NN+k;b=j*NN+(k+1)%NN;ff.append((a,b,b+NN,a+NN))
 ff.extend([tuple(reversed(range(NN))),tuple((len(rings)-1)*NN+k for k in range(NN))]);boot=mesh('Boot shell.'+label,vv,ff,cloth,'Leg.'+label);boot.data.materials.append(trim)
 for p in boot.data.polygons:
  z=sum(boot.data.vertices[i].co.z for i in p.vertices)/len(p.vertices);p.material_index=1 if z<.096 else 0
 mod=boot.modifiers.new('Soft boot contour','SUBSURF');mod.levels=2;mod.render_levels=2;bpy.context.view_layer.objects.active=boot;bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.context.view_layer.update();bbvh=BVHTree.FromObject(boot,bpy.context.evaluated_depsgraph_get())
 # Blue toe is a lower-front cap continuing to the sole, not an oval sticker.
 def bp(x,z):
  q,_,_,_=bbvh.ray_cast(Vector((x,-2,z)),Vector((0,1,0)))
  if q is None:return (x,-.2,z)
  return (x,q.y-.003,z)
 vv=[];ff=[];NX=40;NZ=15
 for j in range(NZ+1):
  for k in range(NX+1):
   u=k/NX*2-1;x=s*.275+u*.195;top=.105+.104*sqrt(max(0,1-u*u));z=.080+(top-.08)*j/NZ;vv.append(bp(x,z))
 for j in range(NZ):
  for k in range(NX):a=j*(NX+1)+k;ff.append((a,a+1,a+NX+2,a+NX+1))
 mesh('Boot toe cap.'+label,vv,ff,blue,'Leg.'+label)
 tube('Boot cuff.'+label,[(s*.275+.195*cos(a),-.025+.195*sin(a),.365) for a in np.linspace(0,2*pi,64,endpoint=False)],.035,cloth,'Leg.'+label,True)
# Neck fills the small collar opening and joins the head naturally.
ell('Neck under collar',(0,.005,1.40),(.235,.21,.105),skin,'Head')
# Flattened integrated waistband conforms to the torso; broad enough to read as cloth.
bpy.context.view_layer.update();waistbvh=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
waist=[];wf=[];NN=96
for j in range(5):
 t=j/4;z=.66+.072*t
 for k in range(NN):
  a=k*2*pi/NN;direction=Vector((cos(a),sin(a),0));q,_,_,_=waistbvh.ray_cast(Vector((0,.035,z)),direction);waist.append(tuple(q+direction*.006))
for j in range(4):
 for k in range(NN):a=j*NN+k;b=j*NN+(k+1)%NN;wf.append((a,b,b+NN,a+NN))
o=mesh('Uniform waistband',waist,wf,blue);mod=o.modifiers.new('Band soft thickness','SOLIDIFY');mod.thickness=.008
# Tailored broad double collar, curved ribbon surface, visible blue inset.
for s in [-1,1]:
 path=cat([(s*.025,-.347,1.285),(s*.11,-.34,1.32),(s*.24,-.28,1.37),(s*.30,-.15,1.41),(s*.25,.02,1.425)],10,False)
 vv=[];ff=[];NN=11
 for j,p in enumerate(path):
  t=j/(len(path)-1);width=.018+.047*sin(pi*t)**.6
  tangent=path[min(j+1,len(path)-1)]-path[max(j-1,0)];w=Vector((-tangent.z,0,tangent.x)).normalized()
  for k in range(NN):
   u=k/(NN-1)*2-1;q=p+w*width*u;q.y-=.009*(1-u*u);vv.append(tuple(q))
 for j in range(len(path)-1):
  for k in range(NN-1):a=j*NN+k;ff.append((a,a+1,a+NN+1,a+NN))
 o=mesh('Broad ivory collar '+str(s),vv,ff,cloth);mod=o.modifiers.new('Tailored collar thickness','SOLIDIFY');mod.thickness=.013;mod=o.modifiers.new('Collar smoothness','SUBSURF');mod.levels=1
 tube('Collar blue inset '+str(s),[(p.x-s*.012,p.y+.003,p.z+.014) for p in path],.011,blue)
# Rounded square mount with circular inlay, sits close to upper torso.
box('Star badge ivory mount',(0,-.353,1.23),(.295,.075,.295),.087,cloth)
ell('Star badge blue inlay',(0,-.399,1.23),(.111,.018,.111),blue)
star('Star badge gold',(0,-.427,1.23),.084,gold,'Spine',.026)
# Tool pod: molded face, rim and simple raised closure, one anatomical side.
box('Hip pod casing',(.525,-.04,.72),(.17,.255,.285),.067,blue)
box('Hip pod front',(.612,-.055,.725),(.025,.205,.235),.012,blue)
box('Hip pod closure',(.632,-.082,.75),(.017,.125,.043),.008,cloth)
o=star('Shoulder mission emblem',(-.46,-.222,1.36),.047,gold,'Arm.R',.011);o.rotation_euler[1]=-.25
# Assemble facial layers while retaining consistent morph topology.
for o in list(char.objects):
 if o.type in {'MESH','CURVE'} and o not in face_parts:apply(o)
bpy.ops.object.select_all(action='DESELECT')
for o in face_parts:o.select_set(True)
bpy.context.view_layer.objects.active=face_parts[0];bpy.ops.object.join();face=bpy.context.object;face.name='Face | eight expression controls';own(face,'Head');face.select_set(False)
face.data.uv_layers.active_index=0;face.data.uv_layers[0].active_render=True
# Skeleton uses smooth weighted shoulders/hips on continuous uniform.
arm=bpy.data.armatures.new('Xingbao detailed rig');rig=bpy.data.objects.new('Xingbao_Rig',arm);char.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
bones=[('Root',(0,0,0),(0,0,.22),None),('Spine',(0,0,.66),(0,0,1.39),'Root'),('Head',(0,0,1.39),(0,0,2.35),'Spine'),('Arm.R',(-.39,0,1.23),(-.94,0,.985),'Spine'),('Arm.L',(.39,0,1.23),(.94,0,.985),'Spine'),('Leg.R',(-.255,0,.64),(-.275,0,.15),'Root'),('Leg.L',(.255,0,.64),(.275,0,.15),'Root')]
for name,h,t,parent in bones:
 b=arm.edit_bones.new(name);b.head=h;b.tail=t
 if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
for o in list(char.objects):
 if o.type!='MESH':continue
 if o==body:
  groups={name:o.vertex_groups.new(name=name) for name in ['Spine','Arm.L','Arm.R','Leg.L','Leg.R']}
  for v in o.data.vertices:
   x,y,z=v.co;aw=max(0,min(1,(abs(x)-.30)/.32)) if z>.84 else 0;lw=max(0,min(1,(.70-z)/.22)) if z<.70 else 0
   groups['Spine'].add([v.index],max(0,1-aw-lw),'REPLACE')
   if aw:groups['Arm.L' if x>0 else 'Arm.R'].add([v.index],aw,'REPLACE')
   if lw:groups['Leg.L' if x>0 else 'Leg.R'].add([v.index],lw,'REPLACE')
 else:
  bone=parts[o.name];vg=o.vertex_groups.new(name=bone);vg.add(list(range(len(o.data.vertices))),1,'REPLACE')
 o.parent=rig;mod=o.modifiers.new('Character skinning','ARMATURE');mod.object=rig
# Keep three source meshes for editability: head, facial controls and joined outfit/accessories.
bpy.ops.object.select_all(action='DESELECT');join=[o for o in char.objects if o.type=='MESH' and o not in [head,face]]
for o in join:o.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.object.join();outfit=bpy.context.object;outfit.name='Outfit | continuous suit and equipment';outfit.select_set(False)
# Morph evaluation utilities for source/rendering and exported expression actions.
def clear_face():
 for ob in [face,head]:
  for k in ob.data.shape_keys.key_blocks:
   if k.name!='Basis':k.value=0

def expression(name):
 clear_face()
 for ob in [face,head]:
  ks=ob.data.shape_keys.key_blocks
  if name in ks:ks[name].value=1
 if name=='Blink':face.data.shape_keys.key_blocks['Blink_L'].value=1;face.data.shape_keys.key_blocks['Blink_R'].value=1

def turn(label,angle):
 pb=rig.pose.bones['Arm.'+label];axis=pb.bone.matrix_local.to_3x3().inverted()@Vector((0,1,0));pb.rotation_euler=Quaternion(axis,angle).to_euler()
def pose(name):
 for pb in rig.pose.bones:pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
 if name=='hero':
  turn('L',-.92);turn('R',-.10);rig.pose.bones['Head'].rotation_euler[2]=.12;rig.pose.bones['Leg.R'].rotation_euler[0]=.22
 if name=='happy':turn('L',-.85);turn('R',.85);rig.pose.bones['Root'].location.y=.07
 if name=='think':turn('L',-.55);rig.pose.bones['Head'].rotation_euler[2]=.10
 if name=='focus':turn('L',-.45);turn('R',.20)
# Actual shape-key actions stored for glTF; use matching names to combine mesh and head morph tracks.
for ob in [face,head]:
 keys=ob.data.shape_keys;keys.animation_data_create()
 for aname,frames in [('Blink',[(1,0),(12,0),(15,1),(18,0),(45,0)]),('Happy',[(1,0),(12,1),(45,1),(60,0)]),('Think',[(1,0),(15,1),(60,1)]),('Focus',[(1,0),(15,1),(60,1)]),('Surprise',[(1,0),(10,1),(40,1),(55,0)]),('Talk_A',[(1,0),(6,1),(12,0),(18,.7),(24,0)]),('Talk_O',[(1,0),(8,1),(16,0),(24,.8),(30,0)])]:
  if aname=='Blink':targets=[k for k in ['Blink_L','Blink_R'] if k in keys.key_blocks]
  else:targets=[aname] if aname in keys.key_blocks else []
  if not targets:continue
  a=bpy.data.actions.new(aname if ob==face else aname+'_cheek');keys.animation_data.action=a
  for frame,val in frames:
   for key in targets:keys.key_blocks[key].value=val;keys.key_blocks[key].keyframe_insert('value',frame=frame)
  tr=keys.animation_data.nla_tracks.new();tr.name=aname;tr.strips.new(aname,1,a);tr.mute=True;keys.animation_data.action=None
clear_face()
# Bone actions retained for future integration.
rig.animation_data_create()
for name,end in [('Idle',90),('Wave',60),('Celebrate',60)]:
 a=bpy.data.actions.new(name);rig.animation_data.action=a
 for frame in range(1,end+1,3):
  t=(frame-1)/(end-1)*2*pi;pose('neutral');rig.pose.bones['Spine'].rotation_euler[1]=.018*sin(t);rig.pose.bones['Head'].rotation_euler[1]=.025*sin(t+.5)
  if name=='Wave':turn('L',-.92+.17*sin(t*3))
  if name=='Celebrate':turn('L',-.85);turn('R',.85);rig.pose.bones['Root'].location.y=.08*(1-cos(t*2))
  for pb in rig.pose.bones:pb.keyframe_insert('rotation_euler',frame=frame);pb.keyframe_insert('location',frame=frame)
 scene.frame_set(1)
 for pb in rig.pose.bones:pb.keyframe_insert('rotation_euler',frame=end);pb.keyframe_insert('location',frame=end)
 tr=rig.animation_data.nla_tracks.new();tr.name=name;tr.strips.new(name,1,a);tr.mute=True;rig.animation_data.action=None
pose('neutral');clear_face();scene.frame_set(1)
for ob in [head,face,outfit]:ob.data.name=ob.name
_palette={};exec((ROOT/'tools/xingbao-space-palette.py').read_text(),_palette);_palette['calibrate']()
# Portable PBR export. Microtexture remains source-side until normal-map baking.
bpy.ops.object.select_all(action='DESELECT')
for o in char.objects:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(OUT/'xingbao-space-v2.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_skins=True,export_morph=True,export_yup=True)
# Soft warm studio tuned to concept illumination, separated from exported model.
floormat=mat('Studio warm ivory',(1,.96,.89),.8)
n=floormat.node_tree.nodes;l=floormat.node_tree.links;p=n['Principled BSDF'];out=n['Material Output'];ao=n.new('ShaderNodeAmbientOcclusion');ao.inputs['Color'].default_value=(1,.93,.82,1);ao.inputs['Distance'].default_value=.5;em=n.new('ShaderNodeEmission');em.inputs['Strength'].default_value=2.6;l.new(ao.outputs['Color'],em.inputs['Color']);lp=n.new('ShaderNodeLightPath');mix=n.new('ShaderNodeMixShader');l.new(lp.outputs['Is Camera Ray'],mix.inputs[0]);l.new(p.outputs[0],mix.inputs[1]);l.new(em.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],out.inputs['Surface'])
bpy.ops.mesh.primitive_plane_add(size=2000);o=bpy.context.object;move(o,studio);o.data.materials.append(floormat)
def area(name,loc,power,size,c):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=c;o=bpy.data.objects.new(name,d);studio.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
area('Key warm softbox',(-3.4,-4,5.5),650,3.3,(1,.86,.69));area('Front fill',(2,-4,3.5),190,3,(.85,.91,1));area('Soft rim',(2,3,5),650,3,(1,.90,.72))
d=bpy.data.cameras.new('ReviewCamera');cam=bpy.data.objects.new('ReviewCamera',d);studio.objects.link(cam);scene.camera=cam;d.type='ORTHO';d.ortho_scale=3.60
views={'front':((0,-10,1.8),(0,0,1.5)),'hero':((2.5,-9,2.5),(0,0,1.5)),'side':((9,0,1.8),(0,0,1.5)),'back':((0,9,1.8),(0,0,1.5)),'happy':((.5,-9,2),(0,0,1.5)),'think':((.5,-9,2),(0,0,1.5)),'focus':((.5,-9,2),(0,0,1.5)),'blink':((.5,-9,2),(0,0,1.5)),'surprise':((.5,-9,2),(0,0,1.5))}
def camera(view):
 loc,target=views[view];cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.data.images.load(str(OUT/'approved-concept.png')).pack();camera('hero');pose('neutral');clear_face();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'xingbao-space-v2.blend'))
for view in os.getenv('XB_VIEWS','hero,front,side,back,happy,think,focus,blink,surprise').split(','):
 if not view:continue
 clear_face();pose('neutral');camera(view)
 if view=='hero':pose('hero')
 if view in ['happy','think','focus']:expression(view.capitalize());pose(view)
 if view=='blink':expression('Blink')
 if view=='surprise':expression('Surprise')
 scene.render.filepath=str(PRE/(view+'.png'));bpy.ops.render.render(write_still=True)
report={'version':2,'source':'actual Blender sculpt, continuous uniform and facial morph targets','reference':'approved-concept.png','expressions':EXP,'face_uv':'UVMap explicitly bound and active','outfit_texture':'uniform-color.png (2048 px baked base color)','meshes':{},'bones':len(arm.bones)}
for o in [head,face,outfit]:o.data.calc_loop_triangles();report['meshes'][o.name]={'vertices':len(o.data.vertices),'triangles':len(o.data.loop_triangles)}
(OUT/'model-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('REFINED_V2_COMPLETE',flush=True)
