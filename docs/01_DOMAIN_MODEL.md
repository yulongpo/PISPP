# PISPP 宽带领域模型

## 1. WidebandScene

表示一次宽带观测或合成场景。

```yaml
WidebandScene:
  id:
  name:
  rf_center_frequency_hz:
  sampling_rate_sps:
  receiver_bandwidth_hz:
  duration_s:
  sample_format:
  reference_level:
  background:
  signal_instances: []
  tf_config:
  provenance:
```

约束：

\[
B_{RX} \le F_s
\]

且必须区分：

\[
F_s,\ B_{RX},\ B_{signal}
\]

## 2. Background

```yaml
Background:
  type: awgn | colored_noise | recorded | custom_psd
  noise_psd_dbm_per_hz:
  noise_floor_dbfs:
  source_ref:
```

场景层优先描述 Noise PSD/Noise Floor，不使用单一全局 SNR 替代背景定义。

## 3. SignalInstance

```yaml
SignalInstance:
  id:
  scene_id:
  source_type: simulated | measured | imported
  class_label:
  modulation:
  protocol:
  behavior: continuous | burst | hopping | sweep
  center_frequency_hz:
  occupied_bandwidth_hz:
  start_time_s:
  duration_s:
  received_power_dbm:
  cnr_db:
  snr_db:
  symbol_rate_baud:
  frequency_offset_hz:
  channel_model:
  track_id:
```

调制方式、符号率、实例 SNR/CNR 均属于此层。

## 4. TFRepresentation

```yaml
TFRepresentation:
  id:
  scene_id:
  fft_length:
  window:
  overlap_ratio:
  hop_length:
  frequency_resolution_hz:
  time_resolution_s:
  scaling:
  normalization:
  tile_size:
  version:
```

其中：

\[
\Delta f = \frac{F_s}{N_{FFT}}
\]

STFT 配置是数据血缘的一部分。

## 5. DetectionAnnotation

```yaml
DetectionAnnotation:
  id:
  scene_id:
  signal_instance_id:
  t_start_s:
  t_end_s:
  f_low_hz:
  f_high_hz:
  class_label:
  known_state: known | unknown
  confidence:
  source: manual | auto
  track_id:
```

基本几何区域：

\[
A_i=(t_s,t_e,f_l,f_h,c_i)
\]

## 6. SignalTrack

用于跳频、突发和多片段关联：

```yaml
SignalTrack:
  id:
  scene_id:
  detection_ids: []
  behavior:
  hop_rate_hz:
  confidence:
```

## 7. ExtractedSignal

宽带 ROI 经 DDC/滤波/重采样后得到：

```yaml
ExtractedSignal:
  id:
  source_scene_id:
  source_annotation_id:
  rf_center_frequency_hz:
  source_time_range:
  extraction_bandwidth_hz:
  ddc_offset_hz:
  output_sampling_rate_sps:
  filter_type:
  filter_bandwidth_hz:
  provenance:
```

## 8. Dataset

至少支持：

```text
RawIQDataset
DetectionDataset
NarrowbandRecognitionDataset
```

DetectionDataset 的每个样本必须保留：

`Tile ↔ TFRepresentation ↔ RawIQ ↔ WidebandScene`

坐标映射。

## 9. ModelTask

```text
classification
open_set_classification
detection
segmentation
tracking
parameter_estimation
```

## 10. Evaluation

建议抽象：

\[
Evaluation =
Model \times Dataset \times ScenarioCondition \times MetricSet
\]

宽带场景条件至少允许：

- SNR/CNR
- bandwidth
- duration
- signal count
- occupancy
- frequency separation
- power difference
- overlap ratio
- hopping rate
- channel/background
