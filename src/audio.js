const AUDIO_FILES = {
  bgm_atelier: 'assets/audio/bgm_atelier.mp3',
  sfx_bubble: 'assets/audio/sfx_bubble.mp3',
  sfx_click: 'assets/audio/sfx_click.mp3',
  sfx_coins: 'assets/audio/sfx_coins.mp3',
  sfx_paper: 'assets/audio/sfx_paper.mp3',
  sfx_part_snap: 'assets/audio/sfx_part_snap.mp3',
  sfx_screw_pop: 'assets/audio/sfx_screw_pop.mp3',
  sfx_stage_chime: 'assets/audio/sfx_stage_chime.mp3',
  sfx_tool_pickup: 'assets/audio/sfx_tool_pickup.mp3',
  sfx_wrong: 'assets/audio/sfx_wrong.mp3'
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.bgmSource = null;

    this.rawBuffers = new Map();
    this.buffers = new Map();
    this.fetching = new Map();
    this.decoding = new Set();

    this.userMuted = false;
    this.platformAudioEnabled = true;
    this.platformPaused = false;
    this.adOpen = false;
    this.pageHidden = typeof document !== 'undefined' ? Boolean(document.hidden) : false;
    this.initialized = false;
    this.preloadStarted = false;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.setPageHidden(Boolean(document.hidden));
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', () => this.setPageHidden(true));
      window.addEventListener('focus', () => {
        if (typeof document !== 'undefined' && !document.hidden) {
          this.setPageHidden(false);
        }
      });
    }
  }

  isSilenced() {
    return (
      this.userMuted ||
      !this.platformAudioEnabled ||
      this.platformPaused ||
      this.adOpen ||
      this.pageHidden
    );
  }

  preloadAll() {
    if (this.preloadStarted || typeof fetch !== 'function') return;
    this.preloadStarted = true;
    const keys = Object.keys(AUDIO_FILES);
    const priority = ['sfx_click', 'sfx_part_snap', 'sfx_screw_pop', 'sfx_coins', 'sfx_stage_chime', 'bgm_atelier'];
    const rest = keys.filter((k) => !priority.includes(k));
    Promise.all(priority.map((k) => this.fetchKey(k))).finally(() => {
      for (const k of rest) this.fetchKey(k);
    });
  }

  fetchKey(key) {
    if (typeof fetch !== 'function') return Promise.resolve(null);
    if (this.rawBuffers.has(key)) return Promise.resolve(this.rawBuffers.get(key));
    if (this.fetching.has(key)) return this.fetching.get(key);
    const url = AUDIO_FILES[key];
    if (!url) return Promise.resolve(null);

    const p = fetch(url)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then((buf) => {
        this.fetching.delete(key);
        if (!buf) return null;
        this.rawBuffers.set(key, buf);
        if (this.initialized) this.decodeKey(key);
        return buf;
      })
      .catch(() => {
        this.fetching.delete(key);
        return null;
      });
    this.fetching.set(key, p);
    return p;
  }

  decodeKey(key) {
    if (!this.ctx || this.buffers.has(key) || this.decoding.has(key)) return;
    const raw = this.rawBuffers.get(key);
    if (!raw) return;
    this.decoding.add(key);
    this.ctx
      .decodeAudioData(raw.slice(0))
      .then((audioBuf) => {
        this.buffers.set(key, audioBuf);
        this.decoding.delete(key);
        if (key === 'bgm_atelier') this.ensureBgmPlaying();
      })
      .catch(() => {
        this.decoding.delete(key);
      });
  }

  ensureContext() {
    if (this.initialized) return true;
    const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (!AudioCtx) return false;
    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isSilenced() ? 0 : 0.85;

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.isSilenced() ? 0 : 0.14;

      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.initialized = true;
      for (const k of this.rawBuffers.keys()) {
        this.decodeKey(k);
      }
      this.ensureBgmPlaying();
      return true;
    } catch {
      return false;
    }
  }

  ensureBgmPlaying() {
    if (!this.initialized || !this.ctx || !this.bgmGain || this.bgmSource) return;
    const buf = this.buffers.get('bgm_atelier');
    if (!buf) {
      if (this.rawBuffers.has('bgm_atelier')) this.decodeKey('bgm_atelier');
      else this.fetchKey('bgm_atelier');
      return;
    }
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(this.bgmGain);
      src.start(0);
      this.bgmSource = src;
    } catch {
      this.bgmSource = null;
    }
  }

  unlock() {
    if (!this.ensureContext() || !this.ctx) return;
    this.ensureBgmPlaying();
    if (!this.isSilenced() && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.syncAudioState();
  }

  syncAudioState() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    if (this.isSilenced()) {
      this.masterGain.gain.setValueAtTime(0, now);
      if (this.bgmGain) this.bgmGain.gain.setValueAtTime(0, now);
      if (this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } else {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.masterGain.gain.setValueAtTime(0.85, now);
      if (this.bgmGain) this.bgmGain.gain.setValueAtTime(0.14, now);
      this.ensureBgmPlaying();
    }
  }

  setUserMuted(muted) {
    this.userMuted = Boolean(muted);
    this.syncAudioState();
    return this.userMuted;
  }

  setPlatformAudioEnabled(enabled) {
    this.platformAudioEnabled = Boolean(enabled);
    this.syncAudioState();
  }

  setPlatformPaused(paused) {
    this.platformPaused = Boolean(paused);
    this.syncAudioState();
  }

  setAdOpen(isOpen) {
    this.adOpen = Boolean(isOpen);
    this.syncAudioState();
  }

  setPageHidden(hidden) {
    this.pageHidden = Boolean(hidden);
    this.syncAudioState();
  }

  play(key, { volume = 0.7, rate = 1.0 } = {}) {
    if (this.isSilenced()) return;
    if (!this.initialized) this.unlock();
    if (!this.ctx || !this.masterGain) return;
    const buf = this.buffers.get(key);
    if (!buf) {
      if (this.rawBuffers.has(key)) this.decodeKey(key);
      else this.fetchKey(key);
      return;
    }
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = Math.max(0.5, Math.min(2.0, rate));
      const g = this.ctx.createGain();
      g.gain.value = Math.max(0.02, Math.min(1.0, volume));
      src.connect(g);
      g.connect(this.masterGain);
      src.start(0);
    } catch {
      // Safe fallback
    }
  }

  playClick() {
    this.play('sfx_click', { volume: 0.52, rate: 1.05 });
  }

  playSpawn(overdrive = false) {
    this.play('sfx_screw_pop', { volume: 0.62, rate: overdrive ? 1.24 : 1.04 });
  }

  playMerge(tier = 2, brokeFrost = false) {
    const rate = Math.min(1.55, 0.88 + tier * 0.085);
    this.play('sfx_part_snap', { volume: 0.78, rate });
    if (tier >= 4 || brokeFrost) {
      setTimeout(() => {
        this.play(brokeFrost ? 'sfx_bubble' : 'sfx_stage_chime', {
          volume: 0.56,
          rate: brokeFrost ? 1.25 : 0.95 + tier * 0.05
        });
      }, 65);
    }
  }

  playOrderDone() {
    this.play('sfx_coins', { volume: 0.8, rate: 1.04 });
    setTimeout(() => this.play('sfx_stage_chime', { volume: 0.72, rate: 1.08 }), 90);
  }

  playUpgrade() {
    this.play('sfx_stage_chime', { volume: 0.88, rate: 1.0 });
    setTimeout(() => this.play('sfx_coins', { volume: 0.68, rate: 1.18 }), 120);
  }

  playBubblePop() {
    this.play('sfx_bubble', { volume: 0.78, rate: 1.12 });
  }

  playBag() {
    this.play('sfx_paper', { volume: 0.6, rate: 1.05 });
  }

  playWrong() {
    this.play('sfx_wrong', { volume: 0.5, rate: 1.0 });
  }
}
