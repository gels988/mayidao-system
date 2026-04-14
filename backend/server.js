const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

// 中间件
app.use(cors({
    origin(origin, callback) {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowedOrigins.length === 0) {
            callback(new Error('CORS origin not configured'));
            return;
        }
        callback(null, allowedOrigins.includes(origin));
    },
    credentials: true
}));
app.use(express.json());

// Supabase客户端
const supabaseUrl = (process.env.SUPABASE_URL || '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/`/g, '')
    .replace(/\s+/g, '')
    .trim();
const supabaseKey = (process.env.SUPABASE_ANON_KEY || '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/`/g, '')
    .replace(/\s+/g, '')
    .trim();
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const donationWallet = (process.env.DONATION_WALLET || '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/`/g, '')
    .replace(/\s+/g, '')
    .trim();

// 路由
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/version', (req, res) => {
    res.status(200).json({
        name: 'mayidao-system',
        api_version: '2.0.0',
        vercel_git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        vercel_deployment_id: process.env.VERCEL_DEPLOYMENT_ID || null,
        server_time: new Date().toISOString()
    });
});

app.get('/api/debug-env', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.status(404).json({ error: '接口不存在' });
        return;
    }

    const urlRaw = process.env.SUPABASE_URL || '';
    const keyRaw = process.env.SUPABASE_ANON_KEY || '';
    const urlTrim = urlRaw.trim();
    const keyTrim = keyRaw.trim();

    res.status(200).json({
        has_url: Boolean(urlTrim),
        has_key: Boolean(keyTrim),
        url_preview: urlTrim ? (urlTrim.slice(0, 24) + '...') : null,
        url_has_backtick: urlRaw.includes('`'),
        url_has_whitespace: /\s/.test(urlRaw),
        key_has_backtick: keyRaw.includes('`'),
        key_has_whitespace: /\s/.test(keyRaw)
    });
});

app.get('/api/runtime-config', (req, res) => {
    res.status(200).json({
        supabaseUrl: supabaseUrl || '',
        supabaseAnonKey: supabaseKey || '',
        donationWallet: donationWallet || '',
        hasSupabase: Boolean(supabaseUrl && supabaseKey),
        hasDonationWallet: Boolean(donationWallet)
    });
});

// 健康检查
app.get('/api/health', async (req, res) => {
    try {
        if (!supabase) {
            res.status(200).json({
                status: 'degraded',
                timestamp: new Date().toISOString(),
                database: 'not_configured',
                error: 'SUPABASE_URL / SUPABASE_ANON_KEY 未配置（请在 Vercel 环境变量中设置）'
            });
            return;
        }

        let count = null;
        try {
            const resCount = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
            if (resCount && resCount.error) throw resCount.error;
            count = resCount ? (resCount.count ?? 0) : 0;
        } catch (e) {
            res.status(200).json({
                status: 'degraded',
                timestamp: new Date().toISOString(),
                database: 'unreachable',
                error: e && e.message ? e.message : 'fetch_failed',
                hint: '检查 Vercel 环境变量 SUPABASE_URL / SUPABASE_ANON_KEY 是否存在且不包含空格或反引号'
            });
            return;
        }

        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
            users: count ?? 0
        });
    } catch (error) {
        res.status(200).json({ status: 'degraded', error: error.message || String(error) });
    }
});

app.get('/api/cron/wake', async (req, res) => {
    try {
        if (!supabase) {
            res.status(200).json({
                status: 'degraded',
                timestamp: new Date().toISOString(),
                database: 'not_configured'
            });
            return;
        }

        const ping = await supabase.from('users').select('id', { head: true, count: 'exact' });
        if (ping && ping.error) throw ping.error;

        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (e) {
        res.status(200).json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            database: 'unreachable',
            error: e && e.message ? e.message : 'fetch_failed'
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
if (require.main === module) {
app.listen(PORT, () => {
    console.log(`🚀 蚂蚁岛API服务器运行在 http://localhost:${PORT}`);
    console.log(`📊 API端点: http://localhost:${PORT}/api`);
    console.log(`🌍 Vercel部署: https://mayidao-gels988.vercel.app`);
});
}

module.exports = app;
