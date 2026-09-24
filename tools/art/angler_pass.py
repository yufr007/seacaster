"""Adds the first-person angler to the SeaCaster authored GLB.
Runs after premium_pass.py and edits the saved Blender source in place.
"""
from pathlib import Path
import bpy, json, math
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'models' / 'sculpted'
SOURCE = Path('/tmp/seacaster-art-source.blend')
if not SOURCE.exists(): raise RuntimeError('premium_pass.py must run first')
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))

def V(p): return Vector((p[0], -p[2], p[1]))
def material(name, color=None, rough=.7):
    found = bpy.data.materials.get(name)
    if found: return found
    m = bpy.data.materials.new(name); m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    if color:
        h = color.lstrip('#'); rgb = tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
        bs.inputs['Base Color'].default_value = (*rgb,1)
    bs.inputs['Roughness'].default_value = rough
    return m

def uv(mesh):
    if mesh.uv_layers: return
    layer = mesh.uv_layers.new(name='UVMap')
    for poly in mesh.polygons:
        normal=poly.normal; axis=max(range(3),key=lambda i:abs(normal[i])); axes=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            co=mesh.vertices[mesh.loops[li].vertex_index].co; layer.data[li].uv=(co[axes[0]]*.5,co[axes[1]]*.5)

def finish(obj,name,mat,root,smooth=True):
    obj.name=name; obj.parent=root; obj.data.materials.append(material(mat))
    for p in obj.data.polygons:p.use_smooth=smooth
    uv(obj.data); return obj

def empty(name):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o); return o

def ball(name,at,scale,mat,root):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=1, location=V(at)); o=bpy.context.object
    o.scale=(scale[0],scale[2],scale[1]); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,root)

def tube(name,a,b,r1,r2,mat,root):
    va,vb=V(a),V(b); d=vb-va
    bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=r1,radius2=r2,depth=d.length,location=(va+vb)*.5)
    o=bpy.context.object; o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    bevel=o.modifiers.new('Soft_edge','BEVEL'); bevel.width=min(.018,r1*.16); bevel.segments=2
    bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=bevel.name)
    return finish(o,name,mat,root)

material('Angler_skin','#D89B72',.72)
material('Angler_sleeve','#256D78',.78)
root=empty('AnglerHands'); root['interface']='First-person presentation; parent beside Rod in runtime'
# Lower casting hand: oversized readable mitten/palm around the cork grip.
tube('Casting_sleeve',(.46,.02,.05),(.12,.47,.02),.20,.15,'Angler_sleeve',root)
ball('Casting_cuff',(.10,.48,.02),(.21,.12,.18),'Warm_ivory_enamel',root)
ball('Casting_palm',(.02,.66,.00),(.18,.24,.15),'Angler_skin',root)
for i,z in enumerate((-.10,-.035,.035,.10)):
    tube('Casting_finger',(-.09,.66,z),(.09,.71,z),.045,.038,'Angler_skin',root)
ball('Casting_thumb',(.13,.66,-.11),(.09,.14,.08),'Angler_skin',root)
# Reel hand sits above and slightly left so the silhouette reads around the reel seat.
tube('Reel_sleeve',(-.48,.38,.16),(-.17,.83,.09),.19,.145,'Angler_sleeve',root)
ball('Reel_cuff',(-.17,.84,.09),(.20,.12,.18),'Warm_ivory_enamel',root)
ball('Reel_palm',(-.10,1.01,.06),(.18,.22,.15),'Angler_skin',root)
for i,z in enumerate((-.08,-.02,.04,.10)):
    tube('Reel_finger',(-.18,1.04,z),(.05,1.08,z),.042,.035,'Angler_skin',root)
ball('Reel_thumb',(.09,.99,-.06),(.085,.13,.075),'Angler_skin',root)

bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'harbour-kit.glb'),export_format='GLB',export_yup=True,export_apply=False,export_extras=True,export_animations=True,export_frame_range=False,export_force_sampling=True,export_nla_strips=True,export_materials='EXPORT',export_image_format='AUTO')
manifest_path=OUT/'manifest.json'; manifest=json.loads(manifest_path.read_text())
manifest.update({'version':5,'source':'tools/art/build.py + tools/art/premium_pass.py + tools/art/angler_pass.py','review':'Premium first-person harbour candidate; verify authored WebGL renders and physical-device performance.'})
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'angler_pass':5,'objects':len(bpy.context.scene.objects)}))
