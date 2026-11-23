# 霓虹纽约 · 参赛开发基线

Three.js 赛博朋克体素城市原型。当前主入口为 `index.html` → `nyc-game.js`，包含第三人称漫游、自由飞行、城区地图与公寓序章。

## 第一次启动

安装 Node.js 24 LTS、Git 和 Git LFS。Windows 可使用 Git for Windows 自带的 Git LFS。

```sh
git lfs install
git clone <仓库地址>
cd <仓库目录>
git lfs pull
npm ci
npm run dev
```

打开 http://127.0.0.1:18780/ 。`npm run dev` 先构建，再提供 `dist/` 静态预览；修改源文件后在另一个终端执行 `npm run build` 并刷新页面，目前不提供自动热更新。

不要直接双击 HTML，也不要在源码根目录启动静态服务器：源码使用需要打包的 npm 模块。`vendor/zaohua-platform-sdk/` 是本地依赖，须随仓库保留。

| 命令 | 用途 |
| --- | --- |
| `npm ci` | 严格按锁文件安装依赖 |
| `npm run dev` / `npm start` | 构建并启动本地试玩 |
| `npm run build` | 构建当前版本到 `dist/` |
| `npm run preview` | 仅预览已有构建 |
| `npm test` | 移动、自由飞行和战斗行为测试 |
| `npm run check` | 测试并构建，与 CI 一致 |
| `npm run build:legacy` | 旧版灰模资源烘焙与构建；不作为参赛默认入口 |

项目统一使用 npm，仅维护 `package-lock.json`。Node.js 版本见 `.nvmrc`。端口冲突时，PowerShell 执行 `$env:PORT=18781` 后再启动。

## 操作和验收

WASD 移动，Shift 奔跑，空格跳跃，滚轮缩放。F 切换自由飞行，飞行中 Q/E 升降。M 打开地图，H 进入拍照模式，Esc 暂停。

克隆后执行 `git lfs pull` 获取新角色和动画，再按上面的步骤启动。离开公寓到达街道后，左键冲拳，连续按两次左键衔接蓄力冲步拳，右键拖动观察，Ctrl + 方向键闪避，Q/E/R 施法，青色圆环内按 F 打坐。门和电梯的交互提示出现时，E 优先用于交互。导出与资源来源见 [UE 动画导入指南](UE动画导入.md)。

暂停菜单中的「装备细剑／卸下细剑」切换持剑与徒手状态。持剑后左键逐次接三段挥剑，WASD／Shift 使用 UE 混合空间导出的方向动画，空格、Ctrl + 方向键、Q/E/R 同步换为持剑动作；受击、死亡及击飞后起身也使用对应持剑动画。演练 NPC 对持剑角色每第三次命中造成一次击飞，点击「重置演练」可重新测试。

移动界面可用 http://127.0.0.1:18780/mobile-preview.html 检查。该页面模拟横屏界面，真机性能和触控需在手机上验收。

西仓过磅里的排水检修井通往三号泵房。踏上黄灯标记的井盖，或靠近后按 E / 点“下井”。击停巡检机后，落水闸右侧的检修门会升起。穿过拱券总渠，绕过沉砂池，向东穿过泄洪横廊，即可由逃生井上到旧交易所西街。原入口井梯也可随时撤离。使用 `mobile-preview.html?start=sewer-entry` 可从井口附近开始试玩。

在该地址后加 `?start=core` 可从旧交易所东北门起步，沿折光换乘街进入北部核心区。西北门经修造巷接回换乘街，东站楼梯通往高架站台。
使用 `?start=core-transfer` 可直接在换乘街转角查看站厅、高架列车和东岸塔群。

## 文件导航

| 位置 | 职责 |
| --- | --- |
| `nyc-game.js`、`nyc-scene.js` | 运行入口、全局整合、场景装配；修改前协调 |
| `nyc-motor.js`、`nyc-controls.js`、`nyc-flight.js` | 角色运动、输入、自由飞行 |
| `nyc-*.js` | 城区、交互、材质、灯光、环境等模块 |
| `index.html`、`nyc*.css`、`nyc-map-ui.js` | 页面与 UI |
| `character-motion/`、`blender/`、`city-surfaces/` | 角色、建筑源文件及当前场景资源 |
| `public/`、`viewer.js`、`build-legacy.cjs` | 保留的旧版场景与资源 |
| `vendor/zaohua-platform-sdk/` | 造化平台 SDK 本地依赖 |
| `SCENE-API.md`、`ART-BIBLE.md`、`MAP-ROADMAP.md` | 场景约定、美术说明、地图规划；含历史记录 |
| `.game-builder/qa/` | 历史专项检查脚本，部分依赖本机工具，不属于默认 CI |

## 协作和发布

先读 [CONTRIBUTING.md](CONTRIBUTING.md)。AI 助手同时遵循 [AGENTS.md](AGENTS.md)。每项任务开独立分支，使用 Pull Request 合并回 `main`。

GitHub 托管源码并执行检查；游戏的正式发布平台为造化工坊。由指定发布负责人从验收通过的提交发布。平台登录、上传状态、密钥不进仓库；队友本机生成的平台游戏 ID 不应擅自覆盖团队发布目标。

模型、Blender 文件和二进制资源已配置 Git LFS；克隆后如模型加载失败，先执行 `git lfs pull`。美术资源须记录来源与使用许可，仓库私有并不代表拥有第三方素材的再分发权。
