"""Run in the ZaoHua Unreal Editor with py "<absolute path to this script>"."""

import os
import pathlib
import traceback
import unreal


FOLDER = "/Game/VoxelCharacter"
ASSETS = {
    "idle": "IdleMonk__Anim_Monk_C_idle",
    "walk": "A_Voxel_WalkNeutral",
    "run": "Runrun_front",
    "jump": "A_Voxel_Jump",
    "attack": "A_Voxel_ChantStart",
    "punch": "A_Voxel_RightPunch_ShoulderLead",
    "dodge-forward": "Monk__Anim_Monk_move_F",
    "dodge-left": "Monk__Anim_Monk_move_L",
    "dodge-right": "Monk__Anim_Monk_move_R",
    "dodge-back": "Monk__Anim_Monk_movev_B",
    "charged-punch": "A_Attack2",
    "death": "A_Dead",
    "hurt": "A_Hurt",
    "skill-1": "A_SkillAttack1",
    "skill-2": "A_SkillAttack2",
    "skill-3": "A_SkillAttack3",
    "meditate-enter": "MonkH__Anim_Monk_sit",
    "meditate-rise": "MonkH__Anim_Monk_sitrise",
    "meditate-idle": "MonkH__Anim_Monk_high_idle",
}
OUTPUT = pathlib.Path(__file__).resolve().parent / "ue-voxel"


def find_asset(path):
    name = path.rsplit("/", 1)[-1]
    asset = unreal.find_object(None, f"{path}.{name}") or unreal.load_asset(path)
    if asset is None:
        raise RuntimeError(f"Asset is unavailable: {path}")
    return asset


def export_animations():
    mesh = find_asset(f"{FOLDER}/SKM_Reference_UniformVoxel")
    skeleton = mesh.get_editor_property("skeleton").get_path_name()
    options = unreal.GLTFExportOptions()
    options.export_animation_sequences = True
    options.export_vertex_skin_weights = True

    requested = os.environ.get("NYC_UE_EXPORT_ROLES")
    roles = [role.strip() for role in requested.split(",")] if requested else ASSETS
    animations = {}
    for role in roles:
        name = ASSETS[role]
        animation = find_asset(f"{FOLDER}/Animations/{name}")
        if not isinstance(animation, unreal.AnimSequence):
            raise RuntimeError(f"{name} must be an Animation Sequence")
        if animation.get_editor_property("skeleton").get_path_name() != skeleton:
            raise RuntimeError(f"{name} does not target {skeleton}")
        animations[role] = animation

    # The glTF exporter samples the evaluated (compressed) pose. Finish the
    # queued jobs before it reads any of the freshly loaded sequences.
    unreal.SystemLibrary.execute_console_command(None, "Editor.AsyncAssetCompilationFinishAll")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for role, animation in animations.items():
        name = ASSETS[role]
        options.export_preview_mesh = role == "idle"
        file = OUTPUT / f"{role}.glb"
        temporary = OUTPUT / f".{role}.export.glb"
        try:
            messages = unreal.GLTFExporter.export_to_gltf(
                animation, str(temporary), options, set()
            )
            if messages is None or messages.errors or not temporary.is_file():
                raise RuntimeError(f"Could not export {name}: {messages}")
            temporary.replace(file)
        finally:
            temporary.unlink(missing_ok=True)
        unreal.log(f"NYC_VOXEL_EXPORT {role}: {name} ({file.stat().st_size} bytes)")


if __name__ == "__main__":
    try:
        export_animations()
    except Exception:
        unreal.log_error(traceback.format_exc())
        raise
