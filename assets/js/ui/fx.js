// Праздничные эффекты на canvas: лепестки, сердечки, искры, конфетти, звёзды.
import { reducedMotion } from './util.js';

const PALETTE = {
  hearts: ['#F0849F', '#F0624A', '#FFB088', '#FF9DB5', '#E8588A'],
  petals: ['#FFC2D1', '#F9A8C0', '#FFE3A1', '#F7B8E0', '#FFFFFF'],
  sparkles: ['#FFE3A1', '#FFFFFF', '#FFB088', '#C7B8FF'],
  confetti: ['#F0624A', '#FFE3A1', '#8FE3C4', '#C7B8FF', '#F0849F', '#7FB6FF'],
  stars: ['#FFE3A1', '#FFFFFF', '#FFD27A', '#C7B8FF'],
};
const SHAPE = { hearts: 'heart', petals: 'petal', sparkles: 'spark', confetti: 'rect', stars: 'spark' };

function drawHeart(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s, -s * 0.35, -s * 0.45, -s, 0, -s * 0.4);
  ctx.bezierCurveTo(s * 0.45, -s, s, -s * 0.35, 0, s * 0.35);
  ctx.fill();
}
function drawSpark(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.12, -s * 0.12, s, 0);
  ctx.quadraticCurveTo(s * 0.12, s * 0.12, 0, s);
  ctx.quadraticCurveTo(-s * 0.12, s * 0.12, -s, 0);
  ctx.quadraticCurveTo(-s * 0.12, -s * 0.12, 0, -s);
  ctx.fill();
}
function drawPetal(ctx, s) {
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.55, s, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Взрыв частиц из точки (x, y — в пикселях окна).
 * kind: hearts | petals | sparkles | confetti | stars
 */
export function burst(kind = 'confetti', { x = innerWidth / 2, y = innerHeight / 2, count = 90, spread = 1 } = {}) {
  if (reducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const colors = PALETTE[kind] ?? PALETTE.confetti;
  const shape = SHAPE[kind] ?? 'rect';
  const floaty = kind === 'petals' || kind === 'hearts';
  const parts = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (4 + Math.random() * 9) * spread;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (floaty ? 5 : 7),
      size: (shape === 'rect' ? 5 : 7) + Math.random() * (shape === 'spark' ? 9 : 8),
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      ttl: 1900 + Math.random() * 1200, // миллисекунды
      sway: Math.random() * Math.PI * 2,
    };
  });

  // Время жизни считается в настоящих миллисекундах: даже если браузер рисует редко
  // (вкладка в фоне, слабое устройство), эффект закончится вовремя.
  let last = performance.now();
  const killer = setTimeout(() => canvas.remove(), 7000);
  function frame(now) {
    const ms = now - last;
    const dt = Math.min(2.5, ms / 16.67);
    last = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of parts) {
      p.life += ms;
      if (p.life > p.ttl) continue;
      alive++;
      p.vy += (floaty ? 0.16 : 0.28) * dt;
      p.vx *= 0.985; p.vy *= 0.99;
      p.sway += 0.08 * dt;
      p.x += (p.vx + (floaty ? Math.sin(p.sway) * 0.9 : 0)) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const fade = Math.min(1, (p.ttl - p.life) / 450);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (shape === 'heart') drawHeart(ctx, p.size);
      else if (shape === 'spark') drawSpark(ctx, p.size);
      else if (shape === 'petal') drawPetal(ctx, p.size * 0.8);
      else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (alive) requestAnimationFrame(frame);
    else { clearTimeout(killer); canvas.remove(); }
  }
  requestAnimationFrame(frame);
}
