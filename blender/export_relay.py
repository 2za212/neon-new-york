"""Run with Blender -b <signal house.blend> -P blender/export_relay.py.

Bake the static interior in the author's lighting. Keep lettering as geometry
so the calendar stays readable up close. This never saves the input .blend.
"""
import math
import tempfile
from pathlib import Path

import bpy


scene = bpy.context.scene
assert scene.name == "FULTON | Signal Keeper"
out = Path(__file__).resolve().parent / "relay-home.glb"
scratch = Path(tempfile.mkdtemp(prefix="relay-atlas-"))
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 12
scene.cycles.max_bounces = 4
scene.render.bake.margin = 4
scene.render.bake.use_pass_glossy = False
scene.render.bake.use_pass_transmission = False
scene.render.bake.use_pass_emit = True
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 92


def select(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def unlit(name, color=None, image=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    if image:
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = image
        mat.node_tree.links.new(tex.outputs["Color"], emit.inputs["Color"])
    else:
        emit.inputs["Color"].default_value = color
    output = nodes.new("ShaderNodeOutputMaterial")
    mat.node_tree.links.new(emit.outputs[0], output.inputs["Surface"])
    return mat


def bake_group(name, objects, size):
    select(objects)
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    while obj.data.uv_layers:
        obj.data.uv_layers.remove(obj.data.uv_layers[0])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(65), island_margin=.0015)
    bpy.ops.object.mode_set(mode="OBJECT")
    atlas = bpy.data.images.new(name, width=size, height=size, alpha=False, float_buffer=True)
    for mat in set(obj.data.materials):
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = atlas
        mat.node_tree.nodes.active = tex
    print("BAKING", name, len(obj.data.polygons), flush=True)
    bpy.ops.object.bake(type="COMBINED")
    path = scratch / (name + ".jpg")
    atlas.save_render(str(path), scene=scene)
    texture = bpy.data.images.load(str(path))
    # Defer replacing the BSDF until all groups have received bounced light.
    return obj, unlit(name + "_baked", image=texture)


for obj in bpy.data.collections["08  /  Explorer"].objects:
    obj.hide_render = True
hint = bpy.data.objects["Calendar | Translucent prompt"]
hint.hide_render = True
exports = []
for original, runtime in [
    ("Socket.Bed.Eyes", "BedEyes"), ("Socket.Bed.Landing", "BedLanding"),
    ("Socket.Calendar.Read", "CalendarRead"), ("Socket.Calendar.Question", "CalendarHint"),
    ("Socket.Exit", "HomeExit")
]:
    obj = bpy.data.objects[original]
    obj.name = runtime
    exports.append(obj)

indoor = [obj for obj in scene.objects if obj.type == "MESH" and not obj.hide_render
          and not any(c.name.startswith("06  /") for c in obj.users_collection)]
deck = [obj for obj in indoor if obj.get("relay_walk_surface")]
fittings = [obj for obj in indoor if obj not in deck and not any(c.name.startswith("01  /") for c in obj.users_collection)]
groups = [bake_group("StationShell", [o for o in indoor if o not in fittings and o not in deck], 2048),
          bake_group("StationFittings", fittings, 3072)]
if deck:
    groups.append(bake_group("RelayDeck", deck, 2048))
for obj, mat in groups:
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.material_index = 0
    exports.append(obj)

# The occupied apartment looks onto the playable street. Keep the Blender
# backdrop for authoring renders, but do not ship it inside the city block.
lettering = [obj for obj in scene.objects if obj.type == "FONT" and obj != hint
             and not any(c.name.startswith("06  /") for c in obj.users_collection)]
select(lettering)
bpy.ops.object.convert(target="MESH")
bpy.ops.object.join()
street = bpy.context.object
street.name = "ApartmentLettering"
for i, original in enumerate(list(street.data.materials)):
    bsdf = original.node_tree.nodes.get("Principled BSDF")
    color = list(original.diffuse_color)
    strength = bsdf.inputs["Emission Strength"].default_value if bsdf else 0
    for j in range(3):
        color[j] *= .45 + min(strength, 1.4)
    street.data.materials[i] = unlit("Print_" + original.name, color=color)
exports.append(street)
select(exports)
bpy.ops.export_scene.gltf(filepath=str(out), use_selection=True, export_format="GLB",
                          export_yup=True, export_animations=False, export_cameras=False,
                          export_lights=False, export_image_format="AUTO")
print("EXPORTED", out, out.stat().st_size, flush=True)
