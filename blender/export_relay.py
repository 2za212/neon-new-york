"""Run with Blender -b <signal house.blend> -P blender/export_relay.py.

Bake the static interior in the author's lighting. Keep lettering as geometry
so the calendar stays readable up close. This never saves the input .blend.
"""
import math
import runpy
import tempfile
from pathlib import Path

import bpy
import numpy as np
from mathutils.kdtree import KDTree
from mathutils import Vector
from mathutils.bvhtree import BVHTree


scene = bpy.context.scene
assert scene.name == "FULTON | Signal Keeper"
out = Path(__file__).resolve().parent / "relay-home.glb"
scratch = Path(tempfile.mkdtemp(prefix="relay-atlas-"))
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 48
scene.cycles.max_bounces = 2
scene.render.bake.margin = 6
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_glossy = False
scene.render.bake.use_pass_transmission = False
scene.render.bake.use_pass_emit = True
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 92


def prepare_room_finishes():
    """Broad painted faces and quiet grain, with a diffuse fill for unlit H5."""
    woods = {"wood", "aged", "pine", "end"}
    masonry = {"brick", "mud", "oxide", "grout"}
    for mat in bpy.data.materials:
        if not mat.node_tree:
            continue
        nodes = mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF")
        if not bsdf or bsdf.inputs["Emission Strength"].default_value:
            continue
        base = tuple(bsdf.inputs["Base Color"].default_value)
        ramp_node = next((node for node in nodes if node.type == "VALTORGB"), None)
        if ramp_node:
            amount = .25 if mat.name.startswith("Heartwood /") or mat.name in woods else .10
            if mat.name in masonry:
                amount = .12
            for stop in ramp_node.color_ramp.elements:
                stop.color = [base[i] + (stop.color[i] - base[i]) * amount for i in range(3)] + [1]
        for node in nodes:
            if node.type == "BUMP":
                node.inputs["Strength"].default_value = .018 if mat.name in masonry else .0
        # The atlas contains direct diffuse and emission. Pigmented metal needs
        # a diffuse lobe even where the authoring shader is highly metallic.
        bsdf.inputs["Metallic"].default_value = min(.22, bsdf.inputs["Metallic"].default_value)
        bsdf.inputs["Emission Color"].default_value = base
        bsdf.inputs["Emission Strength"].default_value = .044


runpy.run_path(str(Path(__file__).with_name("relay_lighting.py")))["light_apartment"]()
prepare_room_finishes()


def block_finish_material():
    mat = bpy.data.materials.new("RelaySolidFinish")
    mat.use_nodes = True
    color = mat.node_tree.nodes.new("ShaderNodeVertexColor")
    color.layer_name = "FaceLight"
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    mat.node_tree.links.new(color.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def fit_block_faces(mesh, texture):
    """Fit the baked light inside each flat face without sampling across UV seams at runtime."""
    masonry = {"brick", "kiln", "oxide"}
    coated = {"steel", "edge", "brass", "enamel", "jade", "washed", "blue", "coal"}
    names = [mat.name for mat in mesh.materials]
    faces = [f for f in mesh.polygons if names[f.material_index] in masonry | coated]
    if not faces:
        return []
    width, height = texture.size
    pixels = np.empty(width * height * 4, dtype=np.float32)
    texture.pixels.foreach_get(pixels)
    pixels = pixels.reshape(height, width, 4)
    uv_layer = mesh.uv_layers.active.data
    colors = np.ones((len(mesh.loops), 4), dtype=np.float32)
    brick_faces, brick_light = [], []
    extent = np.array([width, height])
    for face in faces:
        loops = list(face.loop_indices)
        uv = np.array([uv_layer[i].uv[:] for i in loops])
        center = uv.mean(axis=0)
        # Sample inside the island. The corner texels frequently belong to
        # padding on the narrow drawer edges and thin stair members.
        probes = center + (uv - center) * np.array([.16, .45, .72])[:, None, None]
        xy = np.clip((probes * extent).astype(int), 0, extent - 1)
        srgb = pixels[xy[:, :, 1], xy[:, :, 0], :3]
        # Blender exposes the JPEG's byte values in sRGB via Image.pixels.
        # glTF vertex colors multiply in linear light.
        samples = np.where(srgb <= .04045, srgb / 12.92, ((srgb + .055) / 1.055) ** 2.4)
        light = np.median(samples.reshape(-1, 3), axis=0)
        corner_light = np.median(samples, axis=0)
        colors[loops, :3] = .76 * light + .24 * corner_light
        if names[face.material_index] in masonry:
            brick_faces.append(face)
            brick_light.append(light)
    # Model the soft pool across a wall, keeping each brick's side and top
    # faces separate. Small brick-to-brick pigment differences remain.
    if brick_faces:
        tree = KDTree(len(brick_faces))
        for i, face in enumerate(brick_faces):
            tree.insert(face.center, i)
        tree.balance()
        for i, face in enumerate(brick_faces):
            total, weight = brick_light[i].copy(), 1.
            for _, j, distance in tree.find_range(face.center, .85):
                other = brick_faces[j]
                offset = other.center - face.center
                if i == j or face.normal.dot(other.normal) < .98 or abs(face.normal.dot(offset)) > .12:
                    continue
                influence = 1. - distance / .85
                total += brick_light[j] * influence
                weight += influence
            colors[list(face.loop_indices), :3] = .32 * brick_light[i] + .68 * total / weight
    layer = mesh.color_attributes.new(name="FaceLight", type="BYTE_COLOR", domain="CORNER")
    layer.data.foreach_set("color", colors.ravel())
    mesh.color_attributes.active_color = layer
    return [face.index for face in faces]


def select(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def bake_train_visibility(groups):
    """Two samples of a passing viaduct light, occluded by the actual room and sashes."""
    points, polygons = [], []
    for obj, _, _ in groups:
        base = len(points)
        points.extend(v.co.copy() for v in obj.data.vertices)
        polygons.extend(tuple(base+i for i in f.vertices) for f in obj.data.polygons)
    blockers = BVHTree.FromPolygons(points, polygons)
    signals = [Vector((-4.7, 6.85, 3.30)), Vector((.85, 6.85, 3.30))]
    for obj, _, _ in groups:
        mesh = obj.data
        masks = np.zeros((len(mesh.loops), 2), dtype=np.float32)
        for face in mesh.polygons:
            normal, center = face.normal, face.center
            pigment = mesh.materials[face.material_index].diffuse_color
            reflectance = max(pigment[:3]) ** .55
            for channel, source in enumerate(signals):
                if normal.dot(source - center) <= 0:
                    continue
                for loop_id in face.loop_indices:
                    corner = mesh.vertices[mesh.loops[loop_id].vertex_index].co
                    sample = corner.lerp(center, .19) + .003 * normal
                    ray = source - sample
                    distance = ray.length
                    ray.normalize()
                    if blockers.ray_cast(sample, ray, distance)[0] is None:
                        masks[loop_id, channel] = reflectance * max(0, normal.dot(ray)) * min(1, 43 / distance**2)
        masks[:, 1] = 1 - masks[:, 1]  # glTF exports texture-coordinate V flipped.
        layer = mesh.uv_layers.new(name="TrainVisibility", do_init=False)
        layer.uv.foreach_set("vector", masks.ravel())
        mesh.uv_layers.active_index = 0
        mesh.uv_layers[0].active_render = True


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
    bpy.ops.uv.smart_project(angle_limit=math.radians(65), island_margin=.003)
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
    return obj, unlit(name + "_baked", image=texture), fit_block_faces(obj.data, texture)


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
bake_train_visibility(groups)
block_finish = block_finish_material()
for obj, mat, flat_faces in groups:
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.material_index = 0
    if flat_faces:
        obj.data.materials.append(block_finish)
        for i in flat_faces:
            obj.data.polygons[i].material_index = 1
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
