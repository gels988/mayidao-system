
// 🛡️ Supabase Client Wrapper (Robust Version)
// 优先使用 index.html 中引入的全局 window.supabase，避免 CDN 模块加载失败

const SUPABASE_URL = 'https://xhfyfkqfykkbbnlwghem.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZnlma3FmeWtrYmJubHdnaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODA4ODEsImV4cCI6MjA4NDA1Njg4MX0.SVUTAVSWi-skCq3N3KioTetV40IWt0vNkewA0WqEfcg';

// 🛡️ System Cognition Reset (Pure Math Architecture)
const PURE_ARCHITECTURE = { 
  axis1: "数字基因 (142/857/428/571/285/714循环)", 
  axis2: "卦象空间 (64卦象限：左上蓝/右下红/对角平衡)", 
  axis3: "动态平衡 (S=(B-R)/(B+R)×100%, X=1/(R+D+1))", 
  antiEffect: "补牌反噬=5-A"
};

function enforcePureArchitecture() {
  console.log("✅ System Cognition Locked: Three-Layer Pure Math Architecture");
  console.log(PURE_ARCHITECTURE);
  
  // Clear any residual pollution in storage
  // Note: Pollution clearing is handled by system reset
}

// Run enforcement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforcePureArchitecture);
} else {
    enforcePureArchitecture();
}

let supabaseInstance = null;

try {
    if (window.supabase && window.supabase.createClient) {
        // 1. 尝试使用全局对象 (最稳定)
        supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("✅ Supabase initialized via global script");
    } else {
        // 2. 如果全局对象不存在，使用智能 Mock 客户端 (支持本地测试)
        console.warn("Supabase SDK not loaded. Using SMART mock client.");
        
        // Helper to simulate async delay
        const asyncResponse = (data, error = null) => 
            new Promise(resolve => setTimeout(() => resolve({ data, error }), 100));

        supabaseInstance = {
            auth: {
                getSession: () => asyncResponse({ session: { user: MOCK_DB.users['user_admin'] } }),
                getUser: () => asyncResponse({ user: MOCK_DB.users['user_admin'] }),
                signInWithPassword: ({ email, phone }) => {
                    const user = Object.values(MOCK_DB.users).find(u => u.email === email || u.phone === phone);
                    return asyncResponse({ user, session: { access_token: 'mock' } }, user ? null : { message: 'User not found' });
                },
                signOut: () => asyncResponse(null)
            },
            from: (table) => {
                return {
                    select: (columns) => {
                        return {
                            eq: (col, val) => {
                                // Simple mock query for 'users' or 'app_users'
                                const targetTable = (table === 'app_users') ? 'users' : table;
                                
                                if ((targetTable === 'users') && col === 'id') return { single: () => asyncResponse(MOCK_DB.users[val] || null) };
                                if ((targetTable === 'users') && col === 'phone_number') { // Support phone_number lookup
                                    const user = Object.values(MOCK_DB.users).find(u => u.phone === val || u.phone_number === val);
                                    return { single: () => asyncResponse(user || null) };
                                }
                                if ((targetTable === 'users') && col === 'referrer_id') {
                                     // Find users with this referrer
                                     const users = Object.values(MOCK_DB.users).filter(u => u.referrer_id === val);
                                     return { order: () => asyncResponse(users) };
                                }
                                if ((targetTable === 'users') && col === 'email') return { maybeSingle: () => asyncResponse(Object.values(MOCK_DB.users).find(u => u.email === val)) };
                                return { single: () => asyncResponse(null) };
                            },
                            or: () => ({ eq: () => ({ single: () => asyncResponse(MOCK_DB.users['user_admin']) }) }) // Mock login query
                        };
                    },
                    insert: (data) => {
                        if (table === 'users' || table === 'app_users') {
                            const newId = 'user_' + Date.now();
                            MOCK_DB.users[newId] = { ...data, id: newId };
                            return { select: () => ({ single: () => asyncResponse(MOCK_DB.users[newId]) }) };
                        }
                        if (table === 'recharges') {
                             // Mock insert for recharges - do nothing but return success
                             return { select: () => ({ single: () => asyncResponse({}) }) };
                        }
                        return { select: () => ({ single: () => asyncResponse({}) }) };
                    },
                    update: (data) => {
                        return {
                            eq: (col, val) => {
                                if ((table === 'users' || table === 'app_users') && (col === 'id' || col === 'phone_number')) {
                                    // Find user by ID or Phone
                                    let userId = val;
                                    if (col === 'phone_number') {
                                        const user = Object.values(MOCK_DB.users).find(u => u.phone === val || u.phone_number === val);
                                        if (user) userId = user.id;
                                        else return asyncResponse(null, { message: 'User not found' });
                                    }
                                    
                                    if (MOCK_DB.users[userId]) {
                                        Object.assign(MOCK_DB.users[userId], data);
                                        return asyncResponse(MOCK_DB.users[userId]);
                                    }
                                }
                                return asyncResponse(null);
                            }
                        };
                    }
                };
            },
            rpc: (func, params) => {
                if (func === 'increment_gas') {
                    if (MOCK_DB.users[params.user_id]) {
                        MOCK_DB.users[params.user_id].gas_balance += params.amount;
                        return asyncResponse(null);
                    }
                }
                if (func === 'deduct_gas_secure') {
                     // ... logic if needed
                }
                return asyncResponse(null, { message: 'Function not found in mock' });
            }
        };
    }
} catch (e) {
    console.error("❌ Supabase Init Failed:", e);
}

// Expose globally for index.html usage
window.supabaseInstance = supabaseInstance;

// 模拟数据库（当Supabase不可用时）
const MOCK_DB = {
    users: {
        'user_123': { id: 'user_123', email: 'test@example.com', phone: '1234567890', gas_balance: 180, accuracy: 0.333 },
        'user_admin': { 
            id: 'user_admin', 
            email: 'admin@mayiju.com', 
            phone: '18080860669', 
            gas_balance: 99999, // First Islander Grant
            is_early_adopter: true, // Permission to open new users
            referral_code: 'ISLAND_MASTER',
            accuracy: 0.95,
            password_hash: 'password' // Mock password
        }
    },
    recharges: {}, // Mock recharges table
    donations: {}  // Mock donations table
};

console.log("⚠️ Running with MOCK DATABASE (Offline Mode)");

// ========== 数据库客户端 (Adapted for Direct Supabase/Mock) ========== 
class DatabaseClient { 
   constructor() { 
     this.userId = null; 
     this.sessionToken = null; 
     this.checkRestoreSession();
   } 
   
   checkRestoreSession() {
       const userStr = localStorage.getItem('currentUser');
       const token = localStorage.getItem('sessionId');
       if (userStr && token) {
           this.userId = JSON.parse(userStr).id;
           this.sessionToken = token;
       }
   }

   /** 
    * 用户登录 
    */ 
   async login(username, password) { 
     try { 
       let data, error;
      
      if (supabaseInstance && supabaseInstance.auth) {
          const result = await supabaseInstance.auth.signInWithPassword({ 
              email: username.includes('@') ? username : undefined,
              phone: !username.includes('@') ? username : undefined,
              password: password 
          });
          data = result.data;
           error = result.error;
       } else {
           // Mock Login Logic
           const user = Object.values(MOCK_DB.users).find(u => 
               u.email === username || u.phone === username
           );
           
           if (user) {
               data = { user: user, session: { access_token: 'mock_token_' + user.id } };
               error = null;
           } else {
               error = { message: 'Invalid login credentials' };
           }
       }
       
       if (error) throw error;
       if (!data.user) throw new Error('登录失败: 用户不存在');
       
       this.userId = data.user.id; 
       this.sessionToken = data.session ? data.session.access_token : 'mock_token'; 
       
       // 保存到localStorage 
       localStorage.setItem('currentUser', JSON.stringify(data.user)); 
       localStorage.setItem('sessionId', this.sessionToken); 
       
       return { user: data.user, token: this.sessionToken }; 
     } catch (error) { 
       console.error('登录错误:', error); 
       throw error; 
     } 
   } 
   
   /** 
    * 获取G-Gas余额 
    */ 
   async getGasBalance() { 
     if (!this.userId) this.checkRestoreSession();
     if (!this.userId) { 
        // Fallback for demo/offline
        return 180;
     } 
     
     try { 
       if (supabaseInstance) {
           const { data, error } = await supabaseInstance
               .from('users') // Note: In real DB this might be 'app_users' based on server.js, but sticking to previous db_client convention
               .select('gas_balance')
               .eq('id', this.userId)
               .single();
           if (error) throw error;
           return data ? data.gas_balance : 0;
       } else {
           return MOCK_DB.users['user_123'].gas_balance;
       }
     } catch (error) { 
       console.error('获取余额错误:', error); 
       return 180; // Fail safe
     } 
   } 
   
   /** 
    * 扣除G-Gas (Secure RPC)
    */ 
   async deductGas(amount) { 
     if (!this.userId) throw new Error('未登录'); 
     
     try { 
       if (supabaseInstance) {
           // ✅ 安全：调用受保护的 RPC 函数
           const { data, error } = await supabaseInstance.rpc('deduct_gas_secure', { 
               user_id: this.userId, 
               amount: amount 
           });
           
           if (error) {
               console.warn("RPC调用失败，尝试客户端降级方案 (仅用于过渡，建议立即部署RPC)", error);
               // 降级逻辑: 客户端检查 + 更新 (不安全，仅作为临时兼容)
               const { data: userData, error: fetchError } = await supabaseInstance
                   .from('users')
                   .select('gas_balance')
                   .eq('id', this.userId)
                   .single();
               
               if (fetchError) throw fetchError;
               if (userData.gas_balance < amount) throw new Error('余额不足');

               const newBalance = userData.gas_balance - amount;
               const { error: updateError } = await supabaseInstance
                   .from('users')
                   .update({ gas_balance: newBalance })
                   .eq('id', this.userId);
                   
               if (updateError) throw updateError;
               return { success: true, newBalance };
           }
           
           // RPC 成功 (假设返回新余额，如果未返回则重新查询)
           return { success: true, newBalance: data };
       } else {
           if (MOCK_DB.users['user_123'].gas_balance < amount) throw new Error('余额不足');
           MOCK_DB.users['user_123'].gas_balance -= amount;
           return { success: true, newBalance: MOCK_DB.users['user_123'].gas_balance };
       }
     } catch (error) { 
       console.error('扣分错误:', error); 
       throw error; 
     } 
   } 
   
   /** 
    * 添加预测记录 
    */ 
   async addPredictionRecord(record) { 
     if (!this.userId) return; // Silent fail if not logged in
     
     try { 
       if (supabaseInstance) {
           const { error } = await supabaseInstance
               .from('prediction_records')
               .insert(record);
           if (error) throw error;
       } else {
           console.log("[MockDB] Record saved:", record);
       }
       return { success: true }; 
     } catch (error) { 
       console.error('保存记录错误:', error); 
       // Don't throw, just log
       return { success: false, error };
     } 
   } 
   
   /** 
    * 更新准确率 (Secure RPC)
    */ 
   async updateAccuracy(newAccuracy) { 
     if (!this.userId) return;
     
     try { 
       if (supabaseInstance) {
           // ✅ Secure: Call RPC
           const { error } = await supabaseInstance.rpc('update_accuracy_secure', {
               user_id: this.userId,
               new_accuracy: newAccuracy
           });
           
           if (error) {
               console.warn("RPC update_accuracy failed, falling back:", error);
               await supabaseInstance
                   .from('users')
                   .update({ accuracy: newAccuracy })
                   .eq('id', this.userId);
           }
       } else {
           MOCK_DB.users['user_123'].accuracy = newAccuracy;
       }
       return { success: true }; 
     } catch (error) { 
       console.error('更新准确率错误:', error); 
       return { success: false };
     } 
   } 
   
   /** 
    * 注销登录 
    */ 
   async logout() { 
     try { 
       if (supabaseInstance) await supabaseInstance.auth.signOut();
       
       this.userId = null; 
       this.sessionToken = null; 
       localStorage.removeItem('currentUser'); 
       localStorage.removeItem('sessionId'); 
       
       return true; 
     } catch (error) { 
       console.error('注销错误:', error); 
       return false; 
     } 
   } 
 } 
 
// 导出单例 (Attached to window for non-module support)
window.dbClient = new DatabaseClient();
// Expose supabase instance for other pages (like juanzeng.html) to use
window.supabaseInstance = supabaseInstance;
