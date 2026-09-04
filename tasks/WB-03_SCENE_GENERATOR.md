# WB-03 宽带场景生成器

## 目标

实现本轮最关键的宽带业务页面。

## 强制能力

- Scene/Capture 参数；
- SignalInstance 列表；
- 时频画布；
- 实例属性编辑；
- Background；
- Randomization；
- Scene Statistics。

## 时频画布

至少可视觉表达：

- 连续信号；
- 突发信号；
- 多个同时存在的信号；
- 跳频信号；
- 邻频/重叠；
- 强弱信号。

## Randomization

不能使用一个笼统“随机时频”开关，必须拆分独立随机化维度。

## 验收

满足 `AC-02`。

## 实施记录

- 完成内容：实现三栏宽带场景生成器，包含 Scene/Capture、5 个 SignalInstance 列表、连续/突发/跳频时频画布、实例属性编辑、Background、9 个独立 Randomization 维度和实时 Scene Statistics。
- 修改文件：`prototype_v2/index.html`、`prototype_v2/assets/css/app.css`、`prototype_v2/assets/js/app.js`、`prototype_v2/assets/js/domain-data.js`、`prototype_v2/README.md`、`tasks/task_manifest.yaml`。
- 验证方式：浏览器 1920×1080 和 1366×768 视觉检查；通过 UI 添加实例、修改中心频率、改变 FFT、拖动 `SIG-002` 时频块并确认列表频率从 2435.000 MHz 变化为 2438.895 MHz；PowerShell V2 验证脚本通过。
- 未解决问题：画布拖动和场景随机化仍是 mock 参数更新，不执行真实 IQ 合成，符合本轮“原型可 mock、算法不实现”边界。
