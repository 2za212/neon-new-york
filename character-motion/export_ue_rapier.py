"""Export saved Rapier animations and blend-space data from the ZaoHua UE project.

The current UE project supplies the input assets. In an open ZaoHua editor use
``py "<absolute path>/export_ue_rapier.py"`` in its Cmd bar. For a saved project,
run ``UnrealEditor-Cmd "<project>.uproject" -run=pythonscript -script="<path>"``.
The script leaves UE assets unchanged. It writes to the ue-rapier folder beside
this script by default. Set the process environment variable NYC_RAPIER_OUTPUT
to an absolute folder path before launching UE to choose another destination.
"""

import json
import os
import runpy
from pathlib import Path
import traceback

import unreal


ANIMATION_FOLDER = "/Game/VoxelCharacter/Animations/Rapier/Animation"
BLENDSPACE_PATH = (
    "/Game/VoxelCharacter/Animations/Rapier/AdvancedAsset/BlendSpace/"
    "A_Voxel_Rapier_BlendSpace"
)
CHARACTER_PATH = "/Game/VoxelCharacter/SKM_Reference_UniformVoxel"
SWORD_PATH = "/Game/Rapier_AnimSet/mesh/weapon"
OUTPUT = Path(os.environ.get(
    "NYC_RAPIER_OUTPUT", Path(__file__).resolve().parent / "ue-rapier"
)).expanduser().resolve()
CLIPS = {
    "idle": "A_Voxel_Rapier_N_idle",
    "jump": "A_Voxel_Rapier_jump1_Z1",
    "attack-1": "A_Voxel_Rapier_attack_01",
    "attack-2": "A_Voxel_Rapier_attack_02",
    "attack-3": "A_Voxel_Rapier_attack_03",
    "dodge-forward": "A_Voxel_Rapier_avoid_front",
    "dodge-back": "A_Voxel_Rapier_avoid_back",
    "dodge-left": "A_Voxel_Rapier_avoid_left",
    "dodge-right": "A_Voxel_Rapier_avoid_right",
    "skill-1": "A_Voxel_Rapier_combo_01",
    "skill-2": "A_Voxel_Rapier_combo_02",
    "skill-3": "A_Voxel_Rapier_combo_03",
    "hurt": "A_Voxel_Rapier_hit_light_F_body",
    "death": "A_Voxel_Rapier_Dead1",
    "knockdown": "A_Voxel_Rapier_hit_knockdown01",
    "rise": "A_Voxel_Rapier_rise1",
}


def asset(path):
    name = path.rsplit("/", 1)[-1]
    result = unreal.find_object(None, f"{path}.{name}") or unreal.load_asset(path)
    if result is None:
        raise RuntimeError(f"Missing UE asset: {path}")
    return result


def vector(value):
    return [float(value.x), float(value.y), float(value.z)]


def clip_info(animation, filename, skeleton):
    if not isinstance(animation, unreal.AnimSequence):
        raise RuntimeError(f"Expected an Animation Sequence: {animation.get_path_name()}")
    if animation.get_editor_property("skeleton") != skeleton:
        raise RuntimeError(f"Animation uses a different skeleton: {animation.get_path_name()}")
    return {
        "file": filename,
        "source": animation.get_path_name(),
        "duration": float(animation.get_play_length()),
    }


def sample_filename(animation):
    stem = animation.get_name().removeprefix("A_Voxel_Rapier_")
    for short, long in (("frontL", "front_left"), ("frontR", "front_right"),
                        ("backL", "back_left"), ("backR", "back_right")):
        stem = stem.replace(short, long)
    if stem == "idle":
        return "locomotion-idle.glb"
    return stem.replace("_", "-") + ".glb"


def export_glb(obj, filename, options):
    final = OUTPUT / filename
    temporary = OUTPUT / f".{filename}.export.glb"
    try:
        messages = unreal.GLTFExporter.export_to_gltf(obj, str(temporary), options, set())
        if messages is None or messages.errors or not temporary.is_file():
            raise RuntimeError(f"Failed to export {obj.get_path_name()}: {messages}")
        for message in messages.warnings:
            unreal.log_warning(str(message))
        temporary.replace(final)
    finally:
        temporary.unlink(missing_ok=True)
    unreal.log(f"NYC_RAPIER_EXPORT {filename}: {final.stat().st_size} bytes")


def main():
    character = asset(CHARACTER_PATH)
    skeleton = character.get_editor_property("skeleton")
    blendspace = asset(BLENDSPACE_PATH)
    if blendspace.get_editor_property("skeleton") != skeleton:
        raise RuntimeError("The Rapier blend space must use the voxel character skeleton")
    manifest = {"version": 1, "source": blendspace.get_path_name(), "axes": [],
                "samples": [], "clips": {}}
    animations = {}
    for role, name in CLIPS.items():
        animation = asset(f"{ANIMATION_FOLDER}/{name}")
        filename = f"{role}.glb"
        manifest["clips"][role] = clip_info(animation, filename, skeleton)
        animations[filename] = animation

    for parameter in blendspace.get_editor_property("blend_parameters"):
        manifest["axes"].append({
            "name": str(parameter.get_editor_property("display_name")),
            "min": float(parameter.get_editor_property("min")),
            "max": float(parameter.get_editor_property("max")),
            "gridDivisions": int(parameter.get_editor_property("grid_num")),
            "wrap": bool(parameter.get_editor_property("wrap_input")),
        })
    for sample in blendspace.get_editor_property("sample_data"):
        animation = sample.get_editor_property("animation")
        if animation is None:
            raise RuntimeError("The Rapier blend space has an empty sample")
        filename = sample_filename(animation)
        info = clip_info(animation, filename, skeleton)
        info["position"] = vector(sample.get_editor_property("sample_value"))
        info["rateScale"] = float(sample.get_editor_property("rate_scale"))
        manifest["samples"].append(info)
        animations[filename] = animation

    sword = asset(SWORD_PATH)
    socket = character.find_socket("Weapon_R")
    if socket is None:
        raise RuntimeError("The character has no Weapon_R socket for its sword")
    transform = socket.get_socket_local_transform()
    p, q, s = transform.translation, transform.rotation, transform.scale3d
    manifest["sword"] = {
        "file": "sword.glb", "source": sword.get_path_name(),
        "socket": "Weapon_R", "bone": str(socket.get_editor_property("bone_name")),
        "position": [p.x * .01, p.z * .01, p.y * .01],
        "quaternion": [-q.x, -q.z, -q.y, q.w],
        "scale": [s.x, s.z, s.y],
    }

    # glTF samples evaluated compressed poses. Newly loaded sequences may still
    # be building their animation data asynchronously in a commandlet.
    unreal.SystemLibrary.execute_console_command(None, "Editor.AsyncAssetCompilationFinishAll")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    options = unreal.GLTFExportOptions()
    options.export_animation_sequences = True
    options.export_vertex_skin_weights = True
    options.export_preview_mesh = False
    for filename, animation in animations.items():
        export_glb(animation, filename, options)
    export_glb(sword, "sword.glb", options)
    manifest_file = OUTPUT / "blendspace.json"
    temporary = OUTPUT / ".blendspace.export.json"
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(manifest_file)
    unreal.log(f"NYC_RAPIER_COMPLETE {len(animations)} clips and sword")
    runpy.run_path(str(Path(__file__).with_name('inspect_ue_rapier_events.py')), run_name='__main__')


if __name__ == "__main__":
    try:
        main()
    except Exception:
        unreal.log_error(traceback.format_exc())
        raise
