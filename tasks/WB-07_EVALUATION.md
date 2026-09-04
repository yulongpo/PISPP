# WB-07 宽带效能评测

## 目标

建立区别于分类 Accuracy 的宽带评测体系。

## 必须指标

- Pd
- Pfa
- Precision
- Recall
- F1
- AP/mAP 或 IoU
- center frequency error
- bandwidth error
- time boundary error

## 条件曲线

至少实现 4 类：

- Pd vs SNR/CNR
- Pd vs Bandwidth
- Pd vs Duration
- Pd vs Signal Count
- Pd vs Occupancy
- Pd vs Frequency Separation
- Pd vs Power Difference

可任选不少于 4 类，但推荐全部 mock。

## 验收

满足 AC-08。

## 实施记录

- 完成内容：实现宽带专项评测页面，展示 Pd、Pfa、Precision、Recall、F1、AP/mAP、IoU、中心频率误差、带宽误差、时间边界误差，并提供 7 类分条件 Pd 曲线和 mock 标识。
- 修改文件：`prototype_v2/assets/js/app.js`、`prototype_v2/assets/css/app.css`、`prototype_v2/assets/js/domain-data.js`、`tasks/task_manifest.yaml`。
- 验证方式：浏览器确认 9 项指标和 `Pd vs SNR/CNR`、Bandwidth、Duration、Signal Count、Occupancy、Frequency Separation、Power Difference 曲线均可见；PowerShell V2 验证脚本通过。
- 未解决问题：指标和曲线为可解释的原型模拟数据，未执行真实检测器推理。
