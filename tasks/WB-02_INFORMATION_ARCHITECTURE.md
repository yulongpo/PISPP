# WB-02 信息架构与导航

## 目标

建立 V2 页面骨架和统一导航。

## 执行

1. 创建 `prototype_v2/`。
2. 建立统一侧栏/顶部栏。
3. 创建以下页面骨架：
   - 工作台
   - 数据源管理
   - 宽带场景详情
   - 样本集管理
   - 宽带场景生成
   - 数据标注
   - 训练任务
   - 实验详情
   - 模型管理
   - 宽带评测
   - 信号提取
   - 窄带信号详情
4. 首页允许访问 V1 和 V2，或提供明确 V2 入口。

## 验收

所有页面之间导航可达，无 404。

## 实施记录

- 完成内容：创建 `prototype_v2/` 独立入口、统一侧栏/顶部栏、12 个 hash 路由页面，并增加 `start_v2.html` 作为根目录 V2 入口；V1 `start.html` 可从侧栏和顶部打开。
- 修改文件：`prototype_v2/index.html`、`prototype_v2/pages/README.md`、`prototype_v2/README.md`、`start_v2.html`、`prototype_v2/assets/css/app.css`、`prototype_v2/assets/js/app.js`、`tasks/task_manifest.yaml`。
- 验证方式：检查所有导航使用 `#/...` 或现有 V1 相对链接；Node `--check` 校验脚本；静态 HTTP 预览路径记录在 V2 README。
- 未解决问题：页面内容和跨页面业务交互将在 WB-03～WB-08 中逐项联调。
