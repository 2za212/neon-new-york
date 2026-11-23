"""Read saved Rapier notifies, Cascade settings, sockets and export their web assets.

Run with UnrealEditor-Cmd <isolated-copy>.uproject -run=pythonscript
-script=<this-file>. The current project supplies all input. No UE assets are
modified or saved. NYC_RAPIER_OUTPUT may override the default ue-rapier folder.
"""
import json
import os
import re
from pathlib import Path
import traceback
import unreal

OUT = Path(os.environ.get('NYC_RAPIER_OUTPUT', Path(__file__).parent / 'ue-rapier')).resolve()
FX = OUT / 'effects'
CLIPS = {**{f'attack-{i}': f'A_Voxel_Rapier_attack_0{i}' for i in range(1, 4)},
         **{f'skill-{i}': f'A_Voxel_Rapier_combo_0{i}' for i in range(1, 4)}}
BASE = '/Game/VoxelCharacter/Animations/Rapier/Animation'


def prop(obj, name, default=None):
    try:
        return obj.get_editor_property(name)
    except Exception:
        return default


def value(obj, depth=0):
    if obj is None or isinstance(obj, (str, bool, int, float)):
        return obj
    if isinstance(obj, unreal.Object):
        return {'path': obj.get_path_name(), 'class': obj.get_class().get_name()}
    if isinstance(obj, (list, tuple, unreal.Array)):
        return [value(x, depth + 1) for x in obj]
    if hasattr(obj, 'x'):
        return [float(getattr(obj, n)) for n in ('x', 'y', 'z', 'w') if hasattr(obj, n)]
    if isinstance(obj, unreal.Rotator):
        return [float(obj.pitch), float(obj.yaw), float(obj.roll)]
    if isinstance(obj, unreal.LinearColor):
        return [float(obj.r), float(obj.g), float(obj.b), float(obj.a)]
    return str(obj)


def fields(obj, names):
    result = {'class': obj.get_class().get_name(), 'path': obj.get_path_name()}
    for name in names:
        v = prop(obj, name)
        if v is not None:
            result[name] = value(v)
    return result


def socket_info(mesh):
    result = {}
    if mesh is None:
        return result
    for name in ('Trail_Start', 'Trail_End', 'hand_rSocket', 'Weapon_R', 'Rapier_FX_Root'):
        s = mesh.find_socket(name)
        if s:
            t = s.get_socket_local_transform()
            result[name] = {'bone': str(prop(s, 'bone_name')),
                            'positionCm': value(t.translation), 'quaternion': value(t.rotation),
                            'scale': value(t.scale3d)}
    return result


def dump_object(obj):
    target = FX / (obj.get_name() + '.t3d')
    try:
        task = unreal.AssetExportTask()
        task.object, task.filename = obj, str(target)
        task.automated, task.prompt, task.replace_identical = True, False, True
        task.exporter = unreal.ObjectExporterT3D()
        if unreal.Exporter.run_asset_export_task(task) and target.is_file():
            return target.name
    except Exception as exc:
        unreal.log_warning(f'Object dump unavailable: {exc}')
    return None


MODULE_PROPS = ('material', 'mesh', 'static_mesh', 'lifetime', 'start_size', 'start_color',
                'start_alpha', 'color_over_life', 'alpha_over_life', 'size_over_life',
                'start_velocity', 'start_velocity_radial', 'rate', 'rate_scale',
                'emitter_duration', 'emitter_loops', 'use_local_space', 'screen_alignment',
                'sort_mode', 'burst_list', 'max_particle_in_trail_count', 'max_trail_count',
                'dead_trails_on_deactivate', 'dead_trails_on_source_loss', 'enable_previous_tangent_recalculation',
                'distance_tessellation_step_size', 'tangent_tessellation_scalar', 'width_tessellation_scalar',
                'tiling_distance', 'sheets_per_trail', 'render_geometry', 'tessellation_factor',
                'spawn_per_unit', 'unit_scalar', 'movement_tolerance')


def module_info(module):
    result = fields(module, MODULE_PROPS)
    # Raw distribution structs hold the editable distribution object.
    for name in MODULE_PROPS:
        raw = prop(module, name)
        dist = prop(raw, 'distribution') if raw is not None else None
        if dist:
            result[name] = fields(dist, ('constant', 'min', 'max', 'constant_curve', 'curve',
                                        'lock_axes', 'locked_axes', 'can_be_baked'))
    return result


def particle_info(particle):
    result = fields(particle, ('warmup_time', 'warmup_tick_rate', 'system_update_mode',
                               'update_time_fps', 'fixed_relative_bounding_box', 'delay',
                               'delay_low', 'use_delay_range', 'occlusion_bounds_method'))
    result['dump'] = dump_object(particle)
    result['emitters'] = []
    for emitter in prop(particle, 'emitters', []):
        er = fields(emitter, ('emitter_name', 'quality_level_spawn_rate_scale', 'cooked_out'))
        er['lods'] = []
        for lod in prop(emitter, 'lod_levels', []):
            lr = fields(lod, ('enabled', 'level'))
            for name in ('required_module', 'spawn_module', 'type_data_module'):
                m = prop(lod, name)
                if m:
                    lr[name] = module_info(m)
            lr['modules'] = [module_info(m) for m in prop(lod, 'modules', []) if m]
            er['lods'].append(lr)
        result['emitters'].append(er)
    return result


def export_texture(texture):
    filename = FX / (texture.get_name() + '.png')
    task = unreal.AssetExportTask()
    task.object, task.filename = texture, str(filename)
    task.automated, task.prompt, task.replace_identical = True, False, True
    task.exporter = unreal.TextureExporterPNG()
    ok = unreal.Exporter.run_asset_export_task(task)
    return filename.name if ok and filename.is_file() else None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    FX.mkdir(parents=True, exist_ok=True)
    result = {'version': 1, 'sourceProject': str(unreal.Paths.get_project_file_path()),
              'readOnly': True, 'clips': {}, 'effects': {}, 'assets': [], 'sockets': {}}
    particles = {}
    for role, name in CLIPS.items():
        anim = unreal.load_asset(BASE + '/' + name)
        if anim is None:
            raise RuntimeError('Missing ' + name)
        duration = anim.get_play_length()
        clip = {'source': anim.get_path_name(), 'duration': duration, 'events': []}
        events = unreal.AnimationLibrary.get_animation_notify_events(anim)
        for i, event in enumerate(events):
            # Sequence links are absolute. TriggerTimeOffset is only a boundary bias.
            # LinkValue/Duration are protected in UE 5.7's Python wrappers.
            # Export the reflected struct, whose final LinkValue is the start
            # (the earlier value belongs to EndLink).
            raw = event.export_text()
            links = re.findall(r'LinkValue=([-\d.]+)', raw)
            span = re.search(r',Duration=([-\d.]+)', raw)
            start = float(links[-1]) if links else prop(event, 'link_value')
            ev = {'index': i, 'name': str(prop(event, 'notify_name')), 'time': start,
                  'duration': float(span.group(1)) if span else 0, 'track': prop(event, 'track_index'),
                  'triggerTimeOffset': prop(event, 'trigger_time_offset')}
            if start is not None:
                ev['phase'] = float(start) / duration
                ev['endTime'] = float(start) + float(ev['duration'] or 0)
                ev['endPhase'] = ev['endTime'] / duration
            for key in ('notify', 'notify_state_class'):
                n = prop(event, key)
                if n:
                    ev[key] = fields(n, ('ps_template', 'first_socket_name', 'second_socket_name',
                                        'width_scale_mode', 'width_scale_curve', 'recycle_spawned_systems',
                                        'location_offset', 'rotation_offset', 'scale', 'attached', 'socket_name',
                                        'template', 'destroy_at_end', 'follow', 'absolute_scale'))
                    p = prop(n, 'ps_template')
                    if p:
                        particles[p.get_path_name()] = p
            clip['events'].append(ev)
        result['clips'][role] = clip
        unreal.log('NYC_ATTACK_EVENTS ' + role + ' ' + json.dumps(clip))
    # Check both retargeted and original mannequin sockets.
    for path in ('/Game/VoxelCharacter/SKM_Reference_UniformVoxel',
                 '/Game/Rapier_AnimSet/Animation/Skeleton/SK_Mannequin'):
        mesh = unreal.load_asset(path)
        result['sockets'][path] = socket_info(mesh)
    for path, particle in particles.items():
        result['effects'][path] = particle_info(particle)
    # Export actual source textures/material descriptions/meshes for reconstruction.
    registry = unreal.AssetRegistryHelpers.get_asset_registry()
    registry.scan_paths_synchronous(['/Game/Rapier_AnimSet'], force_rescan=True)
    assets = registry.get_assets_by_path('/Game/Rapier_AnimSet', recursive=True)
    for data in assets:
        path = str(data.package_name)
        if not any('/' + folder + '/' in path for folder in ('FX_Textures', 'FX_Materials')) and not path.endswith(('/circle_slash', '/upscale__needles')):
            continue
        obj = data.get_asset()
        entry = fields(obj, ())
        try:
            if isinstance(obj, unreal.Texture2D):
                entry['file'] = export_texture(obj)
                entry.update(fields(obj, ('srgb', 'compression_settings', 'address_x', 'address_y')))
            elif isinstance(obj, unreal.MaterialInterface):
                entry['dump'] = dump_object(obj)
                entry.update(fields(obj, ('blend_mode', 'shading_model', 'two_sided', 'material_domain', 'parent',
                                          'texture_parameter_values', 'vector_parameter_values', 'scalar_parameter_values')))
            elif isinstance(obj, unreal.StaticMesh):
                filename = obj.get_name() + '.glb'
                options = unreal.GLTFExportOptions()
                messages = unreal.GLTFExporter.export_to_gltf(obj, str(FX / filename), options, set())
                if messages and not messages.errors:
                    entry['file'] = filename
        except Exception as exc:
            entry['error'] = str(exc)
        result['assets'].append(entry)
    (OUT / 'attack-events.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    unreal.log('NYC_ATTACK_EVENTS_DONE ' + str(OUT / 'attack-events.json'))


try:
    main()
except Exception:
    unreal.log_error(traceback.format_exc())
    raise
