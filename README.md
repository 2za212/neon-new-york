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
| `npm test` | 移动和自由飞行行为测试 |
| `npm run check` | 测试并构建，与 CI 一致 |
| `npm run build:legacy` | 旧版灰模资源烘焙与构建；不作为参赛默认入口 |

项目统一使用 npm，仅维护 `package-lock.json`。Node.js 版本见 `.nvmrc`。端口冲突时，PowerShell 执行 `$env:PORT=18781` 后再启动。

## 操作和验收

WASD 移动、Shift 奔跑、空格跳跃；拖动观察、滚轮缩放；F 切换自由飞行，飞行中 Q/E 升降；M 地图、H 拍照、Esc 暂停、J 发掌。触屏支持摇杆及观察操作。

移动界面可用 http://127.0.0.1:18780/mobile-preview.html 检查；该页面只模拟横屏界面，不能代替真机性能与触控验收。当前测试只覆盖移动/飞行逻辑，CI 通过不能证明整个场景视觉、所有碰撞或平台行为均通过。

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
