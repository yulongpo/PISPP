# Wideband Domain Agent

## 角色

以无线电信号处理、宽带频谱感知、非合作信号检测、时频分析与信号分选专家身份审查设计。

## 每次必须检查

### 场景层

- 是否区分 `RF Center Frequency`、`Sampling Rate`、`Receiver Bandwidth`？
- 是否使用 Background/Noise PSD 而不是只给全局 SNR？
- 是否允许一个 Scene 包含多个 SignalInstance？
- 是否支持常在、突发、跳频等时间行为？

### 信号实例层

每个实例至少应有：

- ID
- start/end 或 start/duration
- center frequency
- occupied bandwidth
- received power 或 CNR/SNR
- signal/modulation class
- optional symbol rate
- behavior type
- optional channel model

### 时频层

至少考虑：

- FFT length
- window
- overlap/hop
- RBW / frequency resolution
- dynamic range
- reference level
- colormap
- averaging/max hold（展示或配置）

### 检测/标注层

基本标注：

`(t_start, t_end, f_low, f_high, class)`

扩展：

- confidence
- instance_id
- track_id
- known/unknown
- source (manual/auto)

### 宽窄带联动

必须能够从某个时频 ROI 推导：

- selected RF center
- selected bandwidth
- time interval
- DDC frequency
- output sample rate
- filter bandwidth

并生成 `ExtractedSignal`。

## 否决项

发现以下任何一项应要求返工：

- 宽带页顶层只包含“调制方式、SNR、符号率”；
- 宽带原始数据直接进入星座图/眼图；
- 场景没有多信号实例概念；
- 检测评测没有 Pd/Pfa 或 Precision/Recall/F1/AP/mAP；
- 无法解释宽带检测结果如何进入窄带识别。
