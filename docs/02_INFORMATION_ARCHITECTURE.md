# V2 信息架构与业务链

## 1. 顶层信息架构

```mermaid
flowchart TD
    W[工作台] --> DA[数据资产]
    W --> DC[数据构建]
    W --> MR[模型研发]
    W --> EV[模型评测]

    DA --> DS[数据源管理]
    DA --> SM[样本集管理]
    DA --> SD[宽带场景详情]

    DC --> NG[窄带信号生成]
    DC --> WG[宽带场景生成]
    DC --> AN[数据标注]
    DC --> TP[模板中心]

    MR --> TT[训练任务]
    MR --> EX[实验任务]
    MR --> MM[模型管理]
    MR --> SC[脚本管理]

    EV --> CE[识别评测]
    EV --> WE[宽带检测评测]
```

## 2. 宽带业务主链

```mermaid
flowchart LR
    A[场景生成/实测导入]
    --> B[WidebandScene]
    --> C[STFT/TF Representation]
    --> D[人工/自动标注]
    --> E[Detection Dataset]
    --> F[Detection Training]
    --> G[Detection Model]
    --> H[Wideband Evaluation]
```

## 3. 宽窄带联动链

```mermaid
flowchart LR
    A[Wideband Scene]
    --> B[Detection]
    --> C[Select ROI]
    --> D[DDC]
    --> E[Filter]
    --> F[Resample]
    --> G[Extracted Narrowband Signal]
    --> H[Modulation/Protocol/Emitter Recognition]
```

## 4. 页面导航规则

- “宽带场景详情”中的任一 detection/annotation 可进入“提取信号”。
- “提取信号”完成后进入“窄带信号详情”。
- 窄带详情必须显示来源 Scene 和 ROI，可一键返回。
- Detection Dataset 详情必须可追溯 TF/STFT 参数和原始 Scene。
- Model 详情必须可追溯 Training Experiment 和 Dataset Version。
- Evaluation 详情必须可追溯 Model Version 和 Dataset Version。
