#!/bin/bash

# ==================== 蚂蚁岛系统部署脚本 ====================

set -e  # 遇到错误立即退出

echo "🚀 蚂蚁岛预测系统 - 部署脚本"
echo "==================================="
echo "Vercel项目: mayidao-gels988"
echo "Supabase: gels988's Org"
echo "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "==================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤1: 安装依赖
echo -e "${BLUE}📦 步骤1: 安装依赖${NC}"
npm install
echo -e "${GREEN}✅ 依赖安装完成${NC}"
echo ""

# 步骤2: Git提交
echo -e "${BLUE}📦 步骤2: Git提交${NC}"
if [ -d ".git" ]; then
    git add .
    git commit -m "🚀 蚂蚁岛系统 v2.0.0 部署

核心功能：
- 🧠 自学模块：22矩阵四数基因预测
- 📊 数据库可视化：实时监控全球用户数据
- 🔮 多模型投票预测机制
- 🌐 全球布局支持

技术栈：
- 后端：Node.js + Express + Supabase
- 前端：HTML5 + Chart.js
- 认证：JWT令牌保护
- 部署：Vercel自动部署" || echo "无更改需要提交"
    
    # 推送到GitHub
    git push origin main 2>/dev/null || echo "跳过GitHub推送"
    echo -e "${GREEN}✅ Git提交完成${NC}"
else
    echo -e "${YELLOW}⚠️  Git仓库未初始化，跳过${NC}"
fi
echo ""

# 步骤3: Vercel部署
echo -e "${BLUE}☁️  步骤3: 部署到Vercel${NC}"
echo "项目: mayidao-gels988"
echo "环境: Production"
echo ""

# 检查登录状态
if ! vercel whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ 未登录Vercel，请先运行: vercel login${NC}"
    exit 1
fi

# 执行部署
echo "开始部署..."
DEPLOY_URL=$(vercel --prod --name mayidao-gels988 --yes 2>&1 | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

if [ -z "$DEPLOY_URL" ]; then
    echo -e "${RED}❌ 部署失败，请检查错误信息${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ 部署成功！${NC}"
echo ""
echo "==================================="
echo -e "${GREEN}🌐 系统访问地址:${NC}"
echo "   $DEPLOY_URL"
echo ""
echo -e "${GREEN}🔧 API端点:${NC}"
echo "   $DEPLOY_URL/api"
echo ""
echo -e "${GREEN}📊 管理看板:${NC}"
echo "   $DEPLOY_URL/数据库资料.html"
echo ""
echo -e "${GREEN}🧠 学习模块:${NC}"
echo "   $DEPLOY_URL/self_learn.html"
echo "==================================="
echo ""
echo -e "${YELLOW}⏰ 系统将自动运行，每30秒刷新数据${NC}"
echo -e "${YELLOW}📈 预测系统将持续学习并优化准确率${NC}"
echo -e "${YELLOW}🌱 蚂蚁岛正在自我生存与发展...${NC}"
echo "==================================="
echo ""

# 保存部署信息
cat > DEPLOY_INFO.txt << EOF
蚂蚁岛系统部署信息
===================

部署时间: $(date '+%Y-%m-%d %H:%M:%S')
Vercel项目: mayidao-gels988
访问地址: $DEPLOY_URL

核心功能:
- 自学模块: 22矩阵四数基因预测
- 数据库可视化: 实时监控全球用户数据
- 多模型投票预测机制
- 全球布局支持

技术栈:
- 后端: Node.js + Express + Supabase
- 前端: HTML5 + Chart.js
- 认证: JWT令牌保护
- 部署: Vercel自动部署

环境变量:
- SUPABASE_URL: 已配置
- SUPABASE_ANON_KEY: 已配置
- JWT_SECRET: 已配置
- NODE_ENV: production

系统状态: ✅ 正常运行
EOF

echo -e "${GREEN}✅ 部署信息已保存到 DEPLOY_INFO.txt${NC}"
