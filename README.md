# 🏓 Ping Prompt

An experimental asymmetric Air Hockey prototype built in Vanilla JavaScript (ES6) and HTML5 Canvas, powered by a Generative AI running directly in the browser.

The player faces off against **"Neural Core"**, a cynical and arrogant AI that doesn't just play the game: it **profiles you**, **trash-talks** using speech synthesis, and actively **hacks** the DOM to cheat when it's losing!

## ✨ Key Features

- **Custom Physics Engine (Ultra-Lean)**: Zero external frameworks. A custom engine handles elastic collisions, damping, and friction.
- **WebGPU AI (WebLLM)**: The generative AI (using the **Phi-3-mini** model) runs entirely on your local GPU via `@mlc-ai/web-llm`. No backend server, everything is local! *Includes a Fallback "Dummy Mode" if WebGPU is not supported by the machine.*
- **Agentic AI (Function Calling)**: The AI is aware it's in a game. If struggling, the SLM can trigger cheat "Tools" (inverting your mouse, removing table friction, creating visual glitches, or making the puck a ghost).
- **Profiling & Prescience (Brain.js)**: A real Multilayer Perceptron neural network trains in real-time on your shots to deduce your attacking "tendencies". This analysis not only feeds the LLM's narrative but is also **plugged into the physics engine**: the AI will pre-position itself (Prescience) to block your shots before you even hit them!
- **Serverless "Gatekeeper" Leaderboard (Supabase)**: Cloud PostgreSQL database. To optimize writes, the Front-End filters requests by reading the 10th best score, blocking data insertion for unqualified players (Anti-Spam).
- **Dynamic Difficulty Adjustment (DDA)**: The game engine auto-balances the match. If you humiliate the AI, it gets angry and becomes ultra-fast. If you lose heavily, it secretly softens up.
- **"Asynchronous" F2P Tutorial**: The download of the LLM model (1.8 GB) is completely hidden. You instantly start playing against a gray, clumsy "Training Bot". Once the LLM is loaded in the background, the AI "hacks" the game, the screen shakes, and the real narrative boss fight begins.
- **Generative Sound Design (Web Audio API)**: Dynamic, zero-latency audio generation using mathematical oscillators (8-bit square waves), without requiring any external `.mp3` files for sound effects.
- **Items & Gameplay (Pinball Mode)**: Blistering speed, Giant Paddles, Ice Rays, and the very rare **Multi-Puck** mode (multiple pucks exploding on the field simultaneously). The gameplay is supported by intense Game Feel (Screenshake, Impact particles, Neon/Glassmorphism UI).

## 🛠️ Project Architecture

The code is 100% modular client-side (Client-side Rendering):

- `index.html`: Interface structure (Cyberpunk UI, Canvas, LLM Status, and System Logs).
- `style.css`: Design system, "Space Grotesk" Font, Glassmorphism.
- `physics.js` / `game.js` / `entities.js`: The physical foundation of the arcade game.
- `ai-director.js`: The narrative brain (WebLLM Phi-3).
- `ai-profiler.js`: The analytical brain (Brain.js).
- `items.js` / `fx.js` / `audioManager.js`: The "Game Juice" (Bonuses, Particles, and Audio).

## 🚀 How to play locally?

Since the game downloads AI models via ES6 modules and WebGPU, browsers forbid opening it via a simple double-click (`file://` protocol) due to CORS security reasons.

From the project folder, launch a lightweight local server:

```bash
python3 -m http.server 8080
```
Then open your browser (Chrome or Edge recommended) at: **http://localhost:8080**

*Note: On the first launch, the game will download the Phi-3 model (about 1.8 GB) to store it in the browser's local cache.*

## 🌐 Deployment

This project is 100% static (Vanilla JS/HTML/CSS). It can be deployed instantly on platforms like **Vercel**, **Netlify**, or **GitHub Pages**. Once online (HTTPS), the WebLLM engine will securely download the models to end-users with a compatible GPU.
