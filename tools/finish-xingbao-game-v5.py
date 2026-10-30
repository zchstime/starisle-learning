"""Preserve clean white sclera and view-independent sculpted gold in game export."""
import bpy,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent.parent;out=root/'art-source/xingbao-space-v5';bpy.ops.wm.open_mainfile(filepath=str(out/'xingbao-game-v5.blend'))
char=bpy.data.collections['XINGBAO | blue explorer refined'];targets={o.name:o for o in char.objects if o.type=='MESH'}
with bpy.data.libraries.load(str(out/'xingbao-space-v5.blend')) as (src,dst):dst.meshes=list(targets)
original={m.name.split('.00')[0]:m for m in dst.meshes}
def lin(x):return x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
for name,o in targets.items():
 source=original[name];assert len(source.polygons)==len(o.data.polygons)
 for old in list(o.data.color_attributes):o.data.color_attributes.remove(old)
 colors=o.data.color_attributes.new(name='GameColor',type='FLOAT_COLOR',domain='CORNER')
 for c in colors.data:c.color=(1,1,1,1)
 mats={}
 for p,sp in zip(o.data.polygons,source.polygons):
  mn=source.materials[sp.material_index].name
  kind='gold' if 'gold' in mn.lower() or 'Eye starlight' in mn else ('white' if 'eye edge' in mn else None)
  if not kind:continue
  if kind not in mats:
   m=bpy.data.materials.new('Game '+kind+' clean');m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=(1,1,1,1);bs.inputs['Metallic'].default_value=0;vc=n.new('ShaderNodeVertexColor');vc.layer_name='GameColor';l.new(vc.outputs[0],bs.inputs['Base Color']);o.data.materials.append(m);mats[kind]=len(o.data.materials)-1
  p.material_index=mats[kind]
  for li in p.loop_indices:
   if kind=='white':rgb=(.99,.98,.95)
   else:
    normal=o.data.vertices[o.data.loops[li].vertex_index].normal
    t=max(0,normal.dot(Vector((-.4,-.8,.45)).normalized()));rgb=tuple(a*(1-t)+b*t for a,b in zip((.88,.46,.08),(1,.86,.40)))
   colors.data[li].color=(*(lin(x) for x in rgb),1)
# Quantize only AFTER the HDR bake and exposure. Game PNGs need 8-bit sRGB,
# not 16-bit intermediates that double the download size.
scene=bpy.context.scene;scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8'
encoded={}
for o in targets.values():
 for mat in o.data.materials:
  for nd in mat.node_tree.nodes:
   if nd.type!='TEX_IMAGE' or not nd.image:continue
   im=nd.image
   if im not in encoded:
    path=out/(im.name.split('.')[0].lower()+'-srgb.png');im.save_render(str(path),scene=scene)
    portable=bpy.data.images.load(str(path),check_existing=False);portable.pack();encoded[im]=portable
   nd.image=encoded[im]
bpy.ops.object.select_all(action='DESELECT')
for o in char.objects:o.select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['Xingbao_Rig']
bpy.ops.export_scene.gltf(filepath=str(out/'xingbao-game-v5.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_skins=True,export_morph=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'xingbao-game-v5.blend'))
