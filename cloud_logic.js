const SUPABASE_URL = "https://xhfyfkqfykkbbnlwghem.supabase.co";
const SUPABASE_KEY = "在此填入你的 Supabase Anon Key";
let supabaseClient = null;
function showLoginModal(){var m=document.getElementById("login-modal");if(m){m.style.display="flex";}}
function hideLoginModal(){var m=document.getElementById("login-modal");if(m){m.style.display="none";}}
function setUser(phone){var el=document.getElementById("user-id-display");if(el){el.innerText=phone||"User";}}
function updateBalanceDisplay(balance){var el=document.getElementById("g-coin-display");if(el){el.innerText=Math.floor(balance||0).toLocaleString();}}
async function refreshCloudBalance(phone){if(!supabaseClient||!phone)return;var q=await supabaseClient.from("app_users").select("phone_number,balance_g").eq("phone_number",phone).maybeSingle();if(q&&q.data&&typeof q.data.balance_g!=="undefined"){updateBalanceDisplay(q.data.balance_g);if(window.ui&&typeof window.ui.updateBalance==="function"){window.ui.updateBalance(q.data.balance_g);}}}
function initSupabase(){if(!window.supabase)return;supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);window.__SUPABASE_ANON_KEY__=SUPABASE_KEY;}
function bindLogin(){var btn=document.getElementById("btn-login-confirm");if(!btn)return;btn.addEventListener("click",async function(){var input=document.getElementById("login-phone");var phone=(input&&input.value||"").trim();if(!phone){return;}localStorage.setItem("current_phone",phone);setUser(phone);hideLoginModal();await refreshCloudBalance(phone);});}
document.addEventListener("DOMContentLoaded",async function(){initSupabase();bindLogin();var phone=(localStorage.getItem("current_phone")||"").trim();if(!phone){showLoginModal();}else{setUser(phone);await refreshCloudBalance(phone);}});
