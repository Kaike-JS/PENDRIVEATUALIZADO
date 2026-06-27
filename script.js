/* =============================================
   RENATO ATUALIZAÇÕES — PREMIUM JS ENGINE v2.0
   ============================================= */

'use strict';

/* ─── UTILS ─────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (min, max) => Math.random() * (max - min) + min;

/* ─── 1. PRELOADER COM WAVEFORM CANVAS ────────── */
(function initPreloader() {
    const preloader  = document.getElementById('preloader');
    const fill       = document.getElementById('progressFill');
    const percent    = document.getElementById('progressPercent');
    const canvas     = document.getElementById('waveformCanvas');
    if (!preloader || !canvas) return;

    const ctx        = canvas.getContext('2d');
    const W          = 220, H = 60;
    canvas.width     = W * 2; // retina
    canvas.height    = H * 2;
    ctx.scale(2, 2);

    let phase        = 0;
    let progress     = 0;         // 0 → 100
    let animId       = null;
    let startTime    = null;
    const DURATION   = 800;      // ms até chegar em 100%

    function drawWave(t) {
        ctx.clearRect(0, 0, W, H);

        const bars   = 40;
        const barW   = 3;
        const gap    = (W - bars * barW) / (bars - 1);

        for (let i = 0; i < bars; i++) {
            const x      = i * (barW + gap);
            const freq   = (i / bars) * Math.PI * 3;
            const amp    = (Math.sin(freq + phase) * 0.5 + 0.5);
            const barH   = clamp(amp * H * 0.85 + 4, 4, H);
            const alpha  = clamp(amp * 0.9 + 0.1, 0.1, 1);

            ctx.fillStyle = `rgba(255, 0, 60, ${alpha})`;
            ctx.beginPath();
            ctx.roundRect(x, (H - barH) / 2, barW, barH, 1.5);
            ctx.fill();
        }
    }

    function tick(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        phase += 0.055;

        progress = clamp((elapsed / DURATION) * 100, 0, 100);
        const displayP = Math.round(progress);

        fill.style.width    = displayP + '%';
        percent.textContent = displayP + '%';

        drawWave(ts);

        if (progress < 100) {
            animId = requestAnimationFrame(tick);
        } else {
            // Garantia mínima de 3s na tela para animação premium
            setTimeout(() => {
                preloader.classList.add('hidden');
                setTimeout(() => preloader.remove(), 900);
            }, 200);
        }
    }

    animId = requestAnimationFrame(tick);
})();


/* ─── 2. PARTÍCULAS MUSICAIS ─────────────────── */
(function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');

    let W, H;
    const PARTICLE_COUNT = 55;
    const particles      = [];

    // Símbolos musicais e formas
    const symbols = ['♩', '♪', '♫', '♬', '🎵'];

    class Particle {
        constructor() { this.reset(true); }

        reset(init = false) {
            this.x      = rand(0, W);
            this.y      = init ? rand(0, H) : H + 20;
            this.size   = rand(9, 18);
            this.speed  = rand(0.3, 0.9);
            this.drift  = rand(-0.4, 0.4);
            this.opacity= rand(0.06, 0.22);
            this.targetOp = this.opacity;
            this.sym    = symbols[Math.floor(rand(0, symbols.length))];
            this.rot    = rand(0, Math.PI * 2);
            this.rotSpd = rand(-0.008, 0.008);
        }

        update() {
            this.y   -= this.speed;
            this.x   += this.drift;
            this.rot += this.rotSpd;

            // Fade-in near bottom, fade-out near top
            const progress = 1 - (this.y / H);
            if (progress < 0.1)      this.opacity = lerp(this.opacity, this.targetOp * (progress / 0.1), 0.05);
            else if (progress > 0.8) this.opacity = lerp(this.opacity, 0, 0.02);

            if (this.y < -30) this.reset();
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.fillStyle = '#ff003c';
            ctx.font      = `${this.size}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.sym, 0, 0);
            ctx.restore();
        }
    }

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function init() {
        resize();
        for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
    }

    function loop() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    init();
    loop();
})();


/* ─── 3. MOUSE TRAIL VERMELHO ─────────────────── */
(function initTrail() {
    const trail   = [];
    const N       = 10;
    let lastX = -999, lastY = -999;

    for (let i = 0; i < N; i++) {
        const dot  = document.createElement('div');
        dot.style.cssText = `
            position: fixed; border-radius: 50%; pointer-events: none;
            z-index: 9999; mix-blend-mode: screen;
            background: rgba(255,0,60,0.7);
            transition: transform 0.1s ease;
            will-change: transform, opacity;
        `;
        document.body.appendChild(dot);
        trail.push({ el: dot, x: 0, y: 0, size: 8 - i * 0.5 });
    }

    let mx = 0, my = 0;

    window.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
    });

    function animTrail() {
        let x = mx, y = my;
        trail.forEach((point, i) => {
            const prev = i === 0 ? { x: mx, y: my } : trail[i - 1];
            point.x = lerp(point.x, prev.x, 0.35);
            point.y = lerp(point.y, prev.y, 0.35);
            const s   = point.size;
            const op  = (1 - i / N) * 0.55;
            point.el.style.width   = s + 'px';
            point.el.style.height  = s + 'px';
            point.el.style.left    = point.x - s / 2 + 'px';
            point.el.style.top     = point.y - s / 2 + 'px';
            point.el.style.opacity = op;
        });
        requestAnimationFrame(animTrail);
    }

    animTrail();
})();


/* ─── 4. BACKGROUND ORBS (LERP PARALAXE) ─────── */
(function initOrbs() {
    const orbs = document.querySelectorAll('.orb');
    if (!orbs.length) return;

    let mx = 0, my = 0;
    let bx = 0, by = 0;
    const SPD = 0.04;

    window.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
    });

    function loop() {
        bx = lerp(bx, mx, SPD);
        by = lerp(by, my, SPD);

        const dx = bx - window.innerWidth  / 2;
        const dy = by - window.innerHeight / 2;

        if (orbs[0]) orbs[0].style.transform = `translate(${dx * 0.04}px, ${dy * 0.04}px)`;
        if (orbs[1]) orbs[1].style.transform = `translate(${dx * -0.03}px, ${dy * -0.03}px)`;
        if (orbs[2]) orbs[2].style.transform = `translate(${dx * 0.025}px, ${dy * -0.05}px)`;

        requestAnimationFrame(loop);
    }
    loop();
})();


/* ─── 5. TYPEWRITER COM SCRAMBLE ─────────────── */
(function initTypewriter() {
    const el = document.querySelector('.typewriter-target');
    if (!el) return;

    const CHARS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    const target = el.dataset.text || '';
    let  revealedCount = 0;
    let  frameCount    = 0;

    function scramble() {
        let display = '';
        for (let i = 0; i < target.length; i++) {
            if (i < revealedCount) {
                display += target[i];
            } else if (i < revealedCount + 4) {
                display += CHARS[Math.floor(Math.random() * CHARS.length)];
            }
        }
        el.textContent = display;

        frameCount++;
        if (frameCount % 3 === 0 && revealedCount < target.length) {
            revealedCount++;
        }

        if (revealedCount <= target.length) {
            requestAnimationFrame(scramble);
        } else {
            el.textContent = target;
        }
    }

    // Inicia após preloader
    setTimeout(scramble, 3200);
})();


/* ─── 6. CONTADOR ANIMADO ─────────────────────── */
(function initCounters() {
    const items = document.querySelectorAll('.stat-item[data-count-target]');
    if (!items.length) return;

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function animateCounter(el, target, suffix = '') {
        const span    = el.querySelector('.stat-number');
        const start   = performance.now();
        const DURATION = 1800;

        function tick(now) {
            const elapsed  = now - start;
            const progress = clamp(elapsed / DURATION, 0, 1);
            const value    = Math.round(easeOut(progress) * target);

            span.textContent = value.toLocaleString('pt-BR') + suffix;

            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // Dispara quando visível
    // Dispara quando visível
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const t      = parseInt(entry.target.dataset.countTarget);
                // Modificado aqui: verifica se contém o ID de clientes para colocar '+', caso contrário coloca '%'
                const suffix = entry.target.querySelector('#statClientes') ? '+' : '%';
                animateCounter(entry.target, t, suffix);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    items.forEach(i => observer.observe(i));
})();


/* ─── 7. CARD 3D TILT + GLARE + WAVE ─────────── */
(function initCards() {
    const cards = document.querySelectorAll('.link-card');

    /* Mini wave engine por card */
    function startWave(canvas, card) {
        const ctx   = canvas.getContext('2d');
        let phase   = 0;
        let running = false;
        let rafId   = null;

        function draw() {
            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;
            canvas.width  = W;
            canvas.height = H;

            ctx.clearRect(0, 0, W, H);
            ctx.strokeStyle = 'rgba(255,0,60,0.18)';
            ctx.lineWidth   = 1.5;

            const LINES = 3;
            for (let l = 0; l < LINES; l++) {
                ctx.beginPath();
                const amp     = 6 + l * 3;
                const freq    = 0.025 + l * 0.005;
                const yOffset = H * (0.3 + l * 0.2);

                for (let x = 0; x < W; x++) {
                    const y = yOffset + Math.sin(x * freq + phase + l * 1.2) * amp;
                    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            phase += 0.04;
            if (running) rafId = requestAnimationFrame(draw);
        }

        return {
            start() { running = true; draw(); },
            stop()  { running = false; cancelAnimationFrame(rafId); }
        };
    }

    cards.forEach(card => {
        const glare   = card.querySelector('.card-glare');
        const icon    = card.querySelector('.card-icon');
        const wCanvas = card.querySelector('.card-wave-canvas');
        const rippleC = card.querySelector('.card-ripple-container');

        const wave = wCanvas ? startWave(wCanvas, card) : null;

        let tiltX  = 0, tiltY = 0;
        let targetX = 0, targetY = 0;
        let animId  = null;

        function smoothTilt() {
            tiltX = lerp(tiltX, targetX, 0.12);
            tiltY = lerp(tiltY, targetY, 0.12);

            card.style.transform = `
                perspective(1000px)
                rotateX(${tiltX}deg)
                rotateY(${tiltY}deg)
                scale3d(1.018, 1.018, 1.018)
            `;

            animId = requestAnimationFrame(smoothTilt);
        }

        card.addEventListener('mouseenter', () => {
            wave && wave.start();
            animId = requestAnimationFrame(smoothTilt);
        });

        card.addEventListener('mousemove', e => {
            const rect  = card.getBoundingClientRect();
            const x     = e.clientX - rect.left;
            const y     = e.clientY - rect.top;
            const midX  = rect.width  / 2;
            const midY  = rect.height / 2;

            targetX = ((y - midY) / midY) * -9;
            targetY = ((x - midX) / midX) *  9;

            if (glare) {
                glare.style.setProperty('--gx', `${(x / rect.width)  * 100}%`);
                glare.style.setProperty('--gy', `${(y / rect.height) * 100}%`);
            }

            if (icon) {
                const ix = ((x - midX) / midX) * 8;
                const iy = ((y - midY) / midY) * 8;
                icon.style.transform = `translate3d(${ix}px, ${iy}px, 22px) scale(1.08)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;

            setTimeout(() => {
                cancelAnimationFrame(animId);
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1,1,1)';
                tiltX = 0; tiltY = 0;
            }, 300);

            if (icon) icon.style.transform = 'translate3d(0,0,22px) scale(1)';
            wave && wave.stop();
        });

        // Click ripple
        card.addEventListener('click', e => {
            if (!rippleC) return;
            const rect   = card.getBoundingClientRect();
            const x      = e.clientX - rect.left;
            const y      = e.clientY - rect.top;
            const size   = Math.max(rect.width, rect.height);

            const ripple = document.createElement('span');
            ripple.classList.add('ripple-wave');
            ripple.style.cssText = `
                width: ${size}px; height: ${size}px;
                left: ${x - size / 2}px; top: ${y - size / 2}px;
            `;
            rippleC.appendChild(ripple);
            setTimeout(() => ripple.remove(), 700);
        });
    });
})();


/* ─── 8. SCROLL REVEAL ORQUESTRADO ───────────── */
(function initReveal() {
    const targets   = [
        '.logo-container',
        '.header-text',
        '.stats-row',
        '.link-card',
        '.profile-footer',
    ];

    const allEls = [];
    targets.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            el.classList.add('reveal');
            allEls.push(el);
        });
    });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Calcula delay baseado na posição vertical do elemento
                const idx   = allEls.indexOf(entry.target);
                const delay = idx * 80;

                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    allEls.forEach(el => observer.observe(el));
})();




/* ─── 10. DEV CREDIT — CIRCUIT BOARD + SCRAMBLE ── */
(function initDevCredit() {

    /* --- Circuit board canvas --- */
    const canvas = document.getElementById('devCircuit');
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');

    function resize() {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    const nodes  = [];
    const edges  = [];
    let   W, H;

    function buildGrid() {
        nodes.length = 0;
        edges.length = 0;
        W = canvas.width;
        H = canvas.height;

        const COLS = 10, ROWS = 3;
        const padX = 10, padY = 8;
        const stepX = (W - padX * 2) / (COLS - 1);
        const stepY = (H - padY * 2) / (ROWS - 1);

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const jitter = (Math.random() - 0.5) * stepX * 0.35;
                nodes.push({
                    x: padX + c * stepX + jitter,
                    y: padY + r * stepY,
                    pulse: Math.random(),
                    speed: rand(0.004, 0.012),
                    dot: Math.random() > 0.6,
                });
            }
        }

        // Horizontal + some diagonal edges
        for (let i = 0; i < nodes.length; i++) {
            const r = Math.floor(i / COLS);
            const c = i % COLS;
            if (c < COLS - 1)                         edges.push([i, i + 1]);
            if (r < ROWS - 1 && Math.random() > 0.4)  edges.push([i, i + COLS]);
            if (r < ROWS - 1 && c < COLS - 1 && Math.random() > 0.7) edges.push([i, i + COLS + 1]);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Draw edges
        edges.forEach(([a, b]) => {
            const nA = nodes[a], nB = nodes[b];
            ctx.beginPath();
            ctx.moveTo(nA.x, nA.y);

            // Right-angle routing: go horizontal first, then vertical
            if (Math.abs(nB.x - nA.x) > 4 && Math.abs(nB.y - nA.y) > 4) {
                ctx.lineTo(nB.x, nA.y);
            }
            ctx.lineTo(nB.x, nB.y);
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth   = 0.8;
            ctx.stroke();
        });

        // Draw nodes
        nodes.forEach(n => {
            n.pulse = (n.pulse + n.speed) % 1;
            const glow = Math.sin(n.pulse * Math.PI * 2) * 0.5 + 0.5;

            if (n.dot) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,0,60,${0.15 + glow * 0.45})`;
                ctx.fill();

                // Outer ring on bright nodes
                if (glow > 0.75) {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255,0,60,${(glow - 0.75) * 0.6})`;
                    ctx.lineWidth   = 0.7;
                    ctx.stroke();
                }
            } else {
                ctx.beginPath();
                ctx.arc(n.x, n.y, 1, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${0.04 + glow * 0.1})`;
                ctx.fill();
            }
        });

        requestAnimationFrame(draw);
    }

    const resizeObs = new ResizeObserver(() => { resize(); buildGrid(); });
    resizeObs.observe(canvas.parentElement);

    resize();
    buildGrid();
    draw();

    /* --- Scramble do nome --- */
    const nameEl = document.querySelector('.dev-name-scramble');
    if (!nameEl) return;

    const CHARS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>';
    const target = nameEl.dataset.text || '';
    let revealed = 0;
    let frame    = 0;
    let active   = false;

    function scrambleLoop() {
        let out = '';
        for (let i = 0; i < target.length; i++) {
            if (i < revealed) {
                out += target[i];
            } else if (i < revealed + 3) {
                out += CHARS[Math.floor(Math.random() * CHARS.length)];
            }
        }
        nameEl.textContent = out;

        frame++;
        if (frame % 4 === 0 && revealed < target.length) revealed++;

        if (revealed <= target.length) {
            requestAnimationFrame(scrambleLoop);
        } else {
            nameEl.textContent = target.toUpperCase();
            active = false;
        }
    }

    function triggerScramble() {
        if (active) return;
        active   = true;
        revealed = 0;
        frame    = 0;
        requestAnimationFrame(scrambleLoop);
    }

    // Dispara na entrada + ao hover
    const creditEl = document.querySelector('.dev-credit-inner');
    if (creditEl) {
        creditEl.addEventListener('mouseenter', triggerScramble);

        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setTimeout(triggerScramble, 3600);
                obs.disconnect();
            }
        }, { threshold: 0.8 });
        obs.observe(creditEl);
    }
})();
