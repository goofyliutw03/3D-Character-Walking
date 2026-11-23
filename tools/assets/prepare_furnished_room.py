"""Furnished living room. Run with blender --background --python this_file.py.

Creates a separate scene; existing scenes are preserved. No external assets.
Designed for Blender 4.x / 5.x. Press F12 after running to render.
"""
import bpy
import math
import random
from mathutils import Vector
from pathlib import Path

rng = random.Random(12)
scene = bpy.data.scenes.new('Furnished Living Room')
if bpy.context.window:
    bpy.context.window.scene = scene


def material(name, color, roughness=0.5, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return mat


oak = material('Honey oak', (0.43, 0.24, 0.11))
wall = material('Warm plaster', (0.79, 0.75, 0.65), 0.9)
teal = material('Teal upholstery', (0.055, 0.23, 0.22), 0.92)
cream = material('Cream fabric', (0.85, 0.79, 0.64), 0.95)
rust = material('Terracotta', (0.60, 0.18, 0.085), 0.8)
dark = material('Charcoal metal', (0.025, 0.032, 0.035), 0.3, 0.6)
brass = material('Brass', (0.55, 0.34, 0.10), 0.28, 0.75)
green = material('Leaves', (0.08, 0.27, 0.095), 0.7)
paper = material('Paper', (0.87, 0.84, 0.73), 0.8)
blue = material('Book blue', (0.10, 0.23, 0.36))


def finish(obj, name, mat):
    obj.name = name
    # Move primitives to this scene, including in background execution.
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def box(name, pos, size, mat, bevel=0.025, rotation=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = finish(bpy.context.object, name, mat)
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.z = rotation
    if bevel:
        mod = obj.modifiers.new('Soft edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    return obj


def cylinder(name, pos, radius, depth, mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius,
                                       depth=depth, location=pos)
    obj = finish(bpy.context.object, name, mat)
    bevel = obj.modifiers.new('Edge rounding', 'BEVEL')
    bevel.width, bevel.segments = 0.012, 3
    return obj


def ellipsoid(name, pos, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=pos)
    obj = finish(bpy.context.object, name, mat)
    obj.scale = scale
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def light(name, pos, target, power, size, color):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.shape, data.size = power, 'DISK', size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = pos
    aim(obj, target)


# Open-front, two-wall architectural cutaway, six by five meters.
box('Foundation', (0, 0, -0.14), (6.2, 5.2, 0.25), oak)
for i in range(20):
    shade = material('Floor plank %02d' % i,
                     (0.40 + rng.random()*0.09, 0.24 + rng.random()*0.04, 0.12))
    box('Floor plank', (-2.85 + i*0.30, 0, 0.005), (0.292, 5, 0.04), shade, 0.005)
box('Back wall', (0, 2.56, 1.5), (6.15, 0.12, 3), wall)
box('Left wall', (-3.06, 0, 1.5), (0.12, 5, 3), wall)
box('Back skirting', (0, 2.46, 0.11), (6, 0.05, 0.18), cream, 0.008)
box('Left skirting', (-2.96, 0, 0.11), (0.05, 5, 0.18), cream, 0.008)

# Rug and sofa, facing the open front.
box('Woven rug', (0, -0.35, 0.047), (3.4, 2.8, 0.035), cream, 0.015)
for x in (-1.5, 1.5):
    box('Rug border', (x, -0.35, 0.067), (0.035, 2.55, 0.006), rust, 0)
for x in (-1.15, 1.15):
    for y in (1.12, 1.90):
        cylinder('Sofa foot', (x, y, 0.16), 0.055, 0.26, oak)
box('Sofa base', (0, 1.52, 0.36), (2.8, 1.02, 0.30), teal, 0.10)
box('Sofa back', (0, 1.96, 0.86), (2.8, 0.25, 0.90), teal, 0.10)
for x in (-1.31, 1.31):
    box('Sofa arm', (x, 1.52, 0.69), (0.24, 1.05, 0.56), teal, 0.09)
for x in (-0.85, 0, 0.85):
    box('Seat cushion', (x, 1.44, 0.59), (0.79, 0.77, 0.19), teal, 0.08)
for x, mat in ((-0.88, cream), (0.88, rust)):
    pillow = box('Throw pillow', (x, 1.77, 0.95), (0.47, 0.18, 0.47), mat, 0.085)
    pillow.rotation_euler = (math.radians(12), math.radians(x*10), 0)

# Rounded coffee table with a book and ceramic bowl.
box('Coffee table top', (0, -0.25, 0.53), (1.65, 0.85, 0.10), oak, 0.16)
for x in (-0.61, 0.61):
    for y in (-0.49, -0.01):
        cylinder('Coffee table leg', (x, y, 0.28), 0.035, 0.48, dark)
box('Coffee table book', (-0.37, -0.25, 0.61), (0.43, 0.31, 0.055), blue, 0.006, 0.12)
cylinder('Ceramic bowl', (0.38, -0.23, 0.615), 0.17, 0.07, rust)
cylinder('Bowl interior', (0.38, -0.23, 0.652), 0.135, 0.006, dark)

# Accent chair, with four wood legs.
for x in (1.96, 2.58):
    for y in (-1.48, -0.85):
        cylinder('Chair leg', (x, y, 0.22), 0.045, 0.40, oak)
box('Armchair seat', (2.27, -1.16, 0.51), (0.88, 0.88, 0.23), rust, 0.10)
box('Armchair back', (2.27, -0.80, 0.88), (0.88, 0.19, 0.76), rust, 0.09)
for x in (1.87, 2.67):
    box('Armchair arm', (x, -1.16, 0.72), (0.16, 0.86, 0.25), rust, 0.07)

# Low bookcase along the left wall, open toward the room.
for z in (0.15, 0.68, 1.21):
    box('Bookcase shelf', (-2.66, 0.65, z), (0.56, 1.60, 0.07), oak)
for y in (-0.12, 1.42):
    box('Bookcase side', (-2.66, y, 0.68), (0.56, 0.07, 1.13), oak)
for i in range(10):
    height = rng.uniform(0.25, 0.40)
    box('Shelf book', (-2.62, 0.02+i*0.105, 0.72+height/2),
        (0.34, 0.075, height), (blue, rust, cream)[i % 3], 0.004)

# Framed geometric artwork on the back wall.
box('Art frame', (0, 2.45, 2.14), (1.65, 0.065, 0.95), oak, 0.015)
box('Art paper', (0, 2.408, 2.14), (1.52, 0.012, 0.82), paper, 0)
ellipsoid('Art sun', (-0.36, 2.393, 2.31), (0.19, 0.008, 0.19), rust)
box('Art blue shape', (0.31, 2.39, 2.10), (0.40, 0.013, 0.48), blue, 0.04)
box('Art horizon', (-0.17, 2.38, 1.96), (0.65, 0.015, 0.07), teal, 0.01)

# Plant in the rear-right corner.
cylinder('Plant pot', (2.35, 1.72, 0.28), 0.28, 0.5, rust)
cylinder('Soil', (2.35, 1.72, 0.535), 0.24, 0.015, dark)
cylinder('Plant stem', (2.35, 1.72, 1.02), 0.022, 1.0, green)
for i in range(11):
    angle = i * 2.4
    z = 0.80 + i*0.075
    leaf = ellipsoid('Plant leaf', (2.35+0.22*math.cos(angle),
                                   1.72+0.22*math.sin(angle), z),
                     (0.28, 0.10, 0.055), green)
    leaf.rotation_euler = (0, -0.4, angle)

# Floor lamp beside sofa.
cylinder('Lamp base', (-1.98, 1.65, 0.08), 0.25, 0.09, dark)
cylinder('Lamp stem', (-1.98, 1.65, 0.93), 0.022, 1.70, brass)
bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=0.33, radius2=0.20,
                               depth=0.40, location=(-1.98, 1.65, 1.80))
finish(bpy.context.object, 'Lampshade', cream)
light('Lamp glow', (-1.98, 1.65, 1.57), (-1.98, 1.65, 0), 45, 0.35, (1, 0.66, 0.34))

# Studio lighting and orthographic architectural camera.
world = bpy.data.worlds.new('Room ambient')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.65, 0.80, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = 0.35
scene.world = world
light('Large daylight', (1, -3, 6), (0, 0.5, 0), 1100, 5, (1, 0.88, 0.72))
light('Soft fill', (4, 1, 4), (0, 0, 1), 650, 4, (0.72, 0.84, 1))
camera_data = bpy.data.cameras.new('Room camera')
camera = bpy.data.objects.new('Room camera', camera_data)
scene.collection.objects.link(camera)
camera.location = (8, -11, 8)
aim(camera, (0, 0.15, 1.05))
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 10.2
scene.camera = camera
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 1400
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = '//furnished_room.png'
scene.unit_settings.system = 'METRIC'
if bpy.context.screen:
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_perspective = 'CAMERA'

# The plank top is the character's ground datum. Apply the same translation
# to the entire room, including the editable lighting and camera.
for obj in scene.objects:
    obj.location.z -= 0.025

# Run from this file, or supply its path when executing in the live session.
root = Path(__file__).resolve().parents[2]
export_path = root / 'public/assets/environments/furnished-room.glb'
blend_path = root / 'tools/assets/furnished-room/furnished-room.blend'
export_path.parent.mkdir(parents=True, exist_ok=True)
blend_path.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type == 'MESH':
        obj.select_set(True)

bpy.ops.export_scene.gltf(
    filepath=str(export_path),
    use_selection=True,
    export_apply=True,
    export_yup=True,
)
bpy.ops.wm.save_as_mainfile(
    filepath=str(blend_path),
    copy=True,
)
print(f'{scene.name}: {len(scene.objects)} objects; scenes: {list(bpy.data.scenes.keys())}')
