const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ant_island_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }
        
        // 查询管理员用户
        const { data: users, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', username)
            .eq('status', 1)
            .single();
        
        if (error || !users) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        // 验证密码
        const isValid = await bcrypt.compare(password, users.password);
        if (!isValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        // 生成JWT令牌
        const token = jwt.sign(
            {
                id: users.id,
                username: users.username,
                role: users.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: users.id,
                username: users.username,
                role: users.role
            }
        });
        
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 验证令牌
router.post('/verify', (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(401).json({ error: '未提供令牌' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ success: true, user: decoded });
    } catch (error) {
        res.status(401).json({ error: '无效的令牌' });
    }
});

module.exports = router;
