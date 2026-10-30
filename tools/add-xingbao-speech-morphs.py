"""Add an actual closed-mouth target and conversational bone animation.
Run after bake-xingbao-game-v5.py, before finish-xingbao-game-v5.py.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector, Quaternion
from mathutils.bvhtree import BVHTree
out=Path(__file__).resolve().parent.parent/'art-source/xingbao-space-v5'
bpy.ops.wm.open_mainfile(filepath=str(out/'xingbao-game-v5.blend'))
face=bpy.data.objects['Face | eight expression controls']; head=bpy.data.objects['Head | reference-traced rounded star']; rig=bpy.data.objects['Xingbao_Rig']
with bpy.data.libraries.load(str(out/'xingbao-space-v5.blend')) as (src,dst):dst.meshes=[face.data.name]
original=dst.meshes[0]
tongue={i for p in original.polygons if 'Tongue' in original.materials[p.material_index].name for i in p.vertices}
keys=face.data.shape_keys.key_blocks
if 'Mouth_Close' in keys:face.shape_key_remove(keys['Mouth_Close'])
closed=face.shape_key_add(name='Mouth_Close',from_mix=False)
bvh=BVHTree.FromPolygons([v.co for v in head.data.vertices],[p.vertices for p in head.data.polygons])
cx=(311-310)/260; cz=(814-368)/260; count=0
for i,(base,talk) in enumerate(zip(keys['Basis'].data,keys['Talk_A'].data)):
 if (talk.co-base.co).length<1e-7:continue
 x=base.co.x;u=(x-cx)/.122;z=cz+.006+.016*u*u+(base.co.z-cz)*.025
 hit=bvh.ray_cast(Vector((x,-3,z)),Vector((0,1,0)))
 assert hit[0] is not None
 y=hit[0].y+(.006 if i in tongue else -.006)
 closed.data[i].co=(x,y,z);count+=1
assert count>500 and tongue
# A small alternating open-hand gesture, separate from a greeting wave.
rig.animation_data.action=None
for t in rig.animation_data.nla_tracks:
 if t.name=='TalkGesture':rig.animation_data.nla_tracks.remove(t)
a=bpy.data.actions.new('TalkGesture');rig.animation_data.action=a
for frame in range(1,92,3):
 t=(frame-1)/90*2*math.pi
 for pb in rig.pose.bones:pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
 for name,angle in [('Arm.L',-.27-.09*math.sin(t)),('Arm.R',.14+.07*math.sin(t+.8)),('Forearm.L',-.12-.06*math.sin(t)),('Forearm.R',.08)]:
  pb=rig.pose.bones[name];axis=pb.bone.matrix_local.to_3x3().inverted()@Vector((0,1,0));pb.rotation_euler=Quaternion(axis,angle).to_euler()
 rig.pose.bones['Head'].rotation_euler[1]=.025*math.sin(t)
 rig.pose.bones['Spine'].rotation_euler[1]=.012*math.sin(t+.6)
 for pb in rig.pose.bones:pb.keyframe_insert('rotation_euler',frame=frame);pb.keyframe_insert('location',frame=frame)
tr=rig.animation_data.nla_tracks.new();tr.name='TalkGesture';tr.strips.new('TalkGesture',1,a);tr.mute=True;rig.animation_data.action=None
for pb in rig.pose.bones:pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
for k in keys:k.value=0
bpy.ops.wm.save_as_mainfile(filepath=str(out/'xingbao-game-v5.blend'))
print('SPEECH_READY',count,'mouth vertices',len(tongue),'tongue vertices',flush=True)
