# PISPP V2 宽带原型

V2 是独立于根目录 Axure 导出的 V1 的 Vanilla HTML/CSS/JS 原型，围绕 `WidebandScene + SignalInstance[]` 表达宽带信号处理研发闭环。

## 预览

无需安装 Node/npm 或第三方依赖。可直接打开 `index.html`；推荐在仓库根目录执行任意静态 HTTP 服务，例如：

```powershell
python -m http.server 8765
```

然后访问 `http://localhost:8765/prototype_v2/`。统一入口也可以从根目录 `start_v2.html` 进入。

## 交互演示路径

1. 工作台 → 宽带场景生成：编辑 Scene/Capture、添加至少 3 个 SignalInstance，拖动时频块，应用独立随机化。
2. 场景详情 → 宽带时频标注：运行自动预标注或修改 class/known state，选择 ROI。
3. ROI → 信号提取：检查 DDC、Filter、Resample 参数并生成 `ExtractedSignal`。
4. 窄带信号详情：查看来源血缘、波形、频谱、Spectrogram、星座图、眼图和识别 mock。
5. 工作台 → Dataset → Training → Experiment → Model → Evaluation：演示宽带算法研发闭环。

## 边界

页面中的 STFT、检测、分组、DDC、滤波、重采样、训练和评测均为带有明确标识的 mock 表达；未连接真实后端、GPU 训练、在线推理或 SDR 采集。
