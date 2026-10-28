"""Verify the exported GLB by reimporting it, rendering every angle and sampling actions."""
import bpy,json,os
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'art-source/xingbao-space-v1';PRE=ROOT/'previews/xingbao-space-v1'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'xingbao-space-v1.blend'))
old=bpy.data.collections['Xingbao_Space_Character'];old.hide_render=True;old.hide_viewport=True
col=bpy.data.collections.new('GLB roundtrip');bpy.context.scene.collection.children.link(col);bpy.context.view_layer.active_layer_collection=bpy.context.view_layer.layer_collection.children[col.name]
before=set(bpy.data.objects);oldactions=set(bpy.data.actions)
bpy.ops.import_scene.gltf(filepath=str(OUT/'xingbao-space-v1.glb'))
objects=set(bpy.data.objects)-before;actions=set(bpy.data.actions)-oldactions
rig=next(o for o in objects if o.type=='ARMATURE');scene=bpy.context.scene;cam=scene.camera
scene.render.resolution_x=scene.render.resolution_y=1000;scene.cycles.samples=24
views={'glb-front':((0,-9,2.2),(0,0,1.55)),'glb-hero':((3,-8,3.2),(0,0,1.55)),'glb-side':((8,0,2.2),(0,0,1.55)),'glb-back':((0,9,2.2),(0,0,1.55))}
# Importer creates action slots/tracks. Neutral rest for geometry inspection.
rig.animation_data_clear()
for pb in rig.pose.bones:pb.matrix_basis.identity()
for name,(loc,target) in views.items():
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(PRE/(name+'.png'));bpy.ops.render.render(write_still=True)
results=[]
for a in actions:
 if not any(k in a.name for k in ['Wave','Celebrate']):continue
 rig.animation_data_create();rig.animation_data.action=a
 if a.slots:rig.animation_data.action_slot=a.slots[0]
 scene.frame_set(16);loc,target=views['glb-front'];cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 name='wave' if 'Wave' in a.name else 'celebrate';scene.render.filepath=str(PRE/(name+'.png'));bpy.ops.render.render(write_still=True);results.append({'action':a.name,'frame':16,'image':name+'.png'})
(OUT/'roundtrip-check.json').write_text(json.dumps({'imported_meshes':sum(o.type=='MESH' for o in objects),'armatures':1,'imported_actions':[a.name for a in actions],'views':list(views),'animation_samples':results},indent=2));print('ROUNDTRIP_COMPLETE')
