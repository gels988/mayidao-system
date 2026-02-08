// js/trial.js

import { getStrongDeviceFingerprint } from './secureFingerprint.js';

const TRIAL_DAYS = 10;
const CONSUME_RATE_FREE = 1;
const CONSUME_RATE_ACTIVATED = 1;

class TrialManager {
    constructor() {
        this.deviceId = getStrongDeviceFingerprint();
        this.loadState();
        this.checkActivationToken(); // Auto-check on startup
        // 绑定到 window 以供 UI 调用
        window.TrialManager = this;
    }

    // 加载或初始化试用状态
    loadState() {
        const saved = localStorage.getItem('mayiju_trial_v2');
        if (saved) {
            try {
                const state = JSON.parse(atob(saved));
                // 验证 deviceId 是否匹配（防复制 localStorage 到其他设备）
                if (state.deviceId === this.deviceId) {
                    this.state = state;
                    if (typeof this.state.totalPredictions !== 'number' || !Number.isFinite(this.state.totalPredictions)) {
                        this.state.totalPredictions = 0;
                    }
                    if (typeof this.state.correctPredictions !== 'number' || !Number.isFinite(this.state.correctPredictions)) {
                        this.state.correctPredictions = 0;
                    }
                    if (typeof this.state.accuracy !== 'number' || !Number.isFinite(this.state.accuracy)) {
                        this.state.accuracy = 0;
                    }
                    this.saveState();
                    return;
                }
            } catch (e) {
                // 解密失败 → 状态损坏，视为新用户但不给体验金
            }
        }

        // 首次启动：初始化试用
        this.state = {
            deviceId: this.deviceId,
            startDate: Date.now(),      // 启动即开始计时
            initialBalance: 300,
            balance: 300,
            isActivated: false,
            activationChecked: false,
            totalPredictions: 0,
            correctPredictions: 0,
            accuracy: 0
        };
        this.saveState();
    }

    saveState() {
        localStorage.setItem('mayiju_trial_v2', btoa(JSON.stringify(this.state)));
    }

    // 检查是否已通过管理软件激活（读取外部token）
    checkActivationToken() {
        if (this.state.isActivated) return;

        // 尝试读取激活令牌（管理软件写入的文件）
        // Web环境受限，此处模拟；Electron/桌面版可读取本地文件
        const token = this.readActivationToken();
        if (token && token.deviceId === this.deviceId && token.valid) {
            this.state.isActivated = true;
            this.state.activatedTier = token.tier || 1; // 默认激活为 Tier 1
            this.state.balance = Math.max(this.state.balance, 1000); // 保底
            console.log("System Activated via Token. Tier:", this.state.activatedTier);
        }
        this.state.activationChecked = true;
        this.saveState();
    }

    // 模拟读取激活令牌（Web版可通过IndexedDB或特殊localStorage模拟）
    readActivationToken() {
        // 实际部署时，Electron 可读取 activation/token.dat
        // 此处用 localStorage 模拟管理软件写入
        const tokenStr = localStorage.getItem('mayiju_activation_token');
        if (tokenStr) {
            try {
                // 支持纯 JSON 或 Base64 编码
                if (tokenStr.trim().startsWith('{')) {
                    return JSON.parse(tokenStr);
                }
                return JSON.parse(atob(tokenStr));
            } catch (e) {
                console.error("Invalid activation token", e);
                return null;
            }
        }
        return null;
    }

    // 获取激活后的等级
    getActivatedTier() {
        return this.state.isActivated ? (this.state.activatedTier || 1) : 0;
    }

    // 获取剩余试用时间（毫秒）
    getRemainingTime() {
        if (this.state.isActivated) return Infinity;
        const elapsed = Date.now() - this.state.startDate;
        const maxTrialMs = TRIAL_DAYS * 24 * 60 * 60 * 1000;
        return Math.max(0, maxTrialMs - elapsed);
    }

    // 是否仍在试用期内
    isInTrial() {
        return !this.state.isActivated && this.getRemainingTime() > 0;
    }

    // 是否已永久激活
    isPermanentlyActivated() {
        return this.state.isActivated;
    }

    // 获取当前G币余额
    getBalance() {
        return this.state.balance;
    }

    // 扣分（根据激活状态决定费率）
    deductForPrediction() {
        this.checkActivationToken(); // 每次扣分前检查激活

        const cost = this.state.isActivated ? CONSUME_RATE_ACTIVATED : CONSUME_RATE_FREE;
        
        // 试用期结束后禁止使用
        if (!this.state.isActivated && this.getRemainingTime() <= 0) {
            return { success: false, reason: 'expired', msg: '试用期已结束' };
        }

        if (this.state.balance < cost) {
            return { success: false, reason: 'insufficient', msg: '余额不足' };
        }

        this.state.balance -= cost;
        this.saveState();
        return { success: true, cost };
    }

    // 获取友好提示
    getStatusMessage() {
        if (this.state.isActivated) {
            return `✅ 已激活 | 余额：${this.state.balance} 分`;
        }

        const remainingMs = this.getRemainingTime();
        if (remainingMs <= 0) {
            return "❌ 试用已结束，请联系管理员";
        }

        const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        return `⏳ 试用期：剩余 ${days} 天 | 余额：${this.state.balance} 分 (-1/次)`;
    }
}

// 自动初始化
new TrialManager();
