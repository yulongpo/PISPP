# PISPP 宽带部分原型重构总方案

## 1. 背景

当前 PISPP 原型已经覆盖数据源、样本集、窄带/宽带信号生成、标注、训练、模型管理和离线评测等环节，但宽带部分仍明显沿用单窄带信号的业务结构。

本重构不是“补参数”，而是改变宽带领域抽象。

## 2. 核心问题

### 2.1 领域对象错误

当前容易形成：

`WidebandSignal = 一个带宽更大的 Signal`

应修改为：

`WidebandScene = Receiver/Capture + Background + SignalInstance[]`

### 2.2 处理链错误

当前宽带与窄带容易并列。

应改为：

```mermaid
flowchart LR
    A[Wideband Scene] --> B[STFT/Spectrum]
    B --> C[Detection/Segmentation]
    C --> D[Grouping/Tracking]
    D --> E[Signal Extraction]
    E --> F[Narrowband Signal]
    F --> G[Recognition/Estimation/Demodulation]
```

### 2.3 标注粒度错误

宽带标注必须从分类标签升级为时频实例：

`(t_start, t_end, f_low, f_high, class)`

### 2.4 评测维度错误

宽带检测不能只看 Accuracy，应围绕：

- Pd/Pfa
- Precision/Recall/F1
- AP/mAP/IoU
- 频率/带宽/时间边界误差
- SNR/CNR
- 信号数量
- 频谱占用率
- Near-Far
- 邻频/重叠
- 短突发/跳频

进行效能刻画。

## 3. 重构目标

### P0

- WidebandScene / SignalInstance 正式建模；
- 宽带信号生成 → 宽带场景生成；
- 时频场景编辑器；
- 宽带时频标注；
- 宽带检测 → 窄带提取联动；
- 宽带数据源/样本集元数据分层。

### P1

- Detection Dataset；
- Detection/Segmentation/Tracking 任务；
- 宽带模型注册；
- 宽带专项评测；
- STFT 数据血缘；
- 场景随机化。

### P2

- Recorded Background；
- 多尺度 STFT；
- 自动预标注；
- 场景难度等级；
- 跳频轨迹编辑。

## 4. V2 页面建议

```text
工作台
├─ 数据资产
│  ├─ 数据源管理
│  ├─ 场景详情
│  └─ 样本集管理
├─ 数据构建
│  ├─ 窄带信号生成
│  ├─ 宽带场景生成
│  ├─ 模板中心
│  └─ 数据标注
├─ 智能模型研发
│  ├─ 训练任务
│  ├─ 实验任务
│  ├─ 模型管理
│  └─ 脚本管理
└─ 模型评测
   ├─ 闭集/开集识别评测
   └─ 宽带检测效能评测
```

## 5. 本轮不做

- 实时 SDR 采集；
- 在线推理服务；
- 边缘部署；
- 告警处置；
- 真实 GPU 算法训练；
- 真实 DDC/STFT 算法实现（原型可 mock，但必须业务正确）。
