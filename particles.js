
(() => {
    // Prevent duplicate canvases when the script runs again
    if (window.__neuralNetworkCleanup) {
        window.__neuralNetworkCleanup();
    }

    const canvas = document.createElement("canvas");
    canvas.id = "particle-canvas";

    Object.assign(canvas.style, {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "0"
    });

    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        canvas.remove();
        return;
    }

    let width = 0;
    let height = 0;
    let particles = [];
    let animationId = 0;
    let running = true;

    const mouse = {
        x: -1000,
        y: -1000
    };

    // Visual settings
    const MAX_PARTICLES = 220;
    const PARTICLE_AREA = 5200;
    const CONNECTION_DISTANCE = 155;
    const MOUSE_DISTANCE = 190;
    const COLORS = [
        "76, 161, 255",
        "0, 190, 255",
        "75, 125, 255",
        "100, 215, 255"
    ];

    // Create particles
    function createParticle() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.65,
            vy: (Math.random() - 0.5) * 0.65,
            radius: 1 + Math.random() * 1.8,
            alpha: 0.35 + Math.random() * 0.5,
            color: COLORS[
                Math.floor(Math.random() * COLORS.length)
            ],
            phase: Math.random() * Math.PI * 2
        };
    }

    // Resize canvas without stretching the drawing
    function resize() {
        const dpr = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.min(
            MAX_PARTICLES,
            Math.max(
                70,
                Math.floor(width * height / PARTICLE_AREA)
            )
        );

        // Keep the existing particles where possible
        if (particles.length > count) {
            particles.length = count;
        }

        while (particles.length < count) {
            particles.push(createParticle());
        }
    }

    // Draw a softly glowing particle
    function drawParticle(p, time) {
        const pulse =
            0.85 + 0.15 * Math.sin(time * 0.0015 + p.phase);

        const radius = p.radius * pulse;

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha * 0.08})`;
        ctx.fill();

        // Particle core
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(210, 245, 255, 0.9)";
        ctx.fill();
    }

    // Connect nearby particles
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];

                const dx = p.x - q.x;
                const dy = p.y - q.y;
                const distanceSquared = dx * dx + dy * dy;

                if (
                    distanceSquared <
                    CONNECTION_DISTANCE * CONNECTION_DISTANCE
                ) {
                    const distance = Math.sqrt(distanceSquared);
                    const strength = 1 - distance / CONNECTION_DISTANCE;

                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);

                    ctx.strokeStyle =
                        `rgba(48, 145, 255, ${strength * 0.32})`;
                    ctx.lineWidth = 0.5 + strength * 0.55;
                    ctx.stroke();
                }
            }
        }
    }

    // Connect the mouse to nearby particles
    function drawMouseConnections() {
        for (const p of particles) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distance = Math.hypot(dx, dy);

            if (distance < MOUSE_DISTANCE) {
                const strength = 1 - distance / MOUSE_DISTANCE;

                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);

                ctx.strokeStyle =
                    `rgba(0, 205, 255, ${strength * 0.7})`;
                ctx.lineWidth = 0.7 + strength;
                ctx.stroke();
            }
        }
    }

    // Animate particle movement and mouse interaction
    function updateParticles() {
        for (const p of particles) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distance = Math.hypot(dx, dy);

            // Gentle mouse repulsion
            if (distance > 0 && distance < 115) {
                const force = (115 - distance) / 115;

                p.vx += (dx / distance) * force * 0.035;
                p.vy += (dy / distance) * force * 0.035;
            }

            // Keep movement smooth
            p.vx *= 0.998;
            p.vy *= 0.998;

            const speed = Math.hypot(p.vx, p.vy);
            const maxSpeed = 0.85;

            if (speed > maxSpeed) {
                p.vx = (p.vx / speed) * maxSpeed;
                p.vy = (p.vy / speed) * maxSpeed;
            }

            // Prevent particles from becoming motionless
            if (speed < 0.08) {
                p.vx += (Math.random() - 0.5) * 0.025;
                p.vy += (Math.random() - 0.5) * 0.025;
            }

            p.x += p.vx;
            p.y += p.vy;

            // Bounce off screen edges
            if (p.x < 0) {
                p.x = 0;
                p.vx = Math.abs(p.vx);
            } else if (p.x > width) {
                p.x = width;
                p.vx = -Math.abs(p.vx);
            }

            if (p.y < 0) {
                p.y = 0;
                p.vy = Math.abs(p.vy);
            } else if (p.y > height) {
                p.y = height;
                p.vy = -Math.abs(p.vy);
            }
        }
    }

    function draw(time) {
        if (!running) return;

        ctx.clearRect(0, 0, width, height);

        updateParticles();
        drawConnections();
        drawMouseConnections();

        for (const p of particles) {
            drawParticle(p, time);
        }

        animationId = requestAnimationFrame(draw);
    }

    function onMouseMove(event) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    }

    function onMouseLeave() {
        mouse.x = -1000;
        mouse.y = -1000;
    }

    function cleanup() {
        running = false;
        cancelAnimationFrame(animationId);

        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseout", onMouseOut);
        window.removeEventListener("pagehide", cleanup);

        canvas.remove();

        if (window.__neuralNetworkCleanup === cleanup) {
            delete window.__neuralNetworkCleanup;
        }
    }

    function onMouseOut(event) {
        if (!event.relatedTarget) {
            onMouseLeave();
        }
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseout", onMouseOut);
    window.addEventListener("pagehide", cleanup, { once: true });

    window.__neuralNetworkCleanup = cleanup;

    resize();
    draw(0);
})();
