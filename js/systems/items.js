/**
 * items.js - Gestion du système de bonus "Mario Kart"
 */

let activeItems = [];
let lastItemSpawn = Date.now();

function spawnItem(x, y, type) {
    activeItems.push({ x, y, type, radius: 14, collected: false });
}

function drawItems(ctx) {
    activeItems.forEach(item => {
        if (!item.collected) {
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
            
            let color = '#ffb86c';
            let icon = '⚡';
            if (item.type === 'size') { color = '#00ffcc'; icon = '+'; }
            if (item.type === 'freeze') { color = '#8be9fd'; icon = '❄️'; }
            if (item.type === 'multipuck') { color = '#ff00ff'; icon = '🪩'; }
            
            ctx.fillStyle = color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Icône
            ctx.fillStyle = '#121217';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = (item.type === 'freeze' || item.type === 'multipuck') ? '10px Arial' : 'bold 14px Arial';
            ctx.fillText(icon, item.x, item.y + 1);
            
            ctx.closePath();
        }
    });
}

function updateItems(canvas, player, ai, pucks, aiBehavior) {
    // Apparition (max 3 sur le terrain)
    if (Date.now() - lastItemSpawn > 12000 && activeItems.length < 3) {
        const spawnX = canvas.width / 4 + Math.random() * (canvas.width / 2);
        const spawnY = 50 + Math.random() * (canvas.height - 100);
        const types = ['speed', 'size', 'freeze', 'multipuck'];
        let type = types[Math.floor(Math.random() * types.length)];
        
        // On rend le Multi-puck plus rare que les autres (50% de chance d'être relancé s'il est tiré)
        if (type === 'multipuck' && Math.random() > 0.5) {
             type = ['speed', 'size', 'freeze'][Math.floor(Math.random() * 3)];
        }
        
        spawnItem(spawnX, spawnY, type);
        lastItemSpawn = Date.now();
    }

    // Collecte
    activeItems.forEach(item => {
        const checkCollect = (paddle, owner) => {
            const dx = paddle.x - item.x;
            const dy = paddle.y - item.y;
            if (Math.sqrt(dx*dx + dy*dy) < paddle.radius + item.radius) {
                item.collected = true;
                applyBonus(owner, item.type, player, ai, pucks, aiBehavior);
            }
        };

        checkCollect(player, 'player');
        checkCollect(ai, 'ai');
    });
    
    // Nettoyage
    activeItems = activeItems.filter(i => !i.collected);
}

function applyBonus(owner, type, player, ai, pucks, aiBehavior) {
    if (owner === 'player' && typeof window.addScore === 'function') {
        window.addScore(100); // Bonus Arcade pour la prise de risque
    }
    
    const target = owner === 'player' ? player : ai;
    const opponent = owner === 'player' ? ai : player;
    const dialogueColorClass = owner === 'player' ? 'text-player' : 'text-ai';
    
    if (type === 'speed') {
        if (typeof window.showBonusAlert === 'function') window.showBonusAlert('SPEED UP!', '#ffb86c');
        
        // La vitesse est augmentée massivement (le soft clamp évitera le blocage brut)
        // On booste tous les palets existants
        for (let p of pucks) {
            p.vx += owner === 'player' ? 35 : -35;
            p.trailColor = owner === 'player' ? '#4facfe' : '#f093fb';
            
            if (typeof FX !== 'undefined') {
                FX.screenshake(10, 8);
                FX.spawnParticles(p.x, p.y, 25, p.trailColor, 2);
            }
        }
        
        if (window.director && window.director.onGameEvent) {
            window.director.onGameEvent(owner === 'player' ? 'bonus_speed_player' : 'bonus_speed_ai');
        }
    } else if (type === 'size') {
        if (typeof window.showBonusAlert === 'function') window.showBonusAlert('GIANT PADDLE!', '#00ffcc');
        
        const originalRadius = 30;
        target.radius = 50;
        
        if (typeof FX !== 'undefined') FX.spawnParticles(target.x, target.y, 30, '#00ffcc');
        
        setTimeout(() => { 
            target.radius = originalRadius; 
            if (typeof FX !== 'undefined') FX.spawnParticles(target.x, target.y, 15, '#00ffcc');
        }, 6000);
        
        if (window.director && window.director.onGameEvent) {
            window.director.onGameEvent(owner === 'player' ? 'bonus_size_player' : 'bonus_size_ai');
        }
    } else if (type === 'freeze') {
        if (typeof window.showBonusAlert === 'function') window.showBonusAlert('FREEZE!', '#8be9fd');
        
        const originalColor = opponent.color;
        opponent.color = '#8be9fd';
        
        // Le controlModifier est ce qui va VRAIMENT ralentir le joueur au niveau des contrôles
        opponent.controlModifier = 0.15; 
        
        let oldAiSpeed = aiBehavior.speed;
        if (owner === 'player') aiBehavior.speed = 0.5; // Freeze drastique pour l'IA
        
        if (typeof FX !== 'undefined') FX.spawnParticles(opponent.x, opponent.y, 40, '#8be9fd');
        
        setTimeout(() => { 
            opponent.color = originalColor; 
            opponent.controlModifier = 1; // Retour à la normale
            if (owner === 'player') aiBehavior.speed = oldAiSpeed;
            if (typeof FX !== 'undefined') FX.spawnParticles(opponent.x, opponent.y, 15, '#8be9fd');
        }, 3500);
        
        if (window.director && window.director.onGameEvent) {
            window.director.onGameEvent(owner === 'player' ? 'bonus_freeze_player' : 'bonus_freeze_ai');
        }
    } else if (type === 'multipuck') {
        if (typeof window.showBonusAlert === 'function') window.showBonusAlert('MULTIBALL!', '#ff00ff');
        
        if (typeof FX !== 'undefined') FX.screenshake(15, 20);
        
        // Prendre le premier palet comme référence
        const refPuck = pucks[0];
        const baseSpeed = Math.sqrt(refPuck.vx*refPuck.vx + refPuck.vy*refPuck.vy) || 8;
        
        // Cloner 2 nouveaux palets
        for(let i = 0; i < 2; i++) {
            const newPuck = new CircleEntity(refPuck.x, refPuck.y, refPuck.radius, '#ffffff', 0.5, true);
            
            // Vecteur dirigé vers l'adversaire avec un angle aléatoire
            const angle = (Math.random() - 0.5) * (Math.PI / 1.5); // Éparpillement
            const vxBase = owner === 'player' ? 1 : -1;
            
            newPuck.vx = baseSpeed * 1.5 * Math.cos(angle) * vxBase;
            newPuck.vy = baseSpeed * 1.5 * Math.sin(angle);
            newPuck.trailColor = owner === 'player' ? '#4facfe' : '#f093fb';
            
            pucks.push(newPuck);
        }
        
        if (typeof FX !== 'undefined') {
            FX.spawnParticles(refPuck.x, refPuck.y, 60, '#ff00ff', 4);
        }
        
        if (window.director && window.director.onGameEvent) {
            window.director.onGameEvent(owner === 'player' ? 'bonus_multipuck_player' : 'bonus_multipuck_ai');
        }
    }
}
