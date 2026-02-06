import { useEffect, useRef } from 'react';

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Draw animated globe with orbital paths
    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;
      const r = Math.min(w, h) * 0.4;

      // Soft glow behind globe
      const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.8);
      glow.addColorStop(0, 'rgba(13, 79, 79, 0.12)');
      glow.addColorStop(0.5, 'rgba(13, 79, 79, 0.04)');
      glow.addColorStop(1, 'rgba(13, 79, 79, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Globe body
      const globeGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
      globeGrad.addColorStop(0, '#1a8a7a');
      globeGrad.addColorStop(0.4, '#0d4f4f');
      globeGrad.addColorStop(0.85, '#0a3a3a');
      globeGrad.addColorStop(1, '#072828');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = globeGrad;
      ctx.fill();

      // Latitude lines
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        const latY = cy + i * r * 0.3;
        const latR = Math.sqrt(r * r - (i * r * 0.3) ** 2);
        if (latR > 0) {
          ctx.beginPath();
          ctx.ellipse(cx, latY, latR, latR * 0.12, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Longitude lines rotating
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI + time * 0.3;
        const scaleX = Math.cos(angle);
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(scaleX) * r, r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Landmass-like patches (simplified continents)
      ctx.fillStyle = 'rgba(45, 106, 79, 0.4)';
      const patches = [
        { x: -0.2, y: -0.15, size: 0.25 },
        { x: 0.15, y: -0.25, size: 0.18 },
        { x: 0.3, y: 0.05, size: 0.15 },
        { x: -0.1, y: 0.2, size: 0.2 },
        { x: 0.25, y: 0.25, size: 0.12 },
      ];
      patches.forEach(p => {
        const px = cx + (p.x + Math.sin(time * 0.3) * 0.05) * r * 2;
        const py = cy + p.y * r * 2;
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r * 0.85) {
          const alpha = 1 - dist / r;
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.arc(px, py, p.size * r, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // Satellite orbits
      const satellites = [
        { speed: 0.5, tilt: 0.3, size: 3, color: '#c67b2e' },
        { speed: -0.35, tilt: -0.2, size: 2.5, color: '#1a73e8' },
        { speed: 0.7, tilt: 0.5, size: 2, color: '#059669' },
      ];

      satellites.forEach(sat => {
        const angle = time * sat.speed;
        const orbitR = r * 1.25;

        // Orbit path
        ctx.beginPath();
        ctx.strokeStyle = `${sat.color}15`;
        ctx.lineWidth = 1;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(sat.tilt);
        ctx.ellipse(0, 0, orbitR, orbitR * 0.4, 0, 0, Math.PI * 2);
        ctx.restore();
        ctx.stroke();

        // Satellite dot
        const sx = Math.cos(angle) * orbitR;
        const sy = Math.sin(angle) * orbitR * 0.4;
        const rotX = sx * Math.cos(sat.tilt) - sy * Math.sin(sat.tilt);
        const rotY = sx * Math.sin(sat.tilt) + sy * Math.cos(sat.tilt);

        // Only draw if "in front" of globe
        if (Math.sin(angle) > -0.3 || Math.sqrt(rotX * rotX + rotY * rotY) > r) {
          ctx.beginPath();
          ctx.arc(cx + rotX, cy + rotY, sat.size, 0, Math.PI * 2);
          ctx.fillStyle = sat.color;
          ctx.fill();

          // Scan line from satellite
          ctx.beginPath();
          ctx.strokeStyle = `${sat.color}30`;
          ctx.lineWidth = 1;
          ctx.moveTo(cx + rotX, cy + rotY);
          const scanX = cx + rotX * 0.4;
          const scanY = cy + rotY * 0.4;
          ctx.lineTo(scanX, scanY);
          ctx.stroke();

          // Scan point on surface
          ctx.beginPath();
          ctx.arc(scanX, scanY, 2, 0, Math.PI * 2);
          ctx.fillStyle = `${sat.color}60`;
          ctx.fill();
        }
      });

      // Embedding data points floating around
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2 + time * 0.2;
        const dist2 = r * 1.4 + Math.sin(a * 3 + time) * 15;
        const px2 = cx + Math.cos(a) * dist2;
        const py2 = cy + Math.sin(a) * dist2 * 0.6;
        const sz = 1 + Math.sin(a + time * 2) * 0.5;
        ctx.beginPath();
        ctx.arc(px2, py2, sz, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? '#1a73e8' : i % 3 === 1 ? '#059669' : '#c67b2e';
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Globe rim highlight
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(26, 138, 122, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      time += 0.008;
      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section className="hero" data-section="hero">
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="hero-content">
        <div className="hero-badge">Large Earth Observation Models</div>
        <h1>Geospatial<br />Foundation Models</h1>
        <p className="hero-tagline">
          For 20 years, text search relied on keywords — until vector embeddings 
          changed everything. Now the same shift is happening for Earth observation: 
          LEOMs turn petabytes of satellite imagery into geo-embeddings — compact, 
          searchable representations that let AI reason about our planet across 
          space, time, and meaning.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">8</span>
            <span className="hero-stat-label">Major Models</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">10m</span>
            <span className="hero-stat-label">Resolution</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">PB+</span>
            <span className="hero-stat-label">Training Data</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">Global</span>
            <span className="hero-stat-label">Coverage</span>
          </div>
        </div>
        <div className="hero-scroll">
          <span>Explore</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <path d="M8 4V20M8 20L2 14M8 20L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </section>
  );
}
