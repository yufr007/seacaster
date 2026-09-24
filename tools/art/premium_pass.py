"""SeaCaster premium landmark pass.

Runs after tools/art/build.py. It opens the reproducible Blender source, replaces the
flat island silhouettes with layered sculpted cliffs, then adds small lived-in coastal
landmarks. Everything is original geometry built from the SeaCaster source scene; no
third-party assets are downloaded.
"""
from pathlib import Path
import bpy
import json
import math
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'models' / 'sculpted'
SOURCE = Path('/tmp/seacaster-art-source.blend')

if not SOURCE.exists():
    raise RuntimeError('Run tools/art/build.py before premium_pass.py')

bpy.ops.wm.open_mainfile(filepath=str(SOURCE))


def V(point):
    """Game-space x/y/z -> Blender x/y/z, matching build.py."""
    return Vector((point[0], -point[2], point[1]))


def mat(name):
    material = bpy.data.materials.get(name)
    if material is None:
        raise RuntimeError(f'Missing authored material: {name}')
    return material


def parent(obj, root):
    obj.parent = root
    return obj


def add_uv(mesh):
    if mesh.uv_layers:
        return
    layer = mesh.uv_layers.new(name='UVMap')
    for poly in mesh.polygons:
        normal = poly.normal
        axis = max(range(3), key=lambda i: abs(normal[i]))
        axes = [i for i in range(3) if i != axis]
        for loop_index in poly.loop_indices:
            co = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            layer.data[loop_index].uv = (co[axes[0]] * .25, co[axes[1]] * .25)


def finish(obj, name, material, root=None, bevel=0.0, smooth=True):
    obj.name = name
    if obj.type == 'MESH':
        obj.data.materials.append(mat(material))
        for poly in obj.data.polygons:
            poly.use_smooth = smooth
        add_uv(obj.data)
        if bevel:
            mod = obj.modifiers.new('Premium_rounded_edges', 'BEVEL')
            mod.width = bevel
            mod.segments = 3
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=mod.name)
            normal = obj.modifiers.new('Premium_weighted_normals', 'WEIGHTED_NORMAL')
            normal.keep_sharp = True
            normal.weight = 40
            bpy.ops.object.modifier_apply(modifier=normal.name)
    if root is not None:
        parent(obj, root)
    return obj


def empty(name, at=(0, 0, 0), root=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = V(at)
    if root is not None:
        parent(obj, root)
    return obj


def box(name, at, size, material, root=None, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=V(at))
    obj = bpy.context.object
    obj.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, material, root, min(bevel, min(size) * .35), smooth=False)


def cylinder(name, a, b, radius, material, root=None, vertices=24):
    va, vb = V(a), V(b)
    direction = vb - va
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=direction.length, location=(va + vb) * .5)
    obj = bpy.context.object
    obj.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()
    return finish(obj, name, material, root, min(.022, radius * .16), smooth=True)


def mound(name, root, rings, material, phase=0.0, segments=56):
    """Organic closed radial shell with authored UVs and a non-repeating silhouette."""
    vertices = []
    uvs = []
    for ring_index, (height, rx, rz) in enumerate(rings):
        v = ring_index / max(1, len(rings) - 1)
        for i in range(segments):
            angle = math.tau * i / segments
            wobble = 1 + .055 * math.sin(angle * 3 + phase) + .032 * math.sin(angle * 7 - phase * .6)
            asym = 1 + .035 * math.cos(angle * 2.0 + phase * 1.7)
            x = math.cos(angle) * rx * wobble
            z = math.sin(angle) * rz * asym
            vertices.append(V((x, height, z)))
            uvs.append((i / segments, v))
    faces = []
    for j in range(len(rings) - 1):
        for i in range(segments):
            nxt = (i + 1) % segments
            a = j * segments + i
            b = j * segments + nxt
            c = (j + 1) * segments + nxt
            d = (j + 1) * segments + i
            faces.append((a, b, c, d))
    # Cap the shell so fog/backface angles never reveal a hollow island.
    top_center = len(vertices)
    top_height = rings[-1][0] + .02
    vertices.append(V((0, top_height, 0)))
    uvs.append((.5, 1.0))
    top_start = (len(rings) - 1) * segments
    for i in range(segments):
        faces.append((top_center, top_start + i, top_start + (i + 1) % segments))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    layer = mesh.uv_layers.new(name='UVMap')
    for poly in mesh.polygons:
        for loop_index in poly.loop_indices:
            vertex_index = mesh.loops[loop_index].vertex_index
            layer.data[loop_index].uv = uvs[vertex_index]
    return finish(obj, name, material, root, smooth=True)


def gable_roof(name, at, width, depth, height, material, root):
    x, y, z = at
    vertices = [
        V((x - width / 2, y, z - depth / 2)),
        V((x + width / 2, y, z - depth / 2)),
        V((x - width / 2, y, z + depth / 2)),
        V((x + width / 2, y, z + depth / 2)),
        V((x, y + height, z - depth / 2)),
        V((x, y + height, z + depth / 2)),
    ]
    faces = [(0, 1, 4), (2, 5, 3), (0, 4, 5, 2), (1, 3, 5, 4), (0, 2, 3, 1)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, material, root, bevel=.035, smooth=False)


def tuft(root, at, scale=1.0):
    x, y, z = at
    for i in range(5):
        angle = (i - 2) * .22
        length = (.42 + (i % 2) * .12) * scale
        end = (x + math.sin(angle) * .18 * scale, y + length, z + math.cos(angle) * .08 * scale)
        cylinder('Coastal_grass', (x, y, z), end, .025 * scale, 'Palm_leaf_shadow', root, 8)


def add_cliff(root_name, node_name, phase):
    root = bpy.data.objects.get(root_name)
    if root is None:
        raise RuntimeError(f'Missing island root {root_name}')
    mound(node_name, root, [
        (-.78, 3.25, 2.35),
        (-.56, 3.70, 2.72),
        (-.25, 3.82, 2.82),
        (.02, 3.48, 2.52),
        (.22, 3.06, 2.17),
    ], 'Smooth_slate', phase)
    # Warm shoreline ledge softens the rock-to-water boundary.
    mound(f'{node_name}_SandLip', root, [
        (-.20, 3.82, 2.78),
        (-.06, 3.96, 2.89),
        (.07, 3.55, 2.58),
    ], 'Warm_sandstone', phase + 1.3, segments=52)
    for i in range(11):
        angle = math.tau * i / 11 + phase
        radius = 2.55 + .18 * math.sin(i * 1.7)
        tuft(root, (math.cos(angle) * radius, .46, math.sin(angle) * radius * .67), .72 + (i % 3) * .09)
    return root


island = add_cliff('Island', 'IslandCliff', .7)
lighthouse = add_cliff('LighthouseIsland', 'LighthouseCliff', 2.1)

# Right-island lifestyle landmark: a small handmade jetty that points back toward the player.
jetty = empty('IslandJetty', (0, 0, 0), island)
for i in range(8):
    z = 2.42 + i * .34
    plank = box('Jetty_plank', (.45 + math.sin(i * .8) * .018, .18, z), (1.16, .12, .31), 'Honey_oiled_timber', jetty, .035)
    plank.rotation_euler.z = (i % 3 - 1) * .006
for side in (-1, 1):
    for z in (2.55, 4.62):
        cylinder('Jetty_post', (.45 + side * .62, -.45, z), (.45 + side * .62, .72, z), .105, 'Timber_endgrain', jetty, 18)
        cylinder('Jetty_rope', (.45 + side * .62, .50, z), (.45 + side * .62, .57, z), .135, 'Braided_hemp', jetty, 18)

# A tiny boathouse canopy makes the unlocked island read as somewhere people actually use.
box('Boathouse_floor', (1.55, .34, -.25), (1.75, .18, 1.38), 'Honey_oiled_timber', island, .04)
for x in (.84, 2.26):
    for z in (-.78, .28):
        cylinder('Boathouse_post', (x, .40, z), (x, 1.48, z), .07, 'Timber_endgrain', island, 16)
gable_roof('Boathouse_roof', (1.55, 1.46, -.25), 2.10, 1.72, .52, 'Coral_red_paint', island)

# Lighthouse keeper cottage: readable landmark layers rather than another generic prop cluster.
cottage = empty('KeeperCottage', (0, 0, 0), lighthouse)
box('Keeper_house', (1.15, .73, -.40), (1.95, 1.25, 1.38), 'Warm_ivory_enamel', cottage, .09)
gable_roof('Keeper_roof', (1.15, 1.36, -.40), 2.35, 1.72, .63, 'Coral_red_paint', cottage)
box('Keeper_door', (.62, .76, .31), (.47, .82, .055), 'Deep_ocean_enamel', cottage, .035)
for x in (1.28, 1.68):
    box('Keeper_window', (x, .86, .31), (.27, .31, .06), 'Aqua_window_glass', cottage, .025)
    box('Window_trim', (x, .86, .345), (.37, .41, .035), 'Warm_ivory_enamel', cottage, .025)
# Chimney, path stones and a little bench sell scale next to the lighthouse.
box('Keeper_chimney', (1.72, 1.79, -.63), (.27, .62, .31), 'Smooth_slate', cottage, .04)
for i in range(6):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1, location=V((.52 + i * .22, .34, .68 + i * .23)))
    stone = bpy.context.object
    stone.scale = (.18, .10, .24)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(stone, 'Keeper_path_stone', 'Warm_sandstone', cottage, smooth=True)
box('Keeper_bench_seat', (1.62, .54, .60), (1.0, .12, .34), 'Honey_oiled_timber', cottage, .035)
for x in (1.22, 2.02):
    cylinder('Keeper_bench_leg', (x, .26, .60), (x, .52, .60), .055, 'Timber_endgrain', cottage, 12)

# Save the upgraded DCC source for artifact review and overwrite the shipping GLB.
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    obj.select_set(True)
bpy.context.scene.render.fps = 24
bpy.ops.export_scene.gltf(
    filepath=str(OUT / 'harbour-kit.glb'),
    export_format='GLB',
    export_yup=True,
    export_apply=False,
    export_extras=True,
    export_animations=True,
    export_frame_range=False,
    export_force_sampling=True,
    export_nla_strips=True,
    export_materials='EXPORT',
    export_image_format='AUTO',
)

manifest_path = OUT / 'manifest.json'
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
manifest.update({
    'version': 4,
    'source': 'tools/art/build.py + tools/art/premium_pass.py',
    'authoring': 'Original SeaCaster Blender models, sculpted landmark pass and procedural paint textures; no third-party assets.',
    'review': 'Premium landmark candidate; verify mobile renders and physical-device performance before release.',
})
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'premium_pass': 4, 'nodes': len(bpy.context.scene.objects)}))
