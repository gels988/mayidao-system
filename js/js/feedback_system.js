import { supabase } from './db_client.js';
import { trackEvent } from './tracker.js';

export class FeedbackSystem {
    constructor() {
        this.predictionCount = 0;
        this.hasShown = false;
        this.injectModal();
        this.bindGlobalEvents();
    }

    injectModal() {
        if (document.getElementById('feedback-modal')) return;

        const html = `
        <div id="feedback-modal" style="display:none; position: fixed; bottom: 20px; right: 20px; background: #fff; color: #333; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 9999; font-family: sans-serif; width: 220px; border: 1px solid #ddd;">
            <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0; display:flex; justify-content:space-between;">
                帮助我们改进 💬
                <span id="close-feedback-x" style="cursor:pointer; color:#999;">&times;</span>
            </h3>
            
            <div style="margin-bottom: 10px;">
                <label style="display:block; font-size: 12px; margin-bottom: 4px;">1. 今天的预测准确吗？</label>
                <select id="fb-accuracy" style="width: 100%; padding: 4px; font-size: 12px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="">请选择...</option>
                    <option value="very_high">非常高 (>80%)</option>
                    <option value="high">高 (60-80%)</option>
                    <option value="medium">一般 (40-60%)</option>
                    <option value="low">低 (<40%)</option>
                </select>
            </div>

            <div style="margin-bottom: 10px;">
                <label style="display:block; font-size: 12px; margin-bottom: 4px;">2. 愿意为高准确率捐赠吗？</label>
                <div style="font-size: 12px;">
                    <label style="margin-right: 10px;"><input type="radio" name="fb-pay" value="yes"> 愿意</label>
                    <label><input type="radio" name="fb-pay" value="no"> 不愿意</label>
                </div>
            </div>

            <div style="display:flex; justify-content: space-between; margin-top: 5px;">
                <button id="submit-feedback" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">提交反馈</button>
                <button id="close-feedback" style="background: #f0f0f0; color: #333; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">关闭</button>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Bind internal events
        document.getElementById('submit-feedback').addEventListener('click', () => this.submit());
        document.getElementById('close-feedback').addEventListener('click', () => this.hide());
        document.getElementById('close-feedback-x').addEventListener('click', () => this.hide());
    }

    bindGlobalEvents() {
        // Listen for custom event 'prediction_completed'
        window.addEventListener('prediction_completed', () => {
            this.predictionCount++;
            if (this.predictionCount >= 50 && !this.hasShown) {
                this.show();
            }
        });
    }

    show() {
        if (sessionStorage.getItem('mayiju_feedback_shown')) return;
        
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.style.display = 'block';
            this.hasShown = true;
            sessionStorage.setItem('mayiju_feedback_shown', 'true');
            trackEvent('feedback_modal_shown');
        }
    }

    hide() {
        const modal = document.getElementById('feedback-modal');
        if (modal) modal.style.display = 'none';
    }

    async submit() {
        const accuracy = document.getElementById('fb-accuracy').value;
        const payWilling = document.querySelector('input[name="fb-pay"]:checked')?.value;

        if (!accuracy) {
            alert("请选择准确率评价");
            return;
        }

        // Submit to Supabase
        const { error } = await supabase.from('user_feedback').insert([{
            user_id: window.AuthBridge?.user?.id,
            accuracy_rating: accuracy,
            pay_willing: payWilling
        }]);

        if (!error) {
            alert("感谢您的反馈！");
            this.hide();
            trackEvent('feedback_submitted', { accuracy, payWilling });
        } else {
            console.error("Feedback error:", error);
            alert("提交失败，请重试");
        }
    }
}

// Auto-init
window.feedbackSystem = new FeedbackSystem();
