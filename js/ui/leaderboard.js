// --- SUPABASE INIT ---
const SUPABASE_URL = 'https://lherbpwqwuobwpserxfq.supabase.co';
const SUPABASE_KEY = 'sb_publishable__GUmv0frV_kbgRrak2824g_eTR6FJlL';
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- GESTION DU LEADERBOARD (SUPABASE CLOUD) ---

window.checkTop10Qualification = async function() {
    try {
        const { data, error } = await window.supabaseClient
            .from('highscores')
            .select('score')
            .order('score', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        let minScore = 0;
        if (data && data.length === 10) {
            minScore = data[9].score; // Le 10ème score
        }
        
        if (window.arcadeScore > minScore || data.length < 10) {
            // Qualifié pour le Top 10
            const inputScreen = document.getElementById('arcade-input-screen');
            document.getElementById('final-score-display').innerText = `YOUR SCORE: ${window.arcadeScore.toString().padStart(6, '0')}`;
            inputScreen.classList.remove('hidden');
            inputScreen.classList.add('active');
            
            setTimeout(() => {
                const input = document.getElementById('arcade-name-input');
                if (input) input.focus();
            }, 100);
        } else {
            // Hors Top 10 (Gatekeeper block)
            const failScreen = document.getElementById('out-of-top-10-screen');
            document.getElementById('out-score-display').innerText = `YOUR SCORE: ${window.arcadeScore.toString().padStart(6, '0')}`;
            failScreen.classList.remove('hidden');
            failScreen.classList.add('active');
        }
    } catch (err) {
        console.error("Supabase Error (checkTop10Qualification):", err);
    }
};

window.saveScoreAndShowLeaderboard = async function() {
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
    let finalScore = Math.min(window.arcadeScore, 9999999);
    
    try {
        await window.supabaseClient.from('highscores').insert([{ name: name.substring(0, 3), score: finalScore }]);
        await window.showLeaderboard();
    } catch (err) {
        console.error("Failed to save score to Supabase:", err);
    }
};

window.showLeaderboard = async function() {
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
        const { data, error } = await window.supabaseClient
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
};

// Boutons Leaderboard
document.getElementById('submit-score-btn').addEventListener('click', window.saveScoreAndShowLeaderboard);
document.getElementById('arcade-name-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') window.saveScoreAndShowLeaderboard();
});
document.getElementById('show-leaderboard-btn').addEventListener('click', () => window.showLeaderboard());
