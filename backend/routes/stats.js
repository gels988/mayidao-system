const express = require('express');
const router = express.Router();
const { 
    supabase,
    getOverviewStats, 
    getUserGrowth, 
    getCountryDistribution 
} = require('../config/supabase');

// 辅助函数：手机号脱敏
const formatPhone = (phone) => {
    if (!phone) return '未知';
    if (phone.length <= 7) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

// 验证中间件
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: '未授权访问' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: '无效的访问令牌' });
    }
};

// 获取核心统计信息
router.get('/overview', authenticate, async (req, res) => {
    try {
        const stats = await getOverviewStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('获取统计信息错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取用户增长趋势
router.get('/user-growth', authenticate, async (req, res) => {
    try {
        const { period = 'today' } = req.query;
        const data = await getUserGrowth(period);
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取用户增长数据错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取国家分布
router.get('/country-distribution', authenticate, async (req, res) => {
    try {
        const data = await getCountryDistribution();
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取国家分布错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取捐赠分布
router.get('/donate-distribution', authenticate, async (req, res) => {
    try {
        const { data: donations } = await supabase
            .from('donations')
            .select('amount')
            .eq('status', 1);
        
        // 分组统计
        const distribution = {
            '0-100': { count: 0, total: 0 },
            '101-500': { count: 0, total: 0 },
            '501-1000': { count: 0, total: 0 },
            '1001-5000': { count: 0, total: 0 },
            '5001+': { count: 0, total: 0 }
        };
        
        donations?.forEach(d => {
            const amount = parseFloat(d.amount);
            let range;
            
            if (amount <= 100) range = '0-100';
            else if (amount <= 500) range = '101-500';
            else if (amount <= 1000) range = '501-1000';
            else if (amount <= 5000) range = '1001-5000';
            else range = '5001+';
            
            distribution[range].count++;
            distribution[range].total += amount;
        });
        
        const result = Object.entries(distribution).map(([range, data]) => ({
            range,
            count: data.count,
            totalAmount: parseFloat(data.total.toFixed(2))
        }));
        
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('获取捐赠分布错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取最近活动
router.get('/recent-activity', authenticate, async (req, res) => {
    try {
        const { data: activities } = await supabase
            .from('activity_logs')
            .select(`
                created_at,
                activity_type,
                description,
                users!inner(phone_number, username)
            `)
            .eq('status', 1)
            .order('created_at', { ascending: false })
            .limit(20);
        
        const activityTypes = {
            'register': '注册',
            'login': '登录',
            'donate': '捐赠',
            'logout': '登出'
        };
        
        const result = activities?.map(act => {
            const time = new Date(act.created_at).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let content = '';
            switch(act.activity_type) {
                case 'register':
                    content = `用户 ${formatPhone(act.users.phone_number)} ${act.description || '注册成功'}`;
                    break;
                case 'donate':
                    content = `用户 ${formatPhone(act.users.phone_number)} ${act.description || '完成捐赠'}`;
                    break;
                case 'login':
                    content = `用户 ${formatPhone(act.users.phone_number)} 登录系统`;
                    break;
                default:
                    content = act.description || `${act.users.username} ${activityTypes[act.activity_type] || act.activity_type}`;
            }
            
            return {
                time,
                content,
                type: act.activity_type
            };
        }) || [];
        
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('获取活动记录错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取实时在线状态
router.get('/realtime', authenticate, async (req, res) => {
    try {
        // 在线用户（最近5分钟活跃）
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const { count: onlineUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('last_active_at', fiveMinutesAgo)
            .eq('status', 1);
        
        // 活跃会话
        const { count: activeSessions } = await supabase
            .from('user_sessions')
            .select('*', { count: 'exact', head: true })
            .gt('expires_at', new Date().toISOString());
        
        // 获取今日峰值（尝试从 online_statistics 获取，如果表不存在则使用当前在线数作为临时值）
        // TODO: 确保数据库中有 online_statistics 表
        /* 
        const { data: peakData } = await supabase
            .from('online_statistics')
            .select('peak_count')
            .eq('date', new Date().toISOString().split('T')[0])
            .single();
        */
        const peakToday = onlineUsers || 0; // 临时逻辑：如果未记录峰值，暂用当前值

        res.json({
            success: true,
            data: {
                onlineUsers: onlineUsers || 0,
                activeSessions: activeSessions || 0,
                peakToday: peakToday // 可以从online_statistics表获取
            }
        });
    } catch (error) {
        console.error('获取实时状态错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

module.exports = router;
