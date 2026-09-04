# WB-00 V1 页面映射

## 根级页面清单

仓库审计发现 25 个根级 HTML 页面：

`工作台.html`、`数据源管理.html`、`样本集管理.html`、`新建样本集.html`、`详情.html`、`详情_1.html`、`详情_2.html`、`窄带信号生成.html`、`宽带信号生成.html`、`数据标注.html`、`模版中心.html`、`训练任务.html`、`新建训练任务.html`、`训练详情.html`、`新建实验任务.html`、`模型管理.html`、`脚本管理.html`、`模型评测.html`、`新建评测任务.html`、`评测详情.html`、`系统设置.html`、`index.html`、`start.html`、`start_c_1.html`、`start_with_pages.html`。

## V1 → V2 映射

| V1 页面/概念 | V2 页面/边界 | 处理方式 |
|---|---|---|
| 工作台 | `#/` | 新增宽带检测研发与宽窄带联动闭环入口；V1 仍可打开 |
| 宽带信号生成 | `#/scene-builder` | 重新建模为 WidebandScene 场景生成，不复制 V1 页面 |
| V1 详情类页面 | `#/scene-detail`、`#/dataset` | 分离 Scene 详情和 Detection Dataset 血缘 |
| 数据标注 | `#/annotation` | 新增 TF ROI、预标注、手工修正和提取动作 |
| 训练任务/实验/训练详情 | `#/training`、`#/experiment` | 增加 detection 等任务类型与专用配置 |
| 模型管理 | `#/models` | 增加宽带模型注册类型，保留窄带识别类型 |
| 模型评测/评测详情 | `#/evaluation` | 新增宽带检测指标、估计误差和分条件曲线 |
| 窄带信号生成/窄带分析语义 | `#/narrowband` | 仅在 ROI 提取后出现波形、星座、眼图和识别结果 |

## 资源与保护边界

V1 页面依赖 Axure 生成的 `files/`、`images/`、`data/`、`resources/`、`plugins/`。本轮 V2 使用独立 `prototype_v2/`，不复用或修改 Axure 内部 ID，不删除任何 V1 页面或资源。
