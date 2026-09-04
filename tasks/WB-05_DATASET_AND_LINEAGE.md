# WB-05 Dataset 与数据血缘

## 目标

建立 Detection Dataset，并确保可复现。

## 必须显示

- dataset type
- version
- parent scenes
- STFT config
- tile size
- annotation schema
- class mapping
- train/val/test
- distribution charts/cards

## 强制关系

`Tile → TFRepresentation → RawIQ → WidebandScene`

## 验收

满足 AC-06。

## 实施记录

- 完成内容：实现 Detection Dataset 页面，展示 dataset type、version、parent scenes、STFT config、tile size、annotation schema、class mapping、train/val/test、Known/Unknown、类别/CNR/带宽/持续时间分布，并以 Tile → TFRepresentation → Raw IQ → WidebandScene 展示血缘。
- 修改文件：`prototype_v2/assets/js/app.js`、`prototype_v2/assets/css/app.css`、`prototype_v2/assets/js/domain-data.js`、`tasks/task_manifest.yaml`。
- 验证方式：浏览器点击 Detection Dataset，确认 Data Lineage、TFRepresentation、WidebandScene、v0.8.2 和四类分布卡片均可见；PowerShell V2 验证脚本通过。
- 未解决问题：数据集切分和分布当前为统一 mock domain data，未接入真实文件索引。
