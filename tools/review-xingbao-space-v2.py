"""Reimport the final GLB and render geometry and real morph expressions."""
import bpy,json,hashlib,os
from pathlib import Path
from mathutils import Vector,Quaternion
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'art-source/xingbao-space-v2';PRE=ROOT/'previews/xingbao-space-v2'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'xingbao-space-v2.blend'))
source=bpy.data.collections['XINGBAO | blue explorer refined'];source.hide_render=True;source.hide_viewport=True
col=bpy.data.collections.new('QA | actual reimported GLB');bpy.context.scene.collection.children.link(col);bpy.context.view_layer.active_layer_collection=bpy.context.view_layer.layer_collection.children[col.name]
before=set(bpy.data.objects);actions_before=set(bpy.data.actions)
bpy.ops.import_scene.gltf(filepath=str(OUT/'xingbao-space-v2.glb'))
objects=set(bpy.data.objects)-before;rig=next(o for o in objects if o.type=='ARMATURE');actions=set(bpy.data.actions)-actions_before
rig.animation_data_clear()
meshes=[o for o in objects if o.type=='MESH'];morphmeshes=[o for o in meshes if o.data.shape_keys]
for o in morphmeshes:o.data.shape_keys.animation_data_clear()
scene=bpy.context.scene;cam=scene.camera;cam.data.ortho_scale=3.60
scene.cycles.samples=int(os.getenv('XB_SAMPLES','32'));scene.render.resolution_x=scene.render.resolution_y=int(os.getenv('XB_RES','1100'))
def setface(name):
 for o in morphmeshes:
  for k in o.data.shape_keys.key_blocks:
   if k.name!='Basis':k.value=0
  keys=o.data.shape_keys.key_blocks
  if name=='Blink':
   for n in ['Blink_L','Blink_R']:
    if n in keys:keys[n].value=1
  elif name in keys:keys[name].value=1

def turn(label,angle):
 pb=rig.pose.bones['Arm.'+label];axis=pb.bone.matrix_local.to_3x3().inverted()@Vector((0,1,0));pb.rotation_euler=Quaternion(axis,angle).to_euler()
def pose(name):
 for pb in rig.pose.bones:pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
 if name=='hero':turn('L',-.92);turn('R',-.1);rig.pose.bones['Head'].rotation_euler[2]=.12;rig.pose.bones['Leg.R'].rotation_euler[0]=.22
 if name=='happy':turn('L',-.85);turn('R',.85)
 if name=='think':turn('L',-.30);rig.pose.bones['Head'].rotation_euler[2]=.09
 if name=='focus':turn('L',-.45);turn('R',.2)
views={'front':((0,-10,1.8),(0,0,1.5)),'hero':((2.5,-9,2.5),(0,0,1.5)),'side':((9,0,1.8),(0,0,1.5)),'back':((0,9,1.8),(0,0,1.5))}
rendered=[]
for name in os.getenv('XB_QA_VIEWS','front,hero,side,back,happy,think,focus,blink,surprise,talk-a,talk-o').split(','):
 if not name:continue
 setface('');pose(name);loc,target=views.get(name,((.5,-9,2),(0,0,1.5)));cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 ex={'happy':'Happy','think':'Think','focus':'Focus','blink':'Blink','surprise':'Surprise','talk-a':'Talk_A','talk-o':'Talk_O'}.get(name,'')
 if ex:setface(ex)
 scene.render.filepath=str(PRE/('glb-'+name+'.png'));bpy.ops.render.render(write_still=True);rendered.append('glb-'+name+'.png')
report={'sha256':hashlib.sha256((OUT/'xingbao-space-v2.glb').read_bytes()).hexdigest(),'imported_meshes':len(meshes),'armatures':1,'imported_actions':[a.name for a in actions],'morphs':{o.name:[k.name for k in o.data.shape_keys.key_blocks] for o in morphmeshes},'actual_glb_renders':rendered}
(OUT/'roundtrip-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('REFINED_ROUNDTRIP_COMPLETE',flush=True)
