
const SUPABASE_URL = 'https://xhfyfkqfykkbbnlwghem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZnlma3FmeWtrYmJubHdnaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODA4ODEsImV4cCI6MjA4NDA1Njg4MX0.SVUTAVSWi-skCq3N3KioTetV40IWt0vNkewA0WqEfcg';

let supabaseClient = null;

function initSupabaseClient() {
    if (!window.supabase) {
        return;
    }
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
}

function isValidPhone(phone) {
    if (!phone) return false;
    return phone.replace(/\s+/g, "").length >= 4;
}

async function autoRecoverAccount(deviceHash) {
    // Auto-recover disabled due to schema change (moving to app_users without device_hash)
    // This ensures stability with the new backend.
    return null;
}

async function submitRegistration() {
    const phoneInput = document.getElementById("phoneInput");
    const submitBtn = document.getElementById("submitBtn");
    const errorText = document.getElementById("errorText");
    if (!phoneInput || !submitBtn) {
        return;
    }
    const phone = (phoneInput.value || "").trim();
    if (!isValidPhone(phone)) {
        if (errorText) {
            errorText.textContent = "请输入一个联系方式或标识（长度至少 4 个字符）";
        } else {
            alert("请输入一个联系方式或标识（长度至少 4 个字符）");
        }
        return;
    }

    if (!supabaseClient) {
        initSupabaseClient();
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "处理中...";
    if (errorText) {
        errorText.textContent = "";
    }

    try {
        // 1. Check if user exists in app_users
        const { data: existing, error: searchError } = await supabaseClient
            .from('app_users')
            .select('*')
            .eq('phone_number', phone)
            .maybeSingle();

        if (searchError && searchError.code !== 'PGRST116') throw searchError;

        if (!existing) {
            // 2. Create new user if not exists
            const { error: insertError } = await supabaseClient
                .from('app_users')
                .insert([{ 
                    phone_number: phone, 
                    balance_g: 180 
                }]);
            
            if (insertError) throw insertError;
        } else {
             console.log("User already exists, logging in directly.");
             // Optional: Update last_login time if field existed
        }

        // 3. Save Local State
        localStorage.setItem("registered", "true");
        localStorage.setItem("mayiju_user_phone", phone); // For AuthBridge
        localStorage.setItem("phone", phone); // Legacy support

        submitBtn.textContent = "成功，正在进入...";
        setTimeout(function () {
            window.location.href = "index.html";
        }, 800);
    } catch (e) {
        console.error("Registration Error:", e);
        if (errorText) {
            errorText.textContent = "注册/登录失败: " + (e.message || "网络错误");
        } else {
            alert("注册失败，请稍后重试");
        }
        submitBtn.disabled = false;
        submitBtn.textContent = "领取 180 分试玩";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const submitBtn = document.getElementById("submitBtn");
    const errorText = document.getElementById("errorText");
    const already = localStorage.getItem("registered");
    
    // Auto-redirect if already registered
    if (already === "true") {
        window.location.href = "index.html";
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = false;
    }
    
    // Init Supabase
    initSupabaseClient();
    
    if (submitBtn) {
        submitBtn.addEventListener("click", function () {
            submitRegistration();
        });
    }
});
