(function (global) {
    const SUPABASE_URL = "https://xhfyfkqfykkbbnlwghem.supabase.co";
    const API_PATH = "/rest/v1/audit_logs";

    function getSupabaseKey() {
        if (global && global.__SUPABASE_ANON_KEY__) {
            return global.__SUPABASE_ANON_KEY__;
        }
        if (typeof process !== "undefined" && process.env && process.env.SUPABASE_ANON_KEY) {
            return process.env.SUPABASE_ANON_KEY;
        }
        return "";
    }

    async function sendAudit(entry, stats) {
        const key = getSupabaseKey();
        if (!key || !entry) return;

        const payload = {
            timestamp: entry.timestamp,
            logic_type: entry.type,
            predicted_color: entry.predicted,
            actual_color: entry.actual,
            is_correct: entry.isCorrect,
            raw_codes: entry.raw_codes || null,
            total_samples: stats && stats.total,
            correct_samples: stats && stats.correct,
            resonance_hits: stats && stats.resonance_hits,
            he9_cancellations: stats && stats.he9_cancellations,
            transition_hits: stats && stats.transition_hits,
            cycle_resets: stats && stats.cycle_resets
        };

        try {
            await fetch(SUPABASE_URL + API_PATH, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: key,
                    Authorization: "Bearer " + key,
                    Prefer: "return=minimal"
                },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            if (global && global.console && typeof global.console.warn === "function") {
                global.console.warn("CloudSync audit send failed");
            }
        }
    }

    if (!global.CloudSync) {
        global.CloudSync = {};
    }
    global.CloudSync.sendAudit = sendAudit;
})(typeof window !== "undefined" ? window : this);

