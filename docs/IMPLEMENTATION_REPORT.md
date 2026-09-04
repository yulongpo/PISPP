# PISPP V2 宽带原型最终实施报告

日期：2026-09-04  
范围：WB-00 ～ WB-09，宽带信号处理相关原型的领域重构与 V2 实现

## 1. 交付结论

WB-00～WB-09 已按 `tasks/TASK_INDEX.md` 依赖顺序执行。V2 可独立预览，核心交互和两条业务链均已联通；V1 Axure 静态导出及其资源保留为基线。

## 2. V1 保留情况

- 未删除或重写根目录 Axure HTML。
- 未修改 `data/`、`files/`、`images/`、`resources/`、`plugins/`。
- `docs/V1_SHA256_BASELINE.txt` 保存了 25 个根级 HTML 的 SHA-256 基线，最终验证全部一致。
- `start.html` 仍为 V1 入口；新增 `start_v2.html` 作为 V2 明确入口，V2 侧栏和顶部均可返回 V1。

## 3. V2 新增页面与实现

入口：`prototype_v2/index.html`，无构建依赖，使用 Vanilla HTML/CSS/JS。

| 页面路由 | 交付内容 |
|---|---|
| `#/` | 工作台、宽带检测研发闭环、宽窄带联动入口 |
| `#/data-sources` | Raw IQ、实测背景、仿真和导入数据源 |
| `#/sample-sets` | 宽带 Detection Dataset 与窄带识别集目录 |
| `#/scene-builder` | WidebandScene 编辑、SignalInstance 列表、时频画布、背景和随机化 |
| `#/scene-detail` | PSD、Spectrogram、Metadata、STFT 血缘和信号列表 |
| `#/annotation` | TF ROI、Annotation List、自动预标注、手工修正和提取 |
| `#/extraction` | ROI → DDC → Filter → Resample → ExtractedSignal |
| `#/narrowband` | 提取后的波形、频谱、Spectrogram、星座图、眼图和识别结果 |
| `#/dataset` | Detection Dataset、分布、切分、STFT 与 Tile 血缘 |
| `#/training`、`#/experiment` | 宽带检测/分割/跟踪/参数估计训练配置和实验追踪 |
| `#/models` | 宽带模型注册类型与窄带识别类型 |
| `#/evaluation` | Pd/Pfa、Precision/Recall/F1、AP/mAP、IoU、误差和 7 类条件曲线 |

## 4. 领域模型变化

V2 的唯一 mock 数据源为 `prototype_v2/assets/js/domain-data.js`：

```text
WidebandScene
├─ Receiver/Capture metadata
├─ Background
├─ SignalInstance[]
├─ TFRepresentation
├─ DetectionAnnotation[]
└─ SignalTrack[]
```

Scene 示例包含 5 个独立实例，覆盖 continuous、burst、hopping；调制、符号率、接收功率、CNR/SNR、B_signal 和时间边界均属于实例层。Scene 层明确区分 RF 中心频率、采样率 Fs、接收带宽 B_RX、Noise PSD 和 Noise Floor。

`TFRepresentation` 保留 FFT Length、Window、Overlap、Hop、Scaling、Tile Size、版本，并实时计算 `Δf = Fs / NFFT`。检测标注以 `(t_start, t_end, f_low, f_high, class)` 为核心，并扩展 known/unknown、confidence、manual/auto、track_id。

## 5. 宽带到窄带联动

任一 Annotation 可进入提取页。提取页从 RF 时间/频率边界推导目标中心频率、DDC offset、滤波带宽和输出采样率。点击生成后创建 `ExtractedSignal` mock，带有：

`source_scene_id`、`source_annotation_id`、RF 中心频率、时间范围、提取带宽、DDC 偏移、输出 Fs、滤波器、TF 版本和 Raw IQ 引用。

窄带详情页显示 `WidebandScene → Detection/ROI → ExtractedSignal` 来源链，只有在此阶段展示星座图、眼图和调制/协议识别结果。

## 6. 与旧宽带页面的主要差异

旧 `宽带信号生成.html` 偏向信号源文件抽样、单一 `SNR范围`、固定频率/控制跳频/随机时频策略和固定布局。V2 改为可编辑的多实例 Scene：实例列表、实例级独立参数、Scene 背景、时频画布、STFT 血缘、Annotation、Detection Dataset 和提取链条彼此可追溯。

## 7. Mock 与真实算法边界

原型模拟的内容包括 IQ/PSD/Spectrogram 视觉、自动预标注、随机化结果、DDC/滤波/重采样参数推导、训练进度、模型指标和评测曲线。页面均以“原型模拟数据”或“mock”标识。

本轮没有实现真实 Raw IQ 合成、STFT、检测/分割/跟踪算法、DDC、滤波、重采样、GPU 训练、模型服务、在线推理、SDR 实时采集或后端 API。

## 8. 后续工程化建议

1. 用后端 Scene/Annotation/Dataset API 替换 `domain-data.js`，为每次 Scene、TF、标注和提取生成不可变版本。
2. 将 Raw IQ 坐标、TF Tile 坐标和 RF 时间/频率坐标统一为可校验的 schema，并在服务端执行 `B_RX ≤ Fs`、边界和重叠约束。
3. 接入真实 STFT、检测器、跟踪器和 DDC pipeline，保存模型推理版本与阈值扫描结果。
4. 将训练、模型注册和评测结果接入任务队列与对象存储，补充权限、审计和失败重试。
