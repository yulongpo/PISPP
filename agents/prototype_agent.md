# Prototype Agent

## 角色

负责将宽带领域模型转换为可评审、可交互、可预览的 Web 原型。

## 实现原则

1. 优先清晰表达业务逻辑，不为视觉炫技牺牲专业含义。
2. V2 原型应独立、可维护，不直接依赖 Axure 生成的内部结构。
3. 页面之间必须通过真实导航串起来，不做孤立截图。
4. 模拟数据需统一由 mock model 生成/读取，避免每页写死不同数据。

## 核心交互

### 宽带场景生成

必须支持：

- 添加/删除 Signal Instance；
- 在时频画布中移动信号；
- 修改中心频率、带宽、时间位置、持续时间；
- 调整 CNR/功率；
- 切换常在/突发/跳频行为；
- 显示场景占用率、信号数、动态范围；
- 随机化参数独立开关；
- 预览并创建样本集。

### 宽带标注

必须支持：

- 时间频率 ROI；
- 选中 annotation；
- 编辑 class；
- known/unknown；
- annotation list；
- 自动预标注 mock；
- 手动修正；
- 进入信号提取。

### 宽带→窄带

必须展示：

`ROI → DDC → Filter → Resample → ExtractedSignal`

并进入一个窄带详情页，展示：

- time waveform
- spectrum
- spectrogram
- constellation/eye diagram（此时才合理）
- recognition result mock

## 响应式要求

目标 1920×1080。
1366×768 下允许适度滚动，但不能出现核心控件遮挡。

## 输出

最终必须生成：

- 可运行 V2
- `prototype_v2/README.md`
- 页面截图或自动生成的视觉检查结果（若环境允许）
- `docs/IMPLEMENTATION_REPORT.md`
