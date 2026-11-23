import { DACHA_UPGRADES } from './data.js';
import { drawProceduralDachaBase } from './sprites.js';

/**
 * Style filter presets per (upgradeId, styleIdx) so each 3-style swatch visibly customizes
 * the real 3D rendered prop sprite while keeping 100% Pixar-3D shading and volume!
 */
const STYLE_FILTERS = {
  upg_snow_path: [
    'none',
    'sepia(0.45) saturate(1.85) hue-rotate(-22deg) brightness(0.98)',
    'sepia(0.55) saturate(1.45) hue-rotate(-6deg) brightness(1.02)'
  ],
  upg_courtyard_tree: [
    'none',
    'hue-rotate(155deg) saturate(1.12) brightness(1.06)',
    'hue-rotate(-32deg) saturate(1.32) brightness(1.04)'
  ],
  upg_porch_garlands: [
    'none',
    'hue-rotate(-26deg) saturate(1.35) brightness(1.04)',
    'hue-rotate(95deg) saturate(1.25) brightness(1.05)'
  ],
  upg_samovar_table: [
    'none',
    'hue-rotate(212deg) saturate(1.18) brightness(1.04)',
    'hue-rotate(36deg) saturate(1.25) brightness(1.08)'
  ],
  upg_snowman: [
    'none',
    'hue-rotate(215deg) saturate(1.15)',
    'hue-rotate(115deg) saturate(1.18)'
  ],
  upg_ice_lanterns: [
    'none',
    'hue-rotate(162deg) saturate(1.25) brightness(1.06)',
    'hue-rotate(-38deg) saturate(1.35) brightness(1.04)'
  ],
  upg_wooden_sled: [
    'none',
    'hue-rotate(198deg) saturate(1.2) brightness(1.05)',
    'hue-rotate(108deg) saturate(1.18) brightness(1.03)'
  ],
  upg_festive_wreath: [
    'none',
    'hue-rotate(34deg) saturate(1.22) brightness(1.06)',
    'saturate(0.68) brightness(1.14)'
  ],
  upg_fireworks: [
    'none',
    'hue-rotate(88deg) saturate(1.3)',
    'hue-rotate(185deg) saturate(1.35)'
  ]
};

export class DachaSceneRenderer {
  constructor(spriteBank) {
    this.spriteBank = spriteBank;
    this.styledCache = new Map();
    this.unlockPopTimers = {};

    this.snowflakes = Array.from({ length: 48 }, (_, i) => ({
      x: (i * 137.5) % 1200,
      y: (i * 89.3) % 675,
      r: 1.6 + (i % 4) * 0.95,
      vy: 17 + (i % 5) * 8.5,
      vx: -6 + (i % 7) * 2.1,
      phase: i * 0.7
    }));

    this.smokePuffs = Array.from({ length: 9 }, (_, i) => ({
      t: i / 9
    }));

    this.steamWisps = Array.from({ length: 5 }, (_, i) => ({
      t: i / 5
    }));

    this.fireworkBursts = [];
    this.fwCooldown = 0.2;
    this.celebrationSparks = [];
  }

  triggerCelebration(unlockedId = null) {
    if (unlockedId) {
      this.unlockPopTimers[unlockedId] = 0.001;
    }
    for (let i = 0; i < 42; i++) {
      const ang = (Math.PI * 2 * i) / 42 + Math.random() * 0.22;
      const spd = 95 + Math.random() * 230;
      this.celebrationSparks.push({
        x: 600 + (Math.random() - 0.5) * 380,
        y: 340 + (Math.random() - 0.5) * 160,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 70,
        life: 1.0,
        color: i % 2 === 0 ? '#fde047' : '#34d399'
      });
    }
  }

  getStyledSprite(spriteId, upgId, styleIdx = 0, flipX = false) {
    const rawImg = this.spriteBank.getImage(spriteId);
    if (!rawImg || !rawImg.naturalWidth) return null;

    const filterStr = STYLE_FILTERS[upgId]?.[styleIdx] || 'none';
    if (filterStr === 'none' && !flipX) {
      return rawImg;
    }

    const key = `${spriteId}|${upgId}|${styleIdx}|${flipX ? 1 : 0}`;
    if (this.styledCache.has(key)) {
      return this.styledCache.get(key);
    }

    if (typeof document === 'undefined') return rawImg;
    const w = rawImg.naturalWidth;
    const h = rawImg.naturalHeight;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    if (!octx) return rawImg;

    octx.save();
    if (filterStr !== 'none' && 'filter' in octx) {
      octx.filter = filterStr;
    }
    if (flipX) {
      octx.translate(w, 0);
      octx.scale(-1, 1);
    }
    octx.drawImage(rawImg, 0, 0, w, h);
    octx.restore();

    this.styledCache.set(key, off);
    return off;
  }

  update(dt, unlockedMap) {
    for (const s of this.snowflakes) {
      s.y += s.vy * dt;
      s.x += (s.vx + Math.sin(s.y * 0.02 + s.phase) * 8) * dt;
      if (s.y > 685) {
        s.y = -10;
        s.x = (s.x + 1200) % 1200;
      }
      if (s.x < -10) s.x += 1220;
      if (s.x > 1210) s.x -= 1220;
    }

    for (const p of this.smokePuffs) {
      p.t = (p.t + dt * 0.22) % 1;
    }

    for (const w of this.steamWisps) {
      w.t = (w.t + dt * 0.42) % 1;
    }

    for (const k of Object.keys(this.unlockPopTimers)) {
      this.unlockPopTimers[k] += dt * 2.4;
      if (this.unlockPopTimers[k] >= 1) {
        delete this.unlockPopTimers[k];
      }
    }

    if (unlockedMap && unlockedMap.upg_fireworks !== undefined) {
      const styleIdx = unlockedMap.upg_fireworks || 0;
      const upg = DACHA_UPGRADES.find((u) => u.id === 'upg_fireworks');
      const st = upg?.styles[styleIdx] || upg?.styles[0];
      this.fwCooldown -= dt;
      if (this.fwCooldown <= 0 && this.fireworkBursts.length < 4) {
        this.fwCooldown = 0.85 + Math.random() * 0.75;
        const spots = [
          [385, 122],
          [885, 108],
          [265, 138],
          [745, 96]
        ];
        const pick = spots[Math.floor(Math.random() * spots.length)];
        const cx = pick[0] + (Math.random() - 0.5) * 70;
        const cy = pick[1] + (Math.random() - 0.5) * 32;
        const sparks = [];
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 * i) / 16 + Math.random() * 0.2;
          const sp = 45 + Math.random() * 75;
          sparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            color: i % 2 === 0 ? st.primary : st.secondary
          });
        }
        this.fireworkBursts.push({
          cx,
          cy,
          size: 155 + Math.random() * 45,
          rot: (Math.random() - 0.5) * 0.8,
          styleIdx,
          age: 0,
          dur: 1.45,
          sparks
        });
      }
    }

    for (let i = this.fireworkBursts.length - 1; i >= 0; i--) {
      const b = this.fireworkBursts[i];
      b.age += dt;
      if (b.age >= b.dur) {
        this.fireworkBursts.splice(i, 1);
        continue;
      }
      for (const sp of b.sparks) {
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 42 * dt;
      }
    }

    for (let i = this.celebrationSparks.length - 1; i >= 0; i--) {
      const sp = this.celebrationSparks[i];
      sp.life -= dt * 1.15;
      if (sp.life <= 0) {
        this.celebrationSparks.splice(i, 1);
        continue;
      }
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 180 * dt;
    }
  }

  getAnimScale(upgId, previewLockedId, nowSec) {
    const popT = this.unlockPopTimers[upgId];
    if (popT !== undefined) {
      // Elastic ease-out pop-in
      const p = Math.min(1, popT);
      return 0.65 + 0.35 * p + Math.sin(p * Math.PI) * 0.16;
    }
    if (previewLockedId === upgId) {
      return 1.0 + 0.028 * Math.sin(nowSec * 4.6);
    }
    return 1.0;
  }

  renderToCanvas(canvas, unlockedMap, nowSec, previewLockedId = null) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    const scale = Math.max(targetW / 1200, targetH / 675);
    const ox = (targetW - 1200 * scale) * 0.5;
    const oy = (targetH - 675 * scale) * 0.5;
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const baseImg = this.spriteBank.getImage('dacha_scene_base');
    if (baseImg && baseImg.naturalWidth > 0) {
      ctx.drawImage(baseImg, 0, 0, 1200, 675);
    } else {
      drawProceduralDachaBase(ctx, 1200, 675);
    }

    const getEntry = (id) => {
      if (!unlockedMap || unlockedMap[id] === undefined) return null;
      const u = DACHA_UPGRADES.find((item) => item.id === id);
      if (!u) return null;
      const styleIdx = unlockedMap[id] || 0;
      return { styleIdx, style: u.styles[styleIdx] || u.styles[0] };
    };

    const draw3DProp = (spriteId, upgId, styleIdx, cx, cy, w, h, rotRad = 0, flipX = false, extraScale = 1) => {
      const img = this.getStyledSprite(spriteId, upgId, styleIdx, flipX);
      if (!img) return;
      ctx.save();
      ctx.translate(cx, cy);
      if (rotRad !== 0) ctx.rotate(rotRad);
      if (extraScale !== 1) ctx.scale(extraScale, extraScale);
      if (previewLockedId === upgId) {
        ctx.globalAlpha = 0.92 + 0.08 * Math.sin(nowSec * 5.0);
      }
      ctx.drawImage(img, -w * 0.5, -h * 0.5, w, h);
      ctx.restore();
    };

    // 1. Warm Cabin Windows & Cozy Chimney Smoke (screen-blended so real 3D wooden muntins stay crisp!)
    const glowEntry = getEntry('upg_chimney_glow');
    if (glowEntry) {
      const { style: glowSt } = glowEntry;
      ctx.save();
      for (const p of this.smokePuffs) {
        const sx = 795 + Math.sin(p.t * 5.2 + nowSec * 1.5) * (10 + p.t * 18) + p.t * 34;
        const sy = 108 - p.t * 98;
        const sr = 9 + p.t * 22;
        const gSmoke = ctx.createRadialGradient(sx, sy, 1, sx, sy, sr);
        gSmoke.addColorStop(0, hexToRgba(glowSt.primary, (1 - p.t) * 0.34));
        gSmoke.addColorStop(0.6, `rgba(226, 232, 240, ${(1 - p.t) * 0.22})`);
        gSmoke.addColorStop(1, 'rgba(226, 232, 240, 0)');
        ctx.fillStyle = gSmoke;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'screen';
      const winPanes = [
        { x: 599, y: 222, w: 30, h: 46, r: 58 },
        { x: 537, y: 360, w: 32, h: 56, r: 68 },
        { x: 600, y: 360, w: 32, h: 56, r: 68 },
        { x: 671, y: 361, w: 32, h: 56, r: 68 },
        { x: 950, y: 370, w: 26, h: 46, r: 52 }
      ];
      for (const w of winPanes) {
        const flicker = 0.9 + 0.1 * Math.sin(nowSec * 3.6 + w.x * 0.05);
        // Crisp interior warm glass pane (screen blend preserves dark wooden crossbars!)
        const paneGrad = ctx.createLinearGradient(w.x, w.y - w.h * 0.5, w.x, w.y + w.h * 0.5);
        paneGrad.addColorStop(0, hexToRgba(glowSt.primary, 0.88 * flicker));
        paneGrad.addColorStop(1, hexToRgba(glowSt.secondary, 0.72 * flicker));
        ctx.fillStyle = paneGrad;
        ctx.beginPath();
        ctx.roundRect(w.x - w.w * 0.5, w.y - w.h * 0.5, w.w, w.h, 3);
        ctx.fill();

        // Soft warm spill onto carved shutters & snowy window sill
        const rad = ctx.createRadialGradient(w.x, w.y, 4, w.x, w.y, w.r * flicker);
        rad.addColorStop(0, hexToRgba(glowSt.primary, 0.56));
        rad.addColorStop(0.5, hexToRgba(glowSt.secondary, 0.25));
        rad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r * flicker, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Cleared 3D Cobblestone Snow Path (squarely inside courtyard from porch step to front lawn)
    const pathEntry = getEntry('upg_snow_path');
    if (pathEntry) {
      const sc = this.getAnimScale('upg_snow_path', previewLockedId, nowSec);
      draw3DProp('prop_stone_path', 'upg_snow_path', pathEntry.styleIdx, 666, 518, 226, 108, (-7 * Math.PI) / 180, false, sc);
    }

    // 4. 3D Pine & Fairy-Bulb Garlands across cabin front cornice & porch roof
    const garEntry = getEntry('upg_porch_garlands');
    if (garEntry) {
      const sc = this.getAnimScale('upg_porch_garlands', previewLockedId, nowSec);
      draw3DProp('prop_porch_garland', 'upg_porch_garlands', garEntry.styleIdx, 605, 326, 268, 134, 0, false, sc);
      draw3DProp('prop_porch_garland', 'upg_porch_garlands', garEntry.styleIdx, 836, 356, 168, 110, 0, false, sc);
      // Soft twinkling light bloom along the garlands
      const tw = 0.72 + 0.28 * Math.sin(nowSec * 4.5);
      drawGlowHalo(ctx, 605, 314, 95 * tw, garEntry.style.primary, 0.28);
      drawGlowHalo(ctx, 836, 344, 65 * tw, garEntry.style.secondary, 0.26);
    }

    // 9. 3D Festive Bell Wreath on Cabin Door & Attic Gable
    const wreathEntry = getEntry('upg_festive_wreath');
    if (wreathEntry) {
      const sc = this.getAnimScale('upg_festive_wreath', previewLockedId, nowSec);
      drawGlowHalo(ctx, 836, 386, 36, wreathEntry.style.primary, 0.32);
      draw3DProp('prop_door_wreath', 'upg_festive_wreath', wreathEntry.styleIdx, 836, 386, 56, 56, 0, false, sc);
      draw3DProp('prop_door_wreath', 'upg_festive_wreath', wreathEntry.styleIdx, 599, 166, 44, 44, 0, false, sc);
    }

    // 3. 3D Dressed Courtyard Christmas Tree with Gifts & Glowing Star
    const treeEntry = getEntry('upg_courtyard_tree');
    if (treeEntry) {
      const sc = this.getAnimScale('upg_courtyard_tree', previewLockedId, nowSec);
      drawSnowShadow(ctx, 198, 548, 132, 26, 0.36);
      draw3DProp('prop_dressed_tree', 'upg_courtyard_tree', treeEntry.styleIdx, 196, 332, 388, 490, 0, false, sc);
      const starPulse = 0.85 + 0.15 * Math.sin(nowSec * 3.8);
      drawGlowHalo(ctx, 196, 126, 62 * starPulse, treeEntry.style.secondary, 0.45);
      drawGlowHalo(ctx, 196, 360, 145 * starPulse, treeEntry.style.primary, 0.16);
    }

    // 8. 3D Painted Wooden Sleigh Overflowing with Holiday Gifts
    const sledEntry = getEntry('upg_wooden_sled');
    if (sledEntry) {
      const sc = this.getAnimScale('upg_wooden_sled', previewLockedId, nowSec);
      drawSnowShadow(ctx, 952, 492, 62, 15, 0.34);
      draw3DProp('prop_sleigh_gifts', 'upg_wooden_sled', sledEntry.styleIdx, 952, 446, 134, 110, 0, true, sc);
    }

    // 5. 3D Festive Samovar Table with Tangerines, Pie & Steaming Teapot
    const tabEntry = getEntry('upg_samovar_table');
    if (tabEntry) {
      const sc = this.getAnimScale('upg_samovar_table', previewLockedId, nowSec);
      drawSnowShadow(ctx, 492, 558, 66, 17, 0.36);
      draw3DProp('prop_samovar_table', 'upg_samovar_table', tabEntry.styleIdx, 492, 486, 174, 174, 0, false, sc);
      // Delicate rising steam wisps above samovar teapot (x=508, y=402)
      ctx.save();
      for (const sw of this.steamWisps) {
        const wx = 507 + Math.sin(sw.t * 6.0 + nowSec * 2.4) * 5;
        const wy = 402 - sw.t * 32;
        const wr = 4 + sw.t * 8;
        ctx.beginPath();
        ctx.arc(wx, wy, wr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 250, 240, ${(1 - sw.t) * 0.28})`;
        ctx.fill();
      }
      ctx.restore();
    }

    // 6. 3D Cheerful Courtyard Snowman with Bucket Hat, Scarf & Birch Broom
    const snowEntry = getEntry('upg_snowman');
    if (snowEntry) {
      const sc = this.getAnimScale('upg_snowman', previewLockedId, nowSec);
      drawSnowShadow(ctx, 348, 566, 52, 15, 0.35);
      draw3DProp('prop_snowman_deluxe', 'upg_snowman', snowEntry.styleIdx, 348, 502, 150, 150, 0, false, sc);
    }

    // 7. 3D Brass Garden Lantern Posts with Warm Snow Light Pools
    const lanEntry = getEntry('upg_ice_lanterns');
    if (lanEntry) {
      const sc = this.getAnimScale('upg_ice_lanterns', previewLockedId, nowSec);
      const flick = 0.88 + 0.12 * Math.sin(nowSec * 4.4);
      // Warm light pools on snow + lamp head halos
      drawGlowHalo(ctx, 734, 486, 58 * flick, lanEntry.style.primary, 0.34);
      drawSnowShadow(ctx, 734, 494, 22, 7, 0.34);
      draw3DProp('prop_lantern_post', 'upg_ice_lanterns', lanEntry.styleIdx, 734, 434, 92, 130, 0, false, sc);
      drawGlowHalo(ctx, 734, 396, 46 * flick, lanEntry.style.primary, 0.48);

      drawGlowHalo(ctx, 602, 554, 72 * flick, lanEntry.style.primary, 0.36);
      drawSnowShadow(ctx, 602, 566, 26, 8, 0.36);
      draw3DProp('prop_lantern_post', 'upg_ice_lanterns', lanEntry.styleIdx, 602, 494, 112, 158, 0, false, sc);
      drawGlowHalo(ctx, 602, 446, 54 * flick, lanEntry.style.primary, 0.52);
    }

    // 10. 3D New Year Fireworks in the Starry Sky (live bursts + static preview if previewing in modal!)
    const fwEntry = getEntry('upg_fireworks');
    if (fwEntry) {
      if (this.fireworkBursts.length === 0 || previewLockedId === 'upg_fireworks') {
        const pulse = 0.88 + 0.12 * Math.sin(nowSec * 3.6);
        drawGlowHalo(ctx, 392, 124, 95 * pulse, fwEntry.style.primary, 0.32);
        draw3DProp('prop_firework_burst', 'upg_fireworks', fwEntry.styleIdx, 392, 124, 180 * pulse, 180 * pulse, nowSec * 0.12);
        drawGlowHalo(ctx, 888, 106, 85 * pulse, fwEntry.style.secondary, 0.3);
        draw3DProp('prop_firework_burst', 'upg_fireworks', fwEntry.styleIdx, 888, 106, 160 * pulse, 160 * pulse, -nowSec * 0.1 + 0.4);
      }
      for (const b of this.fireworkBursts) {
        const p = b.age / b.dur;
        const alpha = p < 0.2 ? p / 0.2 : Math.max(0, 1 - (p - 0.2) / 0.8);
        const grow = 0.45 + 0.72 * Math.sin(Math.min(1, p * 1.35) * (Math.PI * 0.5));
        ctx.save();
        ctx.globalAlpha = alpha;
        drawGlowHalo(ctx, b.cx, b.cy, b.size * 0.55 * grow, fwEntry.style.primary, 0.38 * alpha);
        draw3DProp('prop_firework_burst', 'upg_fireworks', b.styleIdx, b.cx, b.cy, b.size * grow, b.size * grow, b.rot);
        for (const sp of b.sparks) {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = sp.color;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Celebration burst sparks
    for (const sp of this.celebrationSparks) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.life);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Gentle ambient winter snowfall
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    for (const s of this.snowflakes) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  }
}

function drawSnowShadow(ctx, cx, cy, rx, ry, alpha = 0.34) {
  ctx.save();
  const g = ctx.createRadialGradient(cx, cy, rx * 0.15, cx, cy, rx);
  g.addColorStop(0, `rgba(10, 20, 46, ${alpha})`);
  g.addColorStop(0.65, `rgba(10, 20, 46, ${alpha * 0.45})`);
  g.addColorStop(1, 'rgba(10, 20, 46, 0)');
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGlowHalo(ctx, x, y, r, hex, maxAlpha = 0.55) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const g = ctx.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, hexToRgba(hex, maxAlpha));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const clean = String(hex || '#ffd166').replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16) || 0xffd166;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}
