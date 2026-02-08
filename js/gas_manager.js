// ========== G-Gas管理模块 (System Integration) ========== 
// 依赖: window.dbClient

let currentGasBalance = 180; // 默认值 
let currentUser = null; 

/** 
 * 初始化G-Gas显示 
 */ 
async function initGasBalance() { 
  try { 
    // 从localStorage读取用户信息 
    const userStr = localStorage.getItem('currentUser'); 
    if (userStr) { 
      currentUser = JSON.parse(userStr); 
      
      // 从数据库获取最新余额 
      const balance = await window.dbClient.getGasBalance(); 
      currentGasBalance = balance; 
      displayGasBalance(balance); 
      console.log(`[G-Gas] Initialized for user ${currentUser.id}: ${balance}`);
    } else { 
      // 未登录，显示默认值 
      displayGasBalance(180); 
    } 
  } catch (error) { 
    console.error('初始化G-Gas失败:', error); 
    // 显示默认值 
    displayGasBalance(180); 
  } 
} 

/** 
 * 显示G-Gas余额 
 */ 
function displayGasBalance(balance) { 
  const gasElement = document.querySelector('.g-gas'); 
  if (gasElement) { 
    gasElement.textContent = `G-Gas: ${balance}`; 
    
    // 根据余额显示不同颜色 
    if (balance < 50) { 
      gasElement.style.color = '#ff3333'; // 红色 
    } else if (balance < 100) { 
      gasElement.style.color = '#ffcc00'; // 黄色 
    } else { 
      gasElement.style.color = '#00cc66'; // 绿色 
    } 
  } 
} 

/** 
 * 刷新G-Gas余额 
 */ 
async function refreshGasBalance() { 
  try { 
    const balance = await window.dbClient.getGasBalance(); 
    currentGasBalance = balance; 
    displayGasBalance(balance); 
  } catch (error) { 
    console.error('刷新G-Gas失败:', error); 
  } 
} 

/** 
 * 检查G-Gas余额是否足够 
 */ 
function checkGasBalance(minRequired = 1) { 
  if (currentGasBalance < minRequired) { 
    alert(`G-Gas不足！当前余额: ${currentGasBalance}，需要至少 ${minRequired}`); 
    return false; 
  } 
  return true; 
} 

async function deductGasForPrediction(amount = 1) {
    if (!checkGasBalance(amount)) return false;
    try {
        const result = await window.dbClient.deductGas(amount);
        if (result && result.success) {
            currentGasBalance = result.newBalance;
            displayGasBalance(currentGasBalance);
            return true;
        }
        return false;
    } catch (e) {
        currentGasBalance -= amount;
        displayGasBalance(currentGasBalance);
        return true;
    }
}

function onGasRecharged() {
    refreshGasBalance();
}

// 自动初始化
document.addEventListener('DOMContentLoaded', initGasBalance);
window.initGasBalance = initGasBalance;
window.refreshGasBalance = refreshGasBalance;
window.deductGasForPrediction = deductGasForPrediction;
window.onGasRecharged = onGasRecharged;
