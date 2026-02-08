#!/bin/bash

# ==================== 部署脚本 ====================

echo "🚀 蚂蚁岛系统部署脚本"
echo "==================================="
echo "Vercel: mayidao-gels988.vercel.app"
echo "Supabase: gels988's Org"
echo "==================================="

# 1. 安装依赖
echo "📦 安装依赖..."
npm install

# 2. Git操作
echo "💾 Git版本控制..."

# 检查是否已初始化
if [ ! -d ".git" ]; then
    echo "初始化Git仓库..."
    git init
    git remote add origin https://github.com/YOUR_USERNAME/mayidao-system.git
fi

# 添加文件
git add .
git status

# 提交
git commit -m "🚀 部署v2.0.0 - 完整预测系统上线
- 自学模块：22矩阵四数基因预测
- 数据库可视化：实时监控全球用户数据  
- Supabase数据库连接
- 多模型投票预测机制
- 自动学习与优化"

# 推送
git push -u origin main

# 3. Vercel部署
echo "☁️  部署到Vercel..."

# 检查登录状态
if ! vercel whoami > /dev/null 2>&1; then
    echo "⚠️  请先登录Vercel"
    echo "运行: vercel login"
    exit 1
fi

# 部署到生产环境
vercel --prod --name mayidao-gels988 --yes

echo "✅ 部署完成！"
echo "==================================="
echo "🌐 访问地址: https://mayidao-gels988.vercel.app"
echo "🔧 API端点: https://mayidao-gels988.vercel.app/api"
echo "==================================="
