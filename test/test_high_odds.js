const fs = require('fs');
const path = require('path');

// Mock HighOddsPredictor
class HighOddsPredictor {
    constructor() {
        this.predictors = {};
    }
}
global.HighOddsPredictor = HighOddsPredictor;

// Helper to load file content
function loadModule(filename) {
    const content = fs.readFileSync(path.join(__dirname, '..', 'js', filename), 'utf8');
    eval(content);
}

// Load special prediction logic
console.log('Loading predict-special.js...');
loadModule('predict-special.js');

// Test data
// 3 rounds, number 1 appears 3 times (in mol of each round)
const history = [
    { mol: [1, 2], den: [3, 4] },
    { mol: [1, 5], den: [6, 7] },
    { mol: [1, 8], den: [9, 0] } 
];

// Instantiate and test
console.log('Testing predictCrown...');
const predictor = new HighOddsPredictor();

if (typeof predictor.predictCrown !== 'function') {
    console.error('FAIL: predictCrown method not found on prototype.');
    process.exit(1);
}

const result = predictor.predictCrown(history);
console.log('Crown Prediction Result:', result);

if (result.confidence > 0 && result.event === 'crown') {
    console.log('PASS: Crown prediction logic verified.');
} else {
    console.error('FAIL: Crown prediction logic failed.');
    process.exit(1);
}

console.log('Testing predictPanda...');
const resultPanda = predictor.predictPanda(history);
console.log('Panda Prediction Result:', resultPanda);

if (resultPanda.confidence > 0 && resultPanda.event === 'panda') {
    console.log('PASS: Panda prediction logic verified.');
} else {
    console.error('FAIL: Panda prediction logic failed.');
    process.exit(1);
}
