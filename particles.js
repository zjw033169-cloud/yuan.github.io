
(() => {
    // 1. 创建动画画布
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

    // 让文章显示在动画上方
    document.querySelectorAll("article").forEach(article => {
        article.style.position = "relative";
        article.style.zIndex = "1";
    });

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let animationId;

    const maxDistance = 120;

    // 2. 根据窗口大小创建粒子
    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.min(
            65,
            Math.floor(width * height / 12000)
        );

        particles = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        }));
    }

    // 3. 绘制粒子、粒子连线和鼠标连线
    function draw() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            // 粒子之间的连线
            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const d = Math.hypot(p.x - q.x, p.y - q.y);

                if (d < maxDistance) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle =
                        `rgba(76, 131, 195, ${0.15 * (1 - d / maxDistance)})`;
                    ctx.stroke();
                }
            }

            // 粒子与鼠标之间的连线
            const distance = Math.hypot(
                p.x - mouse.x,
                p.y - mouse.y
            );

            if (distance < maxDistance) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle =
                    `rgba(76, 131, 195, ${0.35 * (1 - distance / maxDistance)})`;
                ctx.stroke();
            }

            // 绘制粒子
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(76, 131, 195, 0.55)";
            ctx.fill();
        }

        animationId = requestAnimationFrame(draw);
    }

    // 4. 监听鼠标和窗口变化
    window.addEventListener("mousemove", event => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    window.addEventListener("mouseout", event => {
        if (!event.relatedTarget) {
            mouse.x = -1000;
            mouse.y = -1000;
        }
    });

    window.addEventListener("resize", resize);

    // 5. 启动动画
    resize();
    draw();

    // 离开页面时停止动画
    window.addEventListener("pagehide", () => {
        cancelAnimationFrame(animationId);
    }, { once: true });
})();
