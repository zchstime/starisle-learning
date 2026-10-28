"""Render the actual exported GLB after importing it again into Blender."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'art-source/xingbao-v3'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'xingbao-baked-review-v3.blend'))
for c in bpy.data.collections:
 if c.name.startswith('XINGBAO'):c.hide_render=True;c.hide_viewport=True
col=bpy.data.collections.new('QA • imported GLB');bpy.context.scene.collection.children.link(col)
bpy.context.view_layer.active_layer_collection=bpy.context.view_layer.layer_collection.children[col.name]
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(OUT/'xingbao-review-v3.glb'))
imported=set(bpy.data.objects)-before
assert sum(o.type=='MESH' for o in imported)==13
scene=bpy.context.scene;scene.cycles.samples=24;scene.render.resolution_percentage=75;scene.render.filepath=str(ROOT/'previews/xingbao-v3/glb-reimport.png');bpy.ops.render.render(write_still=True)
(OUT/'roundtrip-check.json').write_text(json.dumps({'import_success':True,'meshes':sum(o.type=='MESH' for o in imported),'render':'../../previews/xingbao-v3/glb-reimport.png'},indent=2))
print('GLB_REIMPORT_RENDER_COMPLETE')
