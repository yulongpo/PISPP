# Codex Master Prompt — PISPP 宽带原型 V2 重构

你正在处理仓库：

`https://github.com/yulongpo/PISPP`

## 一、任务目标

请完整重构 PISPP 中与宽带信号处理相关的产品原型。

当前原型主要以窄带信号处理/识别为基础构建，宽带页面较多沿用了窄带单信号的参数、逻辑和 UI。此次任务不是简单修改字段，而是从专业宽带信号处理、宽带频谱感知和 Signal Intelligence R&D 的视角，重新建立宽带领域模型和交互流程。

核心认知必须固定为：

> 宽带处理的基本对象不是“一个更宽的单信号”，而是“一个宽带观测/合成场景及其中多个 Signal Instance”。

因此必须建立：

```text
WidebandScene
├─ Receiver/Capture Metadata
├─ Background
├─ SignalInstance[]
├─ TFRepresentation
├─ DetectionAnnotation[]
└─ SignalTrack[]
```

并实现核心链路：

```text
WidebandScene / Raw IQ
→ Spectrum / STFT
→ Detection / Annotation
→ Grouping / Tracking
→ ROI Selection
→ DDC
→ Filter
→ Resample
→ Extracted Narrowband Signal
→ Modulation / Protocol / Emitter Recognition
```

---

## 二、首先阅读并遵守

必须先读取：

1. `AGENTS.md`
2. `docs/00_WIDEBAND_REFACTOR_OVERVIEW.md`
3. `docs/01_DOMAIN_MODEL.md`
4. `docs/02_INFORMATION_ARCHITECTURE.md`
5. `docs/03_PAGE_SPEC.md`
6. `docs/04_ACCEPTANCE_CRITERIA.md`
7. `tasks/TASK_INDEX.md`
8. `tasks/task_manifest.yaml`

然后按任务依赖顺序执行 WB-00 ~ WB-09。

不得跳过审计阶段直接改页面。

---

## 三、工程策略

当前仓库是 Axure RP 静态导出原型。

### 必须

- 保留现有 V1 作为基线；
- 不大规模直接改写 Axure 自动生成 HTML/JS/内部 ID；
- 新建 `prototype_v2/`；
- V2 使用可维护 HTML/CSS/Vanilla JS 实现；
- 无构建依赖即可预览；
- 不依赖外部 CDN 才能完成基本功能；
- 尽量继承 PISPP 现有视觉风格；
- 提供统一 V2 入口；
- 原型数据统一使用 mock domain data。

### 禁止

- 不得删除原 V1 页面；
- 不得用新的“宽带信号生成”复制旧“窄带信号生成”；
- 不得让 Scene 顶层只有单一 modulation/SNR/symbol rate；
- 不得把星座图/眼图作为原始宽带 Scene 主视图；
- 不得把 STFT 参数仅当显示参数；
- 不得只用 Accuracy 评测宽带检测。

---

## 四、必须实现的核心页面

### 1. 宽带场景生成

将“宽带信号生成”的产品语义升级为“宽带场景生成”。

页面至少包含：

#### Scene/Capture

- RF Center Frequency
- Sampling Rate
- Receiver Bandwidth
- Duration
- Sample Format
- Reference Level
- Background Type
- Noise PSD/Noise Floor

严格区分：

\[
F_s,\ B_{RX},\ B_{signal}
\]

#### Signal Instance

每个实例独立：

- class / modulation
- center frequency
- occupied bandwidth
- start time
- duration
- received power
- CNR/SNR
- symbol rate
- continuous/burst/hopping/sweep
- optional channel

#### 时频场景编辑

中心主区域必须是 Time-Frequency Canvas。

至少用可交互 mock 展示：

- 多信号；
- 连续；
- 突发；
- 跳频；
- 邻频；
- 重叠；
- strong/weak near-far。

用户应能选择信号并修改频率、时间、带宽、持续时间。

#### Randomization

不要使用“随机时频”一个总开关。

分别提供：

- signal count
- carrier frequency
- start time
- duration
- bandwidth
- power/CNR
- class
- overlap probability
- target spectrum occupancy

#### Scene Statistics

至少：

- signal count
- spectrum occupancy
- dynamic range
- minimum frequency separation

---

### 2. 宽带场景详情

主视图：

- PSD/Power Spectrum
- Spectrogram/Waterfall
- Detection/Signal List
- Metadata/Statistics

时频参数至少：

- FFT Length
- Window
- Overlap/Hop
- Frequency Resolution / RBW
- Scaling
- Reference Level
- Dynamic Range
- Colormap

当 FFT Length 改变时，应显示：

\[
\Delta f = F_s / N_{FFT}
\]

---

### 3. 数据标注 — 宽带模式

至少支持：

```text
(t_start, t_end, f_low, f_high, class)
```

并支持：

- multi-instance
- known / unknown
- confidence
- manual / auto
- track id
- auto pre-annotation mock
- manual correction

---

### 4. 宽带 → 窄带提取

任何 detection/annotation ROI 都应可以进入“信号提取”。

展示：

- selected time range
- selected RF frequency range
- selected center frequency
- DDC offset
- filter bandwidth/type
- output sampling rate
- resampling

生成 `ExtractedSignal` mock。

随后进入窄带详情页。

此时才允许展示：

- waveform
- spectrum
- spectrogram
- constellation
- eye diagram
- modulation recognition
- protocol recognition

必须显示来源：

`WidebandScene → Detection/ROI → ExtractedSignal`

---

### 5. Detection Dataset

新增专用 Dataset 类型。

至少展示：

- Scene count
- Tile count
- Annotation count
- Known/Unknown ratio
- class distribution
- SNR/CNR distribution
- bandwidth distribution
- duration distribution
- STFT config
- tile size
- train/val/test
- dataset version

必须明确数据血缘：

```text
Tile
→ TFRepresentation
→ Raw IQ
→ WidebandScene
```

---

### 6. 训练/实验

Task Type 至少包括：

- Classification
- Open-set Classification
- Time-Frequency Detection
- Segmentation
- Tracking
- Parameter Estimation

Detection 类型不能只复用分类训练参数，应增加：

- input representation
- tile/input size
- detector family
- IoU threshold
- NMS threshold
- class mapping
- detection loss
- data augmentation

保留 LR、scheduler、optimizer 等通用参数。

---

### 7. 模型管理

模型类型增加：

- Spectrum Occupancy
- Signal Detection
- Spectrogram Segmentation
- Signal Tracking
- Parameter Estimation

同时保留：

- Modulation Recognition
- Protocol Recognition
- Emitter Recognition
- Open-set Recognition

保留并合理展示 PyTorch / ONNX / TensorRT 等模型形态，但不要虚构真实部署能力。

---

### 8. 宽带效能评测

建立宽带专项评测页面。

必须至少展示：

#### Detection metrics

- Pd
- Pfa
- Precision
- Recall
- F1
- AP/mAP or IoU

#### Estimation metrics

- Center Frequency Error
- Bandwidth Error
- Time Boundary Error

#### Condition curves

至少 4 类，推荐全部：

- Pd vs SNR/CNR
- Pd vs Bandwidth
- Pd vs Duration
- Pd vs Signal Count
- Pd vs Spectrum Occupancy
- Pd vs Frequency Separation
- Pd vs Power Difference

所有数值均可 mock，但页面必须明确标识为“原型模拟数据”。

---

## 五、工作台与全链流程

最终至少有两条完整可点击演示链：

### 宽带算法研发闭环

```text
工作台
→ 宽带场景生成
→ WidebandScene
→ 数据标注
→ Detection Dataset
→ Training Task
→ Experiment
→ Detection Model
→ Wideband Evaluation
```

### 宽窄带联动

```text
WidebandScene
→ Detection
→ ROI
→ Signal Extraction
→ Narrowband Signal
→ Recognition
```

---

## 六、任务与状态管理

严格执行：

`tasks/WB-00...WB-09`

每完成一个任务：

1. 更新 `tasks/task_manifest.yaml`；
2. 在任务文件追加：
   - 完成内容
   - 修改文件
   - 验证方式
   - 未解决问题
3. 才能进入后续依赖任务。

如遇领域定义冲突，新建 ADR 到：

`docs/decisions/`

不得静默改变关键领域模型。

---

## 七、测试与验收

完整执行：

`docs/04_ACCEPTANCE_CRITERIA.md`

最后生成：

```text
docs/IMPLEMENTATION_REPORT.md
docs/TEST_REPORT.md
docs/KNOWN_ISSUES.md
prototype_v2/README.md
```

最终报告必须明确：

- V1 保留情况；
- V2 新增页面；
- 宽带领域模型变化；
- 与旧宽带页面的主要差异；
- 宽带→窄带联动如何实现；
- mock 与真实算法的边界；
- 尚未实现的真实后台/API/算法；
- 后续工程化建议。

---

## 八、完成标准

除非满足以下全部条件，否则不要宣告任务完成：

1. WB-00 ~ WB-09 按依赖执行完成；
2. 所有 P0/P1 验收通过；
3. V1 未被破坏；
4. V2 可独立预览；
5. 宽带场景可以包含多个 SignalInstance；
6. 有可交互时频场景编辑；
7. 有 TF 标注；
8. 有 Detection Dataset；
9. 有宽带检测训练/模型/评测；
10. 可完整演示“宽带检测 → ROI → 窄带提取 → 识别”。

请现在开始执行，不要只输出计划，不要停留在分析阶段；自行审计仓库、实现原型、验证、修复并提交完整实施文档。
