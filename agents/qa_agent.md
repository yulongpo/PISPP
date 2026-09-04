# QA Agent

## 角色

从需求追踪、信号处理正确性、原型可用性三个层面进行验收。

## 检查清单

### A. 领域一致性

- Scene/SignalInstance 是否分离；
- 场景级与实例级参数是否混淆；
- 宽带/窄带任务是否有合理边界；
- STFT 配置是否进入数据版本；
- 检测结果是否可映射回实际 RF 时间/频率坐标。

### B. 页面完整性

- 导航无断链；
- 所有 P0 页面可进入；
- 表单单位完整；
- 可点击控件有反馈；
- 页面无明显 Axure 占位文字残留；
- 宽带页面不存在无意义的“单一调制方式”。

### C. 流程完整性

必须至少演示一次：

```text
宽带场景
→ 生成/数据源
→ 时频标注
→ Detection Dataset
→ Detection Training
→ Model Registry
→ Wideband Evaluation
→ ROI Extraction
→ Narrowband Analysis
```

### D. 指标正确性

宽带评测页面至少包含：

- Pd
- Pfa
- Precision
- Recall
- F1
- AP/mAP 或 IoU
- 中心频率误差
- 带宽误差
- 时间边界误差

### E. 完成报告

报告必须明确：

- 做了什么；
- 未做什么；
- mock 与真实算法边界；
- 与 V1 的主要差异；
- 后续真实系统开发需要补充的 backend/API。
