/**
 * entities.js - Définition des entités du jeu (Joueur, Palet, IA)
 */

class CircleEntity {
    constructor(x, y, radius, color, mass = 1, isPuck = false) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.mass = mass;
        this.controlModifier = 1; // Permet de réduire drastiquement le contrôle sous l'effet du Freeze
        this.isPuck = isPuck;
        this.trailColor = '#ffffff'; // Couleur dynamique de la traînée FX
    }

    draw(ctx) {
        ctx.save();
        if (this.isPuck && this.isGhost) {
            ctx.globalAlpha = 0.15; // Rendre le palet presque invisible
        }
        
        ctx.beginPath();
        const sides = this.isPuck ? 4 : 8; // Diamant pour le palet, Octogone pour raquettes
        for (let i = 0; i < sides; i++) {
            // Rotation de 45° pour faire un diamant
            const angle = (i * 2 * Math.PI) / sides + (this.isPuck ? Math.PI/4 : 0); 
            const px = this.x + this.radius * Math.cos(angle);
            const py = this.y + this.radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fill();
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Wireframe interne
        if (!this.isPuck) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    }

    update() {
        // Application de la friction
        this.vx *= PHYSICS.friction;
        this.vy *= PHYSICS.friction;

        // Limite de vitesse (Hard clamp pour les raquettes, Soft clamp pour le palet)
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > PHYSICS.maxSpeed) {
            if (this.isPuck) {
                // Soft clamp : On dissipe l'énergie excédentaire rapidement mais sans blocage brutal
                this.vx *= 0.95;
                this.vy *= 0.95;
            } else {
                // Hard clamp strict pour les raquettes
                this.vx = (this.vx / speed) * PHYSICS.maxSpeed;
                this.vy = (this.vy / speed) * PHYSICS.maxSpeed;
            }
        }

        // Mouvement
        this.x += this.vx;
        this.y += this.vy;
    }
}

/**
 * Raquette avancée de l'IA incluant son rendu robotique "Neural Core"
 */
class AIEntity extends CircleEntity {
    draw(ctx) {
        // Base de la raquette géométrique
        super.draw(ctx);

        // Détection de l'intention
        let isAttacking = this.vx < -5;
        let isDefending = this.vx > 5;

        // Oeil central Voxel
        ctx.beginPath();
        ctx.rect(this.x - this.radius * 0.15, this.y - this.radius * 0.15, this.radius * 0.3, this.radius * 0.3);
        
        if (isAttacking) {
            ctx.fillStyle = '#ff0055'; 
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 20;
        } else if (isDefending) {
            ctx.fillStyle = '#00ffcc'; 
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 15;
        } else {
            const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + pulse * 0.6})`;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;

        // Anneau radar géométrique (Hexagone rotatif)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Date.now() / 300 * (isAttacking ? -4 : 1)); 
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI) / 6;
            const px = (this.radius * 0.7) * Math.cos(angle);
            const py = (this.radius * 0.7) * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        ctx.strokeStyle = isAttacking ? '#ff0055' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        
        ctx.restore();
        ctx.setLineDash([]);
    }
}
