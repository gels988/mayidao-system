require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkConnection() {
    try {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            throw new Error('缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY 环境变量');
        }

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        // 尝试查询 users 表的一条记录（只获取数量，减少开销）
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        console.log(`   ✅ Supabase连接成功，当前用户总数: ${count}`);
        process.exit(0);
    } catch (error) {
        console.error(`   ❌ Supabase连接失败: ${error.message}`);
        process.exit(1);
    }
}

checkConnection();
