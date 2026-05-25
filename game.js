/**
 * game.js - Chef d'orchestre : Moteur principal et boucle de jeu
 * Dépendances (chargées dans index.html) : fx.js, physics.js, entities.js, items.js, ai-director.js
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- SUPABASE INIT ---
const SUPABASE_URL = 'https://lherbpwqwuobwpserxfq.supabase.co';
const SUPABASE_KEY = 'sb_publishable__GUmv0frV_kbgRrak2824g_eTR6FJlL';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- MACHINE D'ÉTAT ---
let gameState = 'START_MENU'; // On démarre sur le menu principal
window.isNeuralCoreActive = false; // Flag pour savoir si l'IA complète a pris le relais
let scores = { player: 0, ai: 0 };
let arcadeScore = 0; // Score de points
const aiBehavior = { speed: 1.2, reactionDelay: 0.1, predictiveMode: false }; // Commence très lent (Training Bot)

// --- SYSTÈME DE POINTS (ARCADE) ---
window.addScore = function(points) {
    if (gameState !== 'PLAYING') return;
    
    // Détection de triche (Hack Console)
    if (points > 10000 && window.isNeuralCoreActive) {
        console.log("%c⚠️ SECURITY BREACH DETECTED ⚠️", "color: red; font-size: 20px; font-weight: bold; background: black; padding: 10px;");
        console.log("%cNEURAL_CORE: I see what you are trying to do, human.", "color: #00ffcc; font-size: 16px; background: black; padding: 5px;");
        
        if (window.director) {
            window.director.generateResponse("The human player just tried to cheat by injecting a massive fake score into the developer console. Make a funny, playful joke about their terrible hacking skills.");
        }
    }
    
    arcadeScore += points;
    if (arcadeScore < 0) arcadeScore = 0;
    const scoreStr = arcadeScore.toString().padStart(6, '0');
    const display = document.getElementById('arcade-score-display');
    if (display) display.innerText = `PTS: ${scoreStr}`;
};

// Callback appelé par ai-director.js quand WebLLM est 100% chargé (Prise de contrôle du Boss)
window.onAIReady = function() {
    // Figer le jeu
    gameState = 'PAUSED';
    
    // Disparition de la barre
    const downloadContainer = document.getElementById('download-bar-container');
    if (downloadContainer) downloadContainer.style.display = 'none';

    // Screenshake massif
    if (typeof FX !== 'undefined') FX.screenshake(25, 30);
    
    // Changement cosmétique de l'IA
    ai.color = '#f093fb'; // Devient Rose Néon
    aiBehavior.speed = 1.2; // Vitesse de boss (Nerfée de 1.7 à 1.2)
    
    // Changement HTML
    const avatarName = document.getElementById('ai-avatar-name');
    if (avatarName) {
        avatarName.innerText = '😈 NEURAL_CORE :';
        avatarName.style.color = '#f093fb';
        avatarName.style.textShadow = '0 0 10px #f093fb';
    }

    // Le "Boss" est là
    window.isNeuralCoreActive = true;
    
    // Reprendre le jeu après 1.5s d'effet
    setTimeout(() => {
        gameState = 'PLAYING';
        if (typeof window.audio !== 'undefined' && window.audio.playBGM) {
            window.audio.playBGM();
        }
        window.dispatchEvent(new Event('resize'));
    }, 1500);
};

// --- TOOL CALLING : TRICHES DE L'IA ---
window.executeAITrick = function(toolName) {
    if (toolName === 'hack_mouse') {
        player.controlModifier = -1; // Inverse les contrôles
        if (typeof FX !== 'undefined') FX.screenshake(15, 20);
        setTimeout(() => { player.controlModifier = 1; }, 3000);
    } else if (toolName === 'change_friction') {
        PHYSICS.friction = 1.0; // Plus aucune friction
        if (typeof FX !== 'undefined') FX.screenshake(15, 20);
    } else if (toolName === 'ghost_puck') {
        window.pucks.forEach(p => p.isGhost = true);
        if (typeof FX !== 'undefined') FX.screenshake(15, 20);
        setTimeout(() => { window.pucks.forEach(p => p.isGhost = false); }, 4000);
    } else if (toolName === 'spawn_glitch') {
        if (typeof FX !== 'undefined') {
            for (let i = 0; i < 5; i++) {
                FX.spawnParticles(canvas.width / 2 + (Math.random() - 0.5) * 300, canvas.height / 2 + (Math.random() - 0.5) * 200, 40, '#f093fb', 4);
            }
            FX.screenshake(30, 30);
        }
    }
};

window.showBonusAlert = function(text, color) {
    const alertOverlay = document.getElementById('bonus-alert-overlay');
    const alertText = document.getElementById('bonus-alert-text');
    if (alertOverlay && alertText) {
        // Déclenche le son 8-bit
        if (typeof window.audio !== 'undefined' && window.audio.playPowerUpSound) {
            window.audio.playPowerUpSound();
        }
        
        alertText.innerText = text;
        alertText.style.color = color;
        alertText.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
        
        alertOverlay.classList.remove('hidden');
        
        // Cacher après 1.5s
        setTimeout(() => {
            alertOverlay.classList.add('hidden');
        }, 1500);
    }
};

// Gestion de la Pause
function togglePause() {
    if (gameState === 'LOADING') return; // Impossible de mettre en pause pendant le chargement
    
    const pauseScreen = document.getElementById('pause-screen');
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        if (pauseScreen) {
            pauseScreen.classList.remove('hidden');
            pauseScreen.classList.add('active');
        }
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        if (pauseScreen) {
            pauseScreen.classList.remove('active');
            pauseScreen.classList.add('hidden');
        }
    }
}

// Écouteurs globaux
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        togglePause();
    }
});

const resumeBtn = document.getElementById('resume-btn');
if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
        if (gameState === 'PAUSED') togglePause();
    });
}

// Initialisation des entités
const player = new CircleEntity(100, canvas.height / 2, 30, '#4facfe', 2);
const ai = new AIEntity(canvas.width - 100, canvas.height / 2, 30, '#888888', 2); // Commence gris (Dummy)
window.pucks = [new CircleEntity(canvas.width / 2, canvas.height / 2, 15, '#ffffff', 0.5, true)];

// UI Customization & Start
let playerColor = '#4facfe';
const colorBtns = document.querySelectorAll('.color-btn');
colorBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        colorBtns.forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        playerColor = e.target.dataset.color;
        player.color = playerColor;
        document.getElementById('player-score').style.color = playerColor;
    });
});

document.getElementById('start-btn').addEventListener('click', () => {
    gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('active');
    
    // Révéler les barres HUD (Game UI)
    const topHud = document.getElementById('top-hud-bar');
    const bottomHud = document.getElementById('bottom-hud-bar');
    if (topHud) topHud.classList.remove('hidden');
    if (bottomHud) bottomHud.classList.remove('hidden');
    
    if (typeof window.audio !== 'undefined' && window.audio.playBGM) {
        window.audio.playBGM();
    }
});

// Contrôles Joueur (Souris)
let mouse = { x: 100, y: canvas.height / 2 };
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

function updatePlayer() {
    // controlModifier est à 1 par défaut, ou 0.15 sous l'effet dévastateur du Freeze
    player.vx = (mouse.x - player.x) * 0.3 * player.controlModifier;
    player.vy = (mouse.y - player.y) * 0.3 * player.controlModifier;
    player.update();
    
    player.x = Math.max(player.radius, Math.min(canvas.width / 2 - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
}

function updateAI() {
    const baseAIX = canvas.width - 100;
    
    // Trouver le palet le plus dangereux (le plus proche du but de l'IA)
    let targetPuck = window.pucks[0];
    for(let p of window.pucks) {
        if(p.x > targetPuck.x) targetPuck = p;
    }
    
    let targetY = targetPuck.y;
    
    // PRESCIENCE BRAIN.JS : Si le palet est chez le joueur, l'IA se pré-positionne
    if (targetPuck.x < canvas.width / 2 && window.profiler && window.isNeuralCoreActive) {
        const predictedOffset = window.profiler.getPhysicalPrediction();
        // Au lieu de suivre bêtement le palet, elle se place là où elle PENSE que vous allez tirer
        targetY = (canvas.height / 2) + predictedOffset;
    }

    const yDiff = targetY - ai.y;
    if (Math.abs(yDiff) > 15) {
        ai.vy += Math.sign(yDiff) * aiBehavior.speed * 0.2 * (ai.controlModifier || 1);
    } else {
        ai.vy *= 0.85;
    }

    if (targetPuck.x > canvas.width / 2) {
        if (targetPuck.x < ai.x && Math.abs(ai.y - targetPuck.y) < 60) {
            ai.vx -= aiBehavior.speed * 1.5 * (ai.controlModifier || 1);
        } else if (targetPuck.x >= ai.x) {
            ai.vx += aiBehavior.speed * 0.8 * (ai.controlModifier || 1);
        } else {
            ai.vx += (baseAIX - ai.x) * 0.05 * (ai.controlModifier || 1);
        }
    } else {
        ai.vx += (baseAIX - ai.x) * 0.1 * (ai.controlModifier || 1);
    }

    ai.update();

    ai.x = Math.max(canvas.width / 2 + ai.radius, Math.min(canvas.width - ai.radius, ai.x));
    ai.y = Math.max(ai.radius, Math.min(canvas.height - ai.radius, ai.y));
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
                if (typeof FX !== 'undefined') FX.screenshake(20, 15);
                if (typeof FX !== 'undefined') FX.spawnParticles(0, puck.y, 50, '#f093fb', 3);
                scoreGoal('ai');
                return; // Fin immédiate du cycle
            } else {
                puck.x = puck.radius;
                puck.vx *= -PHYSICS.restitution;
            }
        } else if (puck.x + puck.radius > canvas.width) {
            if (puck.y > goalTop && puck.y < goalBottom) {
                if (typeof FX !== 'undefined') FX.screenshake(20, 15);
                if (typeof FX !== 'undefined') FX.spawnParticles(canvas.width, puck.y, 50, '#4facfe', 3);
                scoreGoal('player');
                return; // Fin immédiate du cycle
            } else {
                puck.x = canvas.width - puck.radius;
                puck.vx *= -PHYSICS.restitution;
            }
        }
    }
}

function scoreGoal(scorer) {
    if (typeof PHYSICS !== 'undefined') PHYSICS.friction = 0.98; // Reset si friction hackée par l'IA
    
    if (scorer === 'player') {
        scores.player++;
        window.addScore(1000); // +1000 pour un but marqué
        if (window.director && window.director.onGameEvent) window.director.onGameEvent('goal_player');
    } else {
        scores.ai++;
        window.addScore(-500); // -500 pour un but encaissé
        if (window.director && window.director.onGameEvent) window.director.onGameEvent('goal_ai');
    }
    
    document.getElementById('player-score').innerText = scores.player;
    document.getElementById('ai-score').innerText = scores.ai;
    
    if (scores.player >= 15 || scores.ai >= 15) {
        triggerGameOver(scorer);
    } else {
        adjustDifficulty();
        resetPuck();
    }
}

function triggerGameOver(winner) {
    gameState = 'GAME_OVER';
    
    if (winner === 'player') {
        window.addScore(5000); // Gros bonus de victoire
        if (window.director) window.director.generateResponse("I have been defeated by a human. Write a funny, overly dramatic and silly excuse for why I lost.");
    } else {
        if (window.director) window.director.generateResponse("I just crushed this human 15 to " + scores.player + ". Write a funny, playfully smug victory speech.");
    }
    
    // Check du Top 10 avant de proposer la saisie (uniquement si victoire ET si LLM actif)
    if (window.isNeuralCoreActive && winner === 'player') {
        checkTop10Qualification();
    } else {
        const goScreen = document.getElementById('game-over-screen');
        if (goScreen) {
            goScreen.classList.remove('hidden');
            goScreen.classList.add('active');
        }
    }
}

// --- GESTION DU LEADERBOARD (SUPABASE CLOUD) ---

async function checkTop10Qualification() {
    try {
        const { data, error } = await supabaseClient
            .from('highscores')
            .select('score')
            .order('score', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        let minScore = 0;
        if (data && data.length === 10) {
            minScore = data[9].score; // Le 10ème score
        }
        
        if (arcadeScore > minScore || data.length < 10) {
            // Qualifié pour le Top 10
            const inputScreen = document.getElementById('arcade-input-screen');
            document.getElementById('final-score-display').innerText = `YOUR SCORE: ${arcadeScore.toString().padStart(6, '0')}`;
            inputScreen.classList.remove('hidden');
            inputScreen.classList.add('active');
            
            setTimeout(() => {
                const input = document.getElementById('arcade-name-input');
                if (input) input.focus();
            }, 100);
        } else {
            // Hors Top 10 (Gatekeeper block)
            const failScreen = document.getElementById('out-of-top-10-screen');
            document.getElementById('out-score-display').innerText = `YOUR SCORE: ${arcadeScore.toString().padStart(6, '0')}`;
            failScreen.classList.remove('hidden');
            failScreen.classList.add('active');
        }
    } catch (err) {
        console.error("Supabase Error (checkTop10Qualification):", err);
    }
}

async function saveScoreAndShowLeaderboard() {
    const input = document.getElementById('arcade-name-input');
    let name = input.value.toUpperCase().trim() || 'AAA';
    
    // GUARDIAN: Filtre anti-insultes
    const bannedWords = ['ASS', 'DIK', 'FUC', 'FUK', 'TIT', 'CUM', 'SEX', 'BIT', 'PIS', 'POO', 'WTF', 'SUC', 'COK', 'NIG', 'FAG', 'SLU', 'VAG', 'GAY'];
    if (bannedWords.includes(name)) {
        name = 'AAA';
        if (window.director && window.isNeuralCoreActive) {
            window.director.generateResponse("The human just tried to enter a naughty banned word for their high score name. I replaced it with 'AAA'. Make a funny, sarcastic joke about their childish humor.");
        }
    }
    
    // ANTI-TROLL LIMIT
    let finalScore = Math.min(arcadeScore, 9999999);
    
    try {
        await supabaseClient.from('highscores').insert([{ name: name.substring(0, 3), score: finalScore }]);
        await showLeaderboard();
    } catch (err) {
        console.error("Failed to save score to Supabase:", err);
    }
}

async function showLeaderboard() {
    document.getElementById('arcade-input-screen').classList.remove('active');
    document.getElementById('arcade-input-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('hidden');
    
    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#fff; font-size: 0.8rem; padding: 20px;">FETCHING NEURAL DATA...</td></tr>';
    
    const lbScreen = document.getElementById('leaderboard-screen');
    lbScreen.classList.remove('hidden');
    lbScreen.classList.add('active');
    
    try {
        const { data, error } = await supabaseClient
            .from('highscores')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">NO DATA</td></tr>';
        } else {
            data.forEach((entry, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>#${index + 1}</td><td>${entry.name}</td><td>${entry.score.toString().padStart(6, '0')}</td>`;
                tbody.appendChild(tr);
            });
        }
    } catch(err) {
        console.error("Supabase Error (showLeaderboard):", err);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">CLOUD ERROR</td></tr>';
    }
}

// Boutons Leaderboard
document.getElementById('submit-score-btn').addEventListener('click', saveScoreAndShowLeaderboard);

document.getElementById('arcade-name-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveScoreAndShowLeaderboard();
});

document.getElementById('show-leaderboard-btn').addEventListener('click', () => showLeaderboard());

function resetToMenu() {
    document.getElementById('leaderboard-screen').classList.remove('active');
    document.getElementById('leaderboard-screen').classList.add('hidden');
    document.getElementById('out-of-top-10-screen').classList.remove('active');
    document.getElementById('out-of-top-10-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.add('hidden');
    
    scores.player = 0;
    scores.ai = 0;
    arcadeScore = 0;
    window.addScore(0);
    document.getElementById('player-score').innerText = 0;
    document.getElementById('ai-score').innerText = 0;
    resetPuck();
    
    const startScreen = document.getElementById('start-screen');
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');
    gameState = 'START_MENU';
    
    if (window.isNeuralCoreActive && window.director) {
        window.director.generateResponse("The human clicked 'REMATCH' and wants to play again. Make a funny, cheeky comment welcoming them back for another defeat.");
    }
}

document.getElementById('leaderboard-close-btn').addEventListener('click', resetToMenu);
document.getElementById('retry-btn').addEventListener('click', resetToMenu);
const rematchBtn = document.getElementById('rematch-btn');
if (rematchBtn) rematchBtn.addEventListener('click', resetToMenu);

// --- DDA (Dynamic Difficulty Adjustment) ---
function adjustDifficulty() {
    if (!window.isNeuralCoreActive) return;
    
    const diff = scores.ai - scores.player;
    
    if (diff >= 6) {
        // Le joueur se fait humilier -> On nerfe fortement l'IA
        aiBehavior.speed = 0.7; 
    } else if (diff >= 3) {
        // L'IA gagne confortablement
        aiBehavior.speed = 1.0;
    } else if (Math.abs(diff) <= 2) {
        // Match serré -> Vitesse nominale du Boss
        aiBehavior.speed = 1.2;
    } else if (diff <= -3) {
        // Le joueur gagne -> L'IA s'énerve et devient surpuissante
        aiBehavior.speed = 1.8;
    }
}

function resetPuck() {
    window.pucks = [new CircleEntity(canvas.width / 2, canvas.height / 2, 15, '#ffffff', 0.5, true)];
}

function drawTable() {
    // Grille Voxel/Wireframe façon Resogun
    ctx.strokeStyle = 'rgba(240, 147, 251, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    
    // Lignes verticales
    for(let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    // Lignes horizontales
    for(let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Ligne médiane lumineuse
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

    // Goals (Zones d'en-but)
    const goalWidth = 160;
    ctx.fillStyle = 'rgba(240, 147, 251, 0.15)';
    ctx.fillRect(0, canvas.height / 2 - goalWidth / 2, 15, goalWidth);
    ctx.fillRect(canvas.width - 15, canvas.height / 2 - goalWidth / 2, 15, goalWidth);
}

function gameLoop() {
    // Si on joue, on met à jour la logique
    if (gameState === 'PLAYING') {
        // 1. Mise à jour de la logique (Moteurs)
        updateItems(canvas, player, ai, window.pucks, aiBehavior);
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

        // 2. Résolution Physique (Géré par physics.js)
        for (let puck of window.pucks) {
            if (checkCollision(player, puck, true)) {
                window.addScore(10); // +10 points par renvoi
                if (typeof window.profiler !== 'undefined') {
                    window.profiler.recordShot(puck.y, puck.vy, canvas.height);
                }
            }
            checkCollision(ai, puck, true);
        }
    }

    // 3. Rendu Graphique (Dessine le jeu même en pause ou en chargement pour l'effet de flou par-dessus)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (typeof FX !== 'undefined') FX.applyShake(ctx); // Applique le tremblement global

    drawTable();
    if (typeof FX !== 'undefined') FX.draw(ctx); // Dessine particules et trails SOUS les entités
    drawItems(ctx); 
    
    player.draw(ctx);
    ai.draw(ctx);
    for (let puck of window.pucks) puck.draw(ctx);

    if (typeof FX !== 'undefined') FX.restore(ctx); // Restaure le contexte non-tremblant

    requestAnimationFrame(gameLoop);
}

// Démarrage du moteur (Commence par le rendu en arrière-plan sous l'écran de chargement)
gameLoop();
