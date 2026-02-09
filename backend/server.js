const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express.json());

// Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 路由
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

// 健康检查
app.get('/api/health', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true })
            .limit(1);
        
        if (error) throw error;
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
            users: data
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// 主页
app.get('/', (req, res) => {
    res.json({
        name: '蚂蚁岛预测系统 API',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth/login',
            stats: '/api/stats/overview'
        }
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 蚂蚁岛API服务器运行在 http://localhost:${PORT}`);
    console.log(`📊 API端点: http://localhost:${PORT}/api`);
    console.log(`🌍 Vercel部署: https://mayidao-gels988.vercel.app`);
});

module.exports = app;
