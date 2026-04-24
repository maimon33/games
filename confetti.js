(function () {
  function launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#7c6ff7','#52a0e0','#52e07c','#e0c452','#e07c52','#e052b0','#52e0d0','#e05252','#ffffff'];
    const particles = Array.from({length: 160}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.5 - 20,
      w: Math.random() * 10 + 5,
      h: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 4 + 2,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.25,
      alpha: 1,
    }));

    let start = null;
    const DURATION = 3800;

    function frame(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.vy += 0.06;
        if (elapsed > DURATION - 900) p.alpha = Math.max(0, p.alpha - 0.025);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (elapsed < DURATION) requestAnimationFrame(frame);
      else canvas.remove();
    }

    requestAnimationFrame(frame);
  }

  window.launchConfetti = launchConfetti;
})();
