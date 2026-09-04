# WB-06 宽带模型研发

## 目标

让训练任务、实验和模型管理支持真正的宽带算法。

## Task Type

至少支持：

- classification
- open-set classification
- detection
- segmentation
- tracking
- parameter estimation

## Detection Experiment

至少含：

- representation
- input/tile size
- detector
- IoU threshold
- NMS threshold
- loss
- optimizer
- learning rate
- scheduler
- augmentation

## Model Registry

新增：

- Signal Detection
- Spectrogram Segmentation
- Signal Tracking
- Parameter Estimation

同时保留识别模型。

## 验收

满足 AC-07。

## 实施记录

- 完成内容：训练任务支持 Classification、Open-set Classification、Time-Frequency Detection、Segmentation、Tracking、Parameter Estimation；检测类表单独立展示 representation、tile/input size、detector family、IoU、NMS、class mapping、loss、augmentation 及通用优化参数；模型注册增加宽带五类并保留窄带识别类型。
- 修改文件：`prototype_v2/assets/js/app.js`、`prototype_v2/assets/css/app.css`、`prototype_v2/assets/js/domain-data.js`、`tasks/task_manifest.yaml`。
- 验证方式：浏览器确认 Training 页面显示 Time-Frequency Detection、IoU Threshold、NMS Threshold；Experiment、Model Registry 路由可达；静态验证通过。
- 未解决问题：训练进度、权重导出和模型注册均为 mock，不代表真实训练或部署能力。
