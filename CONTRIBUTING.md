# 团队协作约定

## 任务与分支

每项任务写明负责人、涉及模块、依赖、验收步骤。看板使用“待开发 / 开发中 / 待验收 / 已完成”。同一任务默认一位负责人。

`main` 保存已经整合并能试玩的版本。使用 `feat/missions`、`fix/camera-collision`、`art/shop-signs` 等短期分支；不按人维护长期分支。开始新任务前：

```sh
git switch main
git pull --ff-only
git switch -c feat/your-feature
```

做小而完整的提交，提交说明描述实际变化。首次上传分支：

```sh
git add <本次任务涉及的文件>
git commit -m "feat: add terminal interaction"
git push -u origin feat/your-feature
```

然后在 GitHub 创建 Pull Request，填写模板，关联任务，请另一位队友审查并试玩。审查通过后采用 Squash merge。合并后删除远端功能分支，再同步本地主分支。不要强推共享主分支或覆盖队友改动。

若开发期间主分支已更新，先提交当前工作，再 `git fetch origin`、`git merge origin/main`，解决冲突并重新验证。遇到不理解的冲突联系相关模块负责人。

## 模块与资源

- 新功能优先独立文件，通过明确的参数和接口接入。维持现有命名与代码风格，避免顺手全量格式化。
- 修改 `nyc-game.js`、`nyc-scene.js`、共享输入、材质、地图坐标、依赖或构建脚本时，先在任务里告知相关队友；一项整合任务尽量由一人负责。
- 坐标以米为单位，遵循现有场景约定；角色、道路、开口、碰撞和相机必须一起检查。碰撞、出生点和接口细节查阅 `SCENE-API.md`，以当前代码为准。
- 修改公共接口时同步文档，说明调用者如何迁移。新增交互要考虑键鼠与触屏的可操作性。
- `.blend`、`.glb` 等二进制文件通常不能合并。同一个文件同一时间由一人编辑，在任务中认领；Git LFS 仅负责存储，不会自动解决同时编辑冲突。
- `.glb`、`.blend`、`.bin` 用 Git LFS；不要提交 `node_modules/`、`dist/`、个人环境变量、登录缓存和临时报告。新增大贴图、音视频前先评估是否也需要 LFS。
- 更新依赖使用 npm 并提交 `package.json` 与 `package-lock.json`。保留 `vendor/zaohua-platform-sdk`；不要混用 pnpm/yarn 锁文件。

## 合并与验收

提交前运行 `npm run check`。CI 执行同样的测试和构建。涉及的功能必须人工试玩，画面修改附截图，运动修改检查碰撞与相机，UI 修改检查触屏和不同窗口尺寸。

建议仓库管理员在套餐支持时为 `main` 配置保护：仅经 PR 合并、至少一位审查者、要求 `Project checks / check` 检查通过、禁止强推。若私有仓库当前套餐不支持保护，则先执行相同团队约定；本文件不代表远端已启用保护。

每日结束同步进展，每隔一两天整合试玩。重要里程碑打 `v0.1.0` 等标签，并记录验收结果。正式发布由指定负责人操作，避免多人各自发布到不同游戏 ID；先核对平台项目和目标环境，再按造化插件完整流程验证、发布。
