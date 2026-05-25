// ai-profiler.js
class AIProfiler {
    constructor() {
        // Initialize brain.js neural network
        // We use a simple feed-forward network
        this.net = new brain.NeuralNetwork({ hiddenLayers: [4] });
        
        this.trainingData = [];
        this.shotCount = 0;
        this.profile = "Unknown";
        this.isTrained = false;
        
        // Initial dummy training so it doesn't crash on run
        this.net.train([
            { input: { y: 0.1, vy: -1 }, output: { top: 1, bottom: 0, straight: 0 } },
            { input: { y: 0.9, vy: 1 }, output: { top: 0, bottom: 1, straight: 0 } },
            { input: { y: 0.5, vy: 0 }, output: { top: 0, bottom: 0, straight: 1 } }
        ], { iterations: 100 });
    }
    
    recordShot(puckY, puckVY, canvasHeight) {
        // Normalize data
        const normY = puckY / canvasHeight;
        // Normalize velocity roughly between -1 and 1
        const normVY = Math.max(-1, Math.min(1, puckVY / 20));
        
        // Determine the "actual" classification for this shot to use as training data
        let output = { top: 0, bottom: 0, straight: 0 };
        if (normVY < -0.3) output.top = 1;
        else if (normVY > 0.3) output.bottom = 1;
        else output.straight = 1;
        
        this.trainingData.push({
            input: { y: normY, vy: normVY },
            output: output
        });
        
        this.shotCount++;
        
        // Update HUD
        let maxVal = 0;
        let currentTendency = 'STRAIGHT';
        const result = this.net.run({ y: normY, vy: normVY });
        for (const [key, val] of Object.entries(result)) {
            if (val > maxVal) { maxVal = val; currentTendency = key.toUpperCase(); }
        }
        this.updateHUD(puckY, Math.abs(puckVY), currentTendency, maxVal);
        
        // Retrain every 5 shots to adapt to player style
        if (this.trainingData.length >= 5) {
            this.trainAndProfile();
            // Keep only the last 20 shots so it adapts over time
            if (this.trainingData.length > 20) {
                this.trainingData.shift();
            }
        }
    }
    
    trainAndProfile() {
        this.net.train(this.trainingData, {
            iterations: 1000,
            errorThresh: 0.01,
            log: false
        });
        this.isTrained = true;
        this.updateProfile();
    }
    
    updateProfile() {
        // Test the network with a generic central shot to see its bias
        // Since the network learns the player's habits, passing the center will output their most likely tendency
        const result = this.net.run({ y: 0.5, vy: 0 });
        
        if (result.top > result.bottom && result.top > result.straight) {
            this.profile = "The player frequently shoots towards the TOP (your right side).";
        } else if (result.bottom > result.top && result.bottom > result.straight) {
            this.profile = "The player frequently shoots towards the BOTTOM (your left side).";
        } else {
            this.profile = "The player shoots STRAIGHT and directly.";
        }
    }
    
    getProfileContext() {
        if (!this.isTrained || this.shotCount < 5) return "";
        return `[Brain.js Profiler Analysis: ${this.profile}]`;
    }
    
    getPhysicalPrediction() {
        if (!this.isTrained || this.shotCount < 5) return 0;
        
        // Interroge le réseau pour connaître la tendance lourde du joueur
        const result = this.net.run({ y: 0.5, vy: 0 });
        
        // Renvoie un offset en pixels (-90 pour haut, +90 pour bas)
        if (result.top > result.bottom && result.top > result.straight) {
            return -90; // Anticipe en haut
        } else if (result.bottom > result.top && result.bottom > result.straight) {
            return 90; // Anticipe en bas
        } else {
            return 0; // Anticipe au centre
        }
    }
    
    updateHUD(yPos, force, tendency, confidence) {
        const hud = document.getElementById('brain-hud');
        const content = document.getElementById('brain-hud-content');
        
        if (hud && hud.classList.contains('hidden') && window.isNeuralCoreActive) {
            hud.classList.remove('hidden');
        }

        if (content && window.isNeuralCoreActive) {
            const pct = Math.round(confidence * 100);
            let color = '#00ffcc';
            if (pct > 80) color = '#ff0055'; // Danger
            
            content.innerHTML = `L_STRIKE: Y:${Math.round(yPos)} P:${force.toFixed(1)}<br>TARGET: <span style="color:${color}; font-weight:bold;">${tendency}</span><br>CONFIDENCE: ${pct}%`;
            
            hud.style.boxShadow = `0 0 20px ${color}`;
            hud.style.borderColor = color;
            setTimeout(() => {
                hud.style.boxShadow = '0 0 10px rgba(0, 255, 204, 0.2)';
                hud.style.borderColor = '#00ffcc';
            }, 300);
        }
    }
}

window.profiler = new AIProfiler();
