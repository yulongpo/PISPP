# WB-01 宽带领域模型

## 目标

将 `Signal` 单对象思维改为 `WidebandScene + SignalInstance`。

## 执行

根据 `docs/01_DOMAIN_MODEL.md` 创建 V2 mock schema。

建议：

`prototype_v2/mock/domain-data.js`

至少定义：

- WidebandScene
- Background
- SignalInstance
- TFRepresentation
- DetectionAnnotation
- SignalTrack
- ExtractedSignal
- Dataset
- Model
- Evaluation

## 验收

- 同一 Scene 至少包含 5 个不同 SignalInstance 示例；
- 包含 continuous、burst、hopping；
- Scene 与 Instance 参数不混淆；
- 所有频率/时间字段可映射到 TF 坐标。

## 实施记录

- 完成内容：建立唯一 mock domain source `prototype_v2/assets/js/domain-data.js`，定义 `WidebandScene`、`Background`、5 个 `SignalInstance`、`TFRepresentation`、`DetectionAnnotation`、`SignalTrack`、`ExtractedSignal`、`Dataset`、`Model` 和 `Evaluation`。
- 修改文件：`prototype_v2/assets/js/domain-data.js`、`prototype_v2/mock/README.md`、`tasks/task_manifest.yaml`。
- 验证方式：Node `--check` 校验 JavaScript 语法；静态检查确认场景含 5 个实例，覆盖 continuous、burst、hopping，且 Scene 级背景与 Instance 级 CNR/SNR 分离。
- 未解决问题：真实 STFT、检测器和信号提取仍按任务边界保持 mock，转入 WB-02 页面和导航实现。
