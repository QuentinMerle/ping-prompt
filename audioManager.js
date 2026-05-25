// audioManager.js
class AudioManager {
    constructor() {
        this.bgm = new Audio('assets/mfcc-retro-arcade-game-music-297305.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.25;
        
        // Pool de sons pour pouvoir en jouer plusieurs en même temps (les collisions rapides)
        this.maxHitSounds = 10;
        this.hitPool = [];
        for (let i = 0; i < this.maxHitSounds; i++) {
            const audio = new Audio('assets/cling.mp3');
            this.hitPool.push(audio);
        }
        this.poolIndex = 0;
        
        this.isMuted = false;
        this.audioContextStarted = false;
        
        // L'interaction de l'utilisateur permet de débloquer l'audio
        window.addEventListener('click', () => {
            if (!this.audioContextStarted && typeof gameState !== 'undefined' && gameState !== 'LOADING' && !this.isMuted) {
                this.startBGM();
            }
        }, { once: true });
        
        // Gestion du bouton Mute
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.isMuted) {
                    this.isMuted = false;
                    if (this.audioContextStarted) this.startBGM();
                    muteBtn.innerText = "🎵 ON";
                } else {
                    this.isMuted = true;
                    this.pauseBGM();
                    muteBtn.innerText = "🔇 OFF";
                }
            });
        }
    }
    
    startBGM() {
        if (!this.audioContextStarted) {
            this.audioContextStarted = true;
        }
        if (this.bgm.paused) {
            this.bgm.play().catch(e => console.log("Audio en attente d'interaction utilisateur", e));
        }
    }
    
    pauseBGM() {
        this.bgm.pause();
    }
    
    playCling(intensity) {
        if (this.isMuted || !this.audioContextStarted) return;
        
        // Normaliser l'intensité de la collision (souvent entre 5 et 30) pour le volume (0.0 à 1.0)
        const vol = Math.max(0.05, Math.min(1.0, intensity / 20));
        
        const sound = this.hitPool[this.poolIndex];
        sound.volume = vol * 0.7; 
        
        // Variation subtile du pitch
        sound.playbackRate = 0.8 + Math.random() * 0.4;
        
        sound.currentTime = 0;
        sound.play().catch(e => {});
        this.poolIndex = (this.poolIndex + 1) % this.maxHitSounds;
    }
    
    // Génère un son 8-bit "Power Up" à la volée (Zéro fichier MP3 requis)
    playPowerUpSound() {
        if (this.isMuted || !this.audioContextStarted) return;
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.synthCtx) this.synthCtx = new AudioContext();
        
        const osc = this.synthCtx.createOscillator();
        const gainNode = this.synthCtx.createGain();
        
        osc.type = 'square'; // Son très Arcade/Nintendo
        osc.frequency.setValueAtTime(440, this.synthCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(880, this.synthCtx.currentTime + 0.1); // Slide rapide vers l'aigu
        
        gainNode.gain.setValueAtTime(0.15, this.synthCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.synthCtx.currentTime + 0.3); // Fade out rapide
        
        osc.connect(gainNode);
        gainNode.connect(this.synthCtx.destination);
        
        osc.start();
        osc.stop(this.synthCtx.currentTime + 0.3);
    }
}

window.audio = new AudioManager();
