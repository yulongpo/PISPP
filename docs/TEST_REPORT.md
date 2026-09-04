# PISPP V2 测试与验收报告

日期：2026-09-04

## 1. 自动验证

执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tests\verify_v2.ps1
node --check prototype_v2/assets/js/app.js
node --check prototype_v2/assets/js/domain-data.js
```

结果：`V2 verification completed: 12 checks passed.` 两个 JavaScript 文件语法检查通过。

自动检查覆盖：V2 文件存在、WidebandScene、5 个 SignalInstance、continuous/burst/hopping、Scene/Instance 分层、TF 分辨率联动、完整路由集合、Annotation/Extraction 链、9 项评测指标、7 类条件曲线、V1 25 个 HTML SHA-256 基线、无外部媒体依赖。

另执行本地资源引用检查：`prototype_v2/index.html` 共 6 个本地引用，缺失数为 0。

## 2. 浏览器交互验证

通过本地静态服务器 `python -m http.server 8765` 访问 `http://localhost:8765/prototype_v2/`，执行以下检查：

| 检查 | 结果 |
|---|---|
| 工作台 → 场景生成 | 通过；显示 5 个 SignalInstance 和时频主画布 |
| 添加实例 | 通过；UI 从 5 个实例变为 6 个实例 |
| 编辑实例中心频率 | 通过；输入变化反映到列表和画布 |
| FFT Length → Δf | 通过；4096 时为 19531.25 Hz，8192 时为 9765.63 Hz |
| 时频画布拖动 | 通过；`SIG-002` 频率从 2435.000 MHz 变为 2438.895 MHz |
| 自动预标注 | 通过；生成并显示 6 个 Annotation |
| ROI → 提取 | 通过；进入 DDC / Filter / Resample 页 |
| ExtractedSignal → 窄带 | 通过；显示来源、Constellation、Eye Diagram |
| Dataset 血缘 | 通过；显示 Tile → TFRepresentation → Raw IQ → WidebandScene |
| Detection Training | 通过；显示 Task Type、IoU Threshold、NMS Threshold |
| Experiment / Model / Evaluation | 通过；三页可达，关键内容存在 |
| 浏览器运行时错误 | 通过；error/warn 日志为空 |

## 3. 视觉检查

- 1920×1080：场景生成页三栏结构、主时频画布、实例属性和 Scene/Capture 参数均可见；页面可继续纵向查看下方 TF 和 Randomization。
- 1366×768：核心标题、保存按钮、三栏主结构和时频画布无遮挡；允许纵向滚动访问完整表单。
- 页面使用统一深色 PISPP 风格、单位标签和明显的“原型模拟数据”标识。

## 4. 验收项结论

AC-01～AC-09 全部满足。AC-09 的 V1 保护由 25 个根级 HTML SHA-256 基线和本地文件引用检查共同验证。
