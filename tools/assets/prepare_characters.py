"""Rebuild CC0 character derivatives with installed Blender 5.2; no external add-ons.

blender --factory-startup --disable-autoexec --background --python tools/assets/prepare_characters.py
"""
from pathlib import Path
import hashlib
import json
import sys

import bpy
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'public/assets/characters'
SOURCE = ROOT / 'tools/assets/source'


def warp_child(point):
    """Shorter legs, wider torso and enlarged head in Blender world Z-up space."""
    x, y, z = point
    if z < 0.95:
        z *= 0.55
    elif z < 1.45:
        z = 0.95 * 0.55 + (z - 0.95) * 0.65
    else:
        z = 0.95 * 0.55 + 0.5 * 0.65 + (z - 1.45) * 0.95
    head = point.z > 1.45
    return Vector((x * (0.94 if head else 0.73), y * (0.94 if head else 0.73), z))


def make_child(rig):
    rig.animation_data.action = None
    bpy.context.view_layer.update()
    # Preserve each adult hand as a uniformly scaled unit about its wrist.
    # Height alone cannot identify the head: T-pose fingers cross z=1.45 too.
    hand_bones = {}
    wrists = {}
    for side in ('L', 'R'):
        wrist = rig.data.bones[f'Wrist.{side}']
        wrists[side] = rig.matrix_world @ wrist.head_local
        for bone in (wrist, *wrist.children_recursive):
            hand_bones[bone.name] = side

    def hand_point(point, side):
        origin = wrists[side]
        return warp_child(origin) + (point - origin) * 0.73

    for obj in list(bpy.context.scene.objects):
        if obj.type != 'MESH':
            continue
        inv = obj.matrix_world.inverted()
        for vertex in obj.data.vertices:
            point = obj.matrix_world @ vertex.co
            target = warp_child(point)
            weights = {'L': 0.0, 'R': 0.0}
            for group in vertex.groups:
                side = hand_bones.get(obj.vertex_groups[group.group].name)
                if side:
                    weights[side] += group.weight
            for side, weight in weights.items():
                target += (hand_point(point, side) - warp_child(point)) * weight
            vertex.co = inv @ target
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    inv = rig.matrix_world.inverted()
    for bone in rig.data.edit_bones:
        side = hand_bones.get(bone.name)
        for attr in ('head', 'tail'):
            point = rig.matrix_world @ getattr(bone, attr)
            setattr(bone, attr, inv @ (hand_point(point, side) if side else warp_child(point)))
    bpy.ops.object.mode_set(mode='OBJECT')
    # Translation keys are offsets from rest; scale locomotion bob to child size.
    for action in bpy.data.actions:
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        if curve.data_path.endswith('.location'):
                            for key in curve.keyframe_points:
                                key.co.y *= 0.65
                                key.handle_left.y *= 0.65
                                key.handle_right.y *= 0.65


def author_jump(rig, idle):
    rig.animation_data.action = idle
    rig.animation_data.action_slot = idle.slots[0]
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()
    base = {b.name: (b.location.copy(), b.rotation_quaternion.copy(), b.scale.copy()) for b in rig.pose.bones}
    bend_axes = {b.name: (rig.matrix_world @ b.matrix).to_quaternion().inverted() @ Vector((1, 0, 0)) for b in rig.pose.bones}
    rig.animation_data.action = None
    action = bpy.data.actions.new('Jump')
    action.slots.new(id_type='OBJECT', name=rig.name)
    rig.animation_data.action = action
    rig.animation_data.action_slot = action.slots[0]
    # Controller supplies world-space ascent; these keys only articulate the rig.
    poses = [(0, 0.0), (4, 0.35), (9, 1.0), (17, 0.8), (22, 0.2), (26, 0.0)]
    for frame, amount in poses:
        for bone in rig.pose.bones:
            location, rotation, scale = base[bone.name]
            bone.location = location
            bone.rotation_mode = 'QUATERNION'
            bone.rotation_quaternion = rotation
            bone.scale = scale
            angle = 0.0
            if bone.name.startswith('UpperLeg.'):
                angle = -0.55 * amount
            elif bone.name.startswith('LowerLeg.'):
                angle = 0.95 * amount
            elif bone.name.startswith('UpperArm.'):
                angle = -1.0 * amount
            elif bone.name.startswith('LowerArm.'):
                angle = -0.45 * amount
            elif bone.name == 'Torso':
                angle = 0.12 * amount
            if angle:
                bone.rotation_quaternion = rotation @ Quaternion(bend_axes[bone.name], angle)
            for prop in ('location', 'rotation_quaternion', 'scale'):
                bone.keyframe_insert(data_path=prop, frame=frame, group=bone.name)
    action.use_fake_user = True
    return action


def generate(variant):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    source = SOURCE / ('woman.glb' if variant == 'woman' else 'man.glb')
    bpy.ops.import_scene.gltf(filepath=str(source))
    rig = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    keep = {}
    for action in list(bpy.data.actions):
        suffix = action.name.split('|')[-1]
        if suffix in ('Idle', 'Walk', 'Run'):
            action.name = suffix
            action.use_fake_user = True
            keep[suffix] = action
        else:
            bpy.data.actions.remove(action)
    for track in list(rig.animation_data.nla_tracks):
        rig.animation_data.nla_tracks.remove(track)
    # Imported custom bone display shapes are not part of the character.
    for obj in list(bpy.context.scene.objects):
        if obj.type == 'MESH' and not any(m.type == 'ARMATURE' for m in obj.modifiers):
            bpy.data.objects.remove(obj, do_unlink=True)
    if variant == 'child':
        make_child(rig)
    keep['Jump'] = author_jump(rig, keep['Idle'])
    rig.animation_data.action = keep['Idle']
    rig.animation_data.action_slot = keep['Idle'].slots[0]
    bpy.context.scene.frame_set(0)
    bpy.context.scene.render.fps = 30
    rig['asset_author'] = 'Quaternius'
    rig['asset_license'] = 'CC0-1.0'
    rig['project_modifications'] = 'Project-authored Jump; retained Idle Walk Run' + ('; stylized child proportions' if variant == 'child' else '')
    target = OUTPUT / f'{variant}.glb'
    bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', export_animations=True,
                              export_animation_mode='ACTIONS', export_anim_single_armature=True,
                              export_extras=True)
    if target.stat().st_size > 2 * 1024 * 1024:
        raise RuntimeError(f'Asset exceeds 2 MiB: {target}')
    return {'variant': variant, 'file': target.name, 'bytes': target.stat().st_size,
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
            'source': str(source.relative_to(ROOT)).replace('\\', '/'),
            'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'license': 'CC0-1.0', 'author': 'Quaternius', 'projectAuthoredJump': True,
            'derivedChild': variant == 'child'}


OUTPUT.mkdir(parents=True, exist_ok=True)
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
variants = args or ['man', 'woman', 'child']
if any(v not in ('man', 'woman', 'child') for v in variants):
    raise ValueError('Expected variants: man woman child')
previous = json.loads((OUTPUT / 'asset-manifest.json').read_text(encoding='utf-8')) if args else None
updated = {v: generate(v) for v in variants}
manifest = {'generator': 'tools/assets/prepare_characters.py', 'blender': bpy.app.version_string,
            'assets': [updated.get(v) or next(a for a in previous['assets'] if a['variant'] == v)
                       for v in ('man', 'woman', 'child')]}
(OUTPUT / 'asset-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print('ASSET_MANIFEST', json.dumps(manifest))
