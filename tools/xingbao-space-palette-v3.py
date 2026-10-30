"""Final concept-matching color calibration, reusable by generator and source updater."""
import bpy,numpy as np,math

def srgb(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4

def calibrate():
 scene=bpy.context.scene
 if scene.get('XingbaoPaletteCalibrated'):return
 for name,color in [('03 Sky blue cloth',(.17,.54,.98)),('04 Deep powder blue',(.06,.38,.86)),('05 Warm gold',(.98,.64,.10))]:
  m=bpy.data.materials.get(name)
  if m:
   c=tuple(srgb(v) for v in color)+(1,);m.diffuse_color=c;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=c
 atlas=bpy.data.images.get('Uniform_Color_2048')
 if atlas:
  a=np.empty(len(atlas.pixels),dtype=np.float32);atlas.pixels.foreach_get(a);a=a.reshape((-1,4));mask=(a[:,2]>a[:,0]*1.25)&(a[:,2]>a[:,1]*1.10)
  a[mask,0]*=.52;a[mask,1]*=.94;atlas.pixels.foreach_set(a.ravel());atlas.save();atlas.pack()
 head=bpy.data.objects.get('Head | reference-traced rounded star')
 if head:
  att=head.data.color_attributes.get('SkinColor');base=tuple(srgb(v) for v in (.99,.905,.77));pink=tuple(srgb(v) for v in (1,.45,.49))
  centers=[((179-310)/260,(814-385)/260),((447-310)/260,(814-381)/260)]
  for v in head.data.vertices:
   x,y,z=v.co;w=0
   if y<0:
    for cx,cz in centers:
     r=math.sqrt(((x-cx)/.132)**2+((z-cz)/.113)**2);t=max(0,min(1,(r-.48)/.75));weight=.80*(1-t*t*(3-2*t));w=max(w,weight)
   att.data[v.index].color=(*(a*(1-w)+b*w for a,b in zip(base,pink)),1)
 scene['XingbaoPaletteCalibrated']=True
