# WB-04 宽带标注与信号提取

## 目标

建立“宽带发现 → 窄带理解”的关键桥梁。

## 数据标注

实现 TF ROI、annotation list、类别、known/unknown、track、manual/auto。

## 提取

从选中 ROI 打开“信号提取”页，明确：

- RF time/frequency range
- DDC
- Filter
- Resample
- output Fs

创建 ExtractedSignal mock。

## 窄带详情

提取后进入窄带页，此时才展示：

- waveform
- spectrum
- spectrogram
- constellation
- eye diagram
- recognition mock

## 验收

满足 AC-04、AC-05。

## 实施记录

- 完成内容：实现 TF ROI 画布、Annotation List、class/known/unknown、confidence、manual/auto、track_id、自动预标注 mock 与手工修正；从 ROI 推导 DDC、Filter、Resample 参数，生成 ExtractedSignal 并进入窄带详情。
- 修改文件：`prototype_v2/assets/js/app.js`、`prototype_v2/assets/css/app.css`、`prototype_v2/pages/README.md`、`tasks/task_manifest.yaml`。
- 验证方式：浏览器执行“自动预标注 mock”并确认生成 6 个 Annotation；点击“从此 ROI 提取信号”确认进入提取页；点击“确认并进入窄带详情”确认来源血缘、Constellation 和 Eye Diagram 可见。
- 未解决问题：实际 DDC、滤波、重采样与检测算法未连接后端，页面明确显示为 mock。
