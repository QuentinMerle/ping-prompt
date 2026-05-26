/**
 * game.js - Chef d'orchestre : Moteur principal et boucle de jeu
 * Dépendances (chargées dans index.html) : fx.js, physics.js, entities.js, items.js, ai-director.js
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

window.gameState = 'START_MENU';
window.isNeuralCoreActive = false;
window.scores = { player: 0, ai: 0 };
window.arcadeScore = 0;
window.aiBehavior = { speed: 1.2, reactionDelay: 0.1, predictiveMode: false };

window.addScore = function(points) {
    if (window.gameState !== 'PLAYING') return;
    
    if (points > 10000 && window.isNeuralCoreActive) {
        console.log("%c⚠️ SECURITY BREACH DETECTED ⚠️", "color: red; font-size: 20px; font-weight: bold; background: black; padding: 10px;");
        console.log("%cNEURAL_CORE: I see what you are trying to do, human.", "color: #00ffcc; font-size: 16px; background: black; padding: 5px;");
        
        if (window.director) {
            window.director.generateResponse("The human player just tried to cheat by injecting a massive fake score into the developer console. Make a funny, playful joke about their terrible hacking skills.");
        }
    }
    
    window.arcadeScore += points;
    if (window.arcadeScore < 0) window.arcadeScore = 0;
    const scoreStr = window.arcadeScore.toString().padStart(6, '0');
    const display = document.getElementById('arcade-score-display');
    if (display) display.innerText = `PTS: ${scoreStr}`;
};

window.onAIReady = function() {
    window.gameState = 'PAUSED';
    
    const downloadContainer = document.getElementById('download-bar-container');
    if (downloadContainer) downloadContainer.style.display = 'none';

    if (typeof FX !== 'undefined') FX.screenshake(25, 30);
    
    window.ai.color = '#f093fb'; 
    window.aiBehavior.speed = 1.2; 
    
    const avatarName = document.getElementById('ai-avatar-name');
    if (avatarName) {
        avatarName.innerText = '😈 NEURAL_CORE :';
        avatarName.style.color = '#f093fb';
        avatarName.style.textShadow = '0 0 10px #f093fb';
    }

    window.isNeuralCoreActive = true;
    
    setTimeout(() => {
        window.gameState = 'PLAYING';
        if (typeof window.audio !== 'undefined' && window.audio.playBGM) {
            window.audio.playBGM();
        }
        window.dispatchEvent(new Event('resize'));
    }, 1500);
};

window.executeAITrick = function(toolName) {
    if (toolName === 'hack_mouse') {
        window.player.controlModifier = -1;
        if (typeof FX !== 'undefined') FX.screenshake(15, 20);
        setTimeout(() => { window.player.controlModifier = 1; }, 3000);
    } else if (toolName === 'change_friction') {
        PHYSICS.friction = 1.0; 
        if (typeof FX !== 'undefined') FX.screenshake(15, 20);
    } else if (toolName === 'ghost_puck') {
        window.pucks.forEach(p => p.isGhost = true);
        if (typeof FX !== 'undefined') FX.screenshake(15, 20);
        setTimeout(() => { window.pucks.forEach(p => p.isGhost = false); }, 4000);
    } else if (toolName === 'spawn_glitch') {
        if (typeof FX !== 'undefined') {
            // Plus de particules, réparties sur tout l'écran avec des couleurs aberrantes
            for (let i = 0; i < 12; i++) {
                FX.spawnParticles(canvas.width * Math.random(), canvas.height * Math.random(), 30, Math.random() > 0.5 ? '#00ffcc' : '#ff0055', 8);
            }
            FX.screenshake(40, 40);
        }
        
        // Vrai effet "Glitch" via les filtres CSS du canvas
        const originalFilter = canvas.style.filter;
        canvas.style.filter = 'invert(1) contrast(200%) hue-rotate(90deg)';
        
        // Flicker
        setTimeout(() => {
            canvas.style.filter = originalFilter;
            setTimeout(() => {
                canvas.style.filter = 'hue-rotate(180deg) sepia(100%)';
                setTimeout(() => { 
                    canvas.style.filter = originalFilter; 
                }, 100);
            }, 100);
        }, 250);
    }
};

window.showBonusAlert = function(text, color) {
    const alertOverlay = document.getElementById('bonus-alert-overlay');
    const alertText = document.getElementById('bonus-alert-text');
    if (alertOverlay && alertText) {
        if (typeof window.audio !== 'undefined' && window.audio.playPowerUpSound) {
            window.audio.playPowerUpSound();
        }
        
        alertText.innerText = text;
        alertText.style.color = color;
        alertText.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
        alertOverlay.classList.remove('hidden');
        setTimeout(() => { alertOverlay.classList.add('hidden'); }, 1500);
    }
};

// Initialisation des entités
window.player = new CircleEntity(100, canvas.height / 2, 30, '#4facfe', 2);
window.ai = new AIEntity(canvas.width - 100, canvas.height / 2, 30, '#888888', 2); 
window.pucks = [new CircleEntity(canvas.width / 2, canvas.height / 2, 15, '#ffffff', 0.5, true)];

// Contrôles Joueur (Souris)
let mouse = { x: 100, y: canvas.height / 2 };
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

function updatePlayer() {
    window.player.vx = (mouse.x - window.player.x) * 0.3 * window.player.controlModifier;
    window.player.vy = (mouse.y - window.player.y) * 0.3 * window.player.controlModifier;
    window.player.update();
    
    window.player.x = Math.max(window.player.radius, Math.min(canvas.width / 2 - window.player.radius, window.player.x));
    window.player.y = Math.max(window.player.radius, Math.min(canvas.height - window.player.radius, window.player.y));
}

function updateAI() {
    const baseAIX = canvas.width - 100;
    
    let targetPuck = window.pucks[0];
    for(let p of window.pucks) {
        if(p.x > targetPuck.x) targetPuck = p;
    }
    
    let targetY = targetPuck.y;
    
    if (targetPuck.x < canvas.width / 2 && window.profiler && window.isNeuralCoreActive) {
        const predictedOffset = window.profiler.getPhysicalPrediction();
        targetY = (canvas.height / 2) + predictedOffset;
    }

    const yDiff = targetY - window.ai.y;
    if (Math.abs(yDiff) > 15) {
        window.ai.vy += Math.sign(yDiff) * window.aiBehavior.speed * 0.2 * (window.ai.controlModifier || 1);
    } else {
        window.ai.vy *= 0.85;
    }

    if (targetPuck.x > canvas.width / 2) {
        if (targetPuck.x < window.ai.x && Math.abs(window.ai.y - targetPuck.y) < 60) {
            window.ai.vx -= window.aiBehavior.speed * 1.5 * (window.ai.controlModifier || 1);
        } else if (targetPuck.x >= window.ai.x) {
            window.ai.vx += window.aiBehavior.speed * 0.8 * (window.ai.controlModifier || 1);
        } else {
            window.ai.vx += (baseAIX - window.ai.x) * 0.05 * (window.ai.controlModifier || 1);
        }
    } else {
        window.ai.vx += (baseAIX - window.ai.x) * 0.1 * (window.ai.controlModifier || 1);
    }

    window.ai.update();

    window.ai.x = Math.max(canvas.width / 2 + window.ai.radius, Math.min(canvas.width - window.ai.radius, window.ai.x));
    window.ai.y = Math.max(window.ai.radius, Math.min(canvas.height - window.ai.radius, window.ai.y));
}

function updatePucks() {
    const goalWidth = 140;
    const goalTop = canvas.height / 2 - goalWidth / 2;
    const goalBottom = canvas.height / 2 + goalWidth / 2;

    for (let i = window.pucks.length - 1; i >= 0; i--) {
        const puck = window.pucks[i];
        puck.update();

        if (puck.y - puck.radius < 0) {
            puck.y = puck.radius;
            puck.vy *= -PHYSICS.restitution;
        } else if (puck.y + puck.radius > canvas.height) {
            puck.y = canvas.height - puck.radius;
            puck.vy *= -PHYSICS.restitution;
        }

        if (puck.x - puck.radius < 0) {
            if (puck.y > goalTop && puck.y < goalBottom) {
                if (typeof FX !== 'undefined') {
                    FX.screenshake(20, 15);
                    FX.spawnParticles(0, puck.y, 50, '#f093fb', 3);
                }
                scoreGoal('ai');
                return;
            } else {
                puck.x = puck.radius;
                puck.vx *= -PHYSICS.restitution;
            }
        } else if (puck.x + puck.radius > canvas.width) {
            if (puck.y > goalTop && puck.y < goalBottom) {
                if (typeof FX !== 'undefined') {
                    FX.screenshake(20, 15);
                    FX.spawnParticles(canvas.width, puck.y, 50, '#4facfe', 3);
                }
                scoreGoal('player');
                return;
            } else {
                puck.x = canvas.width - puck.radius;
                puck.vx *= -PHYSICS.restitution;
            }
        }
    }
}

function scoreGoal(scorer) {
    if (typeof PHYSICS !== 'undefined') PHYSICS.friction = 0.98; 
    
    if (scorer === 'player') {
        window.scores.player++;
        window.addScore(1000); 
        if (window.director && window.director.onGameEvent) window.director.onGameEvent('goal_player');
    } else {
        window.scores.ai++;
        window.addScore(-500); 
        if (window.director && window.director.onGameEvent) window.director.onGameEvent('goal_ai');
    }
    
    document.getElementById('player-score').innerText = window.scores.player;
    document.getElementById('ai-score').innerText = window.scores.ai;
    
    if (window.scores.player >= 15 || window.scores.ai >= 15) {
        triggerGameOver(scorer);
    } else {
        adjustDifficulty();
        window.resetPuck();
    }
}

function triggerGameOver(winner) {
    window.gameState = 'GAME_OVER';
    
    if (winner === 'player') {
        window.addScore(5000);
        if (window.director) window.director.generateResponse("I have been defeated by a human. Write a funny, overly dramatic and silly excuse for why I lost.");
    } else {
        if (window.director) window.director.generateResponse("I just crushed this human 15 to " + window.scores.player + ". Write a funny, playfully smug victory speech.");
    }
    
    if (window.isNeuralCoreActive && winner === 'player') {
        if (window.checkTop10Qualification) window.checkTop10Qualification();
    } else {
        const goScreen = document.getElementById('game-over-screen');
        if (goScreen) {
            goScreen.classList.remove('hidden');
            goScreen.classList.add('active');
        }
    }
}

function adjustDifficulty() {
    if (!window.isNeuralCoreActive) return;
    
    const diff = window.scores.ai - window.scores.player;
    
    if (diff >= 6) {
        window.aiBehavior.speed = 0.7; 
    } else if (diff >= 3) {
        window.aiBehavior.speed = 1.0;
    } else if (Math.abs(diff) <= 2) {
        window.aiBehavior.speed = 1.2;
    } else if (diff <= -3) {
        window.aiBehavior.speed = 1.8;
    }
}

window.resetPuck = function() {
    window.pucks = [new CircleEntity(canvas.width / 2, canvas.height / 2, 15, '#ffffff', 0.5, true)];
};

function drawTable() {
    ctx.strokeStyle = 'rgba(240, 147, 251, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    
    for(let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for(let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#f093fb';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f093fb';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    const goalWidth = 160;
    ctx.fillStyle = 'rgba(240, 147, 251, 0.15)';
    ctx.fillRect(0, canvas.height / 2 - goalWidth / 2, 15, goalWidth);
    ctx.fillRect(canvas.width - 15, canvas.height / 2 - goalWidth / 2, 15, goalWidth);
}

function gameLoop() {
    if (window.gameState === 'PLAYING') {
        updateItems(canvas, window.player, window.ai, window.pucks, window.aiBehavior);
        updatePlayer();
        updateAI();
        updatePucks();

        if (typeof FX !== 'undefined') {
            for (let puck of window.pucks) {
                const puckSpeed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
                if (puckSpeed > 5) {
                    FX.addTrail(puck.x, puck.y, puck.radius, puck.trailColor || '#ffffff');
                }
            }
            FX.update();
        }

        for (let puck of window.pucks) {
            if (checkCollision(window.player, puck, true)) {
                window.addScore(10);
                if (typeof window.profiler !== 'undefined') {
                    window.profiler.recordShot(puck.y, puck.vy, canvas.height);
                }
            }
            checkCollision(window.ai, puck, true);
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (typeof FX !== 'undefined') FX.applyShake(ctx);

    drawTable();
    if (typeof FX !== 'undefined') FX.draw(ctx);
    drawItems(ctx); 
    
    window.player.draw(ctx);
    window.ai.draw(ctx);
    for (let puck of window.pucks) puck.draw(ctx);

    if (typeof FX !== 'undefined') FX.restore(ctx);

    requestAnimationFrame(gameLoop);
}

gameLoop();
