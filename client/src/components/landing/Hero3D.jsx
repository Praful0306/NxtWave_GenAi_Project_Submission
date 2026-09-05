import React, { useEffect, useRef } from 'react';

/**
 * Hero3D component
 * High-performance 3D canvas constellation representing 11 Indic language nodes
 * connected with neural energy pathways.
 */
export default function Hero3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth || 600);
    let height = (canvas.height = 320);

    const numParticles = 36;
    const colors = ['#6366f1', '#8b5cf6', '#f59e0b', '#06b6d4', '#10b981'];
    const particles = [];

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 320;
    };

    window.addEventListener('resize', handleResize);

    // Initialize 3D particles on a sphere
    for (let i = 0; i < numParticles; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 95 + Math.random() * 30;

      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        color: colors[i % colors.length],
        size: 2.5 + Math.random() * 2.5,
        pulseSpeed: 0.02 + Math.random() * 0.02,
        pulse: Math.random() * Math.PI,
      });
    }

    let rotX = 0;
    let rotY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - width / 2) * 0.0003;
      mouseY = (e.clientY - rect.top - height / 2) * 0.0003;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      rotY += 0.004 + mouseX;
      rotX += 0.002 + mouseY;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        const fov = 260;
        const scale = fov / (fov + z2 + 120);
        const projX = width / 2 + x1 * scale;
        const projY = height / 2 + y2 * scale;

        p.pulse += p.pulseSpeed;
        const curSize = p.size * (0.85 + 0.25 * Math.sin(p.pulse)) * scale;

        projected.push({
          x: projX,
          y: projY,
          z: z2,
          size: Math.max(1, curSize),
          color: p.color,
          alpha: Math.max(0.2, Math.min(1, (z2 + 140) / 280)),
        });
      }

      // Draw connecting lines
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 75) {
            const lineAlpha = (1 - dist / 75) * 0.22 * Math.min(p1.alpha, p2.alpha);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Sort by depth
      projected.sort((a, b) => a.z - b.z);

      // Draw nodes
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        ctx.save();
        ctx.globalAlpha = p.alpha;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
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
    <div className="relative w-full max-w-xl mx-auto h-[320px] flex items-center justify-center rounded-2xl bg-gradient-to-b from-indigo-950/20 to-slate-900/40 border border-slate-800/80 shadow-inner overflow-hidden my-4">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-800 text-[10px] text-slate-400 font-mono tracking-widest pointer-events-none uppercase">
        11 Neural Indic Nodes • Interactive
      </div>
    </div>
  );
}
