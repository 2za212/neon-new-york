"""3B's blue-hour lighting rig. Dimensions and fixture positions are in Blender metres."""
import math

import bpy
from mathutils import Vector


def light_apartment():
    rig = bpy.data.collections["07  /  Practical lighting"]
    shell = bpy.data.collections["01  /  Station shell"]
    loft = bpy.data.collections["03  /  Gantry and galley"]

    def area(name, eye, target, watts, rgb, width, height, spread=155):
        lamp = bpy.data.objects.get(name)
        if lamp is None:
            lamp = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
            rig.objects.link(lamp)
        lamp.location = eye
        lamp.rotation_euler = (Vector(target) - Vector(eye)).to_track_quat("-Z", "Y").to_euler()
        light = lamp.data
        light.color, light.energy = rgb, watts
        light.shape = "RECTANGLE"
        light.size, light.size_y = width, height
        light.spread = math.radians(spread)

    def block(name, center, size, material, collection):
        bpy.ops.mesh.primitive_cube_add(size=1, location=center)
        obj = bpy.context.object
        obj.name, obj.dimensions = name, size
        for owner in list(obj.users_collection):
            owner.objects.unlink(obj)
        collection.objects.link(obj)
        obj.data.materials.append(material)

    def lens(name, color, power):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = (*color, 1)
        bsdf.inputs["Emission Color"].default_value = (*color, 1)
        bsdf.inputs["Emission Strength"].default_value = power
        return mat

    # Cross the three arches at an angle so their mullions cast a readable
    # pattern on the floor. The return picks up the edge of the blanket.
    area("01 | North viaduct spill", (-.52, 5.62, 3.68), (-2.9, -.25, .30),
         1900, (.026, .26, 1), .72, .46, 76)
    area("09 | Sash cold return", (-3.45, 3.73, 2.52), (-2.2, -.25, .76),
         95, (.019, .44, 1), 1.10, .52, 105)
    # Align the task light with the underside of the rebuilt lamp hood.
    area("04 | Bench pivot lamp", (-.66, -.025, 1.403), (-1.05, -.30, 1.01),
         48, (1, .42, .105), .25, .14, 112)
    area("13 | Worktop reflected amber", (-1.89, -.19, 1.17), (-1.38, -.27, .77),
         10, (1, .24, .043), .64, .42)
    area("02 | Bunk reading strip", (-3.79, .60, 1.94), (-3.58, -.72, .48),
         12, (1, .42, .15), .66, .14, 98)
    area("06 | Calendar spot", (.78, 2.07, 2.72), (.78, 2.80, 1.38),
         49, (1, .62, .28), .49, .24, 95)
    area("03 | Counter underlight", (3.12, 3.65, 1.89), (3.08, 3.36, .7),
         25, (1, .42, .13), 2.1, .14, 110)
    bpy.data.objects["07 | Practical ceiling softbox"].data.energy = 7
    bpy.data.objects["08 | Soft bounce from entry"].data.energy = 15
    bpy.data.objects["10 | Receiver glow"].data.energy = 7

    # A guarded red service lamp belongs to feeder 07. Its upper lens
    # throws onto the brick behind it, below the almost unlit roof beams.
    iron = bpy.data.materials["coal"]
    steel = bpy.data.materials["steel"]
    red = lens("Feeder / ruby signal glass", (1, .012, .105), 3.0)
    cyan = lens("Step / blue-green guide glass", (.015, .73, .9), 2.9)
    amber = lens("Bench / amber diffuser", (1, .37, .071), 2.6)
    # Long repair-bay pendant. Its body masks the arch-side spill; the
    # louvres leave the glowing underside visible from bed and shoulder height.
    hall = bpy.data.collections["04  /  Relay hall"]
    opal = lens("Bench / opal task glass", (1, .46, .13), 3.4)
    for x in (-.89, .17):
        block("Bench pendant | ceiling shoe", (x, -.41, 5.27), (.20, .18, .06), steel, hall)
        block("Bench pendant | suspension", (x, -.41, 3.86), (.027, .027, 2.82), iron, hall)
    block("Bench pendant | spine", (-.36, -.41, 2.44), (1.51, .24, .13), iron, hall)
    block("Bench pendant | folded hood", (-.36, -.41, 2.35), (1.66, .43, .11), steel, hall)
    block("Bench pendant | amber reveal", (-.36, -.41, 2.285), (1.54, .37, .058), amber, hall)
    block("Bench pendant | opal belly", (-.36, -.41, 2.244), (1.44, .31, .055), opal, hall)
    for x in (-1.04, -.68, -.32, .04, .32):
        block("Bench pendant | guard", (x, -.41, 2.251), (.034, .39, .087), iron, hall)
    area("14 | Repair bay pendant", (-.36, -.41, 2.198), (-.27, -.54, .23),
         215, (1, .29, .038), 1.30, .24, 112)
    # The stool and the floor to its right receive the edge of the amber
    # pool. The narrow furnace-coloured return catches the old steel pier.
    area("15 | Island bounce", (.39, -.85, .85), (1.78, .40, 1.08),
         19, (1, .22, .028), .76, .36, 120)
    # A side window in the hood reveals the working lamp at pillow height.
    block("Bench | Amber diffuser rim", (-.793, .025, 1.472), (.032, .242, .075), iron, loft)
    block("Bench | Amber diffuser", (-.813, .025, 1.472), (.020, .208, .046), amber, loft)
    block("07 | Feeder luminaire backplate", (4.53, -.68, 3.65), (.24, 1.76, .20), iron, shell)
    block("07 | Feeder luminaire sill", (4.38, -.68, 3.57), (.13, 1.79, .056), steel, shell)
    for i, (y, width) in enumerate([(-1.20, .56), (-.49, .77), (.021, .16)]):
        block(f"07 | Ruby lens {i}", (4.397, y, 3.675), (.058, width, .078), red, shell)
    area("11 | Feeder wall graze", (4.33, -.68, 3.79), (4.76, -.60, 4.31),
         24, (1, .010, .067), 1.05, .12, 108)
    area("12 | Feeder spill on conduit", (4.04, -.72, 3.50), (4.23, -.67, 2.97),
         12, (1, .032, .12), .64, .13, 105)

    # Three stepped indicator inserts face the room; the protected guide
    # light on the inner stringer catches the treads instead of the whole wall.
    for step in (1, 5, 9):
        y = -2.32 + step * .29
        z = (step + 1) * .21
        block(f"Stair | Guide bezel {step}", (3.11, y, z-.068), (.10, .28, .13), iron, loft)
        block(f"Stair | Guide lens {step}", (3.051, y, z-.056), (.025, .215, .043), cyan, loft)
    area("05 | Steel stair guide", (4.16, -.67, 2.71), (3.36, -1.12, .78),
         115, (.018, .65, .91), .37, .18, 112)
    area("16 | Guide return on stair", (3.01, -1.20, .87), (4.63, .84, 2.73),
         92, (.022, .27, 1), .22, .34, 100)
    # Match the relocated repair island in the enlarged 3B floor plan.
    for fixture in bpy.context.scene.objects:
        if fixture.name.startswith(("Bench pendant |", "Bench | Amber diffuser", "04 | Bench pivot",
                                    "13 | Worktop", "14 | Repair bay", "15 | Island bounce")):
            fixture.location += Vector((1.30, -.88, 0))
