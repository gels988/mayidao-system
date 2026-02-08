# MAYIJU WebVersion1 部署指南

## 🚀 上线建议

### 1. 部署至生产环境

建议将 `d:\WebVersion1` 同步至以下平台之一：
- **Vercel** (推荐，支持静态托管与 Serverless)
- **Nginx** (传统服务器部署)
- **对象存储** (AWS S3 / Aliyun OSS + CDN)

**关键检查点：**
- 确保 `index.html` 中的 Supabase SDK 引用有效。
- 确保 `js/db_client.js` 中的 `SUPABASE_URL` 和 `SUPABASE_KEY` 为生产环境配置（请勿提交 `config.yaml` 或包含敏感 Key 的文件到公开仓库）。
- 确保 Supabase 后台的 **Anon Key** 正确配置，且 RLS (Row Level Security) 策略已启用并允许匿名读取（如适用）。

### 2. 首批用户投放

- **规模**：限定 5–10 名核心用户。
- **分发方式**：发放专属测试链接。
- **反馈重点**：
  1. 前3局是否快速显色？
  2. 高倍信号是否及时出现？
  3. 手机端是否流畅？

### 3. 监控指标

建议在 Supabase 的 `event_tracks` 表中监控以下数据：
- `prediction_made` 事件频率：判断系统活跃度。
- `deduction_suspended`（网络超时）比例：判断网络稳定性。
- 用户留存率：统计完成 ≥5 局的用户比例。

## ⚠️ 注意事项

- **禁止写入 C 盘**：本系统设计为不依赖 C 盘写入，除浏览器缓存外。
- **本地化依赖**：所有核心 JS 库应尽可能本地化或使用可靠 CDN。
- **自检机制**：系统启动时会自动运行三层自检，请留意控制台输出的 `[Self-Check]` 日志。
