# WB-00 V1 仓库与原型审计报告

## 审计范围与基线

审计对象为仓库根目录现有 Axure 静态导出原型。审计期间未修改任何 V1 HTML、`data/`、`files/`、`images/`、`resources/` 或 `plugins/` 内容。根目录共发现 25 个 HTML 文件，Git 工作区在审计开始时仅包含任务包等未跟踪输入，当前分支为 `master`。

## V1 页面事实基线

| 页面 | 业务模块 | 宽带重构相关观察 |
|---|---|---|
| `工作台.html` | 工作台 | 有模块入口，但没有 V2 宽带研发闭环 |
| `数据源管理.html` | 数据资产 | 数据源粒度与宽带 Scene / Raw IQ / TF 关系未明确 |
| `样本集管理.html`、`新建样本集.html`、`详情.html`、`详情_1.html`、`详情_2.html` | 数据资产 | 未形成 Detection Dataset 及 Tile→TF→Raw IQ→Scene 血缘 |
| `窄带信号生成.html` | 窄带数据构建 | 单信号参数编辑，包含调制、码元速率、SNR、波形/星座/眼图等 |
| `宽带信号生成.html` | 宽带数据构建 | 以信号源抽样和固定策略放置为主，仍缺少正式 WidebandScene / SignalInstance 模型 |
| `数据标注.html` | 数据标注 | 没有可追溯的时频实例标注对象与宽带 ROI→提取动作 |
| `训练任务.html`、`新建训练任务.html`、`训练详情.html`、`新建实验任务.html` | 模型研发 | 训练/实验语义未区分检测、分割、跟踪与参数估计 |
| `模型管理.html` | 模型研发 | 缺少宽带检测、谱图分割、跟踪、参数估计注册类型 |
| `模型评测.html`、`新建评测任务.html`、`评测详情.html` | 模型评测 | 需要 Pd/Pfa、IoU、边界误差和分条件曲线 |
| `模版中心.html`、`脚本管理.html`、`系统设置.html` | 平台支撑 | 非本轮宽带主链，但最终 V2 导航需保留其边界 |

## 窄带/宽带生成器对比

| 维度 | `窄带信号生成.html` | `宽带信号生成.html` | 审计结论 |
|---|---:|---:|---|
| HTML 输入控件 | 37 | 50 | 宽带增加了来源抽样、放置策略和高级场景参数，但没有形成稳定领域对象 |
| HTML 选择控件 | 16 | 14 | 两者均以导出控件表达交互，无法作为可复用数据模型 |
| 顶层核心语义 | 中心频率、调制方式、码元速率、带宽、SNR、信道损伤 | 数据源、采样率、背景噪声、单样本时长、场景布局、SNR 范围、跳频/突发策略 | 宽带页仍混合了窄带文件抽样与场景布局，未显式表达 `SignalInstance[]` |
| 时频布局 | 实时频谱及波形/星座/眼图 | 时间-相对频率示意图 | 宽带主视图缺少 STFT 配置、PSD、实例属性和检测/标注联动 |
| 随机化 | 以参数范围/随机种子为主 | `固定频率`、`控制跳频`、`随机时频` 单一策略 | 需要拆分 signal count、carrier、time、duration、bandwidth、power/class、overlap、occupancy |

宽带文件中出现的 `随机时频`、`随机突发`、`控制跳频`、`信号间最小频率间隔` 等内容说明已有业务意图，但它们主要停留在导出页面文案和固定策略上，不能替代 `WidebandScene`、`Background`、`SignalInstance`、`TFRepresentation` 等对象。

## 问题清单

### 1. 宽带场景生成问题

- 页面标题和交互仍是“宽带信号生成”，会将宽带误解为单个更宽的信号。
- 信号源库、文件抽样与场景参数耦合，无法表达一次观测中多个独立实例的生命周期、功率和行为。
- 场景级采样率、接收带宽、中心频率和实例级占用带宽没有可追溯的分层展示。
- 背景出现 `背景噪声功率` 与 `SNR范围`，但缺少 Noise PSD / Noise Floor 的场景级定义。

### 2. 场景/实例属性混淆

- 调制、码元速率、带宽等窄带单信号字段容易被复用为宽带顶层字段。
- 宽带页的 `SNR范围` 更像生成任务范围，不足以表达每个 SignalInstance 的 CNR/SNR 或接收功率。
- 连续、突发、跳频等行为通过策略文案表达，未形成实例级 `behavior` 和 `track_id`。

### 3. 宽带标注问题

- V1 标注页没有在仓库级信息架构中声明 `(t_start, t_end, f_low, f_high, class)` 的 TF ROI 对象。
- 未见 known/unknown、manual/auto、confidence、track_id 的统一 annotation schema。
- 宽带检测结果无法从页面动作进入 DDC、Filter、Resample 后的窄带信号。

### 4. 宽带训练/模型问题

- 训练任务与实验任务没有宽带 detection/segmentation/tracking/parameter estimation 的专用参数分支。
- 模型管理缺少 Signal Detection、Spectrogram Segmentation、Signal Tracking、Parameter Estimation 类型。
- Detection Dataset、TF tile 和 STFT 配置未纳入模型研发血缘。

### 5. 宽带评测问题

- V1 评测信息架构没有保证 Pd/Pfa、Precision/Recall/F1、AP/mAP/IoU 与中心频率、带宽、时间边界误差同时出现。
- 没有按 SNR/CNR、带宽、持续时间、信号数、占用率、频率间隔、功率差分条件的宽带检测曲线。
- 仅有 Accuracy 会掩盖检测边界、漏检和虚警问题，不能作为宽带检测主指标。

### 6. 宽窄带联动缺失

V1 页面之间没有可验证的 `WidebandScene → Detection/ROI → ExtractedSignal → Narrowband Analysis` 链路，宽带主视图和窄带星座/眼图之间没有清晰边界。

## 重构输入与结论

V1 将作为不可破坏基线保留。V2 应新增独立的 Vanilla HTML/CSS/JS 原型，以统一 mock domain model 表达场景、实例、TF 表示、检测标注、数据集、模型和评测，且用真实页面导航串起两条业务链。后续任务按 `tasks/TASK_INDEX.md` 依赖顺序推进。
