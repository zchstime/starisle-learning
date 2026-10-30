"""Bake actual sculpt lighting into portable game materials; retain skin and morphs."""
import bpy,os,json
from pathlib import Path
root=Path(__file__).resolve().parent.parent;out=root/'art-source/xingbao-space-v5';bpy.ops.wm.open_mainfile(filepath=str(out/'xingbao-space-v5.blend'))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=16;s.render.bake.margin=16
char=bpy.data.collections['XINGBAO | blue explorer refined'];rig=bpy.data.objects['Xingbao_Rig']
# Freeze neutral bind for light baking; animated data stays in the export.
rig.animation_data.action=None
for t in rig.animation_data.nla_tracks:t.mute=True
for b in rig.pose.bones:b.rotation_euler=(0,0,0);b.location=(0,0,0)
for ob in char.objects:
 if ob.type=='MESH' and ob.data.shape_keys:
  for k in ob.data.shape_keys.key_blocks:k.value=0
# Bake the same softbox lighting used to inspect the real model.
s.render.bake.use_pass_direct=True;s.render.bake.use_pass_indirect=True;s.render.bake.use_pass_color=True
# Neutral broad lighting; avoid metallic reflections baked from an undefined view.
for m in bpy.data.materials:
 if m.use_nodes:
  p=m.node_tree.nodes.get('Principled BSDF')
  if p:
   if 'gold' in m.name.lower():p.inputs['Metallic'].default_value=0;p.inputs['Roughness'].default_value=.4
   for link in list(p.inputs['Normal'].links):m.node_tree.links.remove(link)
meshes=[o for o in char.objects if o.type=='MESH'];baked=[]
for idx,o in enumerate(meshes):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 # Preserve original texture coordinates when the bake UV becomes active.
 for m in o.data.materials:
  if not m or not m.use_nodes:continue
  n=m.node_tree.nodes;l=m.node_tree.links
  for nd in list(n):
   if nd.type=='TEX_IMAGE' and not nd.inputs['Vector'].is_linked:
    uv=n.new('ShaderNodeUVMap');uv.uv_map=o.data.uv_layers[0].name if o.data.uv_layers else 'UVMap';l.new(uv.outputs['UV'],nd.inputs['Vector'])
 uv=o.data.uv_layers.new(name='GameBake');o.data.uv_layers.active=uv;uv.active_render=True
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
 # Closed garment shells need outward normals during baking, even though
 # Blender's two-sided preview can hide inverted collar/badge side faces.
 if o.name.startswith('Outfit'):bpy.ops.mesh.normals_make_consistent(inside=False)
 bpy.ops.uv.smart_project(angle_limit=1.05,island_margin=.012);bpy.ops.object.mode_set(mode='OBJECT')
 # COMBINED contains HDR radiance. A byte buffer clips highlights before
 # exposure, then multiplying its sRGB pixels produces flat grey skin.
 # Keep scene-linear float pixels until exposure and PNG encoding are done.
 im=bpy.data.images.new('Xingbao_Game_'+str(idx),2048,2048,alpha=False,float_buffer=True)
 for m in o.data.materials:
  n=m.node_tree.nodes;node=n.new('ShaderNodeTexImage');node.image=im;n.active=node
 cache=out/('game-shaded-'+str(idx)+'.png')
 cached=(os.environ.get('XB_BAKE_OUTFIT_ONLY')=='1' and not o.name.startswith('Outfit')) or (os.environ.get('XB_BAKE_HEAD_ONLY')=='1' and not o.name.startswith('Head'))
 if cached and cache.exists():
  im=bpy.data.images.load(str(cache),check_existing=False);im.pack();baked.append((idx,o,im));continue
 # Facial geometry moves. Do not burn an open mouth or eyes into the skin.
 facial=bpy.data.objects['Face | eight expression controls']
 facial.hide_render=o.name.startswith('Head')
 bpy.ops.object.bake(type='COMBINED')
 facial.hide_render=False
 # Apply Standard exposure once, in scene-linear space. save() encodes sRGB.
 import numpy as np
 pixels=np.empty(len(im.pixels),dtype=np.float32);im.pixels.foreach_get(pixels);pixels=pixels.reshape((-1,4));pixels[:,:3]*=2**s.view_settings.exposure;im.pixels.foreach_set(pixels.ravel())
 im.filepath_raw=str(out/('game-shaded-'+str(idx)+'.png'));im.file_format='PNG';im.save();im.pack()
 baked.append((idx,o,im))
 print('BAKED',o.name,flush=True)
for idx,o,im in baked:
 mat=bpy.data.materials.new('Game soft studio '+str(idx));mat.use_nodes=True;n=mat.node_tree.nodes;l=mat.node_tree.links;n.clear();tex=n.new('ShaderNodeTexImage');tex.image=im;uvnode=n.new('ShaderNodeUVMap');uvnode.uv_map='GameBake';l.new(uvnode.outputs[0],tex.inputs[0]);em=n.new('ShaderNodeEmission');l.new(tex.outputs['Color'],em.inputs['Color']);output=n.new('ShaderNodeOutputMaterial');l.new(em.outputs[0],output.inputs['Surface'])
 o.data.materials.clear();o.data.materials.append(mat)
 for p in o.data.polygons:p.material_index=0
 # Only the baked UV/color are required by the game.
 for a in list(o.data.uv_layers):
  if a.name!='GameBake':o.data.uv_layers.remove(a)
 for a in list(o.data.color_attributes):o.data.color_attributes.remove(a)
 print('BAKED',o.name,flush=True)
bpy.ops.object.select_all(action='DESELECT')
for o in char.objects:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(out/'xingbao-game-v5.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_skins=True,export_morph=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'xingbao-game-v5.blend'))
