# 蚂蚁岛预测系统 - 使用与维护指南

## 1. 系统概览

蚂蚁岛预测系统是一个基于 Web 的预测分析平台，包含前端展示、后台管理和自动化预测引擎。

**核心组件:**
*   **云端入口 (Public):** `https://mayidao-gels988.vercel.app` (面向普通用户，仅展示 API 状态或公开信息)
*   **API 服务:** `https://mayidao-gels988.vercel.app/api` (提供数据支持)
*   **本地管理 (Admin):** 仅在本地运行，用于数据录入、模型训练和系统监控。

## 2. 日常操作指南

### 2.1 启动本地管理环境

由于安全策略，敏感的管理功能只能在本地访问。

1.  打开项目文件夹: `D:\预测手机端总装11`
2.  **直接打开 HTML 文件:**
    *   **数据管理:** 双击 `数据库资料.html` (或 `index_old_backup.html`)
    *   **自学模块:** 双击 `frontend/self_learn.html`
3.  **注意:** 请勿将这些文件上传到公共网络。

### 2.2 部署更新到云端

当你修改了代码 (如后端逻辑或前端公开页面) 并希望发布时：

1.  打开 PowerShell 终端。
2.  进入项目目录:
    ```powershell
    cd D:\预测手机端总装11
    ```
3.  运行部署脚本:
    ```powershell
    powershell -ExecutionPolicy Bypass -File .\deploy.ps1
    ```
4.  脚本会自动执行：
    *   安装依赖
    *   Git 提交与推送
    *   部署到 Vercel
    *   生成 `DEPLOY_INFO.txt`

### 2.3 验证系统状态

部署完成后，建议运行验证脚本确保一切正常：

```powershell
powershell -ExecutionPolicy Bypass -File .\verify_system.ps1
```

该脚本会检查：
*   网站是否可访问
*   API 是否健康
*   Supabase 数据库连接
*   敏感页面是否已正确隐藏

## 3. 故障排查

*   **部署失败:**
    *   检查 `deploy_output.log` 查看详细错误信息。
    *   确认网络连接正常 (特别是连接 GitHub 和 Vercel)。
    *   确认已登录 Vercel (`npx vercel login`)。

*   **API 报错:**
    *   检查 Vercel 仪表盘中的 Function Logs。
    *   确认 Supabase 数据库连接配置 (环境变量) 正确。

*   **本地页面无法运行:**
    *   按 `F12` 打开浏览器控制台查看 Console 错误。
    *   确认本地文件路径未被移动。

## 4. 安全注意事项

*   **绝对禁止** 将 `.env` 文件提交到 Git 仓库。
*   **绝对禁止** 将 `数据库资料.html` 和 `self_learn.html` 部署到云端 (已通过 `.vercelignore` 配置屏蔽)。
*   定期备份 `DEPLOY_INFO.txt` 以记录部署历史。

---
**技术支持:** Mayiju Technical Team
**版本:** 2.0.1
