/**
 * physics.js - Constantes et fonctions physiques globales
 */

const PHYSICS = {
    friction: 0.98,
    restitution: 0.9, // Coefficient de rebond
    maxSpeed: 20
};

/**
 * Gère la collision élastique entre deux cercles
 */
function checkCollision(circle1, circle2, isPaddleCollision = false) {
    const dx = circle2.x - circle1.x;
    const dy = circle2.y - circle1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < circle1.radius + circle2.radius) {
        // Résolution du chevauchement (anti-encastrement)
        const overlap = (circle1.radius + circle2.radius - distance) / 2;
        const nx = dx / distance;
        const ny = dy / distance;
        
        circle1.x -= overlap * nx;
        circle1.y -= overlap * ny;
        circle2.x += overlap * nx;
        circle2.y += overlap * ny;

        // Vitesse le long de la normale
        const rvx = circle1.vx - circle2.vx;
        const rvy = circle1.vy - circle2.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        // Ne rien faire s'ils s'éloignent
        if (velAlongNormal < 0) return false;

        // Calcul de l'impulsion (restitution)
        const e = PHYSICS.restitution; 
        const j = -(1 + e) * velAlongNormal;
        const impulse = j / (1 / circle1.mass + 1 / circle2.mass);

        circle1.vx += (impulse / circle1.mass) * nx;
        circle1.vy += (impulse / circle1.mass) * ny;
        
        // Boost dynamique si la raquette frappe le palet
        const puckMultiplier = isPaddleCollision ? 1.4 : 1.0;
        circle2.vx -= (impulse / circle2.mass) * nx * puckMultiplier;
        circle2.vy -= (impulse / circle2.mass) * ny * puckMultiplier;
        
        // --- GAME JUICE : Déclenchement des effets visuels lors d'un choc ---
        if (typeof FX !== 'undefined' && Math.abs(impulse) > 6) {
            // Tremblement léger de l'écran basé sur la force du choc
            FX.screenshake(5, Math.min(Math.abs(impulse) * 0.4, 8));
            
            // Audio
            if (typeof window.audio !== 'undefined' && window.audio.playCling) {
                window.audio.playCling(Math.abs(impulse));
            }

            // Étincelles générées au point de collision
            const collisionX = circle1.x - overlap * nx;
            const collisionY = circle1.y - overlap * ny;
            FX.spawnParticles(collisionX, collisionY, Math.min(Math.floor(Math.abs(impulse) * 1.5), 25), '#ffffff', 1.2);
            
            // Transfert de la couleur d'énergie pour la traînée du palet
            if (isPaddleCollision && circle2.isPuck) {
                circle2.trailColor = circle1.color;
            }
        }
        return true;
    }
    return false;
}
