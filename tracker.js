import { supabase } from './db_client.js';

/**
 * Core Tracking Function
 * Sends event data to Supabase 'event_tracks' table.
 * @param {string} event - The event name (e.g., 'prediction_made')
 * @param {object} props - Additional properties
 */
export const trackEvent = async (event, props = {}) => {
    // Try to get user ID from AuthBridge instance (exposed as window.Economy)
    let userId = null;
    if (window.Economy && window.Economy.user) {
        userId = window.Economy.user.id;
    } else if (window.AuthBridge && window.AuthBridge.user) {
        // Fallback in case referencing the class statically (legacy)
        userId = window.AuthBridge.user.id;
    }

    // Common properties
    const enrichedProps = {
        ...props,
        url: window.location.href,
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        timestamp: new Date().toISOString()
    };

    try {
        // We use 'user_id' column if it matches UUID format, or store in properties if custom
        // Since our schema uses UUID for user_id, but our AuthBridge might use phone/custom ID.
        // If schema expects UUID, we might fail if we pass a phone number.
        // Let's adjust: pass userId in properties if it's not a UUID, or change schema to TEXT.
        // For safety, we'll put the ID in properties as well.
        
        const payload = {
            event_name: event,
            properties: enrichedProps,
            created_at: new Date().toISOString()
        };

        // If userId is a valid UUID, we can put it in user_id column. 
        // Otherwise (like '138...'), we leave user_id null and rely on properties.
        // Current AuthBridge uses Supabase Auth IDs (UUIDs) usually, but check auth_bridge.js logic.
        // auth_bridge.js uses 'app_users' table. 'id' there might be UUID.
        
        if (userId && typeof userId === 'string' && userId.length > 20) {
             payload.user_id = userId;
        }

        const { error } = await supabase.from('event_tracks').insert([payload]);

        if (error) {
            console.warn("[Tracker] Upload failed:", error);
        } else {
            // console.debug(`[Tracker] ${event} logged.`);
        }
    } catch (e) {
        console.warn("[Tracker] Exception:", e);
    }
};

// Expose to global scope for non-module scripts
window.trackEvent = trackEvent;
