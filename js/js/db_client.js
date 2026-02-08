
// 🛡️ Supabase Client Wrapper (Robust Version)
// 优先使用 index.html 中引入的全局 window.supabase，避免 CDN 模块加载失败

const SUPABASE_URL = 'https://xhfyfkqfykkbbnlwghem.supabase.co';
// ⚠️ 请在此处填入您的 Supabase Anon Key (以 eyJ 开头)
// 如果您还没有 Key，请去 Supabase Dashboard -> Settings -> API 复制
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZnlma3FmeWtrYmJubHdnaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODA4ODEsImV4cCI6MjA4NDA1Njg4MX0.SVUTAVSWi-skCq3N3KioTetV40IWt0vNkewA0WqEfcg'; 

let supabaseInstance = null;

try {
    if (window.supabase && window.supabase.createClient) {
        // 1. 尝试使用全局对象 (最稳定)
        supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("✅ Supabase initialized via global script");
    } else {
        // 2. 如果全局对象不存在，抛出错误 (因为 import CDN 在国内不稳定)
        throw new Error("Supabase SDK not loaded. Please check your network or index.html script tags.");
    }
} catch (e) {
    console.error("❌ Supabase Init Failed:", e);
    // 创建一个哑对象，防止报错导致 UI 挂掉
    supabaseInstance = {
        from: () => ({
            select: () => ({ eq: () => ({ single: () => ({ data: null, error: { message: "Supabase not initialized" } }) }) }),
            insert: () => ({ select: () => ({ data: null, error: { message: "Supabase not initialized" } }) }),
            update: () => ({ eq: () => ({ error: { message: "Supabase not initialized" } }) })
        })
    };
}

export const supabase = supabaseInstance;
