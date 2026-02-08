// 完整积分生命周期测试脚本
// 用法：复制此代码到浏览器控制台 (F12 -> Console) 运行
(async () => {
    const bridge = window.AuthBridge;
    if (!bridge) {
        console.error("❌ AuthBridge 未加载，请刷新页面后重试");
        return;
    }

    console.log("🧪 开始积分生命周期测试...");
    console.group("Test Details");

    // Step 1: 模拟新用户注册/登录
    // 使用当前时间戳作为随机后缀，确保每次测试都是新环境（如果需要）
    // 或者固定一个测试号
    const testPhone = "1380000" + Math.floor(Math.random() * 10000).toString().padStart(4, '0'); 
    console.log(`🔹 Step 1: 登录/注册测试账号 ${testPhone}...`);
    
    try {
        await bridge.loginWithPhone(testPhone);
        if (bridge.user.phone === testPhone) {
             console.log(`✅ 登录成功 | 当前积分: ${bridge.user.balanceG}`);
             // 新用户应有 300 积分
             if (bridge.user.balanceG === 300) {
                 console.log("   ✨ 注册赠送 300 积分验证通过");
             } else {
                 console.warn(`   ⚠️ 初始积分非 300 (可能是旧账号): ${bridge.user.balanceG}`);
             }
        } else {
             console.error("❌ 登录失败或用户不匹配");
             console.groupEnd();
             return;
        }
    } catch (e) {
        console.error("❌ 登录过程出错:", e);
        console.groupEnd();
        return;
    }

    // Step 2: 验证充值 300U → 780 分
    console.log("\n🔹 Step 2: 验证充值逻辑 (300U -> 2.6倍)...");
    const rechargeResult = await bridge.verifyRechargeLogic(300);
    if (rechargeResult) {
        console.log("✅ 充值验证通过");
    } else {
        console.error("❌ 充值验证失败");
    }

    // Step 3: 模拟一次“正确预测”扣分
    console.log("\n🔹 Step 3: 验证扣分逻辑...");
    const oldBalance = bridge.user.balanceG;
    const deductResult = await bridge.deductGCoins(1);
    
    if (deductResult.success) {
        const newBalance = bridge.user.balanceG;
        if (newBalance === oldBalance - 1) {
            console.log(`✅ 扣分成功 | ${oldBalance} -> ${newBalance}`);
        } else {
            console.error(`❌ 扣分成功但余额异常! 旧: ${oldBalance}, 新: ${newBalance}`);
        }
    } else {
        console.error("❌ 扣分操作失败:", deductResult.error);
    }

    // Step 4: 验证余额不足时阻止预测
    console.log("\n🔹 Step 4: 验证余额不足防护...");
    const realBalance = bridge.user.balanceG;
    
    // 临时修改本地余额为 0 (模拟耗尽)
    bridge.user.balanceG = 0; 
    console.log("   (模拟余额设为 0)");
    
    const failTest = await bridge.deductGCoins(1);
    if (!failTest.success && (failTest.error.includes("Insufficient") || failTest.error.includes("balance"))) {
        console.log("✅ 余额不足拦截成功 (Insufficient balance)");
    } else {
        console.error("❌ 拦截失败或错误信息不符:", failTest);
    }
    
    // 恢复真实余额
    bridge.user.balanceG = realBalance;
    console.log(`   (已恢复真实余额: ${realBalance})`);

    console.groupEnd();
    console.log("\n🎉 全流程测试完成！系统准备就绪。");
})();
