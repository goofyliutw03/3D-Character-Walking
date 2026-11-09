"""Original CC0 hybrid city buildings. Rebuild with installed Blender; no inputs/network."""
from pathlib import Path
import hashlib
import json
import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/assets/city'
OUT.mkdir(parents=True, exist_ok=True)
(ROOT / 'blender').mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.file_preview_type = 'NONE'
bpy.context.preferences.filepaths.save_version = 0
bpy.context.preferences.filepaths.use_auto_save_temporary_files = False
for unused in list(bpy.data.materials):
    bpy.data.materials.remove(unused, do_unlink=True)
materials = {}

def material(color):
    if color not in materials:
        rgb = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
        linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
        m = bpy.data.materials.new(color)
        m.diffuse_color = (*linear, 1)
        m.use_nodes = True
        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*linear, 1)
        m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .82
        materials[color] = m
    return materials[color]

def box(parts, x, y, z, w, h, d, color):
    # Author in viewer meters / Y-up, convert to Blender Z-up. glTF reverses this conversion.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y))
    obj = bpy.context.object
    obj.scale = (w, d, h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material(color))
    parts.append(obj)

palette = ['#c9aa8b', '#b7c7b3', '#d2ba9d', '#a4b9b8', '#b8c4cb', '#d2ad94', '#d6c9af', '#b8bea1']
for index in range(8):
    side = -1 if index < 4 else 1
    x, z = side * 12.1, [-20, -7, 7, 20][index % 4]
    h = 6 + (index % 4 % 3) * 1.9
    parts = []
    box(parts, x, .3+h/2, z, 7.2, h, 9.8, palette[index])
    box(parts, x, .3+h+.14, z, 7.5, .28, 10.1, '#eee7d7')
    # Rooftop parapets, inset stair housing and solar-like dark roof panels.
    for dz in [-4.85, 4.85]:
        box(parts, x, h+.65, z+dz, 7.2, .42, .22, '#b5b6a9')
    box(parts, x+side*1.7, h+.95, z+2, 2.2, 1.0, 2.0, '#b5b6a9')
    for dz in [-2.5, -.8]:
        box(parts, x, h+.51, z+dz, 3.2, .08, 1.1, '#344b4d')
    front = x-side*3.64
    for y in [v for v in [3.4, 5.5, 7.6] if v < h-.5]:
        for dz in [-3.2, -1.05, 1.05, 3.2]:
            box(parts, front, y, z+dz, .12, 1.42, 1.25, '#eae2d0')
            box(parts, front-side*.08, y, z+dz, .04, 1.15, 1.02, '#526e73')
            box(parts, front-side*.105, y, z+dz, .04, .06, 1.02, '#eae2d0')
    for dz in [-2.9, 2.9]:
        box(parts, front, 1.5, z+dz, .12, 2.1, 2.6, '#466566')
    box(parts, front, 1.45, z, .14, 2.3, 1.1, '#344b4d')
    box(parts, front-side*.05, 2.94, z, .12, .38, 4.6, '#f2e7cc')
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = f'Building_{index}'
    obj.data.name = obj.name
    # Consolidate duplicate material slots while retaining separate glTF primitives.
    unique = []
    mapping = {}
    for slot, mat in enumerate(obj.data.materials):
        if mat not in unique:
            unique.append(mat)
        mapping[slot] = unique.index(mat)
    indices = [mapping[p.material_index] for p in obj.data.polygons]
    obj.data.materials.clear()
    for mat in unique:
        obj.data.materials.append(mat)
    for poly, mat_index in zip(obj.data.polygons, indices):
        poly.material_index = mat_index

bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'blender/city-block.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT / 'buildings.glb'), export_format='GLB', export_yup=True,
                          export_animations=False, export_cameras=False, export_lights=False)
blob = (OUT / 'buildings.glb').read_bytes()
manifest = {'generator': 'tools/assets/prepare_city.py', 'blender': bpy.app.version_string,
            'license': 'CC0-1.0', 'origin': 'Original project-authored procedural buildings; no third-party inputs',
            'buildingCount': 8, 'meters': True, 'upAxis': 'Y', 'bytes': len(blob),
            'sha256': hashlib.sha256(blob).hexdigest(),
            'scope': 'Hybrid streetscape: Blender buildings; runtime procedural road, sidewalks, trees, lights and water'}
(OUT / 'asset-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
print(json.dumps(manifest))
