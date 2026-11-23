"""Build the manor with Blender: blender -b -t 2 --python tools/assets/prepare_manor.py."""
from pathlib import Path
from math import radians
import bpy

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "tools/assets/manor"
EXPORT = ROOT / "public/assets/environments/manor.glb"
SOURCE.mkdir(exist_ok=True)
EXPORT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)

def material(name, rgb, roughness=.7, metallic=0):
    mat = bpy.data.materials.new(name)
    color = (*rgb, 1)
    mat.diffuse_color = color
    mat.use_nodes = True
    shader = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return mat

limestone = material("Warm limestone", (.68, .56, .39))
trim = material("Ivory moulding", (.92, .82, .64))
slate = material("Blue slate", (.07, .11, .16))
brass = material("Aged brass", (.59, .31, .09), .32, .5)
oak = material("Smoked walnut", (.23, .13, .073))
plaster = material("Sage plaster", (.32, .40, .33))
stone = material("Travertine", (.58, .47, .32))
grass = material("Garden lawn", (.16, .27, .095))
gravel = material("Garden gravel", (.61, .52, .38))
leaf = material("Boxwood", (.045, .17, .078))
light_leaf = material("Olive foliage", (.17, .32, .105))
water = material("Reflective teal water", (.025, .26, .30), .18, .29)
linen = material("Linen", (.89, .79, .62))
velvet = material("Claret velvet", (.37, .048, .063))
glass = material("Smoked blue glazing", (.12, .27, .35), .2, .25)

def collection(name):
    group = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(group)
    return group

def place(obj, name, mat, **extras):
    obj.name = name
    for source in tuple(obj.users_collection):
        source.objects.unlink(obj)
    group.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    for key, value in extras.items():
        obj[key] = value
    return obj

cubes = {}
cube_vertices = [(x, y, z) for z in (-.5, .5) for y in (-.5, .5) for x in (-.5, .5)]
cube_faces = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)]


def box(name, x1, x2, bottom, top, z1, z2, mat, *, solid=False, walkable=False, pick_through=False):
    mesh = cubes.get(mat.name)
    if mesh is None:
        mesh = bpy.data.meshes.new(mat.name + " cube")
        mesh.from_pydata(cube_vertices, [], cube_faces)
        mesh.materials.append(mat)
        cubes[mat.name] = mesh
    obj = bpy.data.objects.new(name, mesh)
    obj.location = ((x1+x2)/2, -(z1+z2)/2, (bottom+top)/2)
    obj.scale = (x2-x1, z2-z1, top-bottom)
    return place(obj, name, None, solid=solid, walkable=walkable, groundPickThrough=pick_through)

def block(name, x, y, z, w, h, d, mat, **extras):
    return box(name, x-w/2, x+w/2, y, y+h, z-d/2, z+d/2, mat, **extras)

def ellipsoid(name, x, y, z, w, h, d, mat):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, location=(x, -z, y))
    obj = bpy.context.object
    obj.scale = (w, d, h)
    return place(obj, name, mat)

def waypoint(name, x, y, z):
    obj = bpy.data.objects.new(name, None)
    obj.location = (x, -z, y)
    obj.empty_display_size = .18
    return place(obj, name, None, routeWaypoint=True)

def floor(name, x1, x2, z1, z2, y, mat):
    box(name, x1, x2, y-.24, y, z1, z2, mat, solid=True, walkable=True)

def rail(name, x1, x2, z1, z2, y):
    box(name, x1, x2, y, y+.98, z1, z2, slate, solid=True)
    box("Brass cap", x1-.035, x2+.035, y+.98, y+1.045, z1-.035, z2+.035, brass)

group = collection("Grounds | forecourt and rear garden")
for z1, z2 in [(-21, -7), (7, 21)]:
    floor("Garden", -14, 14, z1, z2, 0, grass)
for x1, x2 in [(-14, -8), (8, 14)]:
    floor("Side garden", x1, x2, -7, 7, 0, grass)
for z in (-12, 12):
    block("Limestone garden avenue", 0, 0, z, 2.8, .024, 10, gravel, pick_through=True)
    for x in (-2.3, 2.3):
        for offset in (-3.5, -.5, 2.5):
            block("Stone planter", x, 0, z+offset, .75, .46, .75, limestone, solid=True)
            ellipsoid("Clipped topiary", x, .86, z+offset, .48, .68, .48, leaf)
for x, z in [(5.9, 13), (-5.9, -13)]:
    block("Pool water", x, .14, z, 4.5, .08, 3.4, water)
    # Pools are outside the walking area, including when the character jumps.
    exclusion = block("Pool collision", x, 0, z, 4.51, 1.2, 3.42, water, solid=True)
    exclusion["collisionOnly"] = True
    exclusion.display_type = "WIRE"
    exclusion.hide_render = True
    for offset in (-2.4, 2.4):
        block("Pool coping", x+offset, 0, z, .31, .37, 3.98, trim, solid=True)
    for offset in (-1.86, 1.86):
        block("Pool coping", x, 0, z+offset, 4.51, .37, .31, trim, solid=True)
    for i in range(9):
        block("Pool ripple", x, .222, z-1.45+i*.36, 4.28, .002, .016, glass)
for sign in (-1, 1):
    for z in (-17, -9, 0, 9, 17):
        x = sign*11.3
        block("Cypress trunk", x, 0, z, .45, 1.9, .45, oak, solid=True)
        ellipsoid("Cypress canopy", x, 2.8, z, .86, 2.4, .86, light_leaf)
    for z in (-19, 19):
        block("Garden hedge", sign*8.5, 0, z, 8, 1.15, .9, leaf, solid=True)
    for x in (-10, -3.5, 0, 3.5, 10):
        for z in (sign*8, sign*17.5):
            waypoint("Garden route", x, 0, z)
    waypoint("Side passage", sign*10, 0, 0)
    for z in (-10.4, 10.4):
        waypoint("Poolside path", sign*5.9, 0, z)

levels = ["B1 | servants quarters", "1F | reception", "2F | primary suite",
          "3F | library", "4F | salon", "Roof | terrace"]
shaft_left, shaft_middle, shaft_right, shaft_end = 2.65, 4.35, 6.05, 3.6
rise = 3.6
for level, label in enumerate(levels):
    group = collection(label)
    y = (level-1)*rise
    roof = level == len(levels)-1
    deck = stone if roof or level <= 1 else oak
    if level == 0:
        floor("Basement slab", -8, 8, -7, 7, y, deck)
    else:
        floor("West gallery", -8, shaft_left, -7, 7, y, deck)
        floor("East gallery", shaft_right, 8, -7, 7, y, deck)
        for z1, z2 in [(-7, -shaft_end), (shaft_end, 7)]:
            floor("Stair landing", shaft_left, shaft_right, z1, z2, y, deck)

    # The shaft walls provide continuous side protection throughout each flight.
    for x in (shaft_left, shaft_middle, shaft_right):
        box("Stairwell masonry", x-.11, x+.11, y, y+(1 if roof else rise), -shaft_end, shaft_end, plaster, solid=True)
        block("Stairwell crown", x, y+(.96 if roof else 2.77), 0, .29, .08, 7.24, brass)
    if level < len(levels)-1:
        direction = 1 if level % 2 == 0 else -1
        lane_left, lane_right = (shaft_left, shaft_middle) if level % 2 == 0 else (shaft_middle, shaft_right)
        width = shaft_end*2/20
        for step in range(20):
            z1 = direction*(-shaft_end+step*width)
            z2 = direction*(-shaft_end+(step+1)*width)
            top = y+rise*(step+1)/20
            tread = box("Limestone stair tread", lane_left+.09, lane_right-.09, top-.18, top,
                min(z1,z2), max(z1,z2), trim if step%5 == 0 else stone, walkable=True)
            tread["stairFlight"] = level
    guard = shaft_end if level % 2 == 0 else -shaft_end
    rail("Stair landing guard", shaft_left, shaft_right, guard-.07, guard+.07, y)

    if level in (0, len(levels)-1):
        a, b = (shaft_middle, shaft_right)
        rail("Stair landing guard", a, b, -guard-.07, -guard+.07, y)

    for z in (-4.55, 4.55):
        for x in (3.5, 5.2):
            landing = waypoint("Stair landing route", x, y, z)
            direction = 1 if level % 2 == 0 else -1
            if z == -direction * 4.55:
                if not roof and x == (3.5 if direction == 1 else 5.2):
                    landing["lowerFlight"] = level
                if level > 0 and x == (5.2 if direction == 1 else 3.5):
                    landing["upperFlight"] = level - 1
        waypoint("Gallery turn", 1.6, y, z)
        waypoint("East wing turn", 6.65, y, z)
    for x in (-5, -2, 0, 1.6, 6.65):
        waypoint("Interior route", x, y, 0)
    for z in (-4.7, 4.7):
        waypoint("West room route", -5, y, z)
    if not roof:
        waypoint("West room aisle", -3.65, y, 0)
        for z in (-5.95, 5.95):
            waypoint("West room aisle", -3.65, y, z)

    if roof:
        for z in (-6.86, 6.86):
            rail("Terrace parapet", -8, 8, z-.1, z+.1, y)
        for x in (-7.86, 7.86):
            rail("Terrace parapet", x-.1, x+.1, -6.76, 6.76, y)
        for x in (-6.5, -3.5):
            block("Terrace planter", x, y, -4.6, 1.25, .55, 1.15, limestone, solid=True)
            ellipsoid("Terrace olive", x, y+1.3, -4.6, .78, .9, .76, light_leaf)
        for z in (-1.65, 1.65):
            block("Terrace settee", -6, y, z, 2.15, .52, .75, oak, solid=True)
        block("Terrace table", -6, y, 0, 1.35, .76, .95, slate, solid=True)
        continue

    for z in (-6.88, 6.88):
        if level == 1:
            for a, b in [(-8, -1.45), (1.45, 8)]:
                box("Doorway masonry", a, b, y, y+rise-.24, z-.12, z+.12, limestone, solid=True)
            block("Door lintel", 0, y+2.66, z, 3.08, .7, .34, limestone, solid=True)
            for x in (-1.58, 1.58):
                block("Carved door jamb", x, y, z, .33, 2.67, .47, trim, solid=True)
            waypoint("Door approach", 0, y, z*.86)
        else:
            block("Facade wall", 0, y, z, 16, rise-.24, .24, limestone, solid=True)
        if level > 0:
            for x in (-6.2, -3.8, 3.8, 6.2):
                outside = z+(.133 if z>0 else -.133)
                block("Window surround", x, y+.77, outside, 1.45, 1.98, .09, trim)
                block("Window glazing", x, y+.9, outside+(.06 if z>0 else -.06), 1.19, 1.7, .035, glass)
                block("Window sill", x, y+.72, outside, 1.66, .13, .39, trim)
                block("Window mullion", x, y+.9, outside+(.09 if z>0 else -.09), .08, 1.7, .04, brass)
            block("Continuous cornice", 0, y+3.27, z, 16.28, .17, .48, trim)
    for x in (-7.88, 7.88):
        block("Side wall", x, y, 0, .24, rise-.24, 14, limestone, solid=True)
    for z1, z2 in [(-6.76, -1.32), (1.32, 6.76)]:
        box("West room partition", -3.15, -2.98, y, y+rise-.24, z1, z2, plaster, solid=True)
    block("West room lintel", -3.06, y+2.55, 0, .17, .81, 2.64, plaster, solid=True)

    # Distinct room furnishings leave the hall and door approaches clear.
    if level in (0, 2):
        for z in ((-3.3, 3.3) if level == 0 else (-3.6,)):
            width = 1.15 if level == 0 else 2.38
            block("Bed frame", -6, y, z, width, .44, 2.38, oak, solid=True)
            block("Mattress", -6, y+.43, z, width-.08, .24, 2.23, linen)
            block("Coverlet", -6, y+.66, z+.25, width-.09, .06, 1.58, velvet)
            block("Pillow", -6, y+.67, z-.75, width-.33, .12, .43, linen)
            block("Headboard", -6, y, z-1.2, width, 1.26, .13, oak, solid=True)
    else:
        for z in (-4.05, 3.8):
            block("Upholstered settee", -6.7, y, z, 1.09, .54, 2.23, velvet, solid=True)
            block("Tufted back", -7.13, y+.46, z, .26, .61, 2.23, velvet, solid=True)
            block("Inlaid table", -5, y, z+.3, 1, .58, 1.2, oak, solid=True)
    for z in (-4, 4):
        block("Woven hall runner", -.5, y, z, 1.5, .018, 3.4, velvet, pick_through=True)
    if level in (0, 2, 3, 4):
        for z in (-5.1, 3.4):
            block("Walnut cabinet", 7.39, y, z, .64, 2.18, 1.65, oak, solid=True)
            for shelf in range(4):
                for i in range(5):
                    block("Cabinet books", 7.057, y+.18+shelf*.45, z-.56+i*.24,
                          .11, .25+i%3*.035, .17, (brass, velvet, slate)[i%3])

group = collection("Entry porticoes")
for z in (-7.94, 7.94):
    for x in (-2.55, 2.55):
        block("Column plinth", x, 0, z, .83, .24, .83, trim, solid=True)
        bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=.28, depth=2.7, location=(x,-z,1.55))
        place(bpy.context.object, "Portico column", limestone, solid=True)
        block("Column capital", x, 2.86, z, .75, .29, .75, trim)
    block("Portico entablature", 0, 3.13, z, 6.48, .36, 1.76, trim)
    canopy = block("Portico cornice", 0, 3.48, z, 6.7, .14, 1.93, slate)
    canopy.rotation_euler.x = radians(2 if z>0 else -2)

bpy.ops.object.select_all(action="DESELECT")
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == "VIEW_3D":
            from mathutils import Euler
            area.spaces.active.region_3d.view_rotation = Euler((radians(62), 0, radians(26)), 'XYZ').to_quaternion()
            area.spaces.active.region_3d.view_distance = 48
            area.spaces.active.region_3d.view_location = (0, 0, 4)
            area.spaces.active.shading.color_type = "MATERIAL"

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "manor.blend"), compress=True)
bpy.ops.export_scene.gltf(filepath=str(EXPORT), export_extras=True)





