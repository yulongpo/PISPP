# V2 Mock Domain Schema

`assets/js/domain-data.js` 是 V2 原型唯一 mock domain data 来源。它以 `WidebandScene` 为根对象，并保留以下可追溯关系：

```text
WidebandScene
├─ background: Background
├─ signal_instances: SignalInstance[]
├─ tf_config: TFRepresentation
├─ provenance: RawIQ reference + seed
└─ DetectionAnnotation[] / SignalTrack[]
```

页面运行时会深拷贝这份数据到 `state`，因此场景生成、标注、提取、数据集、训练、模型和评测不会各自写死一套互不相干的数据。

## 坐标规则

- Scene 频率轴：`RF center ± B_RX / 2`。
- SignalInstance 占用带宽：`center_frequency ± B_signal / 2`。
- DetectionAnnotation：`(t_start_s, t_end_s, f_low_hz, f_high_hz, class_label)`。
- TF 分辨率：`frequency_resolution_hz = Fs / fft_length`。
- ExtractedSignal：由 Annotation 推导 ROI 时间、RF 频率、DDC offset、filter bandwidth 和 output Fs。

页面上的数字是 mock，不代表真实 STFT、检测器、DDC 或重采样执行结果。
