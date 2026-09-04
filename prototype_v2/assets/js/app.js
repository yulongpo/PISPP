(function () {
  "use strict";

  const source = window.PISPP_DOMAIN;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const state = {
    scene: clone(source.WidebandScene),
    annotations: clone(source.DetectionAnnotation),
    selectedSignalId: "SIG-002",
    selectedAnnotationId: "ANN-002",
    extracted: null,
    extraction: null,
    taskType: "detection",
    booting: true,
    randomization: {
      signalCount: true,
      carrier: false,
      startTime: true,
      duration: true,
      bandwidth: false,
      power: true,
      classType: false,
      overlap: false,
      occupancy: false
    }
  };

  const view = document.getElementById("app-view");
  const toast = document.getElementById("toast");
  const routeTitles = {
    "/": "工作台",
    "/data-sources": "数据源管理",
    "/sample-sets": "样本集管理",
    "/dataset": "Detection Dataset",
    "/scene-detail": "宽带场景详情",
    "/scene-builder": "宽带场景生成",
    "/annotation": "宽带时频标注",
    "/training": "训练任务",
    "/experiment": "实验详情",
    "/models": "模型管理",
    "/evaluation": "宽带检测评测",
    "/extraction": "信号提取",
    "/narrowband": "窄带信号详情"
  };

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
  const fmtMHz = (value) => (Number(value) / 1000000).toFixed(3);
  const fmtMHzShort = (value) => (Number(value) / 1000000).toFixed(1);
  const fmtMs = (value) => (Number(value) * 1000).toFixed(2);
  const fmtPct = (value) => `${(Number(value) * 100).toFixed(1)}%`;
  const fmtDb = (value) => `${Number(value).toFixed(1)} dB`;

  function getRoute() {
    const raw = window.location.hash.replace(/^#/, "") || "/";
    return raw.split("?")[0] || "/";
  }

  function navigate(route) {
    window.location.hash = route;
  }

  function showToast(message, kind) {
    toast.textContent = message;
    toast.className = `toast visible${kind === "error" ? " toast-error" : ""}`;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.className = "toast"; }, 2600);
  }

  function pageHeading(eyebrow, title, description, actions) {
    return `<div class="page-heading"><div><div class="eyebrow">${esc(eyebrow)}</div><h1 class="page-title">${esc(title)}</h1><p class="page-description">${esc(description)}</p></div><div class="heading-actions">${actions || ""}</div></div>`;
  }

  function button(label, action, extra) {
    return `<button class="btn ${extra || ""}" data-action="${esc(action)}">${esc(label)}</button>`;
  }

  function metric(label, value, unit, note, tone) {
    return `<div class="metric-card card"><div class="metric-label">${esc(label)}</div><div class="metric-value ${tone || ""}">${esc(value)}${unit ? `<span class="unit">${esc(unit)}</span>` : ""}</div><div class="metric-note">${esc(note || "")}</div></div>`;
  }

  function sceneBounds() {
    const center = state.scene.rf_center_frequency_hz;
    const half = state.scene.receiver_bandwidth_hz / 2;
    return { min: center - half, max: center + half, span: state.scene.receiver_bandwidth_hz };
  }

  function sceneStats() {
    const signals = state.scene.signal_instances;
    const b = sceneBounds();
    let occupied = 0;
    let minSep = Infinity;
    signals.forEach((signal) => {
      occupied += Math.max(0, Math.min(b.max, signal.center_frequency_hz + signal.occupied_bandwidth_hz / 2) - Math.max(b.min, signal.center_frequency_hz - signal.occupied_bandwidth_hz / 2));
    });
    const sorted = signals.slice().sort((a, b2) => a.center_frequency_hz - b2.center_frequency_hz);
    for (let index = 1; index < sorted.length; index += 1) {
      const sep = Math.abs(sorted[index].center_frequency_hz - sorted[index - 1].center_frequency_hz) - (sorted[index].occupied_bandwidth_hz + sorted[index - 1].occupied_bandwidth_hz) / 2;
      minSep = Math.min(minSep, sep);
    }
    const highest = Math.max(...signals.map((item) => item.received_power_dbm));
    const lowest = Math.min(...signals.map((item) => item.received_power_dbm));
    return { occupancy: Math.min(100, occupied / b.span * 100), minSeparation: Number.isFinite(minSep) ? minSep : 0, dynamicRange: highest - lowest, highest, lowest };
  }

  function behaviorLabel(behavior) {
    return ({ continuous: "连续", burst: "突发", hopping: "跳频", sweep: "扫频" }[behavior] || behavior);
  }

  function sourceLabel(type) {
    return ({ simulated: "仿真", measured: "实测", imported: "导入" }[type] || type);
  }

  function signalColor(behavior) {
    return ({ continuous: "#22c7a5", burst: "#e4ae5c", hopping: "#e47d72", sweep: "#9a8be8" }[behavior] || "#55c9df");
  }

  function tfSvg(mode) {
    const b = sceneBounds();
    const px = 56;
    const py = 20;
    const pw = 895;
    const ph = 334;
    const duration = state.scene.duration_s;
    const xTime = (seconds) => px + Math.max(0, Math.min(1, seconds / duration)) * pw;
    const yFreq = (hz) => py + (b.max - hz) / b.span * ph;
    let svg = `<svg class="tf-canvas" viewBox="0 0 1000 420" role="img" aria-label="${mode === "annotations" ? "宽带时频标注画布" : "宽带时频场景画布"}">`;
    svg += `<rect x="0" y="0" width="1000" height="420" fill="#091825"/>`;
    for (let i = 0; i <= 10; i += 1) {
      const x = px + i / 10 * pw;
      svg += `<line class="tf-grid${i % 5 === 0 ? "-major" : ""}" x1="${x}" y1="${py}" x2="${x}" y2="${py + ph}"/>`;
      svg += `<text class="tf-axis" x="${x - 12}" y="${py + ph + 23}">${(i * duration * 1000 / 10).toFixed(1)} ms</text>`;
    }
    for (let i = 0; i <= 6; i += 1) {
      const y = py + i / 6 * ph;
      svg += `<line class="tf-grid${i % 3 === 0 ? "-major" : ""}" x1="${px}" y1="${y}" x2="${px + pw}" y2="${y}"/>`;
      const value = b.max - i / 6 * b.span;
      svg += `<text class="tf-axis" x="5" y="${y + 3}">${fmtMHzShort(value)} MHz</text>`;
    }
    svg += `<text class="tf-axis" x="${px}" y="405">时间 / s</text><text class="tf-axis" transform="translate(12 205) rotate(-90)">射频频率 / MHz</text>`;
    if (mode === "annotations") {
      if (!state.annotations.length) {
        svg += `<text class="tf-axis" x="380" y="200">暂无标注，请拖拽或使用自动预标注</text>`;
      }
      state.annotations.forEach((annotation) => {
        const selected = annotation.id === state.selectedAnnotationId;
        const color = annotation.known_state === "unknown" ? "#e47d72" : "#55c9df";
        const x = xTime(annotation.t_start_s);
        const width = Math.max(8, xTime(annotation.t_end_s) - x);
        const y = yFreq(annotation.f_high_hz);
        const height = Math.max(10, yFreq(annotation.f_low_hz) - y);
        svg += `<rect data-tf-annotation="${esc(annotation.id)}" x="${x}" y="${y}" width="${width}" height="${height}" rx="3" fill="${color}" fill-opacity=".2" stroke="${selected ? "#ffffff" : color}" stroke-width="${selected ? 2.5 : 1.5}" stroke-dasharray="${annotation.source === "auto" ? "5 3" : "0"}"/>`;
        svg += `<text class="tf-label" x="${x + 6}" y="${Math.max(py + 13, y - 5)}">${esc(annotation.class_label)}</text>`;
      });
    } else {
      state.scene.signal_instances.forEach((signal) => {
        const selected = signal.id === state.selectedSignalId;
        const color = signalColor(signal.behavior);
        const x = xTime(signal.start_time_s);
        const width = Math.max(9, xTime(signal.start_time_s + signal.duration_s) - x);
        const y = yFreq(signal.center_frequency_hz + signal.occupied_bandwidth_hz / 2);
        const height = Math.max(11, yFreq(signal.center_frequency_hz - signal.occupied_bandwidth_hz / 2) - y);
        if (signal.behavior === "hopping") {
          const parts = [0, .34, .68];
          parts.forEach((part, index) => {
            const partX = x + width * part;
            const partW = Math.max(12, width * .24);
            const offset = index === 1 ? -height * .42 : (index === 2 ? height * .28 : 0);
            svg += `<rect data-tf-signal="${esc(signal.id)}" x="${partX}" y="${y + offset}" width="${partW}" height="${height}" rx="3" fill="${color}" fill-opacity=".22" stroke="${selected ? "#ffffff" : color}" stroke-width="${selected ? 2.5 : 1.5}"/>`;
          });
          svg += `<path d="M ${x + width * .12} ${y + height * .55} L ${x + width * .45} ${y + height * .12} L ${x + width * .79} ${y + height * .77}" fill="none" stroke="${color}" stroke-width="1.3" stroke-dasharray="4 3"/>`;
        } else {
          svg += `<rect data-tf-signal="${esc(signal.id)}" x="${x}" y="${y}" width="${width}" height="${height}" rx="3" fill="${color}" fill-opacity=".2" stroke="${selected ? "#ffffff" : color}" stroke-width="${selected ? 2.5 : 1.5}"/>`;
        }
        svg += `<text class="tf-label" x="${x + 6}" y="${Math.max(py + 13, y - 5)}">${esc(signal.id)} · ${esc(signal.modulation)}</text>`;
      });
    }
    svg += `</svg>`;
    return svg;
  }

  function spectrumSvg() {
    const points = [];
    for (let i = 0; i <= 180; i += 1) {
      const x = 40 + i / 180 * 930;
      let y = 178 + Math.sin(i * .44) * 3 + Math.sin(i * .11) * 4;
      state.scene.signal_instances.forEach((signal) => {
        const center = (signal.center_frequency_hz - sceneBounds().min) / sceneBounds().span;
        const at = center * 180;
        const spread = Math.max(2, signal.occupied_bandwidth_hz / sceneBounds().span * 180);
        y -= Math.max(0, 1 - Math.abs(i - at) / spread) * (signal.received_power_dbm - sceneStats().lowest + 18) * .72;
      });
      points.push(`${x.toFixed(1)},${Math.max(24, Math.min(180, y)).toFixed(1)}`);
    }
    return `<svg class="svg-panel" viewBox="0 0 1000 215" role="img" aria-label="模拟功率谱密度"><rect width="1000" height="215" fill="#091825"/>${[40,75,110,145,180].map((y) => `<line class="svg-grid" x1="40" y1="${y}" x2="970" y2="${y}"/>`).join("")}<polyline class="svg-line" points="${points.join(" ")}"/><text class="chart-axis" x="40" y="202">${fmtMHz(sceneBounds().min)} MHz</text><text class="chart-axis" x="885" y="202">${fmtMHz(sceneBounds().max)} MHz</text><text class="chart-axis" x="10" y="31">dBm</text><text class="chart-axis" x="470" y="202">频率</text></svg>`;
  }

  function waveformSvg() {
    const points = [];
    for (let i = 0; i <= 220; i += 1) {
      const x = 40 + i / 220 * 930;
      const y = 88 - Math.sin(i * .31) * 22 - Math.sin(i * .77) * 8;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `<svg class="svg-panel" viewBox="0 0 1000 125" role="img" aria-label="提取信号模拟时域波形"><rect width="1000" height="125" fill="#091825"/><line class="svg-grid" x1="40" y1="62" x2="970" y2="62"/><polyline class="svg-line" points="${points.join(" ")}"/><text class="chart-axis" x="40" y="113">0 ms</text><text class="chart-axis" x="920" y="113">${fmtMs(state.extracted ? state.extracted.source_time_range[1] - state.extracted.source_time_range[0] : .0115)} ms</text></svg>`;
  }

  function constellationSvg() {
    const spots = [[110,47],[122,56],[105,62],[116,52],[232,45],[240,58],[225,53],[236,66],[110,145],[120,135],[103,137],[116,151],[232,142],[242,151],[225,138],[236,130]];
    return `<svg class="constellation" viewBox="0 0 350 190" role="img" aria-label="提取信号模拟星座图"><rect width="350" height="190" fill="#091825"/><line class="axis" x1="35" y1="95" x2="315" y2="95"/><line class="axis" x1="175" y1="20" x2="175" y2="170"/>${spots.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3"/>`).join("")}<text class="chart-axis" x="300" y="112">I</text><text class="chart-axis" x="181" y="27">Q</text></svg>`;
  }

  function eyeSvg() {
    const paths = [];
    for (let n = 0; n < 12; n += 1) {
      const points = [];
      for (let i = 0; i <= 40; i += 1) {
        const x = 35 + i / 40 * 280;
        const y = 95 - Math.sin(i / 40 * Math.PI * 2 + n * .13) * 47 + (n - 5) * 1.7;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      paths.push(`<polyline class="svg-line-muted" points="${points.join(" ")}"/>`);
    }
    return `<svg class="svg-panel" viewBox="0 0 350 190" role="img" aria-label="提取信号模拟眼图"><rect width="350" height="190" fill="#091825"/><line class="svg-grid" x1="35" y1="95" x2="315" y2="95"/><line class="svg-grid" x1="175" y1="20" x2="175" y2="170"/>${paths.join("")}<text class="chart-axis" x="281" y="112">时间</text></svg>`;
  }

  function lineChart(title, suffix, values, labels, tone) {
    const width = 500;
    const height = 180;
    const plotX = 42;
    const plotY = 18;
    const plotW = 435;
    const plotH = 125;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const pts = values.map((value, index) => `${plotX + index / (values.length - 1) * plotW},${plotY + (max - value) / range * plotH}`).join(" ");
    const circles = values.map((value, index) => `<circle cx="${plotX + index / (values.length - 1) * plotW}" cy="${plotY + (max - value) / range * plotH}" r="3" fill="${tone || "#22c7a5"}"/>`).join("");
    return `<div class="chart-card"><div class="chart-title"><strong>${esc(title)}</strong><span>原型模拟曲线</span></div><svg class="svg-panel" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}"><rect width="${width}" height="${height}" fill="#091825"/>${[18,49,80,111,143].map((y) => `<line class="svg-grid" x1="${plotX}" y1="${y}" x2="${plotX + plotW}" y2="${y}"/>`).join("")}<polyline fill="none" stroke="${tone || "#22c7a5"}" stroke-width="2" points="${pts}"/>${circles}<text class="chart-axis" x="7" y="23">${max.toFixed(2)}${suffix}</text><text class="chart-axis" x="7" y="146">${min.toFixed(2)}${suffix}</text>${labels.map((label, index) => `<text class="chart-axis" x="${plotX + index / (labels.length - 1) * plotW - 12}" y="165">${esc(label)}</text>`).join("")}</svg></div>`;
  }

  function renderWorkbench() {
    const stats = sceneStats();
    const signals = state.scene.signal_instances;
    return `${pageHeading("PISPP / WORKBENCH", "宽带信号研发工作台", "围绕 WidebandScene 构建时频检测数据，并将检测 ROI 交给窄带识别链路。", `<a class="btn btn-primary" href="#/scene-builder">创建宽带场景</a><a class="btn" href="#/evaluation">查看检测评测</a>`)}
      <div class="notice"><strong>当前工作区：</strong> ${esc(state.scene.name)} · ${signals.length} 个 SignalInstance · Scene / Instance / TF / Annotation 均由统一 mock domain model 驱动。</div>
      <div class="grid grid-4 mt-14">
        ${metric("当前场景信号数", signals.length, "个", "支持连续、突发、跳频行为", "metric-accent")}
        ${metric("频谱占用率", stats.occupancy.toFixed(1), "%", "按接收带宽计算的几何占用", "metric-accent")}
        ${metric("最小频率间隔", fmtMHz(stats.minSeparation), "MHz", "邻频与重叠风险可见", "metric-warning")}
        ${metric("Detection Dataset", "v0.8.2", "", "128 scenes · 18,432 TF tiles", "metric-violet")}
      </div>
      <div class="pipeline" aria-label="宽带算法研发闭环">
        ${[["01", "WidebandScene", "场景生成", "/scene-builder"], ["02", "TF / STFT", "时频表示", "/scene-detail"], ["03", "Annotation", "ROI 标注", "/annotation"], ["04", "Detection Dataset", "数据血缘", "/dataset"], ["05", "Training", "检测训练", "/training"], ["06", "Experiment", "实验追踪", "/experiment"], ["07", "Model", "模型注册", "/models"], ["08", "Evaluation", "宽带评测", "/evaluation"]].map((step) => `<a class="pipeline-step done" href="#${step[3]}"><div class="pipeline-index">${step[0]}</div><div class="pipeline-name">${step[1]}</div><div class="pipeline-detail">${step[2]}</div></a>`).join("")}
      </div>
      <div class="workbench-grid">
        <div class="card"><div class="card-header"><div><h2 class="card-title">宽带算法研发闭环</h2><div class="card-subtitle">从原始 IQ 到检测模型评测</div></div><span class="status-badge">进行中</span></div><div class="card-body flow-list">
          ${[["场景构建", "多信号实例、背景噪声和时频参数", "/scene-builder"], ["标注与分组", "TF ROI、known/unknown、track", "/annotation"], ["数据与训练", "Tile → TF → Raw IQ → Scene", "/dataset"], ["模型与评测", "Pd/Pfa、IoU、边界误差与条件曲线", "/evaluation"]].map((item, index) => `<a class="flow-row" href="#${item[2]}"><span class="flow-number">0${index + 1}</span><span><span class="flow-name">${item[0]}</span><span class="flow-detail">${item[1]}</span></span><span class="flow-arrow">→</span></a>`).join("")}
        </div></div>
        <div class="card"><div class="card-header"><div><h2 class="card-title">宽窄带联动</h2><div class="card-subtitle">从检测 ROI 进入窄带分析</div></div></div><div class="card-body"><div class="lineage"><span class="lineage-node">Scene</span><span class="lineage-arrow">→</span><span class="lineage-node">ROI</span><span class="lineage-arrow">→</span><span class="lineage-node">DDC</span><span class="lineage-arrow">→</span><span class="lineage-node current">Narrowband</span></div><p class="muted small">选择检测结果后，系统会根据 RF 时间/频率边界推导 DDC 偏移、滤波带宽与输出采样率。</p><a class="btn btn-primary" href="#/annotation">从检测结果开始</a></div></div>
      </div>`;
  }

  function renderSignalList() {
    return `<div class="card"><div class="card-header"><div><h2 class="card-title">SignalInstance 列表</h2><div class="card-subtitle">${state.scene.signal_instances.length} 个实例 · 独立参数</div></div><button class="btn btn-sm" data-action="add-signal">+ 添加实例</button></div><div class="signal-list">${state.scene.signal_instances.map((signal) => `<div class="signal-item ${signal.id === state.selectedSignalId ? "selected" : ""}" data-action="select-signal" data-id="${esc(signal.id)}"><span class="signal-color ${esc(signal.behavior)}"></span><span><span class="signal-name">${esc(signal.class_label)}</span><span class="signal-meta">${esc(signal.id)} · ${behaviorLabel(signal.behavior)} · ${fmtMHz(signal.center_frequency_hz)} MHz · ${fmtMHz(signal.occupied_bandwidth_hz)} MHz</span></span><span class="signal-chevron">›</span></div>`).join("")}</div><div class="list-footer"><div class="small muted">场景级背景：${esc(state.scene.background.type)} · ${state.scene.background.noise_floor_dbfs} dBFS</div></div></div>`;
  }

  function renderCaptureConfig() {
    const s = state.scene;
    return `<div class="card"><div class="card-header"><div><h2 class="card-title">Scene / Capture Metadata</h2><div class="card-subtitle">Fs、接收带宽与实例占用带宽分层管理</div></div><span class="chip chip-accent">B_RX ≤ Fs</span></div><div class="card-body"><div class="form-grid-3">
      <div class="field"><label>场景名称</label><input class="input" data-scene="name" value="${esc(s.name)}"></div>
      <div class="field"><label>RF 中心频率 <span>Hz</span></label><input class="input" type="number" data-scene="rf_center_frequency_hz" value="${s.rf_center_frequency_hz}"></div>
      <div class="field"><label>采样率 Fs <span>sps</span></label><input class="input" type="number" data-scene="sampling_rate_sps" value="${s.sampling_rate_sps}"></div>
      <div class="field"><label>接收带宽 B_RX <span>Hz</span></label><input class="input" type="number" data-scene="receiver_bandwidth_hz" value="${s.receiver_bandwidth_hz}"></div>
      <div class="field"><label>场景时长 <span>s</span></label><input class="input" type="number" step="0.001" data-scene="duration_s" value="${s.duration_s}"></div>
      <div class="field"><label>样本格式</label><select class="select" data-scene="sample_format"><option ${s.sample_format === "complex64" ? "selected" : ""}>complex64</option><option ${s.sample_format === "complex128" ? "selected" : ""}>complex128</option><option>int16 IQ</option></select></div>
      <div class="field"><label>参考电平 <span>dBm</span></label><input class="input" type="number" data-scene="reference_level_dbm" value="${s.reference_level_dbm}"></div>
      <div class="field"><label>背景类型</label><select class="select" data-background="type"><option value="awgn" ${s.background.type === "awgn" ? "selected" : ""}>AWGN</option><option value="colored_noise" ${s.background.type === "colored_noise" ? "selected" : ""}>Colored noise</option><option value="recorded" ${s.background.type === "recorded" ? "selected" : ""}>Recorded background</option></select></div>
      <div class="field"><label>Noise PSD <span>dBm/Hz</span></label><input class="input" type="number" data-background="noise_psd_dbm_per_hz" value="${s.background.noise_psd_dbm_per_hz}"></div>
      <div class="field"><label>Noise Floor <span>dBFS</span></label><input class="input" type="number" data-background="noise_floor_dbfs" value="${s.background.noise_floor_dbfs}"></div>
      <div class="field field-full"><div class="helper">背景在 Scene 层定义；CNR / SNR、接收功率和符号率仅属于各个 SignalInstance。</div></div>
    </div></div></div>`;
  }

  function renderInstanceProps() {
    const signal = state.scene.signal_instances.find((item) => item.id === state.selectedSignalId) || state.scene.signal_instances[0];
    if (!signal) return `<div class="card"><div class="empty-state">暂无 SignalInstance</div></div>`;
    const fields = [
      ["class_label", "类别 / 信号类型", "text", ""], ["modulation", "调制方式", "text", ""], ["center_frequency_hz", "中心频率", "number", "Hz"], ["occupied_bandwidth_hz", "占用带宽 B_signal", "number", "Hz"], ["start_time_s", "起始时间", "number", "s"], ["duration_s", "持续时间", "number", "s"], ["received_power_dbm", "接收功率", "number", "dBm"], ["cnr_db", "CNR", "number", "dB"], ["snr_db", "SNR", "number", "dB"], ["symbol_rate_baud", "符号率", "number", "baud"]
    ];
    return `<div class="card"><div class="card-header"><div><h2 class="card-title">Instance Properties</h2><div class="card-subtitle">${esc(signal.id)} · ${sourceLabel(signal.source_type)}</div></div><span class="chip ${signal.behavior === "burst" ? "chip-warning" : signal.behavior === "hopping" ? "chip-danger" : "chip-accent"}">${behaviorLabel(signal.behavior)}</span></div><div class="card-body"><div class="form-grid">${fields.map((field) => `<div class="field"><label>${esc(field[1])}<span>${esc(field[3])}</span></label><input class="input" type="${field[2]}" step="any" data-instance="${field[0]}" value="${esc(signal[field[0]])}"></div>`).join("")}<div class="field field-full"><label>行为</label><select class="select" data-instance="behavior"><option value="continuous" ${signal.behavior === "continuous" ? "selected" : ""}>continuous · 连续</option><option value="burst" ${signal.behavior === "burst" ? "selected" : ""}>burst · 突发</option><option value="hopping" ${signal.behavior === "hopping" ? "selected" : ""}>hopping · 跳频</option><option value="sweep" ${signal.behavior === "sweep" ? "selected" : ""}>sweep · 扫频</option></select></div><div class="field field-full"><label>信道模型</label><input class="input" data-instance="channel_model" value="${esc(signal.channel_model)}"></div></div><div class="section-divider">实例追踪</div><div class="config-list"><div class="config-row"><label>SignalInstance ID</label><strong>${esc(signal.id)}</strong></div><div class="config-row"><label>track_id</label><strong class="accent">${esc(signal.track_id)}</strong></div><div class="config-row"><label>来源类型</label><strong>${sourceLabel(signal.source_type)}</strong></div></div><button class="btn btn-danger btn-sm mt-14" data-action="remove-signal" data-id="${esc(signal.id)}">删除此实例</button></div></div>`;
  }

  function renderRandomization() {
    const items = [["signalCount", "信号数量", "实例数量在范围内变化"], ["carrier", "载频位置", "中心频率随机偏移"], ["startTime", "起始时间", "时间边界随机化"], ["duration", "持续时间", "连续/突发长度随机化"], ["bandwidth", "占用带宽", "B_signal 范围随机化"], ["power", "功率 / CNR", "接收功率与 CNR 随机化"], ["classType", "类别 / 调制", "从 class map 抽样"], ["overlap", "时频重叠概率", "控制邻频与重叠场景"], ["occupancy", "目标频谱占用率", "约束场景占用率"]];
    return `<div class="card"><div class="card-header"><div><h2 class="card-title">Randomization</h2><div class="card-subtitle">独立维度控制，写入场景生成参数快照</div></div><button class="btn btn-sm" data-action="apply-randomization">应用</button></div><div class="card-body">${items.map((item) => `<div class="toggle-row"><div class="toggle-copy"><strong>${item[1]}</strong><span>${item[2]}</span></div><label class="switch"><input type="checkbox" data-random="${item[0]}" ${state.randomization[item[0]] ? "checked" : ""}><span class="switch-track"></span></label></div>`).join("")}<div class="helper mt-14">随机种子：${state.scene.provenance.seed} · 参数变化将刷新 TF 画布与 Scene Statistics。</div></div></div>`;
  }

  function renderBuilder() {
    const stats = sceneStats();
    const tf = state.scene.tf_config;
    return `${pageHeading("DATA CONSTRUCTION / SCENE", "宽带场景生成", "创建一个接收带宽中的多信号时频场景。Scene 承载采集和背景，信号细节由 SignalInstance 独立描述。", `${button("预览场景", "save-scene", "btn")}${button("进入宽带标注", "go-annotation", "btn")}${button("保存 WidebandScene", "save-scene", "btn-primary")}`)}
      <div class="split-3">
        <div class="stack">${renderSignalList()}<div class="card"><div class="card-header"><div><h2 class="card-title">Scene Statistics</h2><div class="card-subtitle">实时由实例边界推导</div></div></div><div class="card-body"><div class="stats-grid"><div class="stat-box"><label>信号数</label><strong>${state.scene.signal_instances.length}<span> 个</span></strong></div><div class="stat-box"><label>频谱占用</label><strong>${stats.occupancy.toFixed(1)}<span> %</span></strong></div><div class="stat-box"><label>动态范围</label><strong>${stats.dynamicRange.toFixed(0)}<span> dB</span></strong></div><div class="stat-box"><label>最小间隔</label><strong>${fmtMHz(stats.minSeparation)}<span> MHz</span></strong></div></div></div></div></div>
        <div class="stack"><div class="card"><div class="card-header"><div><h2 class="card-title">Time-Frequency Scene Editor</h2><div class="card-subtitle">拖动信号块可调整时间和频率位置 · 模拟画布</div></div><div class="legend"><span class="legend-item"><i class="legend-dot continuous"></i>连续</span><span class="legend-item"><i class="legend-dot burst"></i>突发</span><span class="legend-item"><i class="legend-dot hopping"></i>跳频</span></div></div><div class="tf-wrap">${tfSvg("signals")}<div class="tf-caption"><span>横轴：场景时间 0–${fmtMs(state.scene.duration_s)} ms</span><span>纵轴：RF Center ± B_RX/2</span></div></div></div>${renderCaptureConfig()}<div class="card"><div class="card-header"><div><h2 class="card-title">TF Representation</h2><div class="card-subtitle">STFT 参数属于数据血缘，不是单纯显示设置</div></div><span class="chip chip-accent">${esc(tf.version)}</span></div><div class="card-body"><div class="form-grid-3"><div class="field"><label>FFT Length <span>NFFT</span></label><select class="select" data-tf="fft_length"><option value="2048" ${tf.fft_length === 2048 ? "selected" : ""}>2048</option><option value="4096" ${tf.fft_length === 4096 ? "selected" : ""}>4096</option><option value="8192" ${tf.fft_length === 8192 ? "selected" : ""}>8192</option></select></div><div class="field"><label>Window</label><select class="select" data-tf="window"><option>Blackman-Harris</option><option>Hann</option><option>Flat-top</option></select></div><div class="field"><label>Overlap <span>%</span></label><input class="input" type="number" data-tf="overlap_ratio" value="${tf.overlap_ratio * 100}"></div><div class="field"><label>频率分辨率 Δf <span>Hz</span></label><input class="input" value="${(state.scene.sampling_rate_sps / tf.fft_length).toFixed(2)}" disabled></div><div class="field"><label>Hop Length <span>samples</span></label><input class="input" type="number" data-tf="hop_length" value="${tf.hop_length}"></div><div class="field"><label>Scaling</label><input class="input" data-tf="scaling" value="${esc(tf.scaling)}"></div></div></div></div></div>
        <div class="stack">${renderInstanceProps()}${renderRandomization()}</div>
      </div>`;
  }

  function renderSceneDetail() {
    const s = state.scene;
    const stats = sceneStats();
    const tf = s.tf_config;
    return `${pageHeading("DATA ASSET / WIDEBAND SCENE", "宽带场景详情", "查看 WidebandScene 的 PSD、Spectrogram、信号实例和可追溯的 STFT 数据版本。", `<a class="btn" href="#/scene-builder">编辑场景</a><a class="btn btn-primary" href="#/annotation">进入标注</a>`)}
      <div class="dataset-hero"><div class="dataset-hero-main"><div class="eyebrow">WIDEBANDSCENE</div><h2>${esc(s.name)}</h2><p>${esc(s.id)} · ${s.sample_format} · Raw IQ 已关联</p></div><div class="hero-stat"><label>采样率 Fs</label><strong>${(s.sampling_rate_sps / 1000000).toFixed(0)} <small>Msps</small></strong></div><div class="hero-stat"><label>接收带宽 B_RX</label><strong>${(s.receiver_bandwidth_hz / 1000000).toFixed(0)} <small>MHz</small></strong></div><div class="hero-stat"><label>实例 / 占用率</label><strong>${s.signal_instances.length} / ${stats.occupancy.toFixed(1)}%</strong></div></div>
      <div class="detail-grid mt-14"><div class="left-stack"><div class="card"><div class="card-header"><div><h2 class="card-title">Power Spectrum Density</h2><div class="card-subtitle">频率范围 ${fmtMHz(sceneBounds().min)}–${fmtMHz(sceneBounds().max)} MHz · mock spectrum</div></div><span class="chip chip-accent">PSD / dBm</span></div><div class="card-body">${spectrumSvg()}</div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Spectrogram / Waterfall</h2><div class="card-subtitle">以时频实例作为主视图，不在原始 Scene 展示星座图或眼图</div></div><span class="chip">${esc(tf.colormap)}</span></div><div class="tf-wrap">${tfSvg("signals")}</div></div></div><div class="stack"><div class="card"><div class="card-header"><div><h2 class="card-title">Metadata</h2><div class="card-subtitle">Scene-level capture + background</div></div></div><div class="card-body"><div class="config-list">${[["RF 中心频率", `${fmtMHz(s.rf_center_frequency_hz)} MHz`],["采样率 Fs", `${(s.sampling_rate_sps / 1000000).toFixed(2)} Msps`],["接收带宽 B_RX", `${(s.receiver_bandwidth_hz / 1000000).toFixed(2)} MHz`],["时长", `${fmtMs(s.duration_s)} ms`],["背景类型", s.background.type],["Noise PSD", `${s.background.noise_psd_dbm_per_hz} dBm/Hz`],["Noise Floor", `${s.background.noise_floor_dbfs} dBFS`],["Reference Level", `${s.reference_level_dbm} dBm`]].map((row) => `<div class="config-row"><label>${row[0]}</label><strong>${esc(row[1])}</strong></div>`).join("")}</div></div></div><div class="card"><div class="card-header"><div><h2 class="card-title">STFT / TF Provenance</h2><div class="card-subtitle">TFRepresentation ${esc(tf.version)}</div></div></div><div class="card-body"><div class="config-list">${[["FFT Length", tf.fft_length],["Window", tf.window],["Overlap / Hop", `${tf.overlap_ratio * 100}% / ${tf.hop_length} samples`],["Frequency Resolution", `${(s.sampling_rate_sps / tf.fft_length).toFixed(2)} Hz`],["Time Resolution", `${(tf.hop_length / s.sampling_rate_sps * 1e6).toFixed(2)} μs`],["Tile Size", tf.tile_size]].map((row) => `<div class="config-row"><label>${row[0]}</label><strong class="${row[0] === "Frequency Resolution" ? "accent" : ""}">${esc(row[1])}</strong></div>`).join("")}</div></div></div></div></div>
      <div class="card mt-14"><div class="card-header"><div><h2 class="card-title">Signal / Detection List</h2><div class="card-subtitle">选择实例后进入 TF 标注或信号提取</div></div><a class="btn btn-sm" href="#/annotation">管理检测标注</a></div><div class="card-body"><table class="data-table"><thead><tr><th>ID</th><th>类别</th><th>行为</th><th>中心频率</th><th>B_signal</th><th>时间范围</th><th>CNR / 功率</th><th>操作</th></tr></thead><tbody>${s.signal_instances.map((signal) => `<tr><td><span class="annotation-code">${esc(signal.id)}</span></td><td>${esc(signal.class_label)}</td><td><span class="chip ${signal.behavior === "burst" ? "chip-warning" : signal.behavior === "hopping" ? "chip-danger" : "chip-accent"}">${behaviorLabel(signal.behavior)}</span></td><td>${fmtMHz(signal.center_frequency_hz)} MHz</td><td>${fmtMHz(signal.occupied_bandwidth_hz)} MHz</td><td>${fmtMs(signal.start_time_s)}–${fmtMs(signal.start_time_s + signal.duration_s)} ms</td><td>${signal.cnr_db} dB / ${signal.received_power_dbm} dBm</td><td><span class="table-action" data-action="make-annotation" data-id="${esc(signal.id)}">标注 / 提取</span></td></tr>`).join("")}</tbody></table></div></div>`;
  }

  function annotationRow(annotation) {
    const selected = annotation.id === state.selectedAnnotationId;
    return `<tr class="${selected ? "selected" : ""}" data-action="select-annotation" data-id="${esc(annotation.id)}"><td><span class="annotation-code">${esc(annotation.id)}</span></td><td>${esc(annotation.signal_instance_id)}</td><td><span class="annotation-code">(${fmtMs(annotation.t_start_s)}, ${fmtMs(annotation.t_end_s)} ms)<br>(${fmtMHz(annotation.f_low_hz)}, ${fmtMHz(annotation.f_high_hz)} MHz)</span></td><td><input class="input" data-annotation="class_label" data-id="${esc(annotation.id)}" value="${esc(annotation.class_label)}"></td><td><select class="select" data-annotation="known_state" data-id="${esc(annotation.id)}"><option value="known" ${annotation.known_state === "known" ? "selected" : ""}>known</option><option value="unknown" ${annotation.known_state === "unknown" ? "selected" : ""}>unknown</option></select></td><td>${annotation.confidence ? fmtPct(annotation.confidence) : "—"}</td><td>${annotation.source === "auto" ? "<span class=\"chip chip-warning\">auto</span>" : "<span class=\"chip chip-accent\">manual</span>"}</td><td><span class="table-action" data-action="open-extraction" data-id="${esc(annotation.id)}">提取</span></td></tr>`;
  }

  function renderAnnotation() {
    const selected = state.annotations.find((item) => item.id === state.selectedAnnotationId);
    return `${pageHeading("ANNOTATION / TIME-FREQUENCY", "宽带时频标注", "将检测结果表达为时间-频率实例区域，支持自动预标注、手工修正、known/unknown 与 track 关联。", `${button("自动预标注 mock", "auto-annotate", "btn")}${button("保存标注版本", "save-annotations", "btn-primary")}`)}
      <div class="alert-strip">当前标注数据为原型模拟结果；虚线框代表 auto，实线框代表 manual。保存后可从任一 ROI 进入信号提取。</div>
      <div class="detail-grid mt-14"><div class="left-stack"><div class="card"><div class="card-header"><div><h2 class="card-title">Time-Frequency ROI</h2><div class="card-subtitle">坐标映射：Scene 时间轴 + RF 频率轴</div></div><div class="legend"><span class="legend-item"><i class="legend-dot continuous"></i>known</span><span class="legend-item"><i class="legend-dot burst"></i>auto</span></div></div><div class="tf-wrap">${tfSvg("annotations")}<div class="tf-caption"><span>ROI schema: (t_start, t_end, f_low, f_high, class)</span><span>${state.annotations.length} annotations</span></div></div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Annotation List</h2><div class="card-subtitle">支持 multi-instance 与 track_id</div></div><span class="chip">manual correction enabled</span></div><div class="card-body" style="padding:0;overflow:auto"><table class="annotation-table"><thead><tr><th>ID</th><th>Instance</th><th>TF Bounds</th><th>Class</th><th>State</th><th>Conf.</th><th>Source</th><th>Action</th></tr></thead><tbody>${state.annotations.length ? state.annotations.map(annotationRow).join("") : `<tr><td colspan="8"><div class="empty-state">暂无 Annotation。点击“自动预标注 mock”生成可修正的 ROI。</div></td></tr>`}</tbody></table></div></div></div><div class="stack"><div class="card"><div class="card-header"><div><h2 class="card-title">Selected ROI</h2><div class="card-subtitle">检测对象几何属性</div></div></div><div class="card-body">${selected ? `<div class="config-list">${[["Annotation ID", selected.id],["Signal Instance", selected.signal_instance_id],["时间范围", `${fmtMs(selected.t_start_s)}–${fmtMs(selected.t_end_s)} ms`],["RF 频率范围", `${fmtMHz(selected.f_low_hz)}–${fmtMHz(selected.f_high_hz)} MHz`],["track_id", selected.track_id],["source", selected.source]].map((row) => `<div class="config-row"><label>${row[0]}</label><strong>${esc(row[1])}</strong></div>`).join("")}</div><button class="btn btn-primary mt-14" data-action="open-extraction" data-id="${esc(selected.id)}">从此 ROI 提取信号</button>` : `<div class="empty-state">选择一个 ROI 查看属性</div>`}</div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Annotation Schema</h2><div class="card-subtitle">DetectionAnnotation</div></div></div><div class="card-body"><div class="code-block">{\n  scene_id, signal_instance_id,\n  t_start_s, t_end_s,\n  f_low_hz, f_high_hz, class_label,\n  known_state, confidence,\n  source, track_id\n}</div></div></div></div></div>`;
  }

  function getSelectedAnnotation() {
    return state.annotations.find((item) => item.id === state.selectedAnnotationId) || state.annotations[0];
  }

  function initializeExtraction(annotation) {
    if (!annotation) return;
    const signal = state.scene.signal_instances.find((item) => item.id === annotation.signal_instance_id);
    const low = annotation.f_low_hz;
    const high = annotation.f_high_hz;
    state.extraction = {
      annotationId: annotation.id,
      tStart: annotation.t_start_s,
      tEnd: annotation.t_end_s,
      fLow: low,
      fHigh: high,
      targetCenter: (low + high) / 2,
      filterType: "FIR low-pass",
      filterBandwidth: high - low,
      outputFs: Math.min(state.scene.sampling_rate_sps, Math.max(2000000, (high - low) * 2.5)),
      sourceSignal: signal ? signal.class_label : annotation.class_label,
      ddcOffset: (low + high) / 2 - state.scene.rf_center_frequency_hz
    };
  }

  function renderExtraction() {
    const annotation = getSelectedAnnotation();
    if (!state.extraction && annotation) initializeExtraction(annotation);
    const x = state.extraction;
    if (!x) return `${pageHeading("EXTRACTION", "信号提取", "需要先选择一个宽带 TF ROI。", `<a class="btn btn-primary" href="#/annotation">返回宽带标注</a>`)}<div class="empty-state">暂无可提取 ROI。</div>`;
    return `${pageHeading("EXTRACTION / DDC + FILTER + RESAMPLE", "从宽带 ROI 提取窄带信号", "把选定的时频区域转换为可进入窄带识别的 ExtractedSignal mock，并完整保留来源血缘。", `<a class="btn" href="#/annotation">返回标注</a>${button("确认并进入窄带详情", "confirm-extraction", "btn-primary")}`)}
      <div class="extract-stepper"><div class="extract-step active">01 · Selected ROI</div><div class="extract-step active">02 · DDC</div><div class="extract-step active">03 · Filter</div><div class="extract-step active">04 · Resample</div></div>
      <div class="extraction-grid"><div class="left-stack"><div class="card roi-preview"><div class="card-header"><div><h2 class="card-title">Selected ROI Preview</h2><div class="card-subtitle">${esc(x.annotationId)} · ${esc(x.sourceSignal)}</div></div><span class="chip chip-accent">RF coordinate locked</span></div><div class="tf-wrap">${tfSvg("annotations")}<div class="tf-caption"><span>时间 ${fmtMs(x.tStart)}–${fmtMs(x.tEnd)} ms</span><span>频率 ${fmtMHz(x.fLow)}–${fmtMHz(x.fHigh)} MHz</span></div></div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Extraction Lineage</h2><div class="card-subtitle">生成后可追溯 Raw IQ 和 STFT 版本</div></div></div><div class="card-body"><div class="lineage"><span class="lineage-node current">WidebandScene<br><small>${esc(state.scene.id)}</small></span><span class="lineage-arrow">→</span><span class="lineage-node current">Detection / ROI<br><small>${esc(x.annotationId)}</small></span><span class="lineage-arrow">→</span><span class="lineage-node">ExtractedSignal</span><span class="lineage-arrow">→</span><span class="lineage-node">Narrowband Analysis</span></div></div></div></div><div class="stack"><div class="card"><div class="card-header"><div><h2 class="card-title">DDC / Filter / Resample</h2><div class="card-subtitle">参数会写入 ExtractedSignal provenance</div></div></div><div class="card-body"><div class="form-grid"><div class="field"><label>ROI 起始时间 <span>s</span></label><input class="input" type="number" step="any" data-extraction="tStart" value="${x.tStart}"></div><div class="field"><label>ROI 结束时间 <span>s</span></label><input class="input" type="number" step="any" data-extraction="tEnd" value="${x.tEnd}"></div><div class="field"><label>RF 低频边界 <span>Hz</span></label><input class="input" type="number" data-extraction="fLow" value="${x.fLow}"></div><div class="field"><label>RF 高频边界 <span>Hz</span></label><input class="input" type="number" data-extraction="fHigh" value="${x.fHigh}"></div><div class="field field-full"><label>目标中心频率 <span>Hz</span></label><input class="input" type="number" data-extraction="targetCenter" value="${x.targetCenter}"></div><div class="field"><label>DDC Offset <span>Hz</span></label><input class="input" value="${x.ddcOffset.toFixed(0)}" disabled></div><div class="field"><label>滤波器类型</label><select class="select" data-extraction="filterType"><option>FIR low-pass</option><option>FIR band-pass</option><option>Polyphase channelizer</option></select></div><div class="field"><label>滤波带宽 <span>Hz</span></label><input class="input" type="number" data-extraction="filterBandwidth" value="${x.filterBandwidth}"></div><div class="field field-full"><label>输出采样率 <span>sps</span></label><input class="input" type="number" data-extraction="outputFs" value="${x.outputFs}"></div></div><div class="helper mt-14">当前建议输出 Fs = max(2 MHz, 2.5 × extraction bandwidth)，此处仅为 mock 参数推导。</div></div></div><div class="card"><div class="card-body"><button class="btn btn-primary" style="width:100%" data-action="confirm-extraction">生成 ExtractedSignal</button></div></div></div></div>`;
  }

  function renderNarrowband() {
    if (!state.extracted) return `${pageHeading("NARROWBAND ANALYSIS", "窄带信号详情", "窄带分析只在宽带 ROI 完成 DDC、滤波和重采样后出现。", `<a class="btn btn-primary" href="#/annotation">选择宽带 ROI</a>`)}<div class="empty-state">尚未生成 ExtractedSignal。请从宽带场景的检测/标注结果进入信号提取。</div>`;
    const e = state.extracted;
    return `${pageHeading("NARROWBAND ANALYSIS / EXTRACTED SIGNAL", "窄带信号详情", "这是宽带 ROI 提取后的窄带视图；可在此查看波形、频谱、星座、眼图及识别结果。", `<a class="btn" href="#/extraction">查看提取参数</a><a class="btn btn-primary" href="#/scene-detail">返回宽带场景</a>`)}
      <div class="notice"><strong>来源：</strong> WidebandScene ${esc(e.source_scene_id)} → Detection/ROI ${esc(e.source_annotation_id)} → ExtractedSignal ${esc(e.id)}。所有结果均为原型模拟数据。</div>
      <div class="card mt-14"><div class="card-header"><div><h2 class="card-title">ExtractedSignal Metadata</h2><div class="card-subtitle">可追溯的 DDC / Filter / Resample 快照</div></div><span class="chip chip-accent">${esc(e.id)}</span></div><div class="card-body"><div class="config-list"><div class="config-row"><label>来源 Scene / ROI</label><strong>${esc(e.source_scene_id)} / ${esc(e.source_annotation_id)}</strong></div><div class="config-row"><label>RF 中心频率</label><strong>${fmtMHz(e.rf_center_frequency_hz)} MHz</strong></div><div class="config-row"><label>Source time range</label><strong>${fmtMs(e.source_time_range[0])}–${fmtMs(e.source_time_range[1])} ms</strong></div><div class="config-row"><label>Extraction bandwidth</label><strong>${fmtMHz(e.extraction_bandwidth_hz)} MHz</strong></div><div class="config-row"><label>DDC offset</label><strong>${fmtMHz(e.ddc_offset_hz)} MHz</strong></div><div class="config-row"><label>Output Fs</label><strong>${(e.output_sampling_rate_sps / 1000000).toFixed(2)} Msps</strong></div><div class="config-row"><label>Filter</label><strong>${esc(e.filter_type)} / ${fmtMHz(e.filter_bandwidth_hz)} MHz</strong></div></div></div></div>
      <div class="signal-preview-grid mt-14"><div class="card preview-wide"><div class="card-header"><div><h2 class="card-title">Time Waveform</h2><div class="card-subtitle">Extracted narrowband complex IQ · mock</div></div></div><div class="card-body">${waveformSvg()}</div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Spectrum</h2><div class="card-subtitle">基带频谱</div></div></div><div class="card-body">${spectrumSvg()}</div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Spectrogram</h2><div class="card-subtitle">提取后的时频细节</div></div></div><div class="tf-wrap">${tfSvg("annotations")}</div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Constellation</h2><div class="card-subtitle">仅在窄带分析阶段展示</div></div></div><div class="card-body">${constellationSvg()}</div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Eye Diagram</h2><div class="card-subtitle">仅在窄带分析阶段展示</div></div></div><div class="card-body">${eyeSvg()}</div></div></div>
      <div class="card mt-14"><div class="card-header"><div><h2 class="card-title">Recognition / Estimation</h2><div class="card-subtitle">下游窄带识别 mock 结果</div></div><span class="status-badge">模拟结果</span></div><div class="card-body"><div class="grid grid-4"><div class="stat-box"><label>调制识别</label><strong>QPSK</strong></div><div class="stat-box"><label>协议候选</label><strong>自定义遥测</strong></div><div class="stat-box"><label>识别置信度</label><strong class="metric-accent">93.4<span> %</span></strong></div><div class="stat-box"><label>频率估计误差</label><strong>18.4<span> kHz</span></strong></div></div></div></div>`;
  }

  function renderDataSources() {
    return `${pageHeading("DATA ASSETS", "数据源管理", "数据源同时承载 Raw IQ、实测背景和参数化生成来源，供 WidebandScene 建立可追溯引用。", `<a class="btn btn-primary" href="#/scene-builder">从数据源创建场景</a>`)}<div class="grid grid-4">${metric("Raw IQ 来源", "18", "个", "实测与导入采集", "metric-accent")}${metric("噪底记录", "06", "份", "Noise Floor reference", "metric-warning")}${metric("参数化模板", "24", "个", "多信号实例模板", "metric-violet")}${metric("可用容量", "4.3", "GB", "本地原型资产索引", "metric-accent")}</div><div class="card mt-14"><div class="card-header"><div><h2 class="card-title">数据源目录</h2><div class="card-subtitle">V1 数据资产概念在 V2 中补充 Scene / Raw IQ 关系</div></div><span class="chip">4 sources</span></div><div class="card-body" style="padding:0;overflow:auto"><table class="data-table"><thead><tr><th>名称</th><th>类型</th><th>采样率</th><th>带宽</th><th>格式</th><th>背景 / 标签</th><th>状态</th></tr></thead><tbody><tr><td>NOISE-FLOOR-ALASHAN-051</td><td><span class="chip chip-warning">recorded background</span></td><td>80 Msps</td><td>60 MHz</td><td>complex64</td><td>Noise PSD / no labels</td><td>已索引</td></tr><tr><td>机场遥测仿真源</td><td><span class="chip chip-accent">simulated</span></td><td>80 Msps</td><td>60 MHz</td><td>complex64</td><td>class-map-v3.1</td><td>可用</td></tr><tr><td>北区实测宽带采集-02</td><td><span class="chip">measured</span></td><td>100 Msps</td><td>80 MHz</td><td>int16 IQ</td><td>人工校验 82%</td><td>可用</td></tr><tr><td>频段混合导入-09</td><td><span class="chip">imported</span></td><td>50 Msps</td><td>40 MHz</td><td>complex64</td><td>待标注</td><td>已索引</td></tr></tbody></table></div></div>`;
  }

  function renderSampleSets() {
    return `${pageHeading("DATA ASSETS / COLLECTIONS", "样本集管理", "统一查看窄带识别集与宽带 Detection Dataset；宽带样本集保留 Scene、TF Tile 与 Annotation 关系。", `<a class="btn" href="#/data-sources">查看数据源</a><a class="btn btn-primary" href="#/dataset">打开 Detection Dataset</a>`)}<div class="grid grid-4">${metric("宽带场景集", "03", "个", "按 WidebandScene 组织", "metric-accent")}${metric("检测样本集", "01", "个", "当前 v0.8.2", "metric-violet")}${metric("窄带识别集", "08", "个", "保留 V1 资产边界", "metric-warning")}${metric("待标注场景", "12", "个", "可进入宽带标注", "metric-accent")}</div><div class="card mt-14"><div class="card-header"><div><h2 class="card-title">样本集目录</h2><div class="card-subtitle">集合级入口与专用数据类型</div></div><button class="btn btn-primary btn-sm" data-action="create-dataset">新建宽带检测集</button></div><div class="card-body" style="padding:0;overflow:auto"><table class="data-table"><thead><tr><th>样本集</th><th>类型</th><th>版本</th><th>Scenes / Samples</th><th>标注</th><th>血缘状态</th><th>操作</th></tr></thead><tbody><tr><td><strong>机场宽带时频检测集</strong><div class="faint tiny">DS-TF-2026-003</div></td><td><span class="chip chip-accent">DetectionDataset</span></td><td>v0.8.2</td><td>128 / 18,432 tiles</td><td>38,976</td><td>TF / Raw IQ 已追溯</td><td><a class="table-action" href="#/dataset">查看</a></td></tr><tr><td><strong>窄带调制识别基线</strong><div class="faint tiny">NB-REC-2026-011</div></td><td><span class="chip">NarrowbandRecognition</span></td><td>v1.4.0</td><td>8 / 64,200 files</td><td>64,200</td><td>V1 资产保留</td><td><a class="table-action" href="../样本集管理.html">V1 详情</a></td></tr><tr><td><strong>开放集候选场景</strong><div class="faint tiny">DS-TF-2026-004</div></td><td><span class="chip chip-warning">DetectionDataset</span></td><td>v0.2.1</td><td>32 / 4,096 tiles</td><td>7,810</td><td>unknown 37%</td><td><a class="table-action" href="#/annotation">进入标注</a></td></tr></tbody></table></div></div>`;
  }

  function distributionCard(title, items, colors) {
    return `<div class="card"><div class="card-header"><div><h2 class="card-title">${esc(title)}</h2><div class="card-subtitle">dataset distribution · mock</div></div></div><div class="card-body distribution">${items.map((item, index) => `<div class="distribution-row"><span>${esc(item.label)}</span><span class="bar ${colors && colors[index] ? colors[index] : ""}"><span style="width:${item.value}%"></span></span><strong>${item.value}%</strong></div>`).join("")}</div></div>`;
  }

  function renderDataset() {
    const d = source.Dataset;
    return `${pageHeading("DATA ASSETS / DETECTION", "Detection Dataset", "专用于宽带时频检测的数据集版本，保留每个 Tile 与 TFRepresentation、Raw IQ、WidebandScene 的坐标映射。", `<a class="btn" href="#/annotation">查看标注</a><a class="btn btn-primary" href="#/training">创建训练任务</a>`)}<div class="dataset-hero"><div class="dataset-hero-main"><div class="eyebrow">DETECTION DATASET</div><h2>${esc(d.name)}</h2><p>${esc(d.id)} · dataset version ${esc(d.version)} · parent scenes ${d.parent_scenes.length}</p></div><div class="hero-stat"><label>Scenes</label><strong>${d.scene_count}</strong></div><div class="hero-stat"><label>TF Tiles</label><strong>${d.tile_count.toLocaleString()}</strong></div><div class="hero-stat"><label>Annotations</label><strong>${d.annotation_count.toLocaleString()}</strong></div></div><div class="grid grid-4 mt-14">${metric("Known", fmtPct(d.known_ratio), "", "已知类别标注", "metric-accent")}${metric("Unknown", fmtPct(d.unknown_ratio), "", "开放集候选", "metric-warning")}${metric("Tile Size", d.tile_size, "", "时频输入尺寸", "metric-violet")}${metric("Split", "70 / 15 / 15", "", "train / val / test", "metric-accent")}</div><div class="detail-grid mt-14"><div class="left-stack"><div class="card"><div class="card-header"><div><h2 class="card-title">Data Lineage</h2><div class="card-subtitle">Dataset sample coordinate trace</div></div></div><div class="card-body"><div class="lineage"><span class="lineage-node current">Tile<br><small>512 × 256</small></span><span class="lineage-arrow">→</span><span class="lineage-node current">TFRepresentation<br><small>${esc(d.stft_config)}</small></span><span class="lineage-arrow">→</span><span class="lineage-node current">Raw IQ<br><small>sample offset / Fs</small></span><span class="lineage-arrow">→</span><span class="lineage-node current">WidebandScene<br><small>${esc(d.parent_scenes[0])}</small></span></div><div class="code-block mt-14">dataset_version: ${esc(d.version)}\nannotation_schema: ${esc(d.annotation_schema)}\nclass_mapping: ${esc(d.class_mapping)}\nparent_scenes: ${d.parent_scenes.join(", ")}</div></div></div><div class="grid grid-2">${distributionCard("类别分布", d.distributions.classes, ["", "cyan", "warm", "violet", "warm"])}${distributionCard("CNR 分布", d.distributions.cnr, ["warm", "", "cyan", "violet"])}${distributionCard("带宽分布", d.distributions.bandwidth, ["violet", "cyan", "", "warm"])}${distributionCard("持续时间分布", d.distributions.duration, ["warm", "", "cyan", "violet"])}</div></div><div class="stack"><div class="card"><div class="card-header"><div><h2 class="card-title">STFT Config</h2><div class="card-subtitle">进入训练和评测的版本快照</div></div><span class="chip chip-accent">${esc(d.version)}</span></div><div class="card-body"><div class="config-list">${[["Representation", "Spectrogram / PSD"],["FFT Length", "4096"],["Window", "Blackman-Harris"],["Overlap", "75% · Hop 1024"],["Frequency Resolution", "19.53 kHz"],["Tile Size", d.tile_size],["Version", d.stft_config.split(" /")[0]]].map((row) => `<div class="config-row"><label>${row[0]}</label><strong>${esc(row[1])}</strong></div>`).join("")}</div></div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Split & Version</h2><div class="card-subtitle">可复现数据切分</div></div></div><div class="card-body"><div class="version-box"><div><strong>v0.8.2</strong><span> · current</span></div><span>2026-09-04</span></div><div class="stats-grid mt-14"><div class="stat-box"><label>Train</label><strong>70<span>%</span></strong></div><div class="stat-box"><label>Val</label><strong>15<span>%</span></strong></div><div class="stat-box"><label>Test</label><strong>15<span>%</span></strong></div><div class="stat-box"><label>Classes</label><strong>24<span> 类</span></strong></div></div></div></div></div></div>`;
  }

  function renderTraining() {
    const types = [["classification", "Classification", "窄带识别分类"], ["open-set", "Open-set Classification", "未知类识别"], ["detection", "Time-Frequency Detection", "TF 实例检测"], ["segmentation", "Segmentation", "谱图像素分割"], ["tracking", "Tracking", "多片段关联"], ["parameter", "Parameter Estimation", "频率/带宽/时间估计"]];
    const detection = state.taskType === "detection" || state.taskType === "segmentation" || state.taskType === "tracking" || state.taskType === "parameter";
    return `${pageHeading("MODEL R&D / TRAINING", "训练任务", "任务类型决定数据表达和专用参数；宽带检测不复用窄带分类训练表单。", `${button("取消", "back-workbench", "btn")}${button("创建并查看实验", "create-experiment", "btn-primary")}`)}<div class="training-layout"><div class="card"><div class="card-header"><div><h2 class="card-title">Task Type</h2><div class="card-subtitle">选择后加载对应的训练配置</div></div><span class="chip chip-accent">${esc(state.taskType)}</span></div><div class="card-body"><div class="task-type-grid">${types.map((type) => `<div class="task-type ${state.taskType === type[0] ? "selected" : ""}" data-action="select-task" data-type="${type[0]}"><strong>${type[1]}</strong><span>${type[2]}</span></div>`).join("")}</div><div class="section-divider">Dataset & Representation</div><div class="form-grid-3"><div class="field"><label>Dataset Version</label><select class="select"><option>DS-TF-2026-003 / v0.8.2</option><option>DS-TF-2026-002 / v0.7.4</option></select></div><div class="field"><label>Input Representation</label><select class="select"><option>Spectrogram / PSD</option><option>Raw IQ tile</option><option>Multi-scale TF</option></select></div><div class="field"><label>Tile / Input Size</label><select class="select"><option>512 × 256</option><option>1024 × 512</option></select></div></div>${detection ? `<div class="section-divider">Detection-specific Configuration</div><div class="form-grid-3"><div class="field"><label>Detector Family</label><select class="select"><option>Anchor-based TF detector</option><option>Anchor-free center detector</option><option>Segmentation encoder-decoder</option></select></div><div class="field"><label>IoU Threshold</label><input class="input" type="number" step="0.01" value="0.50"></div><div class="field"><label>NMS Threshold</label><input class="input" type="number" step="0.01" value="0.45"></div><div class="field"><label>Detection Loss</label><select class="select"><option>GIoU + BCE + Focal</option><option>Focal + L1</option></select></div><div class="field"><label>Class Mapping</label><select class="select"><option>class-map-v3.1 / 24 classes</option><option>class-map-open-v1.2</option></select></div><div class="field"><label>Augmentation</label><select class="select"><option>time shift + freq shift + noise</option><option>mixup + cutout + noise</option></select></div></div>` : ""}<div class="section-divider">General Optimization</div><div class="form-grid-3"><div class="field"><label>Optimizer</label><select class="select"><option>AdamW</option><option>SGD + momentum</option></select></div><div class="field"><label>Learning Rate</label><input class="input" value="1e-4"></div><div class="field"><label>Scheduler</label><select class="select"><option>Cosine decay</option><option>OneCycle</option></select></div></div></div></div><div class="stack"><div class="card"><div class="card-header"><div><h2 class="card-title">Task Summary</h2><div class="card-subtitle">提交前检查</div></div></div><div class="card-body"><div class="config-list"><div class="config-row"><label>Task type</label><strong class="accent">${types.find((type) => type[0] === state.taskType)[1]}</strong></div><div class="config-row"><label>Dataset</label><strong>DS-TF-2026-003</strong></div><div class="config-row"><label>Input</label><strong>Spectrogram / 512 × 256</strong></div><div class="config-row"><label>Metrics</label><strong>mAP · IoU · Pd/Pfa</strong></div></div><button class="btn btn-primary mt-14" style="width:100%" data-action="create-experiment">创建训练实验</button></div></div><div class="card"><div class="card-header"><div><h2 class="card-title">最近任务</h2><div class="card-subtitle">同一数据版本的可追溯实验</div></div></div><div class="card-body"><div class="version-box"><div><strong>WB-TRAIN-018</strong><span> · TF-Detector</span></div><span class="chip chip-warning">训练中</span></div><div class="progress mt-14"><span style="width:68%"></span></div><div class="helper">epoch 68 / 100 · val mAP 0.846</div></div></div></div></div>`;
  }

  function renderExperiment() {
    return `${pageHeading("MODEL R&D / EXPERIMENT", "实验详情", "训练任务、数据集版本和宽带专用检测参数在此汇总，结果可进入模型注册与评测。", `<a class="btn" href="#/training">返回训练任务</a><a class="btn btn-primary" href="#/models">查看模型管理</a>`)}<div class="notice"><strong>Experiment WB-EXP-018：</strong> ${esc(state.taskType)} 任务使用 Detection Dataset v0.8.2；以下曲线与数值均为 mock，不代表真实训练完成。</div><div class="grid grid-4 mt-14">${metric("Epoch", "68 / 100", "", "Cosine decay", "metric-accent")}${metric("Val mAP", "0.846", "", "IoU threshold 0.50", "metric-accent")}${metric("Val IoU", "0.781", "", "TF box overlap", "metric-warning")}${metric("GPU 状态", "Mock", "", "未连接真实训练后端", "metric-violet")}</div><div class="detail-grid mt-14"><div class="left-stack"><div class="card"><div class="card-header"><div><h2 class="card-title">Training Progress</h2><div class="card-subtitle">Detection loss / mAP mock history</div></div><span class="status-badge">进行中</span></div><div class="card-body">${lineChart("Validation mAP", "", [.51,.58,.63,.68,.72,.75,.79,.81,.83,.846], ["10","20","30","40","50","60","68"], "#22c7a5")}</div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Experiment Provenance</h2><div class="card-subtitle">训练输入和检测配置</div></div></div><div class="card-body"><div class="lineage"><span class="lineage-node current">Dataset v0.8.2</span><span class="lineage-arrow">→</span><span class="lineage-node current">TF Detector</span><span class="lineage-arrow">→</span><span class="lineage-node">Model Candidate</span></div><div class="code-block mt-14">representation: spectrogram / PSD\ntile_size: 512 × 256\niou_threshold: 0.50\nnms_threshold: 0.45\nloss: GIoU + BCE + Focal\naugmentation: time/frequency shift + noise</div></div></div></div><div class="stack"><div class="card"><div class="card-header"><div><h2 class="card-title">Output Artifacts</h2><div class="card-subtitle">实验输出</div></div></div><div class="card-body"><div class="config-list">${[["Checkpoint", "tf-detector-epoch068.pt"],["Export candidate", "TF-Detector-AnchorV2.onnx"],["Logs", "WB-EXP-018 / metrics.json"],["Dataset", "DS-TF-2026-003 v0.8.2"]].map((row) => `<div class="config-row"><label>${row[0]}</label><strong>${row[1]}</strong></div>`).join("")}</div><a class="btn btn-primary mt-14" href="#/models">注册模型候选</a></div></div><div class="card"><div class="card-header"><div><h2 class="card-title">Next Step</h2><div class="card-subtitle">模型通过评测后进入注册</div></div></div><div class="card-body"><a class="btn" href="#/evaluation">打开宽带检测评测</a></div></div></div></div>`;
  }

  function renderModels() {
    const models = source.Model;
    const types = ["Spectrum Occupancy", "Signal Detection", "Spectrogram Segmentation", "Signal Tracking", "Parameter Estimation", "Modulation Recognition", "Protocol Recognition", "Emitter Recognition", "Open-set Recognition"];
    return `${pageHeading("MODEL R&D / REGISTRY", "模型管理", "模型注册区分宽带频谱占用、检测、分割、跟踪、参数估计与窄带识别，不虚构真实部署能力。", `<a class="btn" href="#/experiment">查看实验</a><a class="btn btn-primary" href="#/evaluation">进入评测</a>`)}<div class="card"><div class="card-header"><div><h2 class="card-title">Model Registry</h2><div class="card-subtitle">PyTorch / ONNX / TensorRT 仅表示原型资产形态</div></div><span class="chip chip-accent">${models.length} registered</span></div><div class="card-body" style="padding:0;overflow:auto"><table class="data-table"><thead><tr><th>模型</th><th>类型</th><th>格式</th><th>训练数据</th><th>状态</th><th>主指标</th><th>操作</th></tr></thead><tbody>${models.map((model) => `<tr><td><strong>${esc(model.name)}</strong><div class="faint tiny">${esc(model.id)}</div></td><td><span class="chip ${model.type.includes("Recognition") ? "" : "chip-accent"}">${esc(model.type)}</span></td><td>${esc(model.format)}</td><td>${esc(model.dataset)}</td><td>${esc(model.status)}</td><td>${esc(model.score)}</td><td><span class="table-action" data-action="view-model" data-id="${esc(model.id)}">查看</span></td></tr>`).join("")}</tbody></table></div></div><div class="card mt-14"><div class="card-header"><div><h2 class="card-title">Supported Model Types</h2><div class="card-subtitle">宽带类型与原有窄带识别类型并列但边界清晰</div></div></div><div class="card-body"><div class="chip-list">${types.map((type) => `<span class="chip ${type.includes("Recognition") ? "" : "chip-accent"}">${type}</span>`).join("")}</div></div></div>`;
  }

  function renderEvaluation() {
    const e = source.Evaluation;
    const m = e.metrics;
    return `${pageHeading("EVALUATION / WIDEBAND DETECTION", "宽带检测评测", "围绕检出概率、虚警率、几何重叠和边界误差评估模型；所有结果均明确标注为原型模拟数据。", `<a class="btn" href="#/models">选择模型</a><a class="btn btn-primary" href="#/training">新建评测任务</a>`)}<div class="alert-strip">原型模拟数据 · Model ${esc(e.model)} · Dataset ${esc(e.dataset)} · 评测 ID ${esc(e.id)}</div><div class="eval-overview mt-14">${[["Pd", fmtPct(m.Pd), "检出概率"],["Pfa", fmtPct(m.Pfa), "虚警率"],["Precision", fmtPct(m.Precision), "精确率"],["Recall", fmtPct(m.Recall), "召回率"],["F1", fmtPct(m.F1), "检测 F1"],["AP / mAP", m.mAP.toFixed(3), "IoU@0.50"]].map((item) => `<div class="eval-metric"><label>${item[0]}</label><strong>${item[1]}</strong><small>${item[2]}</small></div>`).join("")}</div><div class="card mt-14"><div class="card-header"><div><h2 class="card-title">Estimation Errors</h2><div class="card-subtitle">检测边界与信号参数估计误差</div></div><span class="chip chip-warning">lower is better</span></div><div class="card-body"><div class="grid grid-3"><div class="stat-box"><label>Center Frequency Error</label><strong>${m.centerError.toFixed(1)}<span> kHz</span></strong></div><div class="stat-box"><label>Bandwidth Error</label><strong>${m.bandwidthError.toFixed(2)}<span> MHz</span></strong></div><div class="stat-box"><label>Time Boundary Error</label><strong>${m.timeError.toFixed(2)}<span> ms</span></strong></div></div></div></div><div class="chart-grid mt-14">${lineChart("Pd vs SNR / CNR", "", [.62,.74,.83,.89,.914,.925], ["0","5","10","15","20","30 dB"], "#22c7a5")}${lineChart("Pd vs Bandwidth", "", [.71,.79,.86,.914,.90], ["1","2","5","10","20 MHz"], "#55c9df")}${lineChart("Pd vs Duration", "", [.63,.74,.85,.914,.92], ["1","2","5","10","20 ms"], "#e4ae5c")}${lineChart("Pd vs Signal Count", "", [.93,.92,.914,.88,.82], ["1","2","4","8","12"], "#9a8be8")}${lineChart("Pd vs Occupancy", "", [.95,.93,.914,.87,.78], ["10","20","40","60","80%"], "#22c7a5")}${lineChart("Pd vs Frequency Separation", "", [.78,.84,.89,.914,.92], ["0",".5","1","2","5 MHz"], "#55c9df")}${lineChart("Pd vs Power Difference", "", [.79,.85,.89,.914,.92], ["0","3","6","10","20 dB"], "#e4ae5c")}${lineChart("IoU / threshold sweep", "", [.61,.72,.781,.77,.73], [".3",".4",".5",".6",".7"], "#9a8be8")}</div>`;
  }

  function render(route) {
    try {
      if (state.booting) {
        view.innerHTML = `<div class="card"><div class="card-body"><div class="loading-skeleton"></div><div class="loading-skeleton mt-14" style="width:42%"></div><div class="loading-skeleton mt-14" style="width:82%;height:180px"></div></div></div>`;
      } else {
        const pages = { "/": renderWorkbench, "/data-sources": renderDataSources, "/sample-sets": renderSampleSets, "/dataset": renderDataset, "/scene-detail": renderSceneDetail, "/scene-builder": renderBuilder, "/annotation": renderAnnotation, "/training": renderTraining, "/experiment": renderExperiment, "/models": renderModels, "/evaluation": renderEvaluation, "/extraction": renderExtraction, "/narrowband": renderNarrowband };
        view.innerHTML = (pages[route] || renderWorkbench)();
      }
      window.scrollTo(0, 0);
      const title = routeTitles[route] || "工作台";
      document.getElementById("breadcrumb-current").textContent = title;
      document.querySelectorAll("[data-nav]").forEach((item) => item.classList.toggle("active", item.dataset.nav === route));
      bindTfDragging();
    } catch (error) {
      view.innerHTML = `<div class="card"><div class="card-body"><div class="alert-strip">页面渲染异常：${esc(error.message)}。请返回工作台重试。</div><a class="btn btn-primary mt-14" href="#/">返回工作台</a></div></div>`;
      showToast("页面渲染异常", "error");
    }
  }

  function bindTfDragging() {
    document.querySelectorAll("[data-tf-signal]").forEach((node) => {
      node.addEventListener("click", () => {
        state.selectedSignalId = node.dataset.tfSignal;
        render(getRoute());
      });
      node.addEventListener("pointerdown", (event) => {
        const signal = state.scene.signal_instances.find((item) => item.id === node.dataset.tfSignal);
        if (!signal || getRoute() !== "/scene-builder") return;
        const svg = node.closest("svg");
        const rect = svg.getBoundingClientRect();
        const initialX = event.clientX;
        const initialY = event.clientY;
        const originalTime = signal.start_time_s;
        const originalFreq = signal.center_frequency_hz;
        const bounds = sceneBounds();
        const move = (moveEvent) => {
          const dx = (moveEvent.clientX - initialX) / rect.width * state.scene.duration_s;
          const dy = (moveEvent.clientY - initialY) / rect.height * bounds.span;
          signal.start_time_s = Math.max(0, Math.min(state.scene.duration_s - signal.duration_s, originalTime + dx));
          signal.center_frequency_hz = Math.max(bounds.min + signal.occupied_bandwidth_hz / 2, Math.min(bounds.max - signal.occupied_bandwidth_hz / 2, originalFreq - dy));
          render(getRoute());
        };
        const up = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); showToast(`${signal.id} 已更新时频位置`); };
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up, { once: true });
      });
    });
  }

  function findSignal(id) { return state.scene.signal_instances.find((item) => item.id === id); }
  function findAnnotation(id) { return state.annotations.find((item) => item.id === id); }

  function handleAction(element) {
    const action = element.dataset.action;
    const id = element.dataset.id;
    if (action === "select-signal") { state.selectedSignalId = id; render(getRoute()); return; }
    if (action === "add-signal") {
      const index = state.scene.signal_instances.length + 1;
      const signal = { id: `SIG-${String(index).padStart(3, "0")}`, scene_id: state.scene.id, source_type: "simulated", class_label: `新建信号实例 ${index}`, modulation: "QPSK", protocol: "待配置", behavior: "burst", center_frequency_hz: state.scene.rf_center_frequency_hz, occupied_bandwidth_hz: 2000000, start_time_s: .003, duration_s: .006, received_power_dbm: -70, cnr_db: 20, snr_db: 17, symbol_rate_baud: 1000000, frequency_offset_hz: 0, channel_model: "AWGN", track_id: `TRK-${String(index).padStart(3, "0")}` };
      state.scene.signal_instances.push(signal); state.selectedSignalId = signal.id; render(getRoute()); showToast("已添加 SignalInstance"); return;
    }
    if (action === "remove-signal") {
      if (state.scene.signal_instances.length <= 1) { showToast("场景至少保留一个 SignalInstance", "error"); return; }
      state.scene.signal_instances = state.scene.signal_instances.filter((item) => item.id !== id); state.selectedSignalId = state.scene.signal_instances[0].id; render(getRoute()); showToast("已删除 SignalInstance"); return;
    }
    if (action === "apply-randomization") {
      const signals = state.scene.signal_instances;
      if (state.randomization.signalCount && signals.length === 5) {
        signals.push({ id: "SIG-006", scene_id: state.scene.id, source_type: "simulated", class_label: "随机候选 / unknown", modulation: "BPSK", protocol: "未知协议", behavior: "burst", center_frequency_hz: 2450000000, occupied_bandwidth_hz: 1800000, start_time_s: .003, duration_s: .004, received_power_dbm: -74, cnr_db: 18, snr_db: 15, symbol_rate_baud: 900000, frequency_offset_hz: 0, channel_model: "AWGN", track_id: "TRK-006" });
      }
      signals.forEach((signal, index) => {
        if (state.randomization.carrier) signal.center_frequency_hz += (index % 2 ? 1 : -1) * 200000;
        if (state.randomization.startTime) signal.start_time_s = Math.min(state.scene.duration_s - signal.duration_s, Math.max(0, (index + 1) * .0011));
        if (state.randomization.duration) signal.duration_s = Math.max(.002, Math.min(state.scene.duration_s - signal.start_time_s, signal.duration_s * (index % 2 ? 1.12 : .88)));
        if (state.randomization.bandwidth) signal.occupied_bandwidth_hz = Math.max(500000, signal.occupied_bandwidth_hz * (index % 2 ? 1.15 : .86));
        if (state.randomization.power) { signal.received_power_dbm += index % 2 ? 2 : -2; signal.cnr_db += index % 2 ? 1 : -1; }
        if (state.randomization.classType) { const classes = ["QPSK / telemetry", "4FSK / beacon", "OFDM / adjacent channel", "FHSS / control"]; const mods = ["QPSK", "4FSK", "OFDM", "GFSK"]; signal.class_label = classes[index % classes.length]; signal.modulation = mods[index % mods.length]; }
      });
      if (state.randomization.overlap && signals.length > 1) signals[signals.length - 1].center_frequency_hz = signals[0].center_frequency_hz + (signals[0].occupied_bandwidth_hz + signals[signals.length - 1].occupied_bandwidth_hz) * .24;
      if (state.randomization.occupancy && signals.length) signals[0].occupied_bandwidth_hz = Math.min(state.scene.receiver_bandwidth_hz * .28, signals[0].occupied_bandwidth_hz * 1.25);
      render(getRoute()); showToast("已应用独立随机化维度"); return;
    }
    if (action === "save-scene") { showToast("WidebandScene 参数已保存到 mock 版本"); navigate("/scene-detail"); return; }
    if (action === "go-annotation") { navigate("/annotation"); return; }
    if (action === "make-annotation") { const signal = findSignal(id); if (signal) { let annotation = state.annotations.find((item) => item.signal_instance_id === id); if (!annotation) { annotation = { id: `ANN-${String(state.annotations.length + 1).padStart(3, "0")}`, scene_id: state.scene.id, signal_instance_id: id, t_start_s: signal.start_time_s, t_end_s: signal.start_time_s + signal.duration_s, f_low_hz: signal.center_frequency_hz - signal.occupied_bandwidth_hz / 2, f_high_hz: signal.center_frequency_hz + signal.occupied_bandwidth_hz / 2, class_label: signal.class_label, known_state: "known", confidence: .9, source: "manual", track_id: signal.track_id }; state.annotations.push(annotation); } state.selectedAnnotationId = annotation.id; navigate("/annotation"); } return; }
    if (action === "auto-annotate") {
      state.scene.signal_instances.forEach((signal) => { if (!state.annotations.some((item) => item.signal_instance_id === signal.id)) state.annotations.push({ id: `ANN-${String(state.annotations.length + 1).padStart(3, "0")}`, scene_id: state.scene.id, signal_instance_id: signal.id, t_start_s: signal.start_time_s, t_end_s: signal.start_time_s + signal.duration_s, f_low_hz: signal.center_frequency_hz - signal.occupied_bandwidth_hz / 2, f_high_hz: signal.center_frequency_hz + signal.occupied_bandwidth_hz / 2, class_label: signal.class_label, known_state: "unknown", confidence: .78, source: "auto", track_id: signal.track_id }); });
      render(getRoute()); showToast("已生成自动预标注 mock"); return;
    }
    if (action === "select-annotation") { state.selectedAnnotationId = id; render(getRoute()); return; }
    if (action === "open-extraction") { state.selectedAnnotationId = id; initializeExtraction(findAnnotation(id)); navigate("/extraction"); return; }
    if (action === "save-annotations") { showToast("标注版本 ANN-v0.3 已保存"); return; }
    if (action === "create-dataset") { showToast("Detection Dataset 草稿已创建"); navigate("/dataset"); return; }
    if (action === "confirm-extraction") {
      const x = state.extraction || (initializeExtraction(getSelectedAnnotation()), state.extraction);
      if (!x) { showToast("请先选择 ROI", "error"); return; }
      state.extracted = { id: `EXT-${Date.now().toString().slice(-6)}`, source_scene_id: state.scene.id, source_annotation_id: x.annotationId, rf_center_frequency_hz: Number(x.targetCenter), source_time_range: [Number(x.tStart), Number(x.tEnd)], extraction_bandwidth_hz: Number(x.filterBandwidth), ddc_offset_hz: Number(x.ddcOffset), output_sampling_rate_sps: Number(x.outputFs), filter_type: x.filterType, filter_bandwidth_hz: Number(x.filterBandwidth), provenance: { tf_version: state.scene.tf_config.version, raw_iq_ref: state.scene.provenance.raw_iq_ref } };
      source.ExtractedSignal = clone(state.extracted); showToast("ExtractedSignal mock 已生成"); navigate("/narrowband"); return;
    }
    if (action === "select-task") { state.taskType = element.dataset.type; render(getRoute()); return; }
    if (action === "create-experiment") { showToast("已创建宽带检测实验 mock"); navigate("/experiment"); return; }
    if (action === "back-workbench") { navigate("/"); return; }
    if (action === "view-model") { showToast(`已选择模型 ${id}`); navigate("/evaluation"); }
  }

  document.addEventListener("click", (event) => {
    const element = event.target.closest("[data-action]");
    if (element) { event.preventDefault(); handleAction(element); }
  });
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.dataset.random) { state.randomization[target.dataset.random] = target.checked; return; }
    if (target.dataset.scene) { state.scene[target.dataset.scene] = target.type === "number" ? Number(target.value) : target.value; render(getRoute()); return; }
    if (target.dataset.background) { state.scene.background[target.dataset.background] = target.type === "number" ? Number(target.value) : target.value; render(getRoute()); return; }
    if (target.dataset.instance) { const signal = findSignal(state.selectedSignalId); if (signal) signal[target.dataset.instance] = target.type === "number" ? Number(target.value) : target.value; render(getRoute()); return; }
    if (target.dataset.tf) { state.scene.tf_config[target.dataset.tf] = target.dataset.tf === "overlap_ratio" ? Number(target.value) / 100 : (target.type === "number" ? Number(target.value) : target.value); render(getRoute()); return; }
    if (target.dataset.annotation) { const annotation = findAnnotation(target.dataset.id); if (annotation) annotation[target.dataset.annotation] = target.type === "number" ? Number(target.value) : target.value; render(getRoute()); return; }
    if (target.dataset.extraction) { if (state.extraction) { state.extraction[target.dataset.extraction] = target.type === "number" ? Number(target.value) : target.value; state.extraction.ddcOffset = state.extraction.targetCenter - state.scene.rf_center_frequency_hz; if (target.dataset.extraction === "fLow" || target.dataset.extraction === "fHigh") state.extraction.filterBandwidth = state.extraction.fHigh - state.extraction.fLow; render(getRoute()); } }
  });
  window.addEventListener("hashchange", () => render(getRoute()));
  window.setTimeout(() => { state.booting = false; render(getRoute()); }, 160);
  render(getRoute());
}());
