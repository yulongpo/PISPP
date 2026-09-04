# PISPP Wideband Refactor Task Index

执行顺序必须遵守依赖关系。

| ID | 任务 | 优先级 | 依赖 | 产出 |
|---|---|---:|---|---|
| WB-00 | 仓库与原型审计 | P0 | - | 审计报告、V1 页面映射 |
| WB-01 | 宽带领域模型 | P0 | WB-00 | Domain model/schema |
| WB-02 | 信息架构与导航重构 | P0 | WB-01 | V2 sitemap/navigation |
| WB-03 | 宽带场景生成器 | P0 | WB-01,02 | 可交互 scene editor |
| WB-04 | 标注与宽窄带提取 | P0 | WB-03 | annotation + extraction |
| WB-05 | Dataset 与数据血缘 | P1 | WB-01,04 | detection dataset |
| WB-06 | 训练/实验/模型研发 | P1 | WB-05 | wideband model R&D UI |
| WB-07 | 宽带评测 | P1 | WB-06 | evaluation UI |
| WB-08 | 工作台与全链集成 | P1 | WB-03~07 | end-to-end navigation |
| WB-09 | QA、视觉检查与交付 | P0 | 全部 | test/report/final |

## 任务状态规则

- `todo`
- `in_progress`
- `blocked`
- `done`

任何任务只有通过对应验收项后才能标记 `done`。
