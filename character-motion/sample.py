import bpy,json
from pathlib import Path
from mathutils import Vector
dest=Path(__file__).parent
result={}
for name in ['Walking','Running']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=str(Path.home()/'Downloads'/(name+'.fbx')),use_image_search=False)
    rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
    act=rig.animation_data.action
    print('ACTION',act.name,act.frame_range,list(rig.pose.bones.keys())[:12])
    bones={b.name.split(':')[-1].split('mixamorig')[-1]:b for b in rig.pose.bones}
    names=['Hips','Head','Neck']+[side+part for side in ['Left','Right'] for part in ['Arm','ForeArm','Hand','UpLeg','Leg','Foot','ToeBase']]
    def point(b): 
        v=rig.matrix_world@bones[b].head
        return [v.x,v.z,-v.y]
    a,b=map(round,act.frame_range);scene=bpy.context.scene
    frames=[]
    for frame in range(a,b+1):
        scene.frame_set(frame)
        frames.append({n:point(n) for n in names})
    result[name]={'frames':frames,'fps':scene.render.fps/scene.render.fps_base}
(dest/'gait.json').write_text(json.dumps(result))
