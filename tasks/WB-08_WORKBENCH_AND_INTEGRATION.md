# WB-08 工作台与全链集成

## 目标

让 V2 不只是若干独立页面，而是一条可演示的研发闭环。

## 必须贯通

```text
工作台
→ 宽带场景生成
→ Scene
→ 标注
→ Detection Dataset
→ Training Task
→ Experiment
→ Model
→ Evaluation
```

同时贯通：

```text
Scene/Detection
→ ROI
→ Extraction
→ Narrowband Detail
→ Recognition
```

## 工作台

区分：

- 宽带检测研发
- 窄带识别研发
- 数据构建
- 模型评测

## 验收

两条流程均可从头点击到尾。

## 实施记录

- 完成内容：工作台区分宽带检测研发、宽窄带联动、数据构建与模型评测；统一 hash 路由贯通 `WidebandScene → Annotation → Detection Dataset → Training → Experiment → Model → Evaluation`，并贯通 `ROI → DDC/Filter/Resample → Narrowband Detail`。
- 修改文件：`prototype_v2/index.html`、`prototype_v2/pages/README.md`、`prototype_v2/assets/js/app.js`、`prototype_v2/README.md`、`tasks/task_manifest.yaml`。
- 验证方式：浏览器分两段执行完整链路并逐页读取 DOM：工作台、场景生成、标注、提取、窄带详情、Dataset、Training、Experiment、Model、Evaluation 均返回预期标题/关键控件；浏览器 error/warn 日志为空。
- 未解决问题：hash SPA 依赖静态服务器或浏览器直接打开入口；不提供真实后端状态持久化。
