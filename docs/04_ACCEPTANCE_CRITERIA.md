# PISPP V2 宽带原型验收标准

## AC-01 领域对象

- [ ] 存在 WidebandScene。
- [ ] 一个 Scene 支持多个 SignalInstance。
- [ ] 调制/SNR/CNR/符号率不再作为 Scene 的单一顶层信号属性。
- [ ] Scene-level background 与 instance-level SNR/CNR 分离。

## AC-02 宽带场景生成

- [ ] 可以添加至少 3 个信号实例。
- [ ] 可改变频率位置。
- [ ] 可改变时间位置。
- [ ] 可改变带宽和持续时间。
- [ ] 支持 continuous/burst/hopping 至少三类行为。
- [ ] 有频谱占用率统计。
- [ ] 有随机化控制。

## AC-03 时频分析

- [ ] 宽带主视图以 PSD + Spectrogram 为核心。
- [ ] FFT、Window、Overlap、Resolution 明确展示。
- [ ] 不在原始宽带场景层展示无意义的星座/眼图。

## AC-04 标注

- [ ] 支持 TF bounding box。
- [ ] 支持 class。
- [ ] 支持 known/unknown。
- [ ] 支持 annotation list。
- [ ] 支持自动预标注 mock。
- [ ] 支持手工修正。

## AC-05 宽窄带联动

- [ ] Detection/ROI 可进入信号提取。
- [ ] 提取页展示 DDC/Filter/Resample。
- [ ] 提取结果进入窄带详情。
- [ ] 窄带详情显示来源 Scene/ROI。
- [ ] 窄带详情可展示星座/眼图。

## AC-06 数据集

- [ ] 存在 Detection Dataset。
- [ ] STFT config 可追溯。
- [ ] Dataset version 可见。
- [ ] train/val/test 可见。
- [ ] 类别、SNR/CNR、带宽、持续时间分布可见。

## AC-07 训练/模型

- [ ] Task Type 区分 detection 与 classification。
- [ ] Detection 配置中有 IoU/NMS 等专用参数。
- [ ] Model Registry 有 detection/segmentation/tracking 类型。

## AC-08 评测

- [ ] 有 Pd/Pfa。
- [ ] 有 Precision/Recall/F1。
- [ ] 有 AP/mAP 或 IoU。
- [ ] 有频率/带宽/时间边界误差。
- [ ] 有至少 4 类场景条件曲线。
- [ ] mock 数据有清楚标识。

## AC-09 工程质量

- [ ] V1 Axure 原型未被破坏。
- [ ] V2 有统一入口。
- [ ] 无关键导航断链。
- [ ] 1920×1080 可正常使用。
- [ ] 1366×768 无核心控件遮挡。
- [ ] README 提供预览方法。
- [ ] 有最终实施报告。
