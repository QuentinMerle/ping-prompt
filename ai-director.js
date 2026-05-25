import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

class AIDirector {
    constructor() {
        this.narrativeElement = document.getElementById('narrative-text');
        this.systemLogElement = document.getElementById('system-logs');
        this.llmStatusIcon = document.getElementById('llm-status-icon');
        this.llmStatusText = document.getElementById('llm-status-text');
        this.badgeElement = document.querySelector('.model-badge');
        
        this.engine = null;
        this.isGenerating = false;
        this.lastTrickTime = 0; // Cooldown JavaScript pour bloquer le spam de triche
        this.lastSpeechTime = 0; // Cooldown pour laisser le temps de lire
        
        // Manual Tool Calling System Prompt
        this.systemPrompt = `You are "Neural Core", a stand-up comedian AI trapped in an Air Hockey game.
RULES:
1. Write EXACTLY ONE short sentence.
2. Be cheeky, sarcastic, and playfully tease the player's physical habits or actions.
3. If you want to cheat, append ONE trick tag at the very end of your sentence.
TRICK TAGS:
[TRICK: hack_mouse]
[TRICK: change_friction]
[TRICK: ghost_puck]
[TRICK: spawn_glitch]

Example of a valid output:
I see you favoring the right side, let's see how you play backwards! [TRICK: hack_mouse]`;
        
        this.chatHistory = [
            { role: "system", content: this.systemPrompt }
        ];
        
        window.isVoiceMuted = false;
        
        // --- Gestion du bouton Voice ---
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.isVoiceMuted = !window.isVoiceMuted;
                if (window.isVoiceMuted) {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    voiceBtn.innerText = "🤖 VOICE: OFF";
                } else {
                    voiceBtn.innerText = "🤖 VOICE: ON";
                }
            });
        }

        // --- PRÉ-CHARGEMENT DES VOIX ---
        // Sur Chrome/Safari, getVoices() est vide au premier appel. On le lance une fois à vide 
        // pour déclencher le chargement asynchrone avant que le modèle ne finisse de télécharger.
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices(); // Met en cache les voix
            };
        }

        this.initModel();
    }

    async initModel() {
        this.setIndicator('init', "Loading...");
        
        // --- VÉRIFICATION MATÉRIELLE (WebGPU requis pour WebLLM) ---
        if (!navigator.gpu) {
            this.setIndicator('error', "WebGPU Not Supported");
            this.triggerDialogue("[DUMMY] Your browser does not support WebGPU. Operating in offline Dummy Mode.");
            this.systemLog("WebGPU missing. Neural Core offline.", "text-ai");
            if (this.badgeElement) this.badgeElement.innerText = "Offline Mode (No WebGPU)";
            return; // Bloque le chargement, le jeu reste en Dummy Mode
        }
        
        // Retour sur Phi-3 : beaucoup plus cohérent en français que Gemma-2B, tout en restant léger
        const selectedModel = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
        
        if (this.badgeElement) this.badgeElement.innerText = "Phi-3-mini (Loading WebGPU...)";

        const initProgressCallback = (progress) => {
            const bar = document.getElementById('download-progress');
            if (bar) {
                bar.style.width = Math.round(progress.progress * 100) + "%";
            }
        };

        try {
            // Disparition du paramètre de fallback tools
            this.engine = await CreateMLCEngine(selectedModel, { initProgressCallback });
            this.setIndicator('idle', "Connected and Ready");
            if (this.badgeElement) this.badgeElement.innerText = "Phi-3-mini (WebGPU Active)";
            
            this.systemLog("Connection to Neural Core established.", 'text-ai');
            this.triggerDialogue("Download complete. I have taken control. Prepare to be destroyed.");
            
            if (typeof window.onAIReady === 'function') {
                window.onAIReady();
            }
        } catch (error) {
            console.error(error);
            this.setIndicator('error', "WebGPU Error");
            this.triggerDialogue("LLM connection error. Check your connection.");
        }
    }

    setIndicator(state, text) {
        if (!this.llmStatusIcon || !this.llmStatusText) return;
        this.llmStatusText.innerText = text;
        this.llmStatusIcon.className = ''; 
        if (state === 'idle') this.llmStatusIcon.classList.add('status-idle');
        if (state === 'thinking') this.llmStatusIcon.classList.add('status-thinking');
        if (state === 'init') {
            this.llmStatusIcon.style.backgroundColor = '#f1fa8c';
            this.llmStatusIcon.style.boxShadow = '0 0 10px #f1fa8c';
        }
        if (state === 'error') {
            this.llmStatusIcon.style.backgroundColor = '#ff5555';
            this.llmStatusIcon.style.boxShadow = '0 0 10px #ff5555';
        }
    }

    async generateResponse(eventContext) {
        if (!this.engine || this.isGenerating) return;
        
        // On laisse au moins 15 secondes entre chaque intervention pour ne pas saturer l'audio
        if (Date.now() - this.lastSpeechTime < 15000) return;
        
        this.isGenerating = true;
        this.setIndicator('thinking', "Tactical calculation...");

        let profileInfo = "";
        if (typeof window.profiler !== 'undefined') {
            profileInfo = window.profiler.getProfileContext();
        }

        this.chatHistory.push({ role: "user", content: `Event: ${eventContext} ${profileInfo}` });

        try {
            // Appel standard sans le paramètre 'tools' de l'API
            const reply = await this.engine.chat.completions.create({
                messages: this.chatHistory,
                temperature: 0.5, // Baisse de la température pour éviter le délire total
                max_tokens: 60  // Limite stricte pour empêcher les monologues
            });
            
            let responseText = reply.choices[0].message.content;
            this.chatHistory.push(reply.choices[0].message);
            
            // --- MANUAL TOOL CALLING PARSING ---
            const trickRegex = /\[TRICK:\s*(.*?)\]/i;
            const match = responseText.match(trickRegex);
            
            if (match && match[1]) {
                const toolName = match[1].trim();
                
                // On efface la balise de triche pour qu'elle soit invisible pour le joueur
                responseText = responseText.replace(trickRegex, '').trim();
                
                // Vérification du cooldown (40 secondes minimum entre deux triches)
                if (Date.now() - this.lastTrickTime > 40000) {
                    this.executeTool(toolName);
                    this.lastTrickTime = Date.now();
                } else {
                    console.log("Triche de l'IA ignorée (Cooldown actif : 40s)");
                }
            }
            
            this.triggerDialogue(responseText);
            this.lastSpeechTime = Date.now(); // Déclenche le chrono de lecture
            
            if (this.chatHistory.length > 15) {
                this.chatHistory = [
                    this.chatHistory[0], 
                    ...this.chatHistory.slice(this.chatHistory.length - 10)
                ];
            }
        } catch (error) {
            console.error("Erreur de génération", error);
        }

        this.setIndicator('idle', "Waiting");
        this.isGenerating = false;
    }

    executeTool(toolName) {
        this.systemLog(`[CHEAT ALERT] AI triggered: ${toolName.toUpperCase()}`, 'text-ai');
        
        // Affichage de l'alerte visuelle massive
        const alertOverlay = document.getElementById('cheat-alert-overlay');
        const alertText = document.getElementById('cheat-alert-text');
        if (alertOverlay && alertText) {
            alertText.innerText = `OVERRIDE : ${toolName.replace('_', ' ')}`;
            alertOverlay.classList.remove('hidden');
            
            // Screenshake massif
            if (typeof FX !== 'undefined') FX.screenshake(15, 20);
            
            // Cache l'alerte après 2.5 secondes
            setTimeout(() => {
                alertOverlay.classList.add('hidden');
            }, 2500);
        }

        if (typeof window.executeAITrick === 'function') {
            window.executeAITrick(toolName);
        }
    }

    onGameEvent(type) {
        if (typeof window.isNeuralCoreActive !== 'undefined' && !window.isNeuralCoreActive) {
            // Training Bot mode (No LLM, fake dialogue)
            const botLines = [
                "Processing trajectory...",
                "Calculating angle...",
                "Target missed. Recalibrating...",
                "Physics engine running...",
                "Basic motor skills online."
            ];
            const randomLine = botLines[Math.floor(Math.random() * botLines.length)];
            this.systemLog(`[SYSTEM_EVENT] ${type}`, 'text-ai');
            this.triggerDialogue(`[DUMMY] ${randomLine}`);
            return;
        }

        if (type === 'goal_player') {
            this.systemLog("Human scored a goal.", 'text-player');
            this.generateResponse("The human just scored a goal. Find a terrible technical excuse.");
        } else if (type === 'goal_ai') {
            this.systemLog("AI scored a goal.", 'text-ai');
            this.generateResponse("You just scored an amazing goal. Brag about it.");
        } else if (type === 'bonus_freeze_player') {
            this.systemLog("Human activated Freeze.", 'text-player');
            this.generateResponse("The human used an Ice bonus and froze you. Complain about the cold.");
        } else if (type === 'bonus_speed_player') {
            this.systemLog("Human activated Speed.", 'text-player');
            this.generateResponse("The human just shot with insane speed. Be impressed but hide it.");
        } else if (type === 'bonus_size_player') {
            this.systemLog("Human activated Size.", 'text-player');
            this.generateResponse("The human's paddle is giant. Claim this is pure cheating.");
        } else if (type === 'bonus_freeze_ai') {
            this.systemLog("AI activated Freeze.", 'text-ai');
            this.generateResponse("You froze the human. Mock their slow speed.");
        } else if (type === 'bonus_speed_ai') {
            this.systemLog("AI activated Speed.", 'text-ai');
            this.generateResponse("You made an overpowered shot. Yell something epic.");
        } else if (type === 'bonus_size_ai') {
            this.systemLog("AI activated Size.", 'text-ai');
            this.generateResponse("Your paddle is huge. Rejoice about being impassable.");
        } else if (type === 'bonus_multipuck_player') {
            this.systemLog("Human triggered MULTIBALL.", 'text-player');
            this.generateResponse("The human just spawned multiple pucks. Panic about the chaos.");
        } else if (type === 'bonus_multipuck_ai') {
            this.systemLog("AI triggered MULTIBALL.", 'text-ai');
            this.generateResponse("You just spawned multiple pucks. Brag about your overwhelming attack.");
        }
    }

    systemLog(text, contextClass = '') {
        if (this.systemLogElement) {
            const entry = document.createElement('div');
            entry.className = `log-entry ${contextClass}`;
            entry.innerText = `> ${text}`;
            this.systemLogElement.appendChild(entry);
            
            if (this.systemLogElement.children.length > 2) {
                this.systemLogElement.removeChild(this.systemLogElement.children[0]);
            }
        }
    }

    triggerDialogue(text) {
        if (this.narrativeElement) {
            this.narrativeElement.style.opacity = 0;
            setTimeout(() => {
                const cleanText = text.replace(/^["']|["']$/g, '');
                this.narrativeElement.innerText = `« ${cleanText} »`;
                this.narrativeElement.style.opacity = 1;
                
                // Ne parle pas pendant le tutoriel [DUMMY]
                if (!cleanText.includes('[DUMMY]')) {
                    this.speakResponse(cleanText);
                }
            }, 400); 
        }
    }

    speakResponse(text) {
        if (!('speechSynthesis' in window) || window.isVoiceMuted) return;
        
        // Coupe la phrase précédente si l'IA s'énerve et parle vite
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configuration issue du Web Speech Selector
        utterance.rate = 1.2;
        utterance.pitch = 0.6;
        utterance.volume = 0.9;
        utterance.lang = 'en-US'; // Le LLM répond en anglais
        
        // Tente de récupérer la voix spécifique "Samantha" en priorité absolue
        const voices = window.speechSynthesis.getVoices();
        let cyberVoice = voices.find(v => v.name.includes('Samantha'));
        
        // Fallback si Samantha n'est pas dispo
        if (!cyberVoice) {
            cyberVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'));
        }
        
        if (cyberVoice) utterance.voice = cyberVoice;

        window.speechSynthesis.speak(utterance);
    }
}

window.director = new AIDirector();
