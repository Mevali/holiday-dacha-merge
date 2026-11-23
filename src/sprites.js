import { ALL_SPRITE_IDS, CHAINS, ITEMS } from './data.js';

export class SpriteBank {
  constructor(onSpriteLoaded = null) {
    this.onSpriteLoaded = onSpriteLoaded;
    this.images = new Map();
    this.loadedUrls = new Map();
    this.fallbacks = new Map();
  }

  preloadAll() {
    for (const id of ALL_SPRITE_IDS) {
      const url = `assets/sprites/${id}.webp`;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (img.naturalWidth > 0) {
          this.images.set(id, img);
          this.loadedUrls.set(id, url);
          this.onSpriteLoaded?.(id, url, img);
        }
      };
      img.onerror = () => {
        // Fallback stays active cleanly
      };
      img.src = url;
    }
  }

  getImage(id) {
    return this.images.get(id) || null;
  }

  getUrl(id) {
    if (this.loadedUrls.has(id)) {
      return this.loadedUrls.get(id);
    }
    if (!this.fallbacks.has(id)) {
      this.fallbacks.set(id, id === 'dacha_scene_base' ? this.makeSceneFallback() : this.makeIconFallback(id));
    }
    return this.fallbacks.get(id);
  }

  makeIconFallback(id) {
    if (typeof document === 'undefined') return '';
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (!ctx) return '';

    const meta = ITEMS[id] || {};
    const chain = meta.chain ? CHAINS[meta.chain] : (meta.producesChain ? CHAINS[meta.producesChain] : null);
    const baseColor = meta.color || chain?.color || '#e86a33';

    // Glossy 3D squircle medallion fallback
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 14, 16, 100, 100, 30);
    ctx.fillStyle = 'rgba(20, 30, 45, 0.18)';
    ctx.fill();

    ctx.beginPath();
    roundRect(ctx, 14, 12, 100, 98, 30);
    const grad = ctx.createLinearGradient(14, 12, 14, 110);
    grad.addColorStop(0, lightenHex(baseColor, 0.34));
    grad.addColorStop(0.55, baseColor);
    grad.addColorStop(1, darkenHex(baseColor, 0.22));
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.stroke();

    // Top specular highlight
    ctx.beginPath();
    roundRect(ctx, 24, 18, 80, 34, 18);
    const spec = ctx.createLinearGradient(24, 18, 24, 52);
    spec.addColorStop(0, 'rgba(255,255,255,0.68)');
    spec.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = spec;
    ctx.fill();

    // Emoji / winter glyph centerpiece
    ctx.font = '52px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fillText(meta.glyph || '⭐', 64, 63);
    ctx.restore();

    return c.toDataURL('image/png');
  }

  makeSceneFallback() {
    if (typeof document === 'undefined') return '';
    const c = document.createElement('canvas');
    c.width = 600;
    c.height = 338;
    const ctx = c.getContext('2d');
    if (!ctx) return '';
    drawProceduralDachaBase(ctx, 600, 338);
    return c.toDataURL('image/png');
  }
}

export function drawProceduralDachaBase(ctx, w, h) {
  ctx.save();
  // Starry twilight winter sky
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  sky.addColorStop(0, '#0f1c3f');
  sky.addColorStop(0.55, '#1e3a6d');
  sky.addColorStop(1, '#4b6cb7');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Distant snowy forest hills
  ctx.fillStyle = '#25416b';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.quadraticCurveTo(w * 0.25, h * 0.48, w * 0.55, h * 0.58);
  ctx.quadraticCurveTo(w * 0.82, h * 0.46, w, h * 0.57);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Snowy yard ground
  const snow = ctx.createLinearGradient(0, h * 0.56, 0, h);
  snow.addColorStop(0, '#e6f0ff');
  snow.addColorStop(0.5, '#d5e5fb');
  snow.addColorStop(1, '#bdd3f2');
  ctx.fillStyle = snow;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.6);
  ctx.quadraticCurveTo(w * 0.45, h * 0.54, w, h * 0.61);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Wooden picket fence
  ctx.fillStyle = '#7c5338';
  for (let x = 20; x < w - 20; x += 26) {
    if (x > w * 0.36 && x < w * 0.62) continue;
    ctx.fillRect(x, h * 0.56, 10, h * 0.11);
  }
  ctx.fillRect(16, h * 0.59, w * 0.34, 5);
  ctx.fillRect(w * 0.63, h * 0.59, w * 0.35, 5);

  // Cozy wooden Russian Dacha cabin (center-left)
  const hx = w * 0.36;
  const hy = h * 0.33;
  const hw = w * 0.34;
  const hh = h * 0.34;

  // Brick chimney
  ctx.fillStyle = '#8d3b32';
  ctx.fillRect(hx + hw * 0.72, hy - h * 0.14, hw * 0.11, h * 0.18);
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(hx + hw * 0.7, hy - h * 0.15, hw * 0.15, 7);

  // Cabin walls
  const wood = ctx.createLinearGradient(hx, hy, hx, hy + hh);
  wood.addColorStop(0, '#9c5f34');
  wood.addColorStop(1, '#6f3f1f');
  ctx.fillStyle = wood;
  ctx.fillRect(hx, hy, hw, hh);

  // Snowy pitched roof
  ctx.beginPath();
  ctx.moveTo(hx - hw * 0.1, hy + 8);
  ctx.lineTo(hx + hw * 0.5, hy - h * 0.18);
  ctx.lineTo(hx + hw * 1.1, hy + 8);
  ctx.closePath();
  ctx.fillStyle = '#69322a';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(hx - hw * 0.12, hy + 6);
  ctx.lineTo(hx + hw * 0.5, hy - h * 0.2);
  ctx.lineTo(hx + hw * 1.12, hy + 6);
  ctx.lineTo(hx + hw * 1.04, hy + 14);
  ctx.lineTo(hx + hw * 0.5, hy - h * 0.13);
  ctx.lineTo(hx - hw * 0.04, hy + 14);
  ctx.closePath();
  ctx.fillStyle = '#f8fbff';
  ctx.fill();

  // Cabin windows (dim until upgraded) & porch door
  ctx.fillStyle = '#3b2416';
  ctx.fillRect(hx + hw * 0.42, hy + hh * 0.36, hw * 0.18, hh * 0.64);
  ctx.fillStyle = '#334e68';
  ctx.fillRect(hx + hw * 0.1, hy + hh * 0.34, hw * 0.22, hh * 0.32);
  ctx.fillRect(hx + hw * 0.68, hy + hh * 0.34, hw * 0.22, hh * 0.32);

  // Big courtyard pine tree on the left
  const tx = w * 0.17;
  const ty = h * 0.22;
  ctx.fillStyle = '#4a2e1b';
  ctx.fillRect(tx - 10, ty + h * 0.41, 20, h * 0.09);
  for (let i = 0; i < 4; i++) {
    const lw = 38 + i * 26;
    const ly = ty + i * (h * 0.1);
    ctx.beginPath();
    ctx.moveTo(tx, ly - 18);
    ctx.lineTo(tx - lw, ly + h * 0.14);
    ctx.lineTo(tx + lw, ly + h * 0.14);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? '#185a3b' : '#1f6f4a';
    ctx.fill();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function parseHex(hex) {
  const clean = String(hex || '#e86a33').replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16) || 0xe86a33;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function lightenHex(hex, amt) {
  const [r, g, b] = parseHex(hex);
  const mix = (v) => Math.min(255, Math.round(v + (255 - v) * amt));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function darkenHex(hex, amt) {
  const [r, g, b] = parseHex(hex);
  const mix = (v) => Math.max(0, Math.round(v * (1 - amt)));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}
