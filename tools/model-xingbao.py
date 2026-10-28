import bpy, math, os, json
from mathutils import Vector
from math import sin,cos,pi
ROOT='/Users/xiyue/Documents/Superior/exam'
OUT=ROOT+'/art-source/xingbao-v2'; PRE=ROOT+'/previews/xingbao-v2'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=1100;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.8,.85,1,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.45
scene.view_settings.view_transform='AgX'
char=bpy.data.collections.new('XINGBAO • Approved slim-face design');scene.collection.children.link(char)
def move(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 char.objects.link(o)
 return o
root=bpy.data.objects.new('Xingbao_Root',None);char.objects.link(root)
def mat(name,c,rough=.45,metal=0,emit=0,alpha=1):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,alpha);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;p.inputs['Alpha'].default_value=alpha
 if emit:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emit
 return m
cream=mat('Warm ivory • soft satin',(0.92,.82,.60),.48)
gold=mat('Champagne gold',(.83,.47,.10),.26,.72)
teal=mat('Cape • deep teal',(.025,.24,.22),.78)
mint=mat('Cape • pale mint lining',(.32,.57,.38),.82)
ink=mat('Eyes • midnight',(.004,.012,.038),.09)
blue=mat('Iris • ocean',(.018,.22,.39),.17)
white=mat('Eye highlights',(.98,.98,1),.12,emit=.2)
rose=mat('Blush',(.88,.32,.29),.72)
mouthmat=mat('Smile interior',(.17,.025,.025),.65)
tongue=mat('Tongue',(.88,.22,.2),.48)
glow=mat('Lantern • warm star',(1,.68,.16),.3,emit=3)
glass=mat('Lantern glass',(.8,.95,.8),.1,alpha=.12)
def finish(o,name,m,parent=root):
 o.name=name;move(o);o.parent=parent
 if m:o.data.materials.append(m)
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=True
 return o
def ell(name,loc,scale,m,parent=root):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=loc);o=bpy.context.object;o.scale=scale;return finish(o,name,m,parent)
def mesh(name,verts,faces,m,parent=root):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);char.objects.link(o);o.parent=parent
 if m:d.materials.append(m)
 for f in d.polygons:f.use_smooth=True
 return o
def curve(name,pts,r,m,cyclic=False,parent=root):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=12;d.bevel_depth=r;d.bevel_resolution=3;s=d.splines.new('POLY');s.points.add(len(pts)-1)
 for p,co in zip(s.points,pts):p.co=(*co,1)
 s.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,d);char.objects.link(o);o.parent=parent;d.materials.append(m);return o
def torus(name,loc,major,minor,m,rotation=(0,0,0),parent=root):
 bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=48,minor_segments=12,location=loc,rotation=rotation);return finish(bpy.context.object,name,m,parent)
def cyl(name,loc,r,depth,m,parent=root,top=None):
 if top is None:bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=depth,location=loc)
 else:bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=r,radius2=top,depth=depth,location=loc)
 o=finish(bpy.context.object,name,m,parent);b=o.modifiers.new('Soft manufactured edges','BEVEL');b.width=.012;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
# Smooth asymmetrical silhouette traced as an explicit sculpt outline, not a regular star.
outline=[(-.76,3.02),(-.82,3.20),(-.68,3.40),(-.45,3.45),(-.20,3.36),(.07,3.12),(.32,2.85),(.62,2.68),(.91,2.61),(1.02,2.52),(.93,2.32),(.78,2.10),(.72,1.83),(.59,1.58),(.35,1.42),(0,1.36),(-.36,1.42),(-.62,1.57),(-.74,1.82),(-.98,1.96),(-1.08,2.10),(-.92,2.26),(-.65,2.44),(-.43,2.69),(-.35,2.95),(-.42,3.17),(-.56,3.23),(-.66,3.15),(-.66,3.04)]
def catmull(points,steps=5):
 out=[]
 for i in range(len(points)):
  a,b,c,d=[Vector(points[j%len(points)]) for j in [i-1,i,i+1,i+2]]
  for k in range(steps):
   t=k/steps;v=.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);out.append(v)
 return out
contour=catmull(outline,6)
# Closed bevelled silhouette preserves concave curled tip without radial mesh seams.
d=bpy.data.curves.new('Curled head silhouette','CURVE');d.dimensions='2D';d.resolution_u=12;d.fill_mode='BOTH';d.extrude=.055;d.bevel_depth=.18;d.bevel_resolution=6
sp=d.splines.new('POLY');sp.points.add(len(contour)-1)
for p,v in zip(sp.points,contour):p.co=(v.x,v.y,0,1)
sp.use_cyclic_u=True
head=bpy.data.objects.new('Head • asymmetric curled silhouette',d);char.objects.link(head);head.parent=root;d.materials.append(cream);head.rotation_euler[0]=pi/2
bpy.ops.object.select_all(action='DESELECT');head.select_set(True);bpy.context.view_layer.objects.active=head;bpy.ops.object.convert(target='MESH');bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
# Dense quad remesh provides a unified sculpt surface for rounded cheeks.
rem=head.modifiers.new('Unified sculpt volume','REMESH');rem.mode='VOXEL';rem.voxel_size=.022;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
sm=head.modifiers.new('Soft sculpt relaxation','SMOOTH');sm.factor=.7;sm.iterations=3;bpy.ops.object.modifier_apply(modifier=sm.name)
for v in head.data.vertices:
 x,y,z=v.co
 bulge=.32*math.exp(-((x/.8)**2+((z-2.05)/.9)**2))
 v.co.y+=(-1 if y<0 else 1)*bulge*min(1,abs(y)/.22)
 v.co.x*=.84;v.co.z=1.40+(z-1.30)*.86
head.data.update()
for p in head.data.polygons:p.use_smooth=True
sub=head.modifiers.new('Sculpt smoothing','SUBSURF');sub.levels=1;sub.render_levels=1
head.select_set(False)
# Curved face-mounted decorative forms; y projection tracks the head surface.
def front(x,z):
 hit,loc,n,idx=head.ray_cast(Vector((x,-3,z)),Vector((0,1,0)));return loc.y if hit else -.5
# Four point inlaid star, modeled convex with rounded bevel.
def star(name,x,y,z,r,m,parent=root,depth=.025):
 v=[(x,y-depth,z)];faces=[]
 for i in range(8):
  a=pi/2+i*pi/4;rr=r if i%2==0 else r*.34;v.append((x+cos(a)*rr,y,z+sin(a)*rr))
 for i in range(8):faces.append((0,i+1,(i+1)%8+1))
 v.append((x,y+depth,z))
 for i in range(8):faces.append((9,(i+1)%8+1,i+1))
 o=mesh(name,v,faces,m,parent);b=o.modifiers.new('Rounded star edges','BEVEL');b.width=r*.045;b.segments=3;return o
for x,z,r in [(-.27,2.67,.17),(-.32,2.91,.065),(-.46,2.45,.065)]:star('Forehead gold star',x,front(x,z)-.018,z,r,gold)
# Large expressive dark-blue eyes, embedded onto the curved face.
for sign in [-1,1]:
 x=sign*.355;z=1.98;y=front(x,z)
 ell('Eye dark rim',(x,y-.016,z),(.205,.075,.255),ink)
 ell('Ocean iris',(x,y-.078,z-.035),(.171,.034,.194),blue)
 ell('Deep pupil',(x,y-.103,z+.025),(.146,.02,.18),ink)
 ell('Main catchlight',(x-.058,y-.128,z+.115),(.052,.018,.062),white)
 ell('Tiny catchlight',(x+.077,y-.122,z+.047),(.022,.014,.026),white)
 for dx,dz,rr in [(.045,-.115,.043),(-.07,-.055,.025)]:star('Starry eye glint',x+dx,y-.13,z+dz,rr,glow,depth=.004)
 bx=sign*.46;bz=1.74
 vv=[(bx,front(bx,bz)-.008,bz)];ff=[]
 for k in range(48):
  a=k*2*pi/48;xx=bx+.085*cos(a);zz=bz+.060*sin(a);vv.append((xx,front(xx,zz)-.008,zz))
 for k in range(48):ff.append((0,k+1,(k+1)%48+1))
 mesh('Soft cheek blush',vv,ff,rose)
# Open smile silhouette, with a curved top and tapered bottom.
smile=[(-.18,1.75),(-.09,1.72),(0,1.74),(.09,1.72),(.18,1.77),(.14,1.57),(0,1.51),(-.14,1.58)]
sv=[(x,front(x,z)-.021,z) for x,z in catmull(smile,8)];sv.insert(0,(0,front(0,1.64)-.032,1.64));sf=[(0,i+1,(i+1)%(len(sv)-1)+1) for i in range(len(sv)-1)];mesh('Happy open smile',sv,sf,mouthmat)
ell('Smiling tongue',(0,front(0,1.58)-.039,1.575),(.10,.016,.045),tongue)
# Compact toddler body with tiny cream feet (no shoes).
ell('Little body',(0,.025,.88),(.48,.35,.58),cream)
for s in [-1,1]:ell('Bare rounded foot',(s*.235,-.07,.20),(.205,.28,.20),cream)
left=ell('Left soft arm',(-.54,-.03,1.02),(.18,.18,.37),cream);left.rotation_euler[1]=-.9
right=ell('Right raised arm',(.59,-.03,1.18),(.18,.18,.38),cream);right.rotation_euler[1]=.9
ell('Lantern mitten',(.86,-.045,1.44),(.18,.18,.16),cream)
# Tailored cloth cape: explicit draped surface, folds, lining and sewn gold edging.
def capePoint(a,t,inside=False):
 r=.43+.59*t;fold=.045*sin(a*6+1)*t*t;x=sin(a)*(r+fold);y=cos(a)*(r*.63+fold)+.10;z=1.43-.91*t+.10*cos(a*3)*t*t
 if inside:y-=.012
 return(x,y,z)
steps=88;rows=26
for inner,m in [(False,teal),(True,mint)]:
 v=[capePoint(-2.30+4.6*i/steps,j/rows,inner) for j in range(rows+1) for i in range(steps+1)];f=[]
 for j in range(rows):
  for i in range(steps):
   a=j*(steps+1)+i;f.append((a,a+1,a+steps+2,a+steps+1))
 o=mesh('Cape lining' if inner else 'Tailored flowing cape',v,f,m);so=o.modifiers.new('Cloth thickness','SOLIDIFY');so.thickness=.012
curve('Cape lower gold piping',[capePoint(-2.3+4.6*i/120,1) for i in range(121)],.014,gold)
curve('Cape stitched hem',[capePoint(-2.3+4.6*i/120,.94) for i in range(121)],.005,gold)
for a in [-2.3,2.3]:curve('Cape front piping',[capePoint(a,i/35) for i in range(36)],.012,gold)
# Collar sweeping around the head base; gold star fastening and scarf tails.
cv=[];cf=[];A=96;B=8
for j in range(B+1):
 t=j/B
 for i in range(A):
  a=i*2*pi/A;r=.34+.27*t;cv.append((r*sin(a),r*.69*cos(a),1.54-.24*t+.035*sin(3*a)*t))
for j in range(B):
 for i in range(A):cf.append((j*A+i,j*A+(i+1)%A,(j+1)*A+(i+1)%A,(j+1)*A+i))
co=mesh('Layered fabric collar',cv,cf,teal);co.modifiers.new('Collar cloth thickness','SOLIDIFY').thickness=.035
curve('Collar gold stitch',[cv[B*A+i] for i in range(A)],.009,gold,True)
for s in [-1,1]:
 pts=[(s*.045,-.34,1.36),(s*.12,-.39,1.18),(s*.14,-.40,.96),(s*.20,-.37,.90),(s*.23,-.36,1.02),(s*.20,-.33,1.26)]
 o=mesh('Scarf folded tail',pts,[(0,1,2,3,4,5)],teal);o.modifiers.new('Scarf thickness','SOLIDIFY').thickness=.026;b=o.modifiers.new('Soft scarf bevel','BEVEL');b.width=.035;b.segments=4
 curve('Scarf tip gold edging',[pts[2],pts[3],pts[4]],.013,gold)
star('Star clasp',0,-.47,1.37,.17,gold,depth=.045)
# Cape embroidered stars, small modeled appliques on rear and visible corners.
for a,t,r in [(-2.0,.8,.075),(-1.75,.88,.04),(2.0,.8,.075),(1.75,.88,.04),(0,.85,.08)]:
 x,y,z=capePoint(a,t);o=star('Cape embroidered star',0,0,0,r,gold,depth=.007);o.location=(x,y+.015,z);o.rotation_euler[2]=-a+pi
# Ornate lantern with real open cage, roof, rings, glass and inner star.
lantern=bpy.data.objects.new('Lantern assembly',None);char.objects.link(lantern);lantern.parent=root;lantern.location=(.98,-.09,.91)
cyl('Lantern base',(0,0,-.23),.205,.065,gold,lantern)
torus('Lower rim',(0,0,-.19),.195,.022,gold,parent=lantern)
torus('Upper rim',(0,0,.19),.195,.022,gold,parent=lantern)
cyl('Teal lantern roof',(0,0,.27),.21,.16,teal,lantern,top=.085)
torus('Roof gold border',(0,0,.19),.215,.018,gold,parent=lantern)
ell('Roof finial',(0,0,.39),(.055,.055,.065),gold,lantern)
torus('Handle',(0,0,.48),.09,.018,gold,(pi/2,0,0),lantern)
for i in range(6):
 a=i*pi/3;curve('Lantern gold rib',[(.185*cos(a),.185*sin(a),-.19),(.185*cos(a),.185*sin(a),.19)],.014,gold,parent=lantern)
cyl('Transparent glass',(0,0,0),.177,.36,glass,lantern)
star('Glowing star inside',0,-.03,0,.135,glow,lantern,.055)
curve('Pendant chain',[(0,0,-.26),(0,0,-.34)],.012,gold,parent=lantern)
star('Dangling star charm',0,0,-.40,.075,gold,lantern,.018)
# Separate stage collection: not part of exported model.
stage=bpy.data.collections.new('STUDIO • not exported');scene.collection.children.link(stage)
def stageMove(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 stage.objects.link(o)
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;floor.name='Studio ground';stageMove(floor);floor.data.materials.append(mat('Studio ivory',(.87,.83,.74),.8))
def area(name,loc,power,size,col):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=col;o=bpy.data.objects.new(name,d);stage.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1.7))-o.location).to_track_quat('-Z','Y').to_euler()
area('Warm key',(-3,-4,6),650,4,(1,.87,.7));area('Soft fill',(4,-2,4),450,3,(.75,.87,1));area('Golden rim',(1,3,5),850,3,(1,.87,.65))
camd=bpy.data.cameras.new('Review camera');cam=bpy.data.objects.new('Review camera',camd);stage.objects.link(cam);scene.camera=cam;camd.type='ORTHO';camd.ortho_scale=4.1
# Save editable native asset and material-preserving mesh export.
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/xingbao-sculpt-v2.blend')
bpy.ops.object.select_all(action='DESELECT')
for o in char.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT+'/xingbao-sculpt-v2.glb',export_format='GLB',use_selection=True,export_apply=True)
report={'objects':len(char.objects),'mesh_objects':sum(o.type=='MESH' for o in char.objects),'source':'approved slim-face reference, original modeled geometry','rigged':False}
open(OUT+'/model-report.json','w').write(json.dumps(report,indent=2))
for name,loc in [('front',(0,-8,2.6)),('three-quarter',(3,-8,2.8)),('side',(7,-.3,2.6)),('back',(0,8,2.6))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,1.72))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=PRE+'/'+name+'.png';bpy.ops.render.render(write_still=True)
cam.location=(3,-8,2.8);cam.rotation_euler=(Vector((0,0,1.72))-cam.location).to_track_quat('-Z','Y').to_euler();bpy.ops.wm.save_as_mainfile(filepath=OUT+'/xingbao-sculpt-v2.blend')
