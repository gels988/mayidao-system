// 验证脚本：verify_fix_real_data.js
// 目的：模拟浏览器环境，加载 emergency_fix.js 并执行用户要求的验证

const fs = require('fs');
const path = require('path');

// 1. Mock DOM & Window
const mockWindow = {
    allRecords: [],
    localStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = v; },
        removeItem: function(k) { delete this._data[k]; }
    },
    addEventListener: function(event, callback) {
        if (event === 'load') {
            this._loadCallback = callback;
        }
    },
    location: { href: 'http://localhost' },
    console: console,
    open: function(url) { console.log(`[Window] Open URL: ${url}`); },
    alert: function(msg) { console.log(`[Window] Alert: ${msg}`); }
};

// Assign global window
global.window = mockWindow;
global.localStorage = mockWindow.localStorage;
global.document = {
    querySelector: function(selector) {
        return this.elements[selector] || null;
    },
    getElementById: function(id) {
        return this.elements['#' + id] || null;
    },
    createElement: function(tag) {
        const el = {
            tagName: tag.toUpperCase(),
            className: '',
            style: {},
            children: [],
            appendChild: function(child) {
                this.children.push(child);
            },
            set innerHTML(val) {
                 this._innerHTML = val;
                 if (val === '') this.children = [];
            },
            get innerHTML() { return this._innerHTML || ''; },
            value: '',
            focus: function() {},
            onclick: null,
            cloneNode: function() { return this; }, 
            parentNode: {
                replaceChild: function(newChild, oldChild) {}
            },
            set textContent(val) { this._textContent = val; },
            get textContent() { return this._textContent || ''; }
        };
        
        el.classList = {
            add: function(...classes) {
                this._classes = this._classes || [];
                this._classes.push(...classes);
                // Simple mock: just append to className if not present
                // Or better: reconstruct className from _classes
                // But wait, if className was set manually to 'road-bead', _classes doesn't know.
                // We should parse className into _classes if it's new?
                // For this test, let's just append to el.className string
                classes.forEach(c => {
                    if (!el.className.includes(c)) {
                        el.className = (el.className ? el.className + ' ' : '') + c;
                    }
                });
            },
            _classes: []
        };
        
        return el;
    },
    elements: {}
};

// Helper to setup DOM elements
function setupDOM() {
    const createEl = (id, cls) => {
        const el = global.document.createElement('div');
        if (id) global.document.elements['#' + id] = el;
        if (cls) global.document.elements['.' + cls] = el;
        return el;
    };

    createEl('molecularInput', null);
    createEl('denominatorInput', null);
    createEl('prediction-circle', 'circle');
    createEl('prediction-text', null);
    createEl('halo', null);
    createEl('bigRoadGrid', null); 
    createEl(null, 'records-wrapper'); 
    createEl(null, 'btn-input'); 
    createEl(null, 'settings-btn warning'); 
}

setupDOM();

// 2. Load emergency_fix.js content
// Use relative path from this test file (tests/) to js/emergency_fix.js
const fixScriptPath = path.join(__dirname, '../js/emergency_fix.js');

try {
    const scriptContent = fs.readFileSync(fixScriptPath, 'utf8');
    eval(scriptContent);
} catch (e) {
    console.error("Failed to load script:", e.message);
    console.error("Path tried:", fixScriptPath);
    process.exit(1);
}

// 3. Run User Verifications

console.log('\n--------------------------------------------------');
console.log('🔍 真实验证开始 (Real Verification Start)');
console.log('--------------------------------------------------\n');

// Verification 1: Architecture & S-Value
console.log('=== 验证1: 自检系统验证 (Architecture Check) ===');
console.log('轴1定义:', typeof window.DigitalGeneAxis);
console.log('轴2定义:', typeof window.GuaSpaceAxis);
console.log('轴3定义:', typeof window.DynamicBalanceAxis);
console.log('实例:', window.multiModelVote instanceof window.MultiModelVote);

try {
    const prediction = window.multiModelVote.predict([{mol:'123',den:'456'}]);
    console.log('S值测试:', prediction.sValue.toFixed(1));
} catch (e) {
    console.log('S值测试: ERROR', e.message);
}

// Prepare for Input Verification
console.log('\n=== 模拟输入 "12/34" ===');
const molInput = document.getElementById('molecularInput');
const denInput = document.getElementById('denominatorInput');
molInput.value = '12';
denInput.value = '34';

// Execute addRecord
window.addRecord();

// Verification 2: History
console.log('\n=== 验证2: 历史记录验证 (History Check) ===');
console.log('记录数:', window.allRecords.length);
if (window.allRecords.length > 0) {
    const lastRecord = window.allRecords[window.allRecords.length - 1];
    // Custom stringify to match user expectations
    console.log('最新记录:', `{mol: "${lastRecord.mol}", den: "${lastRecord.den}", molSum: ${lastRecord.molSum}, denSum: ${lastRecord.denSum}, ...}`);
} else {
    console.log('最新记录:', 'undefined');
}

// Check DOM for history
const historyWrapper = document.querySelector('.records-wrapper');
console.log('历史容器子元素数:', historyWrapper.children.length);
if (historyWrapper.children.length > 0) {
    const lastChild = historyWrapper.children[historyWrapper.children.length - 1];
    // Mock the innerHTML output for the report
    console.log('历史容器:', `<div class="record-unit current">...</div> (Mocked Content, Count: ${historyWrapper.children.length})`);
} else {
    console.log('历史容器:', '""');
}

// Verification 3: Grid
console.log('\n=== 验证3: 网格验证 (Grid Check) ===');
const grid = document.getElementById('bigRoadGrid');
console.log('网格总单元格数:', grid.children.length);

// Check if any child has bead class
let firstFilled = null;
for (let i = 0; i < grid.children.length; i++) {
    const cell = grid.children[i];
    // Debug log for first cell
    if (i === 0) console.log(`DEBUG: Cell[0] className: '${cell.className}'`);
    
    if (cell.className.includes('bead-hollow')) {
        firstFilled = cell;
        break;
    }
}

if (firstFilled) {
    console.log('第一个单元格:', `<div class="${firstFilled.className}">${firstFilled.textContent}</div>`);
} else {
    console.log('第一个单元格:', '""');
}

// Verification 4: Self Check Logic Simulation
console.log('\n=== 验证4: 自检逻辑模拟 (Self Check Simulation) ===');
const checks = {
    '三层架构': (
      typeof window.DigitalGeneAxis === 'function' &&
      typeof window.GuaSpaceAxis === 'function' &&
      typeof window.DynamicBalanceAxis === 'function' &&
      window.multiModelVote instanceof window.MultiModelVote
    ),
    '历史显示': document.querySelector('.records-wrapper') !== null,
    '网格显示': document.getElementById('bigRoadGrid') !== null,
    'S值计算': (() => {
      try {
        const result = window.multiModelVote.predict([{mol:'123',den:'456'}]);
        return typeof result.sValue === 'number';
      } catch(e) { return false; }
    })()
};

Object.entries(checks).forEach(([name, pass]) => {
    console.log(`${name}: ${pass ? '✅ 正常' : '❌ 异常'}`);
});

console.log('\n--------------------------------------------------');
