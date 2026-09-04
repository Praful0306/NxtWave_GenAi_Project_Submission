import React, { useEffect, useRef } from 'react';

/**
 * Hero3D component
 * Lightweight, high-performance Canvas 3D geometric particle constellation for the landing hero.
 * Implements smooth interactive rotation, glowing Indic nodes, and ambient orbital mechanics
 * without bloating the core bundle. (Spec Section 2 & Section 11)
 */
export default function Hero3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;

    const particles = [];
    const numParticles = 48;
    const colors = ['#6366f1', '#8b5cf6', '#f59e0b', '#06b6d4', '#10b981'];

    const handleResize = () => {
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight || 420;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initialize 3D particles on a spherical shell
    for (let i = 0; i < numParticles; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 130 + Math.random() * 40;

      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        baseRadius: radius,
        color: colors[i % colors.length],
        size: 2.5 + Math.random() * 3,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulse: Math.random() * Math.PI,
      });
    }

    let rotX = 0;
    let rotY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - width / 2) * 0.0005;
      mouseY = (e.clientY - rect.top - height / 2) * 0.0005;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      rotY += 0.004 + mouseX * 0.5;
      rotX += 0.002 + mouseY * 0.5;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected = [];

      // Project 3D coordinates to 2D
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Rotate around Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate around X
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        const fov = 320;
        const scale = fov / (fov + z2 + 180);
        const projX = width / 2 + x1 * scale;
        const projY = height / 2 + y2 * scale;

        p.pulse += p.pulseSpeed;
        const curSize = p.size * (0.8 + 0.3 * Math.sin(p.pulse)) * scale;

        projected.push({
          x: projX,
          y: projY,
          z: z2,
          size: Math.max(1, curSize),
          color: p.color,
          alpha: Math.max(0.15, Math.min(1, (z2 + 180) / 360)),
        });
      }

      // Draw connecting energy lines between nearby nodes
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 85) {
            const lineAlpha = (1 - dist / 85) * 0.25 * Math.min(p1.alpha, p2.alpha);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Sort by depth (back to front)
      projected.sort((a, b) => a.z - b.z);

      // Draw particle nodes with radial glow
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        ctx.save();
        ctx.globalAlpha = p.alpha;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] flex items-center justify-center pointer-events-auto">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: 'none' }}
      />
      {/* Floating Center Badge */}
      <div className="absolute z-10 pointer-events-none flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950/60 backdrop-blur-xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 text-center animate-pulse">
        <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
          11 Indic Languages
        </div>
        <p className="text-[11px] uppercase tracking-widest text-slate-300 font-bold mt-1">
          Neural STT • Streaming TTS • Adaptive AI
        </p>
      </div>
    </div>
  );
}
