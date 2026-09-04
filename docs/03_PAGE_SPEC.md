# V2 宽带页面规格

## P-WB-01 宽带场景生成

### 页面目的

构建一个接收带宽中的多信号时频场景，而非生成单个“大带宽信号”。

### 布局

```text
┌──────────────────────────────────────────────────────┐
│ 页面标题 / 模板 / 保存 / 批量生成                    │
├──────────────────────────────────────────────────────┤
│ Scene/Capture 参数                                   │
├──────────────┬───────────────────────┬───────────────┤
│ Signal List  │ Time-Frequency Canvas │ Instance Prop │
│              │                       │               │
├──────────────┴───────────────────────┴───────────────┤
│ Background / Randomization / Scene Statistics        │
└──────────────────────────────────────────────────────┘
```

### Scene 参数

- RF 中心频率
- 采样率
- 接收带宽
- 时长
- 样本格式
- 参考电平
- Background 类型
- Noise PSD/Noise Floor

### Signal Instance 参数

- 调制/信号类型
- 中心频率
- 占用带宽
- 起始时间
- 持续时间
- CNR/SNR 或接收功率
- 符号率
- 行为：连续/突发/跳频/扫频

### Randomization

拆分为：

- 信号数量随机化
- 载频随机化
- 起始时间随机化
- 持续时间随机化
- 带宽随机化
- 功率/CNR 随机化
- 类型随机化
- 时频重叠概率
- 目标频谱占用率

---

## P-WB-02 宽带场景详情

主视图：

- PSD/Power Spectrum
- Spectrogram/Waterfall
- Signal/Detection List
- Metadata
- Scene Statistics

不显示原始宽带星座图/眼图。

支持选择 Detection → “提取为窄带信号”。

---

## P-WB-03 数据标注 - 宽带模式

必须支持：

- TF ROI box
- Annotation list
- class
- known/unknown
- confidence（自动标注）
- track_id
- manual/auto source
- 预标注
- 删除/调整
- 保存版本

---

## P-WB-04 信号提取

展示：

```text
Selected ROI
→ DDC offset
→ Filter bandwidth
→ Output sample rate
→ ExtractedSignal
```

参数：

- ROI 时间范围
- ROI RF 频率范围
- 目标中心频率
- 滤波器类型
- 滤波带宽
- 重采样率

确认后进入窄带信号详情。

---

## P-WB-05 Detection Dataset

展示：

- Scene 数量
- TF Tile 数量
- Annotation 数量
- Known/Unknown 比例
- 类别分布
- SNR/CNR 分布
- bandwidth 分布
- duration 分布
- STFT Config
- train/val/test split
- dataset version

---

## P-WB-06 训练任务

新增 Task Type：

- Classification
- Open-set Classification
- Time-Frequency Detection
- Segmentation
- Tracking
- Parameter Estimation

Detection 类型配置：

- input representation
- TF tile size
- detector family
- IoU threshold
- NMS threshold
- class map
- loss
- LR/scheduler
- augmentation

---

## P-WB-07 模型管理

模型类型至少增加：

- Spectrum Occupancy
- Signal Detection
- Spectrogram Segmentation
- Signal Tracking
- Parameter Estimation

保留：

- Modulation Recognition
- Protocol Recognition
- Emitter Recognition
- Open-set Recognition

---

## P-WB-08 宽带检测评测

总览：

- Pd
- Pfa
- Precision
- Recall
- F1
- AP/mAP
- IoU
- Center Frequency Error
- Bandwidth Error
- Time Boundary Error

分条件曲线：

- Pd vs SNR/CNR
- Pd vs Bandwidth
- Pd vs Duration
- Pd vs Signal Count
- Pd vs Occupancy
- Pd vs Frequency Separation
- Pd vs Power Difference

明确 mock 数据标识。
