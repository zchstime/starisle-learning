"""Original editable Blender sculpt, following the approved slim-face Xingbao.
Run with Blender 5.2: blender --background --python tools/model-xingbao-v3.py
Environment XB_VIEWS=hero,front,side,back and XB_SAMPLES=64 control review renders.
"""
import bpy, math, os, json, random
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from math import sin, cos, pi, sqrt
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'art-source/xingbao-v3'; PRE=ROOT/'previews/xingbao-v3'
OUT.mkdir(parents=True,exist_ok=True); PRE.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=int(os.getenv('XB_SAMPLES','64'));scene.cycles.use_denoising=True
scene.render.resolution_x=1280;scene.render.resolution_y=1280;scene.render.resolution_percentage=100
scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(1,.83,.61,1);bg.inputs['Strength'].default_value=.26
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
char=bpy.data.collections.new('XINGBAO • sculpt refinement 03');scene.collection.children.link(char)
studio=bpy.data.collections.new('STUDIO • review only');scene.collection.children.link(studio)
def empty(name,parent=None):
 o=bpy.data.objects.new(name,None);char.objects.link(o);o.parent=parent;return o
root=empty('Xingbao_Root')
headroot=empty('Head_and_expression',root);bodyroot=empty('Body_and_limbs',root);clothroot=empty('Cape_and_scarf',root)
def move(o,col=char):
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o)
def material(name,color,rough=.5,metal=0,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if emit:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emit
 return m
cream=material('01 · warm ivory microfleece',(.93,.82,.63),.58)
gold=material('02 · polished warm gold',(.83,.43,.075),.22,.82)
teal=material('03 · deep peacock woven cloth',(.006,.105,.088),.83)
lining=material('04 · sage silk lining',(.27,.43,.16),.78)
ink=material('05 · dark eye socket',(.008,.003,.002),.28)
smilemat=material('06 · warm mouth cavity',(.16,.015,.009),.65)
tonguemat=material('07 · soft coral tongue',(.73,.12,.08),.56)
blush=material('08 · peach blush fleece',(.93,.35,.26),.62)
lightgold=material('09 · lantern star emission',(1,.65,.19),.22,emit=5)
white=material('10 · eye catchlight',(1,1,1),.1,emit=.6)
blueglint=material('11 · tiny blue starlight',(.2,.65,1),.2,emit=1)
# Fine-scale procedural surface detail; source materials remain editable.
def microfabric(m,scale,strength,distance,sheen=.3):
 n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');p.inputs['Sheen Weight'].default_value=sheen
 tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=scale;tex.inputs['Detail'].default_value=2.2;tex.inputs['Roughness'].default_value=.65
 bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=strength;bump.inputs['Distance'].default_value=distance;l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
 return tex
microfabric(cream,235,.28,.012,.28);microfabric(blush,235,.23,.010,.25)
p=cream.node_tree.nodes.get('Principled BSDF');p.inputs['Subsurface Weight'].default_value=.11;p.inputs['Subsurface Radius'].default_value=(1,.5,.22);p.inputs['Subsurface Scale'].default_value=.045
for m in [teal,lining]:
 tex=microfabric(m,190,.35,.009,.18)
 n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
 vor=n.new('ShaderNodeTexVoronoi');vor.distance='EUCLIDEAN';vor.inputs['Scale'].default_value=38
 bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.18;bump.inputs['Distance'].default_value=.008;l.new(vor.outputs['Distance'],bump.inputs['Height']);l.new(n.get('Bump').outputs['Normal'],bump.inputs['Normal']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
# Original generated jacquard swatch, used only as a cloth material texture.
clothimage=bpy.data.images.load(str(OUT/'textures/teal-brocade-albedo.png'));clothimage.pack()
for m in [teal,lining]:
 n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
 coords=n.new('ShaderNodeTexCoord');coords.object=root
 mapping=n.new('ShaderNodeVectorMath');mapping.operation='SCALE';mapping.inputs[3].default_value=1.5;l.new(coords.outputs['Object'],mapping.inputs[0])
 tex=n.new('ShaderNodeTexImage');tex.image=clothimage;tex.projection='BOX';tex.projection_blend=.3;l.new(mapping.outputs['Vector'],tex.inputs['Vector'])
 if m==teal:
  mix=n.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=.4;mix.inputs[2].default_value=(.24,.65,.6,1);l.new(tex.outputs['Color'],mix.inputs[1]);l.new(mix.outputs[0],p.inputs['Base Color'])
 bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.26;bump.inputs['Distance'].default_value=.018;l.new(tex.outputs['Color'],bump.inputs['Height'])
 prev=p.inputs['Normal'].links[0].from_socket;l.new(prev,bump.inputs['Normal']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
def mesh(name,verts,faces,mat,parent=root):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);char.objects.link(o);o.parent=parent
 if mat:d.materials.append(mat)
 for p in d.polygons:p.use_smooth=True
 return o
def finish(o,name,m,parent=root):
 o.name=name;move(o);o.parent=parent
 if m:o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def ell(name,loc,scale,m,parent=root):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=(12 if 'tiny' in name else 48),ring_count=(8 if 'tiny' in name else 32),location=loc);o=finish(bpy.context.object,name,m,parent);o.scale=scale;return o
def tube(name,pts,r,m,parent=root,cyclic=False,radii=None):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=4;d.use_fill_caps=True;s=d.splines.new('POLY');s.points.add(len(pts)-1)
 for i,(p,co) in enumerate(zip(s.points,pts)):p.co=(*co,1);p.radius=radii[i] if radii else 1
 s.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,d);char.objects.link(o);o.parent=parent;d.materials.append(m);return o
def catmull(points,steps=8,closed=True):
 pts=[Vector(p) for p in points];out=[]
 for i in range(len(pts) if closed else len(pts)-1):
  a,b,c,d=[pts[j%len(pts)] if closed else pts[max(0,min(j,len(pts)-1))] for j in [i-1,i,i+1,i+2]]
  for k in range(steps):
   t=k/steps;out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
 if not closed:out.append(pts[-1])
 return out
def torus(name,loc,r,minor,m,parent=root,rot=(0,0,0)):
 bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=minor,major_segments=64,minor_segments=12,location=loc,rotation=rot);return finish(bpy.context.object,name,m,parent)
def soften(o,level=1):
 s=o.modifiers.new('Soft subdivision','SUBSURF');s.levels=level;s.render_levels=level;return o
# The silhouette follows the approved image's slender hook and tilted face.
# Coordinates are construction guides, not a texture projection or billboard.
trace=[(337,238),(324,229),(320,211),(326,190),(350,162),(393,151),(453,160),(511,198),(596,269),(668,309),(746,337),(808,340),(844,355),(850,387),(824,457),(840,504),(850,564),(830,622),(778,658),(694,688),(603,710),(509,719),(430,706),(388,671),(363,630),(295,611),(256,589),(246,562),(260,532),(296,494),(326,454),(353,406),(378,351),(393,291),(391,247),(380,223),(367,216),(356,219),(350,232)]
def ref(px,py):return ((px-556)/310,(1118-py)/310)
contour=catmull([ref(x,z) for x,z in trace],5)
# Solve a Poisson membrane over the outline. sqrt(height) produces a fully
# rounded volume with continuously tapering corners, rather than an extrusion.
DX=.011;xs=np.arange(-1.1,1.06,DX);zs=np.arange(1.20,3.22,DX);X,Z=np.meshgrid(xs,zs);inside=np.zeros_like(X,dtype=bool)
for a,b in zip(contour,contour[1:]+contour[:1]):
 crossing=((a.y>Z)!=(b.y>Z)) & (X < (b.x-a.x)*(Z-a.y)/(b.y-a.y+1e-15)+a.x);inside^=crossing
h=np.zeros(X.shape,dtype=np.float64)
for it in range(1900):
 h[1:-1,1:-1]=((h[:-2,1:-1]+h[2:,1:-1]+h[1:-1,:-2]+h[1:-1,2:])+DX*DX)*.25
 h*=inside
height=np.sqrt(np.maximum(h,0));height*=.48/height.max()
# A slightly fuller cheek and softer front/back asymmetry preserve side volume.
index={};verts=[];faces=[]
for j in range(len(zs)):
 for i in range(len(xs)):
  if inside[j,i]:
   for side in [0,1]:
    index[(j,i,side)]=len(verts);v=height[j,i];verts.append((xs[i],(-v if side==0 else v*.92)+.02,zs[j]))
for j in range(len(zs)-1):
 for i in range(len(xs)-1):
  if all((jj,ii,0) in index for jj,ii in [(j,i),(j+1,i),(j+1,i+1),(j,i+1)]):
   frontface=[index[(jj,ii,0)] for jj,ii in [(j,i),(j+1,i),(j+1,i+1),(j,i+1)]];backface=[index[(jj,ii,1)] for jj,ii in [(j,i+1),(j+1,i+1),(j+1,i),(j,i)]];faces.extend([frontface,backface])
# Close all boundary edges between front and back.
edges={}
for f in faces[::2]:
 for a,b in zip(f,f[1:]+f[:1]):
  key=tuple(sorted((a,b)))
  if key in edges:del edges[key]
  else:edges[key]=(a,b)
for a,b in edges.values():faces.append((b,a,a+1,b+1))
head=mesh('Head • sculpted tapered hook and slender cheeks',verts,faces,cream,headroot)
bpy.context.view_layer.objects.active=head;head.select_set(True)
r=head.modifiers.new('Unified smooth sculpt','REMESH');r.mode='VOXEL';r.voxel_size=.009;r.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=r.name)
s=head.modifiers.new('Relax grid boundary','SMOOTH');s.factor=.65;s.iterations=70;bpy.ops.object.modifier_apply(modifier=s.name)
soften(head,1);head.select_set(False)
# Ray projection keeps every facial element in contact with the sculpt.
bpy.context.view_layer.update();dep=bpy.context.evaluated_depsgraph_get();bvh=BVHTree.FromObject(head,dep)
def front(x,z):
 loc,n,idx,d=bvh.ray_cast(Vector((x,-3,z)),Vector((0,1,0)))
 if loc is None:raise ValueError('Face projection missed head: '+str((x,z)))
 return loc.y
# Rounded, inflated four-point jewellery stars, with a second gold rim.
def star(name,loc,r,m,parent=root,depth=.035,rotation=0):
 outline=[]
 for k in range(8):
  a=pi/2+k*pi/4+rotation;rr=r if k%2==0 else r*.37;outline.append((cos(a)*rr,sin(a)*rr))
 c=catmull(outline,5);v=[(0,-depth,0)];f=[]
 for fac,y in [(.42,-depth*.9),(.82,-depth*.55),(1,0),(.82,depth*.5),(.42,depth*.7)]:
  v += [(p.x*fac,y,p.y*fac) for p in c]
 N=len(c)
 for k in range(N):f.append((0,1+k,1+(k+1)%N))
 for ring in range(4):
  for k in range(N):a=1+ring*N+k;b=1+ring*N+(k+1)%N;f.append((a,a+N,b+N,b))
 v.append((0,depth*.7,0));end=len(v)-1
 for k in range(N):f.append((end,1+4*N+(k+1)%N,1+4*N+k))
 o=mesh(name,v,f,m,parent);o.location=loc;return soften(o,1)
for px,py,r in [(450,354,.185),(448,270,.07),(378,431,.052)]:
 x,z=ref(px,py);star('Forehead • gold inlaid sparkle',(x,front(x,z)-.018,z),r,gold,headroot,depth=.035,rotation=.14)
# One shallow curved lens per eye: no stacked sphere "goggles".
iris=material('12 · sapphire galaxy iris',(.006,.03,.10),.17)
n=iris.node_tree.nodes;l=iris.node_tree.links;p=n.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.35;p.inputs['Coat Roughness'].default_value=.08
uv=n.new('ShaderNodeTexCoord');sep=n.new('ShaderNodeSeparateXYZ');l.new(uv.outputs['UV'],sep.inputs[0]);ramp=n.new('ShaderNodeValToRGB')
cr=ramp.color_ramp;cr.elements.remove(cr.elements[1]);cr.elements[0].position=0;cr.elements[0].color=(.008,.19,.20,1)
for pos,c in [(.14,(.006,.13,.26,1)),(.34,(.0015,.013,.065,1)),(.7,(.001,.003,.019,1)),(1,(.001,.002,.012,1))]:e=cr.elements.new(pos);e.color=c
l.new(sep.outputs['Y'],ramp.inputs['Fac']);l.new(ramp.outputs['Color'],p.inputs['Base Color'])
rng=random.Random(7)
for ei,(px,py,rx,rz) in enumerate([(529,557,.175,.207),(754,489,.133,.182)]):
 x,z=ref(px,py);rot=.20;C,S=cos(rot),sin(rot)
 def eyePoint(u,v,extra=0):
  xx=x+(u*rx*C-v*rz*S);zz=z+(u*rx*S+v*rz*C);rr=min(1,u*u+v*v)
  return(xx,front(xx,zz)-.012-.038*(1-rr)-extra,zz)
 N=96;R=20;v=[eyePoint(0,0)];uvs=[(.5,.5)];f=[]
 for j in range(1,R+1):
  rad=j/R
  for i in range(N):
   a=i*2*pi/N;u=rad*cos(a);w=rad*sin(a);v.append(eyePoint(u,w));uvs.append(((u+1)/2,(w+1)/2))
 for i in range(N):f.append((0,1+i,1+(i+1)%N))
 for j in range(R-1):
  for i in range(N):a=1+j*N+i;b=1+j*N+(i+1)%N;f.append((a,b,b+N,a+N))
 eye=mesh('Eye '+str(ei)+' • flush sapphire lens',v,f,iris,headroot);uvlayer=eye.data.uv_layers.new(name='IrisUV')
 for poly in eye.data.polygons:
  for li in poly.loop_indices:uvlayer.data[li].uv=uvs[eye.data.loops[li].vertex_index]
 tube('Eye '+str(ei)+' • fine dark lash rim',[eyePoint(1.035*cos(k*2*pi/N),1.035*sin(k*2*pi/N),-.002) for k in range(N)],.008,ink,headroot,True)
 # Tiny material-like speckles sit on the lens surface.
 for k in range(22):
  u=rng.uniform(-.78,.78);w=rng.uniform(-.76,.78)
  if u*u+w*w>.8:continue
  q=eyePoint(u,w,.002);rr=rng.uniform(.0015,.004)
  ell('Iris tiny starlight',q,(rr,.0018,rr),blueglint,headroot)
 for u,w,rr in [(.10,.15,.030),(-.28,-.47,.026),(.50,-.34,.015)]:
  q=Vector(eyePoint(u,w,.006));spark=star('Eye '+str(ei)+' • floating star highlight',q,rr*(rx/.175),lightgold if w>.0 else white,headroot,depth=.0015,rotation=.1)
  for vert in spark.data.vertices:
   xx=q.x+vert.co.x;zz=q.z+vert.co.z;dx=xx-x;dz=zz-z;uu=(dx*C+dz*S)/rx;ww=(-dx*S+dz*C)/rz;vert.co.y+=eyePoint(uu,ww,.006)[1]-q.y
 q=eyePoint(-.10,.64,.008);o=ell('Eye '+str(ei)+' • softbox catchlight',q,(.032*(rx/.175),.003,.039*(rx/.175)),white,headroot);o.rotation_euler[1]=-.3
# Blush is color on the head itself: no floating discs or coplanar surfaces.
headmat=cream.copy();headmat.name='01b · ivory fleece with integrated cheek blush';head.data.materials[0]=headmat
attr=head.data.color_attributes.new(name='SkinBlush',type='FLOAT_COLOR',domain='POINT')
for i,v in enumerate(head.data.vertices):
 x,y,z=v.co;weight=0
 if y<.01:
  for px,py,rx,rz in [(506,651,.137,.115),(815,566,.096,.107)]:
   cx,cz=ref(px,py);rr=((x-cx)/rx)**2+((z-cz)/rz)**2
   weight=max(weight,math.exp(-rr*1.6)*.85)
 c=tuple(a*(1-weight)+b*weight for a,b in zip((.93,.82,.63),(.93,.35,.26)))
 attr.data[i].color=(*c,1)
n=headmat.node_tree.nodes;l=headmat.node_tree.links;att=n.new('ShaderNodeVertexColor');att.layer_name='SkinBlush';l.new(att.outputs['Color'],n.get('Principled BSDF').inputs['Base Color'])
# Small tapered smile with recessed center and smoothly seated tongue.
smilecoords=[(630,565),(646,565),(662,552),(678,556),(698,546),(701,570),(691,594),(677,609),(657,607),(644,596),(635,579)]
c=catmull([ref(x,y) for x,y in smilecoords],6);cx,cz=ref(667,580)
vv=[(cx,front(cx,cz)-.002,cz)]+[(p.x,front(p.x,p.y)-.008,p.y) for p in c];ff=[(0,i+1,(i+1)%len(c)+1) for i in range(len(c))];mesh('Smile • small joyful open mouth',vv,ff,smilemat,headroot)
x,z=ref(670,594);ell('Smile • soft tongue',(x,front(x,z)-.011,z),(.075,.008,.045),tonguemat,headroot)
# A compact pear body and softly fused, naturally posed limbs.
body=ell('Body • plush pear',(.12,.06,.72),(.48,.36,.56),cream,bodyroot)
for v in body.data.vertices:
 t=v.co.z;v.co.x*=1-.14*t;v.co.y*=1-.08*t
foot=ell('Foot • grounded right',(.42,-.08,.185),(.205,.30,.19),cream,bodyroot);foot.rotation_euler[1]=-.25
foot=ell('Foot • lifted left',(-.20,-.015,.32),(.19,.255,.22),cream,bodyroot);foot.rotation_euler[1]=.6
# Swept, variable-radius limbs avoid hard ellipsoid intersections.
def limb(name,points,radii,m,parent=bodyroot):
 path=catmull(points,10,False);rr=[]
 for i in range(len(points)-1):
  for k in range(10):t=k/10;rr.append(radii[i]*(1-t)+radii[i+1]*t)
 rr.append(radii[-1]);N=32;vs=[];fs=[]
 for j,p in enumerate(path):
  tangent=(path[min(j+1,len(path)-1)]-path[max(0,j-1)]).normalized();u=tangent.cross(Vector((0,1,0))).normalized();v=tangent.cross(u).normalized()
  for k in range(N):q=p+rr[j]*(cos(k*2*pi/N)*u+sin(k*2*pi/N)*v);vs.append(q)
 for j in range(len(path)-1):
  for k in range(N):a=j*N+k;b=j*N+(k+1)%N;fs.append((a,b,b+N,a+N))
 fs.append(tuple(reversed(range(N))));fs.append(tuple((len(path)-1)*N+k for k in range(N)))
 return soften(mesh(name,vs,fs,m,parent),1)
limb('Arm • softly resting left',[(-.25,.03,1.10),(-.39,-.02,.95),(-.52,-.09,.79),(-.55,-.10,.78)],[.18,.17,.13,.015],cream)
limb('Arm • raised to hold lantern',[(.48,.06,1.12),(.71,.03,1.42),(.98,.01,1.79),(1.17,-.01,2.04),(1.24,-.02,2.09)],[.18,.16,.145,.12,.035],cream)
# Mitten curves around the lantern ring instead of covering it as a ball.
limb('Hand • curled around ring',[(1.12,-.035,2.04),(1.17,-.05,2.16),(1.27,-.055,2.19),(1.33,-.055,2.13),(1.32,-.055,2.07)],[.11,.10,.09,.075,.025],cream)
# Fuse the plush anatomy into one continuous sculpt to remove visible limb seams.
bpy.ops.object.select_all(action='DESELECT')
for ob in bodyroot.children:
 if ob.type=='MESH' and not ob.name.startswith('Foot •'):ob.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.object.convert(target='MESH');bpy.ops.object.join();body=bpy.context.object;body.name='Body • continuous plush anatomy and posed limbs'
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
rem=body.modifiers.new('Fuse soft limb connections','REMESH');rem.mode='VOXEL';rem.voxel_size=.012;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
sm=body.modifiers.new('Relax plush anatomy','SMOOTH');sm.factor=.6;sm.iterations=6;bpy.ops.object.modifier_apply(modifier=sm.name);soften(body,1)
body.select_set(False)
# Wind-swept cape, variable depth folds and rolled hem with separate lining.
def cape(a,t,offset=0):
 # Round the lower open corners in the cloth parameter domain.
 u=abs(a)/2.35
 if u>.82 and t>.78:
  U=(u-.82)/.18;V=(t-.78)/.22
  a=math.copysign((.82+.18*U*sqrt(max(0,1-V*V/2)))*2.35,a)
  t=.78+.22*V*sqrt(max(0,1-U*U/2))
 side=abs(sin(a));r=.39+.87*t+.10*t*t*sin(3*a+.8)+.18*max(0,-sin(a))*t
 x=.10+sin(a)*r; y=.20+cos(a)*(.31+.42*t)+.085*sin(5*a+1.8*t)*t
 z=1.28-.82*t+.36*(side**3)*(t**1.7)+.17*sin(3*a+1)*(t**2)
 # Open edges turn upward, exposing a controlled glimpse of sage lining.
 z-=.20*sin(a)*t**1.7
 edge=(abs(a)/2.35)**9;z+=(.22 if a>0 else -.14)*edge*t*t;y-=.22*edge*t*t
 return (x,y+offset,z)
A=100;T=32;v=[cape(-2.35+4.7*i/A,j/T) for j in range(T+1) for i in range(A+1)];f=[]
for j in range(T):
 for i in range(A):a=j*(A+1)+i;f.append((a,a+1,a+A+2,a+A+1))
co=mesh('Cape • wind-swept tailored outer cloth',v,f,teal,clothroot);co.data.materials.append(lining);so=co.modifiers.new('Sage lining and actual cloth thickness','SOLIDIFY');so.thickness=.018;so.offset=0;so.material_offset=1;soften(co,1)
for t,r in [(1,.012),(.945,.004)]:tube('Cape • gold hem' if t==1 else 'Cape • fine gold stitching',[cape(-2.35+4.7*i/220,t,-.006) for i in range(221)],r,gold,clothroot)
for a in [-2.35,2.35]:tube('Cape • turned edge gold piping',[cape(a,j/80,-.006) for j in range(81)],.011,gold,clothroot)
# A soft folded scarf wraps the neck, with a rounded cloth cross-section.
scarfpath=catmull([(-.60,-.04,1.27),(-.48,-.29,1.32),(-.22,-.39,1.38),(.06,-.39,1.34),(.32,-.32,1.30),(.58,-.15,1.40),(.62,.14,1.40),(.30,.39,1.38),(-.08,.43,1.34),(-.44,.28,1.31)],10)
vv=[];ff=[];N=16
for i,p in enumerate(scarfpath):
 tangent=(scarfpath[(i+1)%len(scarfpath)]-scarfpath[(i-1)%len(scarfpath)]).normalized();u=Vector((0,0,1));v=tangent.cross(u).normalized()
 for k in range(N):a=k*2*pi/N;q=p+u*(.065*sin(a))+v*(.105*cos(a));vv.append(q)
for i in range(len(scarfpath)):
 for k in range(N):ff.append((i*N+k,i*N+(k+1)%N,((i+1)%len(scarfpath))*N+(k+1)%N,((i+1)%len(scarfpath))*N+k))
soften(mesh('Scarf • plush folded neck wrap',vv,ff,teal,clothroot),1)
# Front collar lapels are curved broad cloth, rather than a flat disc.
for side in [-1,1]:
 verts=[];faces=[];N=32;M=10
 for j in range(M+1):
  t=j/M
  for i in range(N+1):
   u=i/N
   if side<0:x=-.64+.93*u;z=1.29+.04*sin(u*pi)-.18*t*sin(u*pi);y=-.12-.28*sin(u*pi/2)-.045*sin(t*pi)
   else:x=.29+.34*u;z=1.29+.27*u-.15*t*sin(u*pi);y=-.40+.27*u-.055*sin(t*pi)
   verts.append((x,y,z-.06*t))
 for j in range(M):
  for i in range(N):a=j*(N+1)+i;faces.append((a,a+1,a+N+2,a+N+1))
 ob=mesh('Scarf • flowing collar lapel',verts,faces,teal,clothroot);ob.modifiers.new('Cloth thickness','SOLIDIFY').thickness=.018;soften(ob,1)
 tube('Collar • gold stitched edge',verts[M*(N+1):],.009,gold,clothroot)
# Soft tapered scarf tails with dimensional folds.
for side in [-1,1]:
 pts=[(.29,-.43,1.29),(.29+side*.08,-.47,1.12),(.29+side*.12,-.49,.95),(.29+side*.11,-.47,.87)]
 path=catmull(pts,8,False);vv=[];ff=[]
 for j,p in enumerate(path):
  t=j/(len(path)-1);width=.078*(1-.6*t)
  for k in range(9):u=(k/8-.5)*2;vv.append((p.x+u*width,p.y-.028*(1-u*u)*sin(pi*t),p.z+.035*u*u))
 for j in range(len(path)-1):
  for k in range(8):a=j*9+k;ff.append((a,a+1,a+10,a+9))
 o=mesh('Scarf • folded hanging tie',vv,ff,teal,clothroot);o.modifiers.new('Cloth thickness','SOLIDIFY').thickness=.018;soften(o,1)
 p=path[-1];star('Scarf • gold diamond end',(p.x,p.y-.015,p.z),.048,gold,clothroot,.018)
star('Scarf • rounded star clasp',(.29,-.49,1.30),.138,gold,clothroot,depth=.045,rotation=.12)
# Gold embroidery placed on the wind-swept outer tips.
for a,t,rad in [(-1.8,.87,.075),(-1.55,.91,.04),(1.9,.86,.065),(0,.84,.065)]:
 q=Vector(cape(a,t));da=Vector(cape(a+.001,t))-q;dt=Vector(cape(a,t+.001))-q;normal=da.cross(dt).normalized();o=star('Cape • embroidered golden star',q+normal*.012,rad,gold,clothroot,.01);o.rotation_mode='QUATERNION';o.rotation_quaternion=Vector((0,-1,0)).rotation_difference(normal)
# Rounded lantern dome, open frame, glass chamber, warm emissive star.
lan=empty('Lantern • independent assembly',root);lan.location=(1.31,-.01,1.50);lan.rotation_euler[1]=-.18
# Surface of revolution in local coordinates.
def lathe(name,profile,m,parent=lan,N=80):
 vv=[];ff=[]
 for r,z in profile:
  for k in range(N):a=k*2*pi/N;vv.append((r*cos(a),r*sin(a),z))
 for j in range(len(profile)-1):
  for k in range(N):a=j*N+k;b=j*N+(k+1)%N;ff.append((a,b,b+N,a+N))
 return mesh(name,vv,ff,m,parent)
lathe('Lantern • sculpted teal dome',[(.0,.39),(.065,.38),(.11,.34),(.18,.28),(.23,.26),(.245,.24)],teal)
for z,r,minor in [(.245,.25,.026),(.20,.217,.017),(-.25,.217,.021),(-.29,.24,.025),(-.34,.18,.018)]:torus('Lantern • rounded gold moulding',(0,0,z),r,minor,gold,lan)
lathe('Lantern • layered gold base',[(0,-.35),(.13,-.35),(.19,-.33),(.24,-.29),(.23,-.265),(.20,-.25)],gold)
lathe('Lantern • top gold collar',[(.0,.41),(.06,.41),(.075,.38),(.07,.36)],gold)
torus('Lantern • hand-held ring',(0,0,.51),.10,.021,gold,lan,(pi/2,0,0))
for i in range(5):
 a=2*pi*i/5+.3;tube('Lantern • curved gold frame',[(.205*cos(a),.205*sin(a),z) for z in [-.25,-.1,.08,.2]],.016,gold,lan)
 a=2*pi*i/5+.3;tube('Lantern • dome gold seam',[(r*cos(a),r*sin(a),z) for r,z in [(.065,.38),(.11,.34),(.18,.28),(.23,.26)]],.008,gold,lan)
glass=material('13 · clear amber glass',(.95,.77,.43),.12)
p=glass.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.94;p.inputs['IOR'].default_value=1.46;p.inputs['Alpha'].default_value=.16
lathe('Lantern • delicate glass chamber',[(.194,-.25),(.194,.20)],glass)
star('Lantern • luminous wishing star',(0,-.035,-.025),.17,lightgold,lan,depth=.045,rotation=.1)
for x,z,rr in [(-.10,.12,.035),(.12,.05,.037),(-.10,-.13,.03),(.10,-.17,.028)]:star('Lantern • little spark',(x,-.13,z),rr,lightgold,lan,.01)
tube('Lantern • pendant chain',[(0,0,-.35),(0,0,-.43)],.012,gold,lan)
star('Lantern • hanging gold charm',(0,0,-.50),.075,gold,lan,.025)
# Warm light is part of the character source, but not needed for mesh appearance.
d=bpy.data.lights.new('Lantern interior warmth','POINT');d.energy=2.5;d.color=(1,.58,.12);d.shadow_soft_size=.15;o=bpy.data.objects.new(d.name,d);char.objects.link(o);o.parent=lan;o.location=(0,-.04,0)
# Actual fine 3D fleece, separate from the game mesh for later LOD handling.
furmat=material('14 · fine ivory fleece fibers',(.94,.82,.62),.7)
furmat.node_tree.nodes.get('Principled BSDF').inputs['Sheen Weight'].default_value=.35
rnghair=random.Random(104)
for skin,count in [(head,21000),(body,11000)]:
 skin.data.calc_loop_triangles();tris=list(skin.data.loop_triangles);weights=[t.area for t in tris]
 picked=rnghair.choices(tris,weights=weights,k=count)
 d=bpy.data.curves.new('Short microfleece strands','CURVE');d.dimensions='3D';d.bevel_depth=.00042;d.bevel_resolution=0;d.resolution_u=1
 bpy.context.view_layer.update()
 for tri in picked:
  a,b,c=[skin.data.vertices[i] for i in tri.vertices];u=rnghair.random();v=rnghair.random()
  if u+v>1:u=1-u;v=1-v
  q=a.co*(1-u-v)+b.co*u+c.co*v;n=(a.normal*(1-u-v)+b.normal*u+c.normal*v).normalized()
  q=skin.matrix_world@q;n=(skin.matrix_world.to_3x3().inverted().transposed()@n).normalized()
  if skin==head and q.y<0:
   blocked=False
   for px,py,rx,rz in [(529,557,.19,.23),(754,489,.15,.20),(667,580,.15,.13)]:
    xx,zz=ref(px,py)
    if ((q.x-xx)/rx)**2+((q.z-zz)/rz)**2<1:blocked=True
   if blocked:continue
  length=rnghair.uniform(.003,.0065);end=q+n*length+Vector((rnghair.uniform(-.001,.001),0,rnghair.uniform(-.001,.001)))
  sp=d.splines.new('POLY');sp.points.add(1);sp.points[0].co=(*(q-n*.0007),1);sp.points[1].co=(*end,1);sp.points[1].radius=.25
 ob=bpy.data.objects.new('Fur • '+skin.name,d);char.objects.link(ob);ob.parent=root;d.materials.append(furmat)
# Warm ivory studio, separate from exported character.
def stage(o):move(o,studio);return o
floorMat=material('Studio • softly luminous cream',(.86,.75,.55),.82)
p=floorMat.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.85,.62,1);p.inputs['Emission Strength'].default_value=.25
n=floorMat.node_tree.nodes;l=floorMat.node_tree.links
p.inputs['Emission Strength'].default_value=0
out=n.get('Material Output');ao=n.new('ShaderNodeAmbientOcclusion');ao.inputs['Color'].default_value=(1,.87,.67,1);ao.inputs['Distance'].default_value=.8;ao.samples=16
em=n.new('ShaderNodeEmission');em.inputs['Strength'].default_value=2.1;l.new(ao.outputs['Color'],em.inputs['Color'])
lightpath=n.new('ShaderNodeLightPath');mix=n.new('ShaderNodeMixShader');l.new(lightpath.outputs['Is Camera Ray'],mix.inputs[0]);l.new(p.outputs[0],mix.inputs[1]);l.new(em.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],out.inputs['Surface'])
bpy.ops.mesh.primitive_plane_add(size=200);floor=stage(bpy.context.object);floor.name='Studio ground';floor.data.materials.append(floorMat)
def area(name,loc,power,size,color,target=(0,0,1.65)):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);studio.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Key • large warm softbox',(-3,-4,5),520,3.3,(1,.85,.65));area('Fill • soft frontal',(2,-4,3),170,3,(.8,.89,1));area('Rim • golden plush edge',(1,2.5,4.5),700,2.8,(1,.82,.52))
camd=bpy.data.cameras.new('Review camera');cam=bpy.data.objects.new('Review camera',camd);studio.objects.link(cam);scene.camera=cam;camd.type='ORTHO';camd.ortho_scale=3.95
views={'hero':((.15,-9,2.7),(.12,0,1.6)),'front':((0,-10,1.65),(.12,0,1.65)),'side':((8,-.2,2.2),(0,0,1.6)),'back':((0,8,2.4),(0,0,1.6)),'three-quarter':((-3.8,-8,2.8),(0,0,1.6))}
def camera(name):
 loc,target=views[name];cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
camera('hero')
# Save native source before baking/export in separate pipeline.
bpy.ops.object.select_all(action='DESELECT');head.select_set(True);bpy.context.view_layer.objects.active=head
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'xingbao-refined-v3.blend'))
for name in os.getenv('XB_VIEWS','hero,front,side,back').split(','):
 camera(name);scene.cycles.samples=64 if name=='hero' else 24;scene.render.resolution_percentage=100 if name=='hero' else 75;scene.render.filepath=str(PRE/(name+'.png'));bpy.ops.render.render(write_still=True)
camera('hero');scene.render.resolution_percentage=100;scene.cycles.samples=64;bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'xingbao-refined-v3.blend'))
report={'source':'Blender geometry; approved image used only as visual construction reference','version':3,'objects':len(char.objects),'mesh_objects':sum(o.type=='MESH' for o in char.objects),'rigged':False,'changes':['Rounded Poisson head volume and thin curled tip','Flush single-piece galaxy eye lenses','Feathered blush and microfleece','Wind-swept cape and dimensional scarf','Raised arm, curled mitten and lifted foot','Detailed dome lantern and warm studio'],'material_note':'Procedural materials in Blender source; game export needs texture baking.'}
(OUT/'model-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('XINGBAO_V3_COMPLETE',flush=True)
