const { createClient } = require('@supabase/supabase-js');

// Supabase配置（使用环境变量）
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 测试数据库连接
async function testConnection() {
    try {
        // 查询users表测试连接
        const { data, error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true })
            .limit(1);
        
        if (error) throw error;
        
        console.log('✅ Supabase连接成功');
        console.log('📊 用户总数:', data);
        return true;
    } catch (error) {
        console.error('❌ Supabase连接失败:', error.message);
        return false;
    }
}

// 获取统计信息
async function getOverviewStats() {
    try {
        // 总用户数
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 1);
        
        // 捐赠用户数
        const { count: donateUsers } = await supabase
            .from('donations')
            .select('user_id', { count: 'exact', head: true })
            .eq('status', 1)
            .not('user_id', 'is', null);
        
        // 捐赠总额
        const { data: totalData } = await supabase
            .from('donations')
            .select('amount')
            .eq('status', 1);
        
        const totalDonate = totalData?.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) || 0;
        
        // 国家分布
        const { count: countries } = await supabase
            .from('users')
            .select('country_code', { count: 'exact', head: true })
            .not('country_code', 'is', null)
            .eq('status', 1);
        
        return {
            totalUsers: totalUsers || 0,
            donateUsers: donateUsers || 0,
            totalDonate: parseFloat(totalDonate.toFixed(2)),
            countries: countries || 0
        };
    } catch (error) {
        console.error('获取统计信息失败:', error);
        throw error;
    }
}

// 获取用户增长趋势
async function getUserGrowth(period = 'today') {
    try {
        let query;
        
        switch(period) {
            case 'today':
                query = supabase
                    .from('users')
                    .select('created_at')
                    .gte('created_at', new Date().toISOString().split('T')[0])
                    .eq('status', 1)
                    .order('created_at');
                break;
            case 'week':
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                query = supabase
                    .from('users')
                    .select('created_at')
                    .gte('created_at', weekAgo.toISOString())
                    .eq('status', 1)
                    .order('created_at');
                break;
            case 'month':
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                query = supabase
                    .from('users')
                    .select('created_at')
                    .gte('created_at', monthAgo.toISOString())
                    .eq('status', 1)
                    .order('created_at');
                break;
            default:
                query = supabase
                    .from('users')
                    .select('created_at')
                    .eq('status', 1)
                    .order('created_at');
        }
        
        const { data } = await query;
        
        // 按时间分组统计
        const grouped = {};
        data?.forEach(user => {
            const date = new Date(user.created_at);
            const key = period === 'today'
                ? date.getHours().toString()
                : period === 'week'
                ? date.toLocaleDateString('zh-CN', { weekday: 'short' })
                : period === 'month'
                ? date.toLocaleDateString('zh-CN')
                : date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
            
            grouped[key] = (grouped[key] || 0) + 1;
        });
        
        return Object.entries(grouped).map(([label, count]) => ({
            [period === 'today' ? 'hour' : period === 'week' ? 'day' : period === 'month' ? 'date' : 'month']: label,
            count
        }));
    } catch (error) {
        console.error('获取用户增长数据失败:', error);
        throw error;
    }
}

// 获取国家分布
async function getCountryDistribution() {
    try {
        const { data } = await supabase
            .from('users')
            .select('country_code, country_name')
            .not('country_code', 'is', null)
            .eq('status', 1);
        
        // 统计各国用户数
        const countryMap = {};
        data?.forEach(user => {
            const code = user.country_code || 'unknown';
            countryMap[code] = countryMap[code] || {
                code,
                name: user.country_name || '未知',
                count: 0
            };
            countryMap[code].count++;
        });
        
        // 国家代码到国旗映射
        const flags = {
            'CN': '🇨🇳', 'US': '🇺🇸', 'JP': '🇯🇵', 'KR': '🇰🇷', 'SG': '🇸🇬',
            'MY': '🇲🇾', 'TH': '🇹🇭', 'VN': '🇻🇳', 'ID': '🇮🇩', 'PH': '🇵🇭',
            'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'CA': '🇨🇦', 'AU': '🇦🇺'
        };

        return Object.values(countryMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 20)
            .map(item => ({
                ...item,
                flag: flags[item.code] || '🏳️'
            }));

    } catch (error) {
        console.error('获取国家分布失败:', error);
        throw error;
    }
}

module.exports = {
    supabase,
    testConnection,
    getOverviewStats,
    getUserGrowth,
    getCountryDistribution
};
