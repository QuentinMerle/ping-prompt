/**
 * fx.js - Moteur d'effets visuels "Juice" (Screenshake, Particles, Trails)
 */

class FXManager {
    constructor() {
        this.particles = [];
        this.trails = [];
        
        // État du Screenshake
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    screenshake(duration = 20, magnitude = 10) {
        // Ne remplace pas le shake si un plus gros est déjà en cours
        if (this.shakeTime > 0 && this.shakeMagnitude > magnitude) return;
        this.shakeTime = duration;
        this.shakeMagnitude = magnitude;
    }

    applyShake(ctx) {
        if (this.shakeTime > 0) {
            this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeMagnitude;
            this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeMagnitude;
            
            ctx.save();
            ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
            
            this.shakeTime--;
            this.shakeMagnitude *= 0.9; // Amortissement fluide
        } else {
            ctx.save(); // On sauvegarde toujours pour que restore() ne lève pas d'erreur
        }
    }

    restore(ctx) {
        ctx.restore();
    }

    spawnParticles(x, y, count, color = '#ffffff', speedMultiplier = 1) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15 * speedMultiplier,
                vy: (Math.random() - 0.5) * 15 * speedMultiplier,
                life: 1,
                decay: 0.02 + Math.random() * 0.04,
                color: color,
                size: 2 + Math.random() * 4
            });
        }
    }

    addTrail(x, y, radius, color) {
        this.trails.push({
            x: x,
            y: y,
            radius: radius,
            color: color,
            life: 1,
            decay: 0.08
        });
    }

    update() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        this.trails.forEach(t => {
            t.life -= t.decay;
            t.radius *= 0.92;
        });
        this.trails = this.trails.filter(t => t.life > 0);
    }

    draw(ctx) {
        // Rendu additif (Screen) pour l'effet néon lumineux
        ctx.globalCompositeOperation = 'screen';
        
        this.trails.forEach(t => {
            ctx.shadowBlur = 10;
            ctx.shadowColor = t.color;
            ctx.fillStyle = `rgba(255, 255, 255, ${t.life * 0.4})`;
            ctx.fillRect(t.x - t.radius, t.y - t.radius, t.radius * 2, t.radius * 2);
        });
        ctx.shadowBlur = 0;
        
        // Remise en standard pour les particules solides
        ctx.globalCompositeOperation = 'source-over';
        
        this.particles.forEach(p => {
            const size = Math.max(0.1, p.size * p.life);
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x - size, p.y - size, size * 2, size * 2);
        });
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

const FX = new FXManager();
