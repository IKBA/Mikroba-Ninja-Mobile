/**
 * MIKROBA NINJA - GAME LOGIC
 * Powered by pure Javascript & HTML5 Canvas
 * Synthetic retro upbeat soundtrack via Web Audio API
 */

// ==========================================================================
// 1. WEB AUDIO API SYNTHESIZER (Dynamic Sound Generator)
// ==========================================================================
class WebAudioSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.isPlayingBGM = false;
    
    // Sequencer properties
    this.bpm = 135;
    this.stepInterval = 60 / this.bpm / 2; // 8th notes
    this.nextNoteTime = 0.0;
    this.currentStep = 0;
    this.sequencerTimerId = null;
    
    // Upbeat synth-wave bass notes frequencies (Em - G - A - C)
    // E2: 82.4Hz, G2: 98.0Hz, A2: 110.0Hz, C3: 130.8Hz
    this.bassline = [
      82.4, 82.4, 82.4, 82.4,  // Em
      98.0, 98.0, 98.0, 98.0,  // G
      110.0, 110.0, 110.0, 110.0, // A
      130.8, 130.8, 130.8, 130.8  // C
    ];
  }

  init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("Web Audio API not supported on this browser.");
      return;
    }
    
    this.ctx = new AudioContextClass();
    
    // Setup Volume controls
    this.masterGain = this.ctx.createGain();
    this.bgmGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.bgmGain.gain.setValueAtTime(0.22, this.ctx.currentTime); // keep BGM slightly softer
    this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    
    this.bgmGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- BACKGROUND MUSIC SEQUENCER ---
  startBGM() {
    if (!this.ctx) this.init();
    this.resume();
    if (this.isPlayingBGM) return;
    
    this.isPlayingBGM = true;
    this.nextNoteTime = this.ctx.currentTime;
    this.currentStep = 0;
    
    const scheduler = () => {
      while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
        this.scheduleBassNote(this.currentStep, this.nextNoteTime);
        this.scheduleBeat(this.currentStep, this.nextNoteTime);
        
        this.nextNoteTime += this.stepInterval;
        this.currentStep = (this.currentStep + 1) % 16;
      }
      this.sequencerTimerId = setTimeout(scheduler, 25);
    };
    
    scheduler();
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.sequencerTimerId) {
      clearTimeout(this.sequencerTimerId);
    }
  }

  scheduleBassNote(step, time) {
    if (!this.isPlayingBGM || this.isMuted) return;
    
    const freq = this.bassline[step];
    
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    // Quick chiptune-like envelope filter decay
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + this.stepInterval * 0.95);
    
    // Volume envelope (staccato pluck)
    gainNode.gain.setValueAtTime(0.45, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + this.stepInterval * 0.9);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.bgmGain);
    
    osc.start(time);
    osc.stop(time + this.stepInterval * 0.95);
  }

  scheduleBeat(step, time) {
    if (!this.isPlayingBGM || this.isMuted) return;
    
    // Synthesized Hi-Hat (on off-beats)
    if (step % 2 === 1) {
      const bufferSize = this.ctx.sampleRate * 0.04; // 40ms noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;
      
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.08, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.bgmGain);
      
      noise.start(time);
      noise.stop(time + 0.04);
    }
    
    // Synthesized Snare/Beat Kick on steps 4 and 12
    if (step === 4 || step === 12) {
      // Simple Kick/Snare blend
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
      
      oscGain.gain.setValueAtTime(0.35, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      
      osc.connect(oscGain);
      oscGain.connect(this.bgmGain);
      
      osc.start(time);
      osc.stop(time + 0.1);
    }
  }

  // --- SOUND EFFECTS (SFX) ---
  
  // 1. Organic "Splat" sound when slicing bacteria/virus
  playSplatSFX() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    
    const now = this.ctx.currentTime;
    
    // 1. Synth bass pop
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
    
    gainNode.gain.setValueAtTime(0.8, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    
    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
    
    // 2. Add organic noise squish
    const bufferSize = this.ctx.sampleRate * 0.12; // 120ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.12);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    noise.start(now);
    noise.stop(now + 0.13);
  }

  // 2. Alarm Ding (lose life on slicing friendlies)
  playAlarmSFX() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    
    const now = this.ctx.currentTime;
    
    // Dual frequency warning beep
    const freqs = [620, 784];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      
      gainNode.gain.setValueAtTime(0.4, now + (idx * 0.08));
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.08) + 0.28);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      osc.start(now + (idx * 0.08));
      osc.stop(now + (idx * 0.08) + 0.3);
    });
  }

  // 3. Level-up major-scale rising arpeggio
  playLevelUpSFX() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    
    const now = this.ctx.currentTime;
    // C4, E4, G4, C5
    const notes = [261.63, 329.63, 392.00, 523.25];
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0.3, now + (idx * 0.08));
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.08) + 0.25);
      
      osc.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      osc.start(now + (idx * 0.08));
      osc.stop(now + (idx * 0.08) + 0.27);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

const audioSynth = new WebAudioSynth();


// ==========================================================================
// 2. BIO-GRAPHICS PROCEDURAL ART FUNCTIONS
// ==========================================================================

// Draw Bacteria: green rod capsule with cilia/pili and shininess
function drawBacteria(ctx, x, y, r, angle, splitProgress = 0, isLeftHalf = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  const len = r * 1.5; // Bacteria capsule length
  const width = r * 0.65; // Width
  
  if (splitProgress === 0) {
    // Normal bacteria drawing (capsule)
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(0, 220, 80, 0.4)';
    
    // Draw hair pili radiating out
    ctx.strokeStyle = 'rgba(100, 200, 80, 0.6)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      const alpha = (i / 14) * Math.PI * 2;
      const px = Math.cos(alpha) * (width + 3);
      const py = Math.sin(alpha) * (len + 3);
      ctx.beginPath();
      ctx.moveTo(px * 0.8, py * 0.8);
      ctx.lineTo(px * 1.15, py * 1.15);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // reset
    
    // Capsule shell path
    ctx.beginPath();
    ctx.roundRect(-width, -len, width * 2, len * 2, width);
    
    // Fill with toxic green-purple gradient
    const grad = ctx.createLinearGradient(-width, 0, width, 0);
    grad.addColorStop(0, 'hsl(120, 80%, 42%)');
    grad.addColorStop(0.5, 'hsl(125, 75%, 30%)');
    grad.addColorStop(1, 'hsl(140, 90%, 20%)');
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Outline
    ctx.strokeStyle = 'hsl(120, 95%, 48%)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Specular shiny highlight
    ctx.beginPath();
    ctx.ellipse(-width * 0.4, -len * 0.4, width * 0.25, len * 0.4, Math.PI / 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    
  } else {
    // Drawn as cut pieces flying apart
    const shift = splitProgress * r * 0.8;
    ctx.translate(isLeftHalf ? -shift : shift, 0);
    ctx.rotate(isLeftHalf ? -splitProgress * 0.4 : splitProgress * 0.4);
    
    ctx.beginPath();
    if (isLeftHalf) {
      // Draw top half capsule
      ctx.arc(0, -len + width, width, Math.PI, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(-width, 0);
    } else {
      // Draw bottom half capsule
      ctx.lineTo(-width, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, len - width);
      ctx.arc(0, len - width, width, 0, Math.PI);
    }
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(-width, 0, width, 0);
    grad.addColorStop(0, 'hsl(120, 80%, 42%)');
    grad.addColorStop(0.5, 'hsl(125, 75%, 30%)');
    grad.addColorStop(1, 'hsl(140, 90%, 20%)');
    ctx.fillStyle = grad;
    ctx.fill();
    
    ctx.strokeStyle = 'hsl(120, 95%, 48%)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw fluid/slime spraying from the flat cut side
    ctx.fillStyle = 'hsl(290, 80%, 50%)'; // purple inner bacterial fluid
    ctx.beginPath();
    if (isLeftHalf) {
      ctx.arc(0, 0, width * 0.8, 0, Math.PI, true);
    } else {
      ctx.arc(0, 0, width * 0.8, 0, Math.PI, false);
    }
    ctx.fill();
  }
  ctx.restore();
}

// Draw Virus: pink ball with spikes and spots
function drawVirus(ctx, x, y, r, angle, blinkState = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  if (blinkState) {
    // "Berkedip" effect: Draw virus as semi-transparent neon outline
    ctx.strokeStyle = 'rgba(255, 0, 150, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    
    // basic spines outlines
    for (let i = 0; i < 8; i++) {
      const alpha = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(alpha) * r * 1.2, Math.sin(alpha) * r * 1.2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(255, 0, 100, 0.4)';
  
  // Spikes (10 spokes with orange balls)
  ctx.strokeStyle = 'hsl(330, 80%, 40%)';
  ctx.lineWidth = 3.5;
  const numSpikes = 10;
  for (let i = 0; i < numSpikes; i++) {
    const alpha = (i / numSpikes) * Math.PI * 2;
    const sx = Math.cos(alpha) * (r * 0.6);
    const sy = Math.sin(alpha) * (r * 0.6);
    const ex = Math.cos(alpha) * (r * 1.2);
    const ey = Math.sin(alpha) * (r * 1.2);
    
    // Spire shaft
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    
    // Spire cap (Orange bintik)
    ctx.fillStyle = 'hsl(35, 95%, 55%)';
    ctx.beginPath();
    ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  
  // Main Spiked ball core
  const grad = ctx.createRadialGradient(-r*0.2, -r*0.2, r*0.1, 0, 0, r);
  grad.addColorStop(0, 'hsl(325, 95%, 65%)');
  grad.addColorStop(0.6, 'hsl(320, 85%, 45%)');
  grad.addColorStop(1, 'hsl(330, 95%, 25%)');
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
  ctx.fill();
  
  // Outer outline
  ctx.strokeStyle = 'hsl(325, 100%, 65%)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  
  // Toxic orange/red spots on surface
  ctx.fillStyle = 'rgba(255, 100, 0, 0.65)';
  const spotPositions = [
    [-r*0.3, -r*0.1, r*0.14],
    [r*0.25, -r*0.3, r*0.12],
    [r*0.3, r*0.2, r*0.16],
    [-r*0.2, r*0.35, r*0.1],
    [0, r*0.05, r*0.15]
  ];
  spotPositions.forEach(spot => {
    ctx.beginPath();
    ctx.arc(spot[0], spot[1], spot[2], 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Core Gloss specular Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(-r*0.35, -r*0.3, r*0.2, r*0.1, Math.PI/6, 0, Math.PI*2);
  ctx.fill();
  
  ctx.restore();
}

// Draw Macrophage: large white fluffy cloud with cyan glowing core
function drawMacrophage(ctx, x, y, r, angle, pulseScale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(pulseScale, pulseScale);
  
  ctx.shadowBlur = 16;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
  
  // Draw fluffy white cells composed of overlapping circles
  ctx.fillStyle = 'rgba(240, 242, 250, 0.9)';
  ctx.strokeStyle = 'rgba(210, 220, 240, 0.6)';
  ctx.lineWidth = 3.5;
  
  ctx.beginPath();
  const numBubbles = 7;
  for (let i = 0; i < numBubbles; i++) {
    const alpha = (i / numBubbles) * Math.PI * 2;
    const dist = r * 0.4;
    const bx = Math.cos(alpha) * dist;
    const by = Math.sin(alpha) * dist;
    ctx.arc(bx, by, r * 0.55, 0, Math.PI * 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.shadowBlur = 0;
  
  // Dynamic pulsing blue/cyan nucleus in core
  const nucleusGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.35);
  nucleusGrad.addColorStop(0, 'hsl(190, 100%, 75%)');
  nucleusGrad.addColorStop(0.7, 'hsl(205, 100%, 50%)');
  nucleusGrad.addColorStop(1, 'hsl(220, 80%, 25%)');
  
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(0, 180, 255, 0.8)';
  ctx.fillStyle = nucleusGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'hsl(190, 100%, 60%)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  ctx.restore();
}

// Draw Antibody: shiny gold Y-shaped protein
function drawAntibody(ctx, x, y, r, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  ctx.shadowBlur = 16;
  ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
  
  // Y-shape main branches
  ctx.strokeStyle = 'linear-gradient';
  // Golden dynamic colors
  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, 'hsl(48, 100%, 65%)');
  grad.addColorStop(0.5, 'hsl(45, 95%, 50%)');
  grad.addColorStop(1, 'hsl(38, 90%, 35%)');
  
  ctx.strokeStyle = grad;
  ctx.lineWidth = r * 0.3; // Thick antibody arms
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  // Stem
  ctx.moveTo(0, r * 0.7);
  ctx.lineTo(0, 0);
  // Left arm
  ctx.lineTo(-r * 0.75, -r * 0.65);
  // Right arm
  ctx.moveTo(0, 0);
  ctx.lineTo(r * 0.75, -r * 0.65);
  ctx.stroke();
  
  // Highlight gloss (white inner narrow line)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.55);
  ctx.lineTo(0, 0);
  ctx.lineTo(-r * 0.65, -r * 0.58);
  ctx.moveTo(0, 0);
  ctx.lineTo(r * 0.65, -r * 0.58);
  ctx.stroke();
  
  // Golden tip particles at coordinates
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-r * 0.75, -r * 0.65, 4, 0, Math.PI * 2);
  ctx.arc(r * 0.75, -r * 0.65, 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// Draw red blood cell floating in the background (blurred parallax)
function drawRedBloodCell(ctx, x, y, r, opacity = 0.3) {
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Draw blurred biconcave disc shape (donut-like shading)
  const grad = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
  grad.addColorStop(0, 'hsl(350, 75%, 2%)'); // darker hollow center
  grad.addColorStop(0.3, 'hsl(355, 80%, 18%)');
  grad.addColorStop(0.8, 'hsl(352, 70%, 12%)');
  grad.addColorStop(1, 'hsl(350, 60%, 5%)');
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  
  // Soft outer glow outline
  ctx.strokeStyle = 'rgba(200, 0, 0, 0.12)';
  ctx.lineWidth = r * 0.1;
  ctx.stroke();
  
  ctx.restore();
}


// ==========================================================================
// 3. GAME ENGINE CLASS
// ==========================================================================
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Screens elements
    this.startScreen = document.getElementById('startScreen');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.codexModal = document.getElementById('codexModal');
    this.levelUpBanner = document.getElementById('levelUpBanner');
    this.gameHUD = document.getElementById('gameHUD');
    
    // Buttons
    this.playBtn = document.getElementById('playBtn');
    this.codexBtn = document.getElementById('codexBtn');
    this.closeCodexBtn = document.getElementById('closeCodexBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.menuBtn = document.getElementById('menuBtn');
    
    // Sound & HUD values
    this.audioToggle = document.getElementById('audioToggle');
    this.audioIconOn = document.getElementById('audioIconOn');
    this.audioIconOff = document.getElementById('audioIconOff');
    this.scoreVal = document.getElementById('scoreVal');
    this.levelVal = document.getElementById('levelVal');
    this.highScoreVal = document.getElementById('highScoreVal');
    this.damageFlash = document.getElementById('damageFlash');
    
    // Game variables
    this.state = "MENU"; // MENU, PLAYING, GAMEOVER
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.highScore = parseInt(localStorage.getItem('mikrobaninja_highscore')) || 0;
    
    this.microbes = [];
    this.bgCells = []; // Background Red Blood Cells
    this.particles = []; // Visual splat particles
    this.floatingTexts = []; // Floating +10, Combo titles, etc.
    
    // Level intervals and speed scalars
    this.levelTimer = 0;
    this.lastSpawnTime = 0;
    this.spawnInterval = 2000; // ms
    this.speedMultiplier = 0.7;
    
    // Touch/Slash Trail state
    this.slashPoints = [];
    this.isSlicing = false;
    this.comboCount = 0;
    this.comboWindowTimer = 0;
    this.maxComboReached = 0;
    
    // Set viewport dimensions
    this.resizeCanvas();
    this.initEventListeners();
    this.initBackgroundCells();
    
    // Highscore UI load
    this.highScoreVal.textContent = this.highScore;
    
    // Game tick loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.tick(t));
  }

  // Handle mobile and desktop canvas viewport adaptation
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initBackgroundCells() {
    this.bgCells = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      this.bgCells.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: Math.random() * 45 + 30, // radius 30 to 75
        speedX: Math.random() * 0.15 - 0.075,
        speedY: Math.random() * 0.4 + 0.15, // float down
        opacity: Math.random() * 0.15 + 0.08
      });
    }
  }

  initEventListeners() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.initBackgroundCells();
    });
    
    // Prevent standard elastic scrolling or zooming inside mobile webview
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    
    // --- Touch & Mouse Swipes Events ---
    const startSlash = (x, y) => {
      this.isSlicing = true;
      this.slashPoints = [{ x, y, time: performance.now() }];
      this.comboCount = 0;
      
      // Initialize Audio Synthesizer on first user tap (browsers constraint bypass)
      audioSynth.init();
      audioSynth.resume();
    };
    
    const moveSlash = (x, y) => {
      if (!this.isSlicing) return;
      const now = performance.now();
      this.slashPoints.push({ x, y, time: now });
      
      // Keep only recent points (last 160ms) to form trailing laser
      this.slashPoints = this.slashPoints.filter(p => now - p.time < 160);
      
      // Perform collision checks on active microbes
      if (this.state === "PLAYING") {
        this.checkCollisions();
      }
    };
    
    const endSlash = () => {
      if (!this.isSlicing) return;
      this.isSlicing = false;
      
      // Check for Combo rewards at slice release
      if (this.comboCount >= 3) {
        this.triggerComboReward();
      }
      this.comboCount = 0;
      this.slashPoints = [];
    };
    
    // Touch interface listeners
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        startSlash(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        moveSlash(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    
    this.canvas.addEventListener('touchend', endSlash, { passive: true });
    
    // Mouse fallback listeners for desktop/emulators
    this.canvas.addEventListener('mousedown', (e) => {
      startSlash(e.clientX, e.clientY);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      moveSlash(e.clientX, e.clientY);
    });
    this.canvas.addEventListener('mouseup', endSlash);
    this.canvas.addEventListener('mouseleave', endSlash);
    
    // --- Buttons Actions ---
    this.playBtn.addEventListener('click', () => {
      this.startGame();
    });
    
    this.codexBtn.addEventListener('click', () => {
      this.openCodex();
    });
    
    this.closeCodexBtn.addEventListener('click', () => {
      this.closeCodex();
    });
    
    this.restartBtn.addEventListener('click', () => {
      this.startGame();
    });
    
    this.menuBtn.addEventListener('click', () => {
      this.returnToMenu();
    });
    
    this.audioToggle.addEventListener('click', () => {
      const isMuted = audioSynth.toggleMute();
      if (isMuted) {
        this.audioIconOn.classList.add('hidden');
        this.audioIconOff.classList.remove('hidden');
      } else {
        this.audioIconOn.classList.remove('hidden');
        this.audioIconOff.classList.add('hidden');
      }
    });
  }

  // ==========================================================================
  // GAMEPLAY STATE FLOW CONTROLLER
  // ==========================================================================
  startGame() {
    this.state = "PLAYING";
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.levelTimer = 0;
    this.speedMultiplier = 0.7;
    this.spawnInterval = 2100;
    this.microbes = [];
    this.particles = [];
    this.floatingTexts = [];
    this.maxComboReached = 0;
    this.comboCount = 0;
    this.lastSpawnTime = performance.now();
    
    // HUD Sync
    this.scoreVal.textContent = "0";
    this.levelVal.textContent = "1";
    this.syncLivesHUD();
    
    // Visibilities
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.gameHUD.classList.remove('hidden');
    
    // Audio Start
    audioSynth.startBGM();
    
    // Floating introductory message
    this.spawnFloatingText("IMUN AKTIF!", this.canvas.width / 2, this.canvas.height / 2, '#00e676', 30);
  }

  syncLivesHUD() {
    for (let i = 1; i <= 3; i++) {
      const heart = document.getElementById(`heart${i}`);
      if (i <= this.lives) {
        heart.classList.add('active');
        heart.classList.remove('lost');
      } else {
        heart.classList.remove('active');
        heart.classList.add('lost');
      }
    }
  }

  triggerDamage() {
    this.lives--;
    this.syncLivesHUD();
    
    // Play Alarm SFX
    audioSynth.playAlarmSFX();
    
    // Visual flash and shake
    this.damageFlash.classList.remove('flash-active');
    void this.damageFlash.offsetWidth; // force reflow/repaint
    this.damageFlash.classList.add('flash-active');
    
    document.body.classList.remove('shake-active');
    void document.body.offsetWidth; // force reflow
    document.body.classList.add('shake-active');
    
    setTimeout(() => {
      document.body.classList.remove('shake-active');
    }, 400);
    
    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.state = "GAMEOVER";
    audioSynth.stopBGM();
    
    // Save highscore
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('mikrobaninja_highscore', this.highScore);
      this.highScoreVal.textContent = this.highScore;
    }
    
    // UI Game over details
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('finalLevel').textContent = this.level;
    document.getElementById('finalCombo').textContent = this.maxComboReached;
    
    // Fetch a random educational medical trivia fact
    const facts = [
      "Bakteri adalah sel tunggal patogen. Memotong bakteri membantu kerja makrofag menyerap zat beracun kuman tersebut.",
      "Virus menginfeksi sel hidup untuk menggandakan diri. Sel imun T-Killer bekerja mandiri menghancurkan virus ini.",
      "Makrofag ibarat 'mobil penyedot debu raksasa' di dalam darah. Sel ini menelan patogen jahat bulat-bulat melalui fagositosis.",
      "Antibodi berbentuk 'Y' terbuat dari asam amino berharga, bertugas menempel pada virus agar musuh membeku tak berdaya.",
      "Sistem imun menghasilkan jutaan antibodi spesifik setiap detik untuk memerangi virus berkedip yang sedang menyebar.",
      "Demam di tubuh manusia merupakan reaksi imun terprogram guna menghambat multiplikasi bakteri yang sensitif panas!"
    ];
    const randFact = facts[Math.floor(Math.random() * facts.length)];
    document.getElementById('edFactText').textContent = randFact;
    
    this.gameHUD.classList.add('hidden');
    this.gameOverScreen.classList.remove('hidden');
  }

  returnToMenu() {
    this.state = "MENU";
    this.gameOverScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
  }

  // ==========================================================================
  // CODEX INTERACTION & PROCEDURAL PREVIEWS
  // ==========================================================================
  openCodex() {
    this.codexModal.classList.remove('hidden');
    
    // Render the procedural previews in the Codex list dynamically!
    // This connects our biological visuals right to the Codex.
    setTimeout(() => {
      this.drawCodexPrevs();
    }, 50);
  }

  closeCodex() {
    this.codexModal.classList.add('hidden');
  }

  drawCodexPrevs() {
    const renderPrev = (canvasId, type) => {
      const cv = document.getElementById(canvasId);
      if (!cv) return;
      const c = cv.getContext('2d');
      c.clearRect(0, 0, cv.width, cv.height);
      const cx = cv.width / 2;
      const cy = cv.height / 2;
      const r = 20;
      
      if (type === "bacteria") {
        drawBacteria(c, cx, cy, r, Math.PI / 4, 0);
      } else if (type === "virus") {
        drawVirus(c, cx, cy, r, 0, false);
      } else if (type === "macrophage") {
        drawMacrophage(c, cx, cy, r * 0.9, 0, 1.05);
      } else if (type === "antibody") {
        drawAntibody(c, cx, cy, r * 0.9, -Math.PI / 8);
      }
    };
    
    renderPrev("canvasBacteriaIcon", "bacteria");
    renderPrev("canvasVirusIcon", "virus");
    renderPrev("canvasMacrophageIcon", "macrophage");
    renderPrev("canvasAntibodyIcon", "antibody");
  }


  // ==========================================================================
  // LEVEL MANAGER & AUTOMATED PROGRESSION (15s Intervals)
  // ==========================================================================
  updateLevelManager(deltaTime) {
    if (this.state !== "PLAYING") return;
    
    this.levelTimer += deltaTime;
    
    // Next level every 15000 ms (15 seconds)
    const currentMilestoneLevel = Math.floor(this.levelTimer / 15000) + 1;
    
    if (currentMilestoneLevel > this.level) {
      this.level = currentMilestoneLevel;
      this.levelVal.textContent = this.level;
      
      // Speed multiplier increments +20% with each level
      this.speedMultiplier = 0.7 + (this.level - 1) * 0.20;
      // Decrease spawn interval to make it faster
      this.spawnInterval = Math.max(700, 2100 - (this.level - 1) * 350);
      
      this.triggerLevelUpNotification();
    }
  }

  triggerLevelUpNotification() {
    // Show sliding level up banner with informative subtext
    this.levelUpBanner.classList.remove('hidden');
    
    const bannerTitle = document.getElementById('levelUpTitle');
    const bannerDesc = document.getElementById('levelUpDesc');
    
    bannerTitle.textContent = `LEVEL ${this.level}`;
    audioSynth.playLevelUpSFX();
    
    if (this.level === 2) {
      bannerDesc.textContent = "MAKROFAG MULAI PATROLI! (JANGAN DIPOTONG)";
    } else if (this.level === 3) {
      bannerDesc.textContent = "ANTIBODI DIPRODUKSI! GRUP MIKROBA DATANG";
    } else {
      bannerDesc.textContent = "FRENZY MODE! ALIRAN DARAH MAKIN CEPAT";
    }
    
    // Hide banner after animation finishes (1.5 seconds in CSS)
    setTimeout(() => {
      this.levelUpBanner.classList.add('hidden');
    }, 1500);
  }


  // ==========================================================================
  // MICROBES SPAWNER SYSTEM
  // ==========================================================================
  checkSpawns(now) {
    if (now - this.lastSpawnTime < this.spawnInterval) return;
    
    this.lastSpawnTime = now;
    
    // Number of units to launch depends on level
    let count = 1;
    if (this.level === 1) {
      count = Math.random() < 0.35 ? 2 : 1;
    } else if (this.level === 2) {
      count = Math.random() < 0.6 ? 2 : 1;
    } else if (this.level === 3) {
      count = Math.floor(Math.random() * 2) + 2; // 2-3 units
    } else {
      // Frenzy mode: spawn groups of 3-4
      count = Math.floor(Math.random() * 2) + 3;
    }
    
    for (let i = 0; i < count; i++) {
      // Stagger slightly horizontal locations to prevent clumping
      setTimeout(() => {
        if (this.state === "PLAYING") {
          this.spawnMicrobe();
        }
      }, i * 180);
    }
  }

  spawnMicrobe() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Microbe types pool relative to levels
    const types = ["bacteria"]; // base
    
    // Level 1: Bacteria only.
    // Level 2: Virus + Bacteria, Macrophages start spawning.
    // Level 3+: Antibodi starts spawning, Macrophages more common.
    if (this.level >= 2) {
      types.push("virus");
      types.push("macrophage"); // Friend
    }
    if (this.level >= 3) {
      types.push("antibody"); // Friend
      types.push("virus"); // extra virus chances
    }
    
    const chosenType = types[Math.floor(Math.random() * types.length)];
    
    // Random launch settings
    const r = chosenType === "macrophage" ? 44 : chosenType === "antibody" ? 28 : chosenType === "virus" ? 25 : 24;
    const x = Math.random() * (width * 0.7) + (width * 0.15); // launcher zone
    const y = height + r + 10; // off-screen bottom
    
    // Launch angle pointing slightly towards center
    const targetX = width / 2 + (Math.random() * 160 - 80);
    const targetY = height * 0.15 + (Math.random() * height * 0.2);
    
    // Custom ballistic calculation
    const dx = targetX - x;
    const dy = targetY - y;
    
    // Gravity factor pulls them down, so adjust vertical launch force
    const grav = 0.13;
    const airTime = Math.sqrt(-2 * (dy - height * 0.2) / grav); // rough estimate
    
    const vx = dx / airTime;
    const vy = (dy - 0.5 * grav * airTime * airTime) / airTime;
    
    // Cap vertical launching speeds safely
    const finalVy = Math.max(-13, Math.min(-6, vy)) * this.speedMultiplier;
    const finalVx = Math.max(-5, Math.min(5, vx)) * this.speedMultiplier;
    
    this.microbes.push({
      id: Math.random().toString(36).substr(2, 9),
      type: chosenType,
      x: x,
      y: y,
      vx: finalVx,
      vy: finalVy,
      r: r,
      angle: Math.random() * Math.PI * 2,
      vAngle: chosenType === "antibody" ? (Math.random() * 0.08 + 0.06) : (Math.random() * 0.04 - 0.02), // gold spins fast
      isSliced: false,
      sliceProgress: 0,
      hasBlinked: false,
      blinkTimer: 0,
      pulseTimer: Math.random() * 100, // random offset for macrophage pulse
    });
  }


  // ==========================================================================
  // SWIPE SLASH COLLISION & SLICER CHECKER
  // ==========================================================================
  checkCollisions() {
    if (this.slashPoints.length < 2) return;
    
    // Fetch the last continuous laser line segment
    const p2 = this.slashPoints[this.slashPoints.length - 1];
    const p1 = this.slashPoints[this.slashPoints.length - 2];
    
    this.microbes.forEach(m => {
      if (m.isSliced) return;
      
      // Check segment-to-circle intersection
      if (this.isLineIntersectingCircle(p1.x, p1.y, p2.x, p2.y, m.x, m.y, m.r)) {
        this.sliceMicrobe(m, p2.x, p2.y);
      }
    });
  }

  // Standard line-to-circle distance intersection math
  isLineIntersectingCircle(x1, y1, x2, y2, cx, cy, r) {
    const abX = x2 - x1;
    const abY = y2 - y1;
    const acX = cx - x1;
    const acY = cy - y1;
    
    const abLenSq = abX * abX + abY * abY;
    if (abLenSq === 0) {
      // Slash point is static, do simple distance check
      const d = Math.sqrt(acX * acX + acY * acY);
      return d <= r;
    }
    
    // Project point C onto line segment AB, clamp t to [0, 1]
    let t = (acX * abX + acY * abY) / abLenSq;
    t = Math.max(0, Math.min(1, t));
    
    // Closest coordinates on segment
    const dx = x1 + t * abX;
    const dy = y1 + t * abY;
    
    // Distance from closest point to circle center
    const distSq = (cx - dx) * (cx - dx) + (cy - dy) * (cy - dy);
    return distSq <= r * r;
  }

  sliceMicrobe(m, hitX, hitY) {
    m.isSliced = true;
    m.sliceProgress = 0.01; // start splitting animation
    
    if (m.type === "bacteria") {
      this.score += 10;
      this.comboCount++;
      this.scoreVal.textContent = this.score;
      audioSynth.playSplatSFX();
      
      // Green/purple splatter particles
      this.spawnDebris(m.x, m.y, "bacteria");
      this.spawnFloatingText("+10", m.x, m.y - 10, '#00e676', 22);
      
    } else if (m.type === "virus") {
      this.score += 15;
      this.comboCount++;
      this.scoreVal.textContent = this.score;
      audioSynth.playSplatSFX();
      
      // Pixel burst sparks
      this.spawnDebris(m.x, m.y, "virus");
      this.spawnFloatingText("+15", m.x, m.y - 10, '#ff3366', 22);
      
    } else if (m.type === "macrophage" || m.type === "antibody") {
      // Friendly hit triggers HP loss and screen alarm!
      this.triggerDamage();
      
      const label = m.type === "macrophage" ? "MAKROFAG!" : "ANTIBODI!";
      this.spawnFloatingText(label, m.x, m.y - 10, '#ff3333', 24, true);
    }
  }

  // --- COMBO SYSTEM EVALUATOR ---
  triggerComboReward() {
    const bonus = this.comboCount * 5;
    this.score += bonus;
    this.scoreVal.textContent = this.score;
    
    if (this.comboCount > this.maxComboReached) {
      this.maxComboReached = this.comboCount;
    }
    
    // Spawn floating massive combo text
    // Pick the coordinates of the last swipe point
    const p = this.slashPoints[this.slashPoints.length - 1] || { x: this.canvas.width / 2, y: this.canvas.height / 3 };
    this.spawnFloatingText(`KOMBO x${this.comboCount}! +${bonus} BNS`, p.x, p.y - 28, '#ffcc00', 26, true);
    
    // Level up arpeggio blend for satisfying trigger
    audioSynth.playLevelUpSFX();
  }


  // ==========================================================================
  // FLOATING HUD MESSAGES & PARTICLES ENGINE
  // ==========================================================================
  spawnFloatingText(txt, x, y, color, size = 20, isGlow = false) {
    this.floatingTexts.push({
      text: txt,
      x: x,
      y: y,
      vx: Math.random() * 1.5 - 0.75,
      vy: -1.8,
      opacity: 1.0,
      color: color,
      size: size,
      isGlow: isGlow,
      life: 1.0 // timer countdown
    });
  }

  // Spawn organic green drops for bacteria or pixel square debris for virus
  spawnDebris(x, y, type) {
    const count = type === "bacteria" ? 14 : 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      
      this.particles.push({
        type: type,
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // lift up slightly
        r: type === "bacteria" ? Math.random() * 5 + 3 : Math.random() * 4 + 2, // size
        color: type === "bacteria" 
          ? (Math.random() < 0.7 ? 'hsl(120, 80%, 40%)' : 'hsl(285, 75%, 45%)') // green/purple
          : (Math.random() < 0.65 ? '#ff3366' : '#ff9933'), // pink/orange virus pixels
        opacity: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }


  // ==========================================================================
  // CORE ENGINE TICK & UPDATE LOOPS
  // ==========================================================================
  tick(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame((t) => this.tick(t));
  }

  update(deltaTime) {
    // 1. Update background parallax blood cells floating slowly
    this.bgCells.forEach(cell => {
      cell.x += cell.speedX * deltaTime * 0.06;
      cell.y += cell.speedY * deltaTime * 0.06;
      
      // wrap bottom off screen cells back to top
      if (cell.y - cell.r > this.canvas.height) {
        cell.y = -cell.r;
        cell.x = Math.random() * this.canvas.width;
      }
      if (cell.x + cell.r < 0) cell.x = this.canvas.width + cell.r;
      if (cell.x - cell.r > this.canvas.width) cell.x = -cell.r;
    });
    
    // Skip gameplay calculations if not actively playing
    if (this.state !== "PLAYING") {
      // Fade out old touch trails
      if (this.slashPoints.length > 0) {
        this.slashPoints = this.slashPoints.filter(p => performance.now() - p.time < 160);
      }
      return;
    }
    
    // 2. Automated level milestoners
    this.updateLevelManager(deltaTime);
    
    // 3. Spawns controller
    this.checkSpawns(performance.now());
    
    // 4. Update Microbes vectors
    const grav = 0.13;
    
    for (let i = this.microbes.length - 1; i >= 0; i--) {
      const m = this.microbes[i];
      
      // Apply gravity physics scaled to speedMultiplier to maintain trajectory height
      m.vy += grav * this.speedMultiplier * this.speedMultiplier;
      m.x += m.vx;
      m.y += m.vy;
      
      // Update rotation
      m.angle += m.vAngle;
      
      // Macrophage pulse timer
      if (m.type === "macrophage") {
        m.pulseTimer += deltaTime * 0.006;
      }
      
      // Blinking controller for active virus
      if (m.type === "virus" && !m.isSliced) {
        m.blinkTimer += deltaTime;
        if (m.blinkTimer > 1800) {
          m.blinkTimer = 0;
          m.hasBlinked = true;
          // stop blinking after brief duration
          setTimeout(() => { m.hasBlinked = false; }, 180);
        }
      }
      
      // If sliced, increment division process
      if (m.isSliced) {
        m.sliceProgress += 0.04;
        // Fade out/fly apart: let them fall faster
        m.vy += grav * 0.4;
      }
      
      // Out of bounds detection - only trigger past bottom if moving downwards (m.vy > 0)
      const isPastBottom = m.y - m.r > this.canvas.height && m.vy > 0;
      const isTooFarLeftRight = m.x + m.r < -80 || m.x - m.r > this.canvas.width + 80;
      
      if (isPastBottom || isTooFarLeftRight) {
        // Lose life if enemy (Bacteria or Virus) falls past bottom unscathed
        if (!m.isSliced && (m.type === "bacteria" || m.type === "virus") && isPastBottom) {
          this.triggerDamage();
          this.spawnFloatingText("LOLOS!", m.x, this.canvas.height - 30, '#ff3333', 18);
        }
        
        // Remove from list
        this.microbes.splice(i, 1);
      }
    }
    
    // 5. Update debris particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06; // slight gravity
      p.opacity -= p.decay;
      
      if (p.opacity <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // 6. Update floating HUD messages
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.x += t.vx;
      t.y += t.vy;
      t.opacity -= 0.022; // fade
      
      if (t.opacity <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render() {
    // Clean Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 1. Solid Background Gradient removed so CSS background-image (bg.png) shines through!
    
    // 2. Draw parallax blurred Red Blood Cells
    this.bgCells.forEach(cell => {
      drawRedBloodCell(this.ctx, cell.x, cell.y, cell.r, cell.opacity);
    });
    
    // 3. Draw active/splitting microbes
    this.microbes.forEach(m => {
      if (m.type === "bacteria") {
        if (!m.isSliced) {
          drawBacteria(this.ctx, m.x, m.y, m.r, m.angle, 0);
        } else {
          // Render two splitting halves flying in opposite directions
          drawBacteria(this.ctx, m.x, m.y, m.r, m.angle, m.sliceProgress, true); // left
          drawBacteria(this.ctx, m.x, m.y, m.r, m.angle, m.sliceProgress, false); // right
        }
      } else if (m.type === "virus") {
        if (!m.isSliced) {
          drawVirus(this.ctx, m.x, m.y, m.r, m.angle, m.hasBlinked);
        } else {
          // Virus pixelizes and dissolves, so we draw it fading rapidly if sliced
          this.ctx.save();
          this.ctx.globalAlpha = Math.max(0, 1 - m.sliceProgress * 1.5);
          drawVirus(this.ctx, m.x, m.y, m.r, m.angle, false);
          this.ctx.restore();
        }
      } else if (m.type === "macrophage") {
        // Pulses using sinus timeline
        const pulse = 1.0 + 0.08 * Math.sin(m.pulseTimer);
        this.ctx.save();
        if (m.isSliced) this.ctx.globalAlpha = Math.max(0, 1 - m.sliceProgress * 1.8);
        drawMacrophage(this.ctx, m.x, m.y, m.r, m.angle, pulse);
        this.ctx.restore();
        
      } else if (m.type === "antibody") {
        this.ctx.save();
        if (m.isSliced) this.ctx.globalAlpha = Math.max(0, 1 - m.sliceProgress * 1.8);
        drawAntibody(this.ctx, m.x, m.y, m.r, m.angle);
        this.ctx.restore();
      }
    });
    
    // 4. Draw fluid droplets / pixel sparks particles
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      
      if (p.type === "bacteria") {
        // Organic circular droplets
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Virus pixel squares
        this.ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      this.ctx.restore();
    });
    
    // 5. Draw swipe trails (Laser antiseptic trail!)
    if (this.slashPoints.length > 1) {
      this.ctx.save();
      
      // Draw wider blue background outer neon glow
      this.ctx.beginPath();
      this.ctx.moveTo(this.slashPoints[0].x, this.slashPoints[0].y);
      for (let i = 1; i < this.slashPoints.length; i++) {
        this.ctx.lineTo(this.slashPoints[i].x, this.slashPoints[i].y);
      }
      this.ctx.strokeStyle = 'rgba(0, 150, 255, 0.28)';
      this.ctx.lineWidth = 15;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = 'rgba(0, 180, 255, 0.8)';
      this.ctx.stroke();
      
      // Draw cyan primary core glow
      this.ctx.strokeStyle = 'rgba(0, 230, 255, 0.82)';
      this.ctx.lineWidth = 6;
      this.ctx.stroke();
      
      // Draw inner sharp white laser core
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.shadowBlur = 0; // reset shadow for core
      this.ctx.stroke();
      
      this.ctx.restore();
    }
    
    // 6. Draw floating HUD text (+10, +15, COMBO!)
    this.floatingTexts.forEach(t => {
      this.ctx.save();
      this.ctx.globalAlpha = t.opacity;
      
      this.ctx.font = `800 ${t.size}px 'Outfit', sans-serif`;
      this.ctx.textAlign = 'center';
      
      if (t.isGlow) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = t.color;
      }
      
      // Draw text fill
      this.ctx.fillStyle = t.color;
      this.ctx.fillText(t.text, t.x, t.y);
      
      // text outline for high legibility
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeText(t.text, t.x, t.y);
      
      this.ctx.restore();
    });
  }
}

// Initialize the game engine once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});
