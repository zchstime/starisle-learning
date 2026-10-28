"""Bake procedural materials into a self-contained, static GLB review asset.
The editable high-detail source remains unchanged. This is not the final mobile LOD.
"""
import bpy, math, json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'art-source/xingbao-v3';TEX=OUT/'textures/baked';TEX.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(OUT/'xingbao-refined-v3.blend'))
scene=bpy.context.scene;scene.cycles.samples=8
char=next(c for c in bpy.data.collections if c.name.startswith('XINGBAO'))
# Freeze the explicitly authored eye UVs before making the game texture UVs.
iris=bpy.data.materials.get('12 · sapphire galaxy iris')
if iris:
 n=iris.node_tree.nodes;l=iris.node_tree.links;uv=n.new('ShaderNodeUVMap');uv.uv_map='IrisUV'
 for node in list(n):
  if node.type=='TEX_COORD':
   for link in list(node.outputs['UV'].links):l.new(uv.outputs['UV'],link.to_socket)
objects=[o for o in char.objects if o.type in {'MESH','CURVE'} and not o.name.startswith('Fur •')]
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.convert(target='MESH')
objects=list(bpy.context.selected_objects)
for o in objects:
 mw=o.matrix_world.copy();o.parent=None;o.matrix_world=mw
# Split the cloth shell's outer and lining materials before grouping.
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
objects=list(bpy.context.selected_objects);groups={}
for o in objects:
 used={p.material_index for p in o.data.polygons}
 if not used:continue
 assert len(used)==1,(o.name,used)
 m=o.data.materials[next(iter(used))];groups.setdefault(m.name,[]).append(o)
 for p in o.data.polygons:p.material_index=0
 o.data.materials.clear();o.data.materials.append(m)
assets=[];reports=[]
for number,(matname,parts) in enumerate(groups.items()):
 print('BAKE_GROUP',matname,flush=True)
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0]
 if len(parts)>1:bpy.ops.object.join()
 ob=bpy.context.object;ob.name='Xingbao • '+matname;assets.append(ob)
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 m=ob.data.materials[0];p=m.node_tree.nodes.get('Principled BSDF')
 tris=sum(len(f.vertices)-2 for f in ob.data.polygons)
 cap=110000 if matname.startswith('01b') else (55000 if matname.startswith('01 ') else 35000)
 if tris>cap:
  dec=ob.modifiers.new('Static review simplification','DECIMATE');dec.ratio=cap/tris;bpy.ops.object.modifier_apply(modifier=dec.name)
 needs_color=matname.startswith(('01b','03 ','12 '))
 needs_normal=matname.startswith(('01 ','01b','03 ','04 '))
 maps={}
 if needs_color or needs_normal:
  uv=ob.data.uv_layers.new(name='BakeUV');ob.data.uv_layers.active=uv;uv.active_render=True
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(70),island_margin=.012);bpy.ops.object.mode_set(mode='OBJECT')
  for old in ob.data.uv_layers:old.active_render=(old.name=='BakeUV')
  ob.data.uv_layers.active=ob.data.uv_layers['BakeUV']
  nodes=m.node_tree.nodes;links=m.node_tree.links;output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL')
  for kind in (['color'] if needs_color else [])+(['normal'] if needs_normal else []):
   size=2048 if matname.startswith(('01b','03 ')) else 1024
   img=bpy.data.images.new('Xingbao_'+str(number)+'_'+kind,width=size,height=size,alpha=False)
   if kind=='normal':img.colorspace_settings.name='Non-Color'
   target=nodes.new('ShaderNodeTexImage');target.image=img;nodes.active=target
   if kind=='color':
    prior=output.inputs['Surface'].links[0].from_socket
    em=nodes.new('ShaderNodeEmission')
    if p.inputs['Base Color'].is_linked:links.new(p.inputs['Base Color'].links[0].from_socket,em.inputs['Color'])
    else:em.inputs['Color'].default_value=p.inputs['Base Color'].default_value
    links.new(em.outputs[0],output.inputs['Surface'])
    bpy.ops.object.bake(type='EMIT',use_clear=True,margin=12)
    links.new(prior,output.inputs['Surface']);nodes.remove(em)
   else:bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT',use_clear=True,margin=12)
   img.filepath_raw=str(TEX/(str(number)+'-'+kind+'.png'));img.file_format='PNG';img.save();img.pack();maps[kind]=img
  # A plain Principled material ensures the GLB contains explicit PBR textures.
  out=bpy.data.materials.new(matname+' • BAKED');out.use_nodes=True;np=out.node_tree.nodes.get('Principled BSDF')
  for key in ['Base Color','Roughness','Metallic','IOR','Alpha','Coat Weight','Coat Roughness','Sheen Weight','Emission Color','Emission Strength','Transmission Weight']:
   if key in p.inputs and key in np.inputs:np.inputs[key].default_value=p.inputs[key].default_value
  for kind,img in maps.items():
   tex=out.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img
   if kind=='color':out.node_tree.links.new(tex.outputs['Color'],np.inputs['Base Color'])
   else:
    norm=out.node_tree.nodes.new('ShaderNodeNormalMap');out.node_tree.links.new(tex.outputs['Color'],norm.inputs['Color']);out.node_tree.links.new(norm.outputs['Normal'],np.inputs['Normal'])
  ob.data.materials[0]=out
  # Remove the construction UVs so the baked texture uses glTF TEXCOORD_0.
  for layer in list(ob.data.uv_layers):
   if layer.name!='BakeUV':ob.data.uv_layers.remove(layer)
  for attr in list(ob.data.color_attributes):ob.data.color_attributes.remove(attr)
 reports.append({'part':ob.name,'triangles':sum(len(f.vertices)-2 for f in ob.data.polygons),'maps':list(maps)})
# Hide only source fur; preserve it in the high-detail native sculpt.
for o in char.objects:
 if o.name.startswith('Fur •'):o.hide_render=True;o.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
for o in assets:o.select_set(True)
bpy.context.view_layer.objects.active=assets[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'xingbao-review-v3.glb'),export_format='GLB',use_selection=True,export_apply=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'xingbao-baked-review-v3.blend'))
(OUT/'export-report.json').write_text(json.dumps({'static_review_asset':True,'rigged':False,'animations':0,'parts':reports,'triangles':sum(r['triangles'] for r in reports),'note':'Baked albedo and normal maps. Fine strand fur, Blender subsurface scattering and studio lighting are not represented by the GLB.'},ensure_ascii=False,indent=2))
scene.cycles.samples=24;scene.render.resolution_percentage=75;scene.render.filepath=str(ROOT/'previews/xingbao-v3/baked-review.png');bpy.ops.render.render(write_still=True)
print('XINGBAO_BAKED_EXPORT_COMPLETE',flush=True)
