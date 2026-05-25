// ui.js - Gestion des menus et de l'interface

window.togglePause = function() {
    if (window.gameState === 'LOADING') return;
    
    const pauseScreen = document.getElementById('pause-screen');
    if (window.gameState === 'PLAYING') {
        window.gameState = 'PAUSED';
        if (pauseScreen) {
            pauseScreen.classList.remove('hidden');
            pauseScreen.classList.add('active');
        }
    } else if (window.gameState === 'PAUSED') {
        window.gameState = 'PLAYING';
        if (pauseScreen) {
            pauseScreen.classList.remove('active');
            pauseScreen.classList.add('hidden');
        }
    }
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        window.togglePause();
    }
});

const resumeBtn = document.getElementById('resume-btn');
if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
        if (window.gameState === 'PAUSED') window.togglePause();
    });
}

// UI Customization & Start
const colorBtns = document.querySelectorAll('.color-btn');
colorBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        colorBtns.forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        const playerColor = e.target.dataset.color;
        if (window.player) window.player.color = playerColor;
        document.getElementById('player-score').style.color = playerColor;
    });
});

document.getElementById('start-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('player-name-setup');
    let playerName = "Human";
    if (nameInput && nameInput.value.trim() !== '') {
        playerName = nameInput.value.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 12).trim();
    }
    if (playerName === '') playerName = "Human";
    
    if (window.director && typeof window.director.updatePlayerName === 'function') {
        window.director.updatePlayerName(playerName);
    }

    window.gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('active');
    
    const topHud = document.getElementById('top-hud-bar');
    const bottomHud = document.getElementById('bottom-hud-bar');
    if (topHud) topHud.classList.remove('hidden');
    if (bottomHud) bottomHud.classList.remove('hidden');
    
    if (typeof window.audio !== 'undefined' && window.audio.playBGM) {
        window.audio.playBGM();
    }
});

window.resetToMenu = function() {
    document.getElementById('leaderboard-screen').classList.remove('active');
    document.getElementById('leaderboard-screen').classList.add('hidden');
    document.getElementById('out-of-top-10-screen').classList.remove('active');
    document.getElementById('out-of-top-10-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.add('hidden');
    
    window.scores.player = 0;
    window.scores.ai = 0;
    window.arcadeScore = 0;
    window.addScore(0);
    document.getElementById('player-score').innerText = 0;
    document.getElementById('ai-score').innerText = 0;
    window.resetPuck();
    
    const startScreen = document.getElementById('start-screen');
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');
    window.gameState = 'START_MENU';
    
    if (window.isNeuralCoreActive && window.director) {
        window.director.generateResponse("The human clicked 'REMATCH' and wants to play again. Make a funny, cheeky comment welcoming them back for another defeat.");
    }
};

document.getElementById('leaderboard-close-btn').addEventListener('click', window.resetToMenu);
document.getElementById('retry-btn').addEventListener('click', window.resetToMenu);
const rematchBtn = document.getElementById('rematch-btn');
if (rematchBtn) rematchBtn.addEventListener('click', window.resetToMenu);
