# 把 UE 动画导入纽约体素城市

本次从 UE 5.7 的 ZaoHua 工程直接导出 GLB。角色使用 `SKM_Reference_UniformVoxel` 和它的骨架。网页按以下文件名识别动作。

项目成员通过团队共享获取导出的 GLB，把它们放到本地检出的 `character-motion/ue-voxel/`。公开仓库提供动作接入代码和导出说明。待机、四向闪避、二段拳、受击、死亡与打坐使用 wemakethegame 的 [Monk AnimSet](https://www.fab.com/listings/451f071f-fe87-48ee-99db-2f8321ae717b)，奔跑使用其 [DarkSorceress Animset](https://www.fab.com/listings/04de140e-d47e-44b1-b793-71c05557fda2)。三个施法片段来自《元素特效沙盒》随附的 Mixamo 导出。素材分别适用 [Fab 许可](https://www.fab.com/eula) 和 [Adobe Mixamo 使用说明](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html)。

| 文件 | 本次使用的 UE Animation Sequence | 触发方式 |
| --- | --- | --- |
| `idle.glb` | `IdleMonk__Anim_Monk_C_idle` | 站立，包含网格、材质、蒙皮和待机动作 |
| `walk.glb` | `A_Voxel_WalkNeutral` | WASD 普通步行 |
| `run.glb` | `Runrun_front` | Shift + WASD |
| `jump.glb` | `A_Voxel_Jump` | 空格起跳和落地 |
| `punch.glb` | `A_Voxel_RightPunch_ShoulderLead` | 左键单次冲拳，12 点伤害 |
| `charged-punch.glb` | `A_Attack2` | 冲拳中排队，或结束后 0.55 秒内再按左键，28 点伤害 |
| `dodge-forward.glb` | `Monk__Anim_Monk_move_F` | Ctrl + ↑ |
| `dodge-left.glb` | `Monk__Anim_Monk_move_L` | Ctrl + ← |
| `dodge-right.glb` | `Monk__Anim_Monk_move_R` | Ctrl + → |
| `dodge-back.glb` | `Monk__Anim_Monk_movev_B` | Ctrl + ↓ |
| `skill-1.glb` | `A_SkillAttack1` | Q 冰晶突刺，24 点伤害 |
| `skill-2.glb` | `A_SkillAttack2` | E 雷电长矛，32 点伤害 |
| `skill-3.glb` | `A_SkillAttack3` | R 火陨冲击，40 点伤害 |
| `meditate-enter.glb` | `MonkH__Anim_Monk_sit` | 打坐第一段 |
| `meditate-rise.glb` | `MonkH__Anim_Monk_sitrise` | 打坐第二段 |
| `meditate-idle.glb` | `MonkH__Anim_Monk_high_idle` | 打坐循环 |
| `hurt.glb` | `A_Hurt` | 受击时转向攻击者 |
| `death.glb` | `A_Dead` | 血量归零时播放一次并保持末帧 |

## 更新现有动作

1. 在 UE 完成动画制作或 IK 重定向，保存成目标角色骨架上的 **Animation Sequence**。如果在 Sequencer 用 Control Rig 制作，先烘焙成 Animation Sequence。打开序列，确认预览网格是 `SKM_Reference_UniformVoxel`，并检查素材的朝向、跑步循环接缝和起跳、落地姿势。
2. 在内容浏览器右键该序列，选择 **资产操作 → 导出**，文件格式选 **glTF Binary (`.glb`)**。如果列表没有该格式，检查 UE 插件面板中的 **glTF Exporter**。
3. 导出选项打开 **Export Animation Sequences** 和 **Export Vertex Skin Weights**。导出 `idle.glb` 时也打开 **Export Preview Mesh**，让网页获得角色网格和贴图。导出行走、奔跑、跳跃和施法时，关闭 **Export Preview Mesh**，只保存骨架和动画。保留默认尺寸系数 `0.01`。
4. 把新文件放进场景项目的 `character-motion/ue-voxel/`，按表中的文件名覆盖对应动作。每个 GLB 放一个动画。换跑步动作时只需要更新 `run.glb`。
5. 首次克隆时先执行 `git lfs pull` 和 `npm ci`。运行 `npm run dev` 后访问 http://127.0.0.1:18780/ 。如果预览已启动，执行 `npm run build` 后刷新浏览器。


也可批量导出。编辑 `character-motion/export_ue_voxel.py` 里的 `ASSETS`，把动作名改成 `/Game/VoxelCharacter/Animations` 下对应的序列。在 ZaoHua 编辑器底部的 **Cmd** 栏执行 `py "完整路径/character-motion/export_ue_voxel.py"`。脚本会校验目标骨架，等 UE 完成动画压缩再导出，以免 GLB 只有绑定姿势。文件写入脚本旁的 `ue-voxel` 目录。

## UE 和网页如何配合

GLB 保存了蒙皮、关节层级和骨骼关键帧。Three.js 先加载 `idle.glb` 拿到角色，再读取其余 GLB 的关键帧，验证骨骼名、父子关系和绑定姿势，最后用 `AnimationMixer` 在同一个角色模型上切换动作。加载时会对齐每个片段的根骨初始朝向，再把角色的 UE +X 正面转到场景的 +Z。这也校正了本次奔跑片段自带的 90° 朝向差。

场景原有的 `nyc-motor.js` 根据按键、速度和地面碰撞计算人物位置。网页播放骨骼动画时去掉根骨平移轨道，保留骨盆和四肢的关键帧。这样奔跑位移和跳跃高度全由场景控制，脚步、摆臂和收腿仍来自 UE。动画蓝图、Montage 逻辑和 Anim Notify 要在网页端写对应行为。

用左键单次冲拳，鼠标右键拖动可环绕镜头。普通冲拳固定角色水平位置和朝向。蓄力冲步拳前摇站定，到动画约 57%–67% 的出拳阶段一次前冲，空地最多 2.5 米。遇到近处目标或墙壁会缩短冲刺。替换二段拳动画后，可在 `nyc-combat.js` 的 `chargedDash` 中调整出拳时段和距离。冲拳以 1.08 倍播放，奔跑动画以 1.12 倍播放，奔跑移动速度为 6.6 米/秒。Ctrl 加键盘方向键可避开浏览器占用的 Ctrl+W 等快捷键。

出生街口有青色打坐圈和练习傀儡。进入圈内按 F 进入打坐，依次播放 `sit → sitrise → high_idle`，最后一段持续循环。再按 F 从当前帧倒放并按相反顺序返回站立。圈外按 F 仍可切换自由飞行。傀儡有 200 点血，靠近会蓄势反击，每次造成 16 点伤害。受击会打断动作，人物面向攻击者并后退；致死后可用「重置演练」恢复双方状态。

伤害、命中范围和动作内命中时点配置在 `nyc-combat.js` 的 `attacks` 里。替换施法或拳击动画后，在 UE 里找到对应命中帧，用命中帧除以片段最后一帧，更新相应的 `hit`。三个技能特效来自队友的《元素特效沙盒》，实现位于 `nyc-combat-effects.js`。

体素人物普通步行的最高速度为 1.35 米/秒，步行动画会根据水平速度和角色显示比例调整播放速度。替换成步幅或节奏不同的循环时，同步更新 `nyc-player-avatar.js` 内的 `authoredWalkingSpeed`，单位为未缩放角色的米/秒。

当前跳跃片段共 34 帧间隔，网页用第 10 帧到第 22 帧对应腾空，两脚触地后继续播放收势。替换成节奏不同的跳跃时，在 `nyc-player-avatar.js` 调整 `jumpTakeoff` 与 `jumpTouchdown`，值为关键帧编号除以最后一帧编号。`landingDuration` 是网页落地收势时间，单位为秒。

要新增翻滚等动作，用同样的选项导出一个新 GLB。然后给 `nyc-player-avatar.js` 增加动作映射和播放规则，并在 `nyc-controls.js` 或现有游戏逻辑里接入触发条件。

官方参考：[UE 5.7 glTF 导出选项](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/GLTFExportOptions?application_version=5.7) · [UE glTF 对动画的支持](https://dev.epicgames.com/documentation/en-us/unreal-engine/how-the-gltf-exporter-handles-unreal-engine-content?application_version=5.7)
