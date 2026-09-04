# PISPP Codex Agent Instructions

## 1. 项目目标

本轮工作只针对 PISPP **宽带信号处理相关原型的领域重构与 V2 原型实现**。

本项目不是简单的页面美化，也不是把窄带页面复制一份后修改“带宽/采样率”。

核心目标：

> 将宽带部分从“单信号参数编辑范式”重构为“宽带场景 + 多信号实例 + 时频检测/标注 + 信号提取 + 宽窄带联动范式”。

---

## 2. 必读文件顺序

开始任何修改前必须按顺序阅读：

1. `README.md`
2. `docs/00_WIDEBAND_REFACTOR_OVERVIEW.md`
3. `docs/01_DOMAIN_MODEL.md`
4. `docs/02_INFORMATION_ARCHITECTURE.md`
5. `docs/03_PAGE_SPEC.md`
6. `docs/04_ACCEPTANCE_CRITERIA.md`
7. `tasks/TASK_INDEX.md`
8. 当前执行任务对应的 `tasks/WB-xx_*.md`

如任务内容与领域模型冲突，以：

`AGENTS.md > docs/01_DOMAIN_MODEL.md > task 文件 > 当前原型细节`

为优先级。

---

## 3. 强制领域原则

### 3.1 宽带对象不是单个 Signal

禁止继续采用：

```text
WidebandSignal {
  modulation
  snr
  symbol_rate
}
```

作为宽带顶层模型。

必须采用：

```text
WidebandScene
  ├─ Capture/Receiver metadata
  ├─ Background
  └─ SignalInstance[]
```

其中调制方式、符号率、单信号 CNR/SNR、占用带宽、持续时间等属于 `SignalInstance`。

### 3.2 宽带主处理链

必须体现：

```text
WidebandScene / Raw IQ
    ↓
Spectrum / STFT
    ↓
Detection / Annotation
    ↓
Grouping / Tracking
    ↓
DDC + Filter + Resample
    ↓
Extracted Narrowband Signal
    ↓
Recognition / Estimation / Demodulation
```

### 3.3 不允许的设计

- 不允许直接复制“窄带信号生成”作为“宽带信号生成”。
- 不允许把星座图、眼图作为原始宽带场景一级主视图。
- 不允许使用一个全局“调制方式”描述多信号宽带场景。
- 不允许把一个全局 SNR 作为宽带场景的唯一噪声描述。
- 不允许把 STFT 参数只作为 UI 显示参数；必须进入数据版本/血缘。
- 不允许只用 Accuracy 作为宽带检测模型的主要评测指标。
- 不允许破坏现有 V1 Axure 静态导出原型。

---

## 4. 工程策略

### 4.1 V1 保留

现有根目录 Axure 输出视为 `V1 baseline`。

除非为增加 V2 入口链接所必需，不要修改：

- Axure 自动生成的内部 ID
- `data/`
- `files/`
- `resources/`
- `plugins/`
- 现有大型页面内部结构

### 4.2 V2 新实现

建议新增：

```text
prototype_v2/
├─ index.html
├─ assets/
│  ├─ css/
│  ├─ js/
│  └─ img/
├─ pages/
└─ mock/
```

要求：

- 无需 Node/npm 即可直接打开或通过轻量 HTTP server 预览；
- HTML/CSS/Vanilla JS 优先；
- 组件结构清晰；
- 不依赖外部 CDN 才能完成基本预览；
- 所有核心交互应有可点击演示逻辑。

---

## 5. UI/UX 原则

- 保持 PISPP 现有整体视觉语言，不进行完全无关的品牌重做。
- 1080p 桌面分辨率下必须完整可用。
- 核心宽带页面优先为三栏或“参数 + 时频画布 + 属性/统计”布局。
- 时频图是宽带页面主视图。
- 所有物理量必须带单位。
- `Fs`、接收带宽、信号占用带宽必须在 UI 上明确区分。
- 对 FFT Length，应同时展示推导出的频率分辨率：
  `Δf = Fs / NFFT`。
- 交互原型可以使用 mock data，但不得伪装为真实算法结果。

---

## 6. Agent 分工

执行时按以下角色自检：

- 宽带领域与信号处理：`agents/wideband_domain_agent.md`
- 原型实现与交互：`agents/prototype_agent.md`
- 验收与一致性：`agents/qa_agent.md`

Codex 可以按任务切换角色，但最终结果必须同时通过三套检查。

---

## 7. 任务执行规则

每完成一个任务：

1. 更新 `tasks/task_manifest.yaml` 状态；
2. 在对应任务文件末尾增加“实施记录”；
3. 记录实际修改文件；
4. 记录验证方法；
5. 不得提前把任务标记为 done；
6. 发现设计冲突时写入 `docs/decisions/` ADR，而不是静默自行改变领域定义。

---

## 8. 完成定义

只有以下条件同时满足才可宣布完成：

- P0/P1 任务全部完成；
- V2 可从统一入口进入；
- 宽带场景生成可交互；
- 宽带标注/检测结果可交互；
- 可以演示“宽带 ROI → 信号提取 → 窄带分析”的联动；
- 数据集、训练、模型、评测均体现宽带专用语义；
- 无明显窄带复制残留；
- 通过 `docs/04_ACCEPTANCE_CRITERIA.md`；
- 生成最终实施报告。
