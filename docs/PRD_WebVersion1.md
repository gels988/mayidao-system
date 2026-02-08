# MAYIJU WebVersion1 产品需求文档 (PRD)

**文档状态**: 正式版 1.0
**最后更新**: 2026-01-21
**负责人**: 第一方面军统帅 (MAYIJU System Commander)
**密级**: 内部核心 (Core Memory)

---

## 1. 项目概述 (Overview)

### 1.1 产品愿景
MAYIJU WebVersion1 是一套为高风险决策环境设计的**生存级**预测分析系统。它不依赖外部庞大框架，强调在受限环境（Windows D盘、无外网依赖）下的**绝对稳定性**、**极简架构**与**数据韧性**。产品核心目标是提供精准的红蓝（P/B）趋势分析、实时概率计算及云端同步功能。

### 1.2 核心价值
*   **自主可控**: 代码全本地化，不依赖 npm 在线安装，所有逻辑透明可查。
*   **双模适配**: 同时支持移动端（快速网格录入）与桌面端（高精度分子分母录入），无缝切换。
*   **高可用性**: 即使在网络断连情况下也能本地运行，网络恢复后自动同步。

---

## 2. 用户角色 (User Personas)

| 角色 | 描述 | 核心需求 |
| :--- | :--- | :--- |
| **前线操作员 (User)** | 在高压环境下进行快速录入与决策 | 界面响应极快 (<100ms)，操作容错率高，关键数据一目了然。 |
| **系统统帅 (Commander)** | 负责系统的维护、部署与架构演进 | 代码模块化，故障可回溯，部署脚本化 (PowerShell)。 |

---

## 3. 功能需求 (Functional Requirements)

### 3.1 输入与交互系统 (Input System)
*   **双模式切换 (Dual Mode Toggle)**:
    *   **简易模式 (Simple/Mobile)**: 
        *   界面：显示交互式网格（Grid）。
        *   操作：点击网格直接录入红/蓝结果。
        *   适用：移动设备或快速跟投场景。
    *   **高级模式 (Advanced/Desktop)**:
        *   界面：显示分子 (P) / 分母 (B) 数值输入框。
        *   操作：手动输入具体数值，点击“计算”触发分析。
        *   适用：桌面环境或需深度精算场景。
    *   **逻辑约束**: 必须允许用户手动自由切换，**严禁**基于 User-Agent 强制锁定模式。

### 3.2 核心分析引擎 (Analysis Engines)
*   **基础引擎 (`core_engine.js`)**:
    *   处理基础概率计算。
    *   维护全局游戏状态 (Game State)。
*   **高赔率逻辑 (`encrypted_logic.js`)**:
    *   识别特定高价值图形模式。
    *   输出高置信度信号 (High Confidence Signals)。
*   **动态趋势引擎 (`dynamics_engine.js`)**:
    *   实时监控红蓝走势（Phase 3 Logic）。
    *   提供动态权重调整建议。

### 3.3 数据管理与同步 (Data & Sync)
*   **本地存储**: 使用 `localStorage` 缓存当前会话数据，防止意外刷新丢失。
*   **云端同步 (`cloud_sync.js`)**:
    *   对接 Supabase 数据库。
    *   实现实时数据上报与历史记录拉取。
    *   断网重连机制：网络恢复后自动补传积压数据。

### 3.4 系统安全与鉴权 (Security)
*   **身份验证**: 基于手机号的简易登录系统 (`auth_bridge.js`)。
*   **设备指纹**: `secureFingerprint.js` 用于识别单一设备，防止多点登录冲突。

---

## 4. 非功能需求 (Non-Functional Requirements)

### 4.1 稳定性 (Stability)
*   **去干扰原则**: 系统**不得**包含主动干扰用户操作的“自愈”脚本（如 AHS 自动重置 DOM）。
*   **错误边界**: 遇到非致命错误（如网络超时）应静默重试或仅提示，不应阻断主流程。

### 4.2 性能 (Performance)
*   **加载速度**: 核心首屏加载时间 < 1秒（本地文件读取）。
*   **资源占用**: 运行时内存占用需控制在低水平，避免浏览器崩溃。

### 4.3 部署约束 (Deployment)
*   **路径依赖**: 所有资源必须通过相对路径或 `D:\WebVersion1` 绝对路径访问。
*   **环境依赖**: 仅依赖 Windows 内置 PowerShell 与浏览器，无需 Python/Node.js 运行时环境（Server.js 仅作开发辅助）。

---

## 5. 架构设计 (Architecture)

### 5.1 目录结构规范
```text
D:\WebVersion1\
├── index.html              # 主入口 (PWA Shell)
├── css\                    # 样式表
├── js\                     # 核心逻辑库
│   ├── core_engine.js      # 运算核心
│   ├── ui_controller.js    # 视图控制 (MVC Controller)
│   ├── tracker.js          # 数据追踪
│   └── ...
├── docs\                   # 文档库
└── tests\                  # 自动化测试用例
```

### 5.2 关键数据流
1.  **Input** (UI/Grid/InputBox) -> `ui_controller.js`
2.  **Process** -> `core_engine.js` + `dynamics_engine.js`
3.  **State** -> `tracker.js` (Update Local State)
4.  **Persist** -> `cloud_sync.js` (Push to Supabase)
5.  **Feedback** -> Update UI (Grid/Charts)

---

## 6. 版本规划 (Roadmap)

### v1.0 (Current)
*   [x] 完成核心红蓝预测逻辑。
*   [x] 实现 Supabase 云同步。
*   [x] 移除不稳定的 AHS 自愈模块。
*   [x] 修复移动/桌面模式切换逻辑。

### v1.1 (Next)
*   [ ] 引入更丰富的图表展示 (Chart.js/ECharts 本地化)。
*   [ ] 优化离线模式下的数据冲突解决策略。
*   [ ] 增加 PowerShell 自动化部署脚本 (`BaguaAgent` 增强)。

---

**批准人**: MAYIJU System Commander
