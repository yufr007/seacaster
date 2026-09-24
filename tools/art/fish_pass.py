"""Author distinct premium-stylized 3D models for all 15 SeaCaster catches.

Runs after the harbour, landmark and angler passes. Geometry is deliberately smooth,
compact and readable on phone screens. Each catch gets a stable Fish_fN root and
Tail_fN pivot so runtime animation is deterministic and independent of Blender clips.
"""
from pathlib import Path
import bpy, json, math
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'models' / 'sculpted'
SOURCE = Path('/tmp/seacaster-art-source.blend')
if not SOURCE.exists(): raise RuntimeError('angler_pass.py must run first')
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))


def V(p): return Vector((p[0], -p[2], p[1]))

def hex_rgb(value):
    h=value.lstrip('#'); return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))

def material(name, color, rough=.58, metal=.0, emissive=None):
    m=bpy.data.materials.get(name)
    if m: return m
    m=bpy.data.materials.new(name); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); rgb=hex_rgb(color)
    bs.inputs['Base Color'].default_value=(*rgb,1); bs.inputs['Roughness'].default_value=rough; bs.inputs['Metallic'].default_value=metal
    if emissive and 'Emission Color' in bs.inputs:
        bs.inputs['Emission Color'].default_value=(*hex_rgb(emissive),1); bs.inputs['Emission Strength'].default_value=.45
    return m

def uv(mesh):
    if mesh.uv_layers:return
    layer=mesh.uv_layers.new(name='UVMap')
    for poly in mesh.polygons:
        normal=poly.normal; axis=max(range(3),key=lambda i:abs(normal[i])); axes=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            co=mesh.vertices[mesh.loops[li].vertex_index].co; layer.data[li].uv=(co[axes[0]]*.45,co[axes[1]]*.45)

def finish(obj,name,mat,root,smooth=True):
    obj.name=name; obj.parent=root; obj.data.materials.append(mat)
    for poly in obj.data.polygons: poly.use_smooth=smooth
    uv(obj.data); return obj

def empty(name,root=None,at=(0,0,0)):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o); o.location=V(at)
    if root:o.parent=root
    return o

def sphere(name,at,scale,mat,root,segments=28,rings=18):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=V(at)); o=bpy.context.object
    o.scale=(scale[0],scale[2],scale[1]); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,root)

def segment(name,a,b,r1,r2,mat,root,vertices=22):
    va,vb=V(a),V(b); d=vb-va
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=d.length,location=(va+vb)*.5)
    o=bpy.context.object; o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    return finish(o,name,mat,root)

def fin(name,root,points,thickness,mat):
    # Symmetrical wedge gives fins enough volume to catch lighting without heavy topology.
    verts=[]
    for side in (-thickness,thickness):
        for x,y,z in points: verts.append(V((x,y,z+side)))
    n=len(points); faces=[]
    faces.append(tuple(range(n))); faces.append(tuple(range(n,2*n))[::-1])
    for i in range(n): faces.append((i,(i+1)%n,(i+1)%n+n,i+n))
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o)
    return finish(o,name,mat,root,smooth=True)

def eye(root,x,y,z,scale=.075,ghost=False):
    white=material('Fish_eye_pearl','#f8f1d5',.28)
    dark=material('Fish_eye_dark','#081923',.24)
    glow=material('Fish_eye_ghost','#81f1e0',.24,0, '#81f1e0')
    sphere('Eye', (x,y,z), (scale,scale,scale*.72), glow if ghost else white, root,20,12)
    sphere('Pupil',(x+scale*.72,y,z),(scale*.38,scale*.52,scale*.54),dark,root,16,10)

def standard_fish(fid, palette, length=1.75,height=.58,width=.42, head=.34, tail=.48, dorsal=.34, bill=0, sail=0, shark=False, ghost=False, stripes=0):
    body_mat=material(f'{fid}_body',palette[0],.48 if ghost else .58, .04 if ghost else 0, palette[0] if ghost else None)
    accent=material(f'{fid}_accent',palette[1],.55)
    belly=material(f'{fid}_belly',palette[2],.64)
    root=empty(f'Fish_{fid}'); root['species']=fid
    body=sphere('Body',(0,0,0),(length*.5,height*.5,width*.5),body_mat,root)
    # Belly and shoulder overlays break up the silhouette without flat decals.
    sphere('Belly',(length*.08,-height*.15,0),(length*.32,height*.16,width*.39),belly,root,24,14)
    sphere('Head',(length*.40,0,0),(head,height*.42,width*.43),body_mat,root,24,16)
    eye(root,length*.47,height*.12,width*.38,.065 if length<2 else .08,ghost)
    eye(root,length*.47,height*.12,-width*.38,.065 if length<2 else .08,ghost)
    tail_root=empty(f'Tail_{fid}',root,(-length*.48,0,0))
    fin('TailFin',tail_root,[(-tail*.02,0,0),(-tail,height*.62,0),(-tail*.72,0,0),(-tail,-height*.62,0)],width*.035,accent)
    fin('DorsalFin',root,[(-length*.16,height*.39,0),(length*.06,height*.55+dorsal,0),(length*.20,height*.38,0)],width*.035,accent)
    fin('FinLeft',root,[(length*.08,-.03,width*.35),(length*.02,-height*.42,width*.70),(-length*.18,-height*.08,width*.38)],width*.025,accent)
    fin('FinRight',root,[(length*.08,-.03,-width*.35),(length*.02,-height*.42,-width*.70),(-length*.18,-height*.08,-width*.38)],width*.025,accent)
    if bill:
        segment('Bill',(length*.57,0,0),(length*.57+bill,0,0),width*.08,width*.015,accent,root,18)
    if sail:
        fin('SailFin',root,[(-length*.30,height*.34,0),(-length*.15,height*.35+sail*.65,0),(length*.05,height*.37+sail,0),(length*.28,height*.38,0)],width*.045,accent)
    if shark:
        fin('SharkDorsal',root,[(-length*.08,height*.34,0),(length*.03,height*.98,0),(length*.20,height*.35,0)],width*.05,accent)
        # characteristic lower tail lobe
        fin('SharkTailLower',tail_root,[(-tail*.06,0,0),(-tail*.80,-height*.78,0),(-tail*.56,-height*.05,0)],width*.04,accent)
    # Raised bands are cheap and readable at phone scale; vary count by species.
    for i in range(stripes):
        x=-length*.22 + i*(length*.35/max(1,stripes-1))
        sphere('BodyMark',(x,height*.10,0),(length*.035,height*.36,width*.51),accent,root,18,12)
    return root

SPECIES = [
 ('f1',('#769bb7','#d8c776','#d9e5db'),1.45,.42,.28,.25,.38,.20,0,0,False,False,1),
 ('f2',('#467b86','#243f5c','#c7d7cc'),1.62,.50,.34,.29,.44,.27,0,0,False,False,4),
 ('f3',('#6e8c72','#bb8c59','#d7caa7'),1.72,.64,.42,.34,.45,.34,0,0,False,False,2),
 ('f4',('#c94f46','#f0b24e','#f1d5b0'),1.70,.66,.40,.34,.46,.40,0,0,False,False,1),
 ('f5',('#82684b','#d39b4a','#d4c6a1'),1.68,.88,.55,.42,.48,.35,0,0,False,False,3),
 ('f6',('#8d9a88','#6f4f40','#e6ddc2'),1.78,.70,.45,.37,.48,.31,0,0,False,False,2),
 ('f7',('#315c89','#e3ad44','#d4e5df'),1.92,.69,.48,.39,.55,.38,0,0,False,False,1),
 ('f8',('#5c7d91','#d5b66a','#d9e7e0'),1.88,.58,.38,.30,.50,.32,.95,0,False,False,0),
 ('f9',('#42a999','#e6d35e','#d9f0c4'),1.86,.66,.39,.34,.54,.44,0,0,False,False,3),
 ('f10',('#294f72','#c78a4a','#d5e0d7'),2.04,.66,.42,.32,.58,.36,1.08,0,False,False,1),
 ('f11',('#416c92','#e2bd65','#d7e4dc'),2.00,.61,.40,.31,.56,.32,.82,.82,False,False,0),
 ('f12',('#234d76','#b89048','#d8e5df'),2.20,.82,.58,.44,.62,.42,0,0,False,False,1),
 ('f13',('#385d63','#79d8c7','#8db8ad'),2.55,.88,.64,.48,.72,.40,0,0,True,True,0),
]
for fid,palette,*args in SPECIES: standard_fish(fid,palette,*args)

# Kraken: a living trophy is a sculptural tentacle, not another fish silhouette.
kraken=empty('Fish_f14'); kraken['species']='f14'; kraken_mat=material('f14_body','#8b497d',.54); sucker=material('f14_sucker','#e6a38e',.60)
tail=empty('Tail_f14',kraken,(-.72,0,0))
points=[(-.85,0,0),(-.55,.18,.04),(-.18,.05,-.08),(.16,.28,.04),(.52,.12,.02),(.86,.35,0)]
for i in range(len(points)-1):
    segment('TentacleSegment',points[i],points[i+1],.24-i*.022,.215-i*.022,kraken_mat,kraken,24)
for i in range(7):
    t=i/6; x=-.42+t*1.14; y=.02+math.sin(t*math.pi*2)*.08
    sphere('Sucker',(x,y,-.19),(.075,.032,.075),sucker,kraken,16,10)
# animated tip geometry is parented to Tail_f14
segment('TentacleTip',(-.85,0,0),(-1.28,.22,0),.16,.035,kraken_mat,tail,22)

# Leviathan: elongated spectral sea-serpent with plated fins and a crown-like head.
lev=empty('Fish_f15'); lev['species']='f15'; bodymat=material('f15_body','#245d68',.42,.05,'#58cab5'); accent=material('f15_accent','#d2b65c',.48); belly=material('f15_belly','#7bb2a5',.60)
segments=[(-.95,0,0,.34),(-.55,.06,0,.42),(-.12,0,0,.48),(.32,.08,0,.43),(.68,.13,0,.35)]
for i,(x,y,z,r) in enumerate(segments): sphere('LeviathanBody',(x,y,z),(r*1.35,r,r*.82),bodymat,lev,28,18)
sphere('LeviathanHead',(.90,.16,0),(.48,.40,.34),bodymat,lev,28,18); sphere('LeviathanBelly',(.46,-.12,0),(.62,.20,.29),belly,lev,22,14)
eye(lev,1.15,.25,.26,.085,True); eye(lev,1.15,.25,-.26,.085,True)
levtail=empty('Tail_f15',lev,(-1.18,0,0)); fin('LeviathanTail',levtail,[(-.02,0,0),(-.72,.72,0),(-.55,0,0),(-.72,-.72,0)],.055,accent)
for x in (-.45,-.05,.35,.70): fin('LeviathanSpine',lev,[(x-.13,.30,0),(x,.70,0),(x+.14,.30,0)],.045,accent)
segment('HornLeft',(1.00,.40,.16),(1.18,.78,.27),.07,.018,accent,lev,16); segment('HornRight',(1.00,.40,-.16),(1.18,.78,-.27),.07,.018,accent,lev,16)

bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'harbour-kit.glb'),export_format='GLB',export_yup=True,export_apply=False,export_extras=True,export_animations=True,export_frame_range=False,export_force_sampling=True,export_nla_strips=True,export_materials='EXPORT',export_image_format='AUTO')
manifest_path=OUT/'manifest.json'; manifest=json.loads(manifest_path.read_text())
manifest.update({'version':6,'source':'tools/art/build.py + tools/art/premium_pass.py + tools/art/angler_pass.py + tools/art/fish_pass.py','fish_catalog':'15 distinct authored catch models with stable tail pivots','review':'Premium complete-catalog candidate; verify mobile renders and physical-device performance.'})
roots=list(manifest.get('roots',[]));
for name in ['AnglerHands']+[f'Fish_f{i}' for i in range(1,16)]:
    if name not in roots: roots.append(name)
manifest['roots']=roots
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'fish_pass':6,'species':15,'objects':len(bpy.context.scene.objects)}))
