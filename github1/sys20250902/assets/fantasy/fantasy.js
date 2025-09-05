/*!
 * FantasyBackground (lite)
 * - Fullscreen canvas background with a digital clock and monthly calendar
 * - No framework dependencies
 * - Optional simple audio bars visualizer
 */
(function (global) {
  'use strict';

  const FantasyBackground = {
    _inited: false,
    _opts: null,
    _root: null,
    _canvas: null,
    _ctx: null,
    _riliCanvas: null,
    _riliCtx: null,
    _raf: 0,
    _resizeHandler: null,
    _tickTimer: null,
    _riliTimer: null,
    _audio: null,
    _audioCtx: null,
    _analyser: null,
    _freq: null,

    init(options = {}) {
      if (this._inited) return this;
      const opts = this._opts = Object.assign({
        attachTo: null,         // CSS セレクタ or Element。未指定なら body に作成
        showClock: true,
        showCalendar: true,
        showBars: false,        // 簡易オーディオバー
        barsBottom: true,       // バーの位置（true: 下、false: カレンダー右）
        theme: 'auto',          // 'auto' | 'day' | 'night'
        dayStart: 6,
        dayEnd: 18,
        locale: 'ja',           // 'ja'|'en'
        fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Noto Sans JP", "Roboto", "Helvetica Neue", Arial, "Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
        clockFont: '700 32px Impact, system-ui, sans-serif',
        calFont: 'bold 18px system-ui, sans-serif',
        calDayFont: '16px system-ui, sans-serif',
        colorDay: '#1f2937',    // 文字色（昼）
        colorNight: '#e5e7eb',  // 文字色（夜）
        accent: '#ef4444',      // 今日や週末のアクセント色
        bgDay: ['#e6f0ff', '#ffffff'],      // 背景グラデーション（昼）
        bgNight: ['#0b1220', '#1f2937'],    // 背景グラデーション（夜）
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        audioElement: null      // 既存 <audio> 要素 or CSS セレクタ
      }, options);

      // Root container
      let root = opts.attachTo;
      if (typeof root === 'string') root = document.querySelector(root);
      if (!root) {
        root = document.createElement('div');
        document.body.appendChild(root);
      }
      root.classList.add('fantasy-bg');

      // Main canvas
      const canvas = document.createElement('canvas');
      canvas.className = 'fantasy-canvas';
      root.appendChild(canvas);

      // Offscreen calendar canvas
      const rili = document.createElement('canvas');
      rili.width = 600;
      rili.height = 400;
      // not appended (offscreen)

      this._root = root;
      this._canvas = canvas;
      this._ctx = canvas.getContext('2d');
      this._riliCanvas = rili;
      this._riliCtx = rili.getContext('2d');

      // Sizing
      this._resizeHandler = () => this._resize();
      window.addEventListener('resize', this._resizeHandler, { passive: true });
      this._resize();

      // First calendar draw and hourly refresh
      if (opts.showCalendar) {
        this._drawCalendar();
        this._riliTimer = setInterval(() => this._drawCalendar(), 3600000);
      }

      // Optional audio bars
      if (opts.showBars) this._setupAudio();

      // Per-second text shaping (optional, clock uses realtime anyway)
      this._tickTimer = setInterval(() => {/* noop: left for future use */}, 1000);

      // Start RAF
      const loop = () => {
        this._render();
        this._raf = window.requestAnimationFrame(loop);
      };
      loop();

      this._inited = true;
      return this;
    },

    destroy() {
      if (!this._inited) return;
      window.cancelAnimationFrame(this._raf);
      this._raf = 0;
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;

      clearInterval(this._tickTimer); this._tickTimer = null;
      clearInterval(this._riliTimer); this._riliTimer = null;

      // Audio
      if (this._audio && this._audioCtx) {
        try { this._audioSrc && this._audioSrc.disconnect(); } catch (e) {}
        try { this._analyser && this._analyser.disconnect(); } catch (e) {}
        // NOTE: Closing AudioContext may affect site-wide audio. We leave it running.
      }
      // DOM
      try {
        this._root && this._root.parentNode && this._root.parentNode.removeChild(this._root);
      } catch (e) {}
      this._root = this._canvas = this._ctx = null;
      this._riliCanvas = this._riliCtx = null;
      this._inited = false;
    },

    _resize() {
      const pr = this._opts.pixelRatio;
      const w = this._root.clientWidth || window.innerWidth;
      const h = this._root.clientHeight || window.innerHeight;
      this._canvas.width = Math.floor(w * pr);
      this._canvas.height = Math.floor(h * pr);
      this._canvas.style.width = w + 'px';
      this._canvas.style.height = h + 'px';
      this._ctx.setTransform(pr, 0, 0, pr, 0, 0); // reset and scale to 1 CSS pixel per logical unit
    },

    _isNight() {
      const { theme, dayStart, dayEnd } = this._opts;
      if (theme === 'night') return true;
      if (theme === 'day') return false;
      const hr = new Date().getHours();
      return !(hr >= dayStart && hr <= dayEnd);
    },

    _renderBackground() {
      const night = this._isNight();
      const [c0, c1] = night ? this._opts.bgNight : this._opts.bgDay;
      const { width: w, height: h } = this._canvas;
      const ctx = this._ctx;

      // Canvas is already device scaled; ctx units are CSS pixels.
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, c0);
      grad.addColorStop(1, c1);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },

    _renderClock() {
      if (!this._opts.showClock) return;
      const ctx = this._ctx;
      const night = this._isNight();
      const color = night ? this._opts.colorNight : this._opts.colorDay;

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const timeText = `${hh}:${mm}:${ss}`;

      ctx.save();
      ctx.fillStyle = color;
      ctx.font = this._opts.clockFont;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.shadowColor = night ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.3)';
      ctx.shadowBlur = 6;
      ctx.fillText(timeText, (this._canvas.width / this._opts.pixelRatio) - 24, 24);
      ctx.restore();
    },

    _drawCalendar() {
      const ctx = this._riliCtx;
      const w = this._riliCanvas.width;
      const h = this._riliCanvas.height;
      const night = this._isNight();
      const color = night ? this._opts.colorNight : this._opts.colorDay;
      const accent = this._opts.accent;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Header
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth(); // 0-11
      const d = now.getDate();

      const monthNamesJa = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
      const monthNamesEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const monthLabel = (this._opts.locale === 'en' ? monthNamesEn[m] : monthNamesJa[m]);

      ctx.fillStyle = color;
      ctx.font = `700 22px ${this._opts.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${y} ${monthLabel}`, 16, 12);

      // Grid metrics
      const top = 50;
      const left = 16;
      const cellW = 78;
      const cellH = 48;

      // Week header
      const weekJa = ['日','月','火','水','木','金','土'];
      const weekEn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const week = (this._opts.locale === 'en' ? weekEn : weekJa);

      ctx.font = `bold 16px ${this._opts.fontFamily}`;
      for (let j = 0; j < 7; j++) {
        ctx.fillStyle = (j === 0 || j === 6) ? accent : color;
        ctx.textAlign = 'center';
        ctx.fillText(week[j], left + j * cellW + cellW / 2, top);
      }

      // Days
      const first = new Date(y, m, 1);
      const firstW = first.getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();

      ctx.font = `${this._opts.calDayFont}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let day = 1; day <= daysInMonth; day++) {
        const idx = firstW + (day - 1);
        const row = 1 + Math.floor(idx / 7);
        const col = idx % 7;
        const cx = left + col * cellW + cellW / 2;
        const cy = top + row * cellH + cellH / 2;

        // Today ring
        if (day === d) {
          ctx.save();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.min(cellW, cellH) * 0.42, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = (col === 0 || col === 6) ? accent : color;
        ctx.fillText(String(day), cx, cy);
      }

      // Box outline (optional subtle border)
      ctx.save();
      ctx.strokeStyle = night ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
      ctx.strokeRect(left - 6, top - 6, cellW * 7 + 12, cellH * 7 + 12);
      ctx.restore();
    },

    _renderCalendar() {
      if (!this._opts.showCalendar) return;
      const ctx = this._ctx;
      const pad = 24;
      const scale = Math.min(
        (this._canvas.width / this._opts.pixelRatio - pad * 2) / 600,
        (this._canvas.height / this._opts.pixelRatio - pad * 2) / 420,
        1
      );
      const w = 600 * scale;
      const h = 400 * scale;
      const x = pad;
      const y = (this._canvas.height / this._opts.pixelRatio) - h - pad;

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(this._riliCanvas, 0, 0, 600, 400, x, y, w, h);
      ctx.restore();
    },

    _setupAudio() {
      // Bind to an existing <audio> element if provided
      let audio = this._opts.audioElement;
      if (typeof audio === 'string') audio = document.querySelector(audio);
      if (!(audio instanceof HTMLMediaElement)) {
        // If none provided, try to find one
        audio = document.querySelector('audio');
      }
      if (!audio) return; // no audio on page

      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ac.createAnalyser();
        analyser.fftSize = 256;
        const src = ac.createMediaElementSource(audio);
        src.connect(analyser);
        analyser.connect(ac.destination);

        this._audio = audio;
        this._audioCtx = ac;
        this._analyser = analyser;
        this._freq = new Uint8Array(analyser.frequencyBinCount);
        this._audioSrc = src;
      } catch (e) {
        // AudioContext failed or blocked by autoplay policy
      }
    },

    _renderBars() {
      if (!this._opts.showBars || !this._analyser) return;
      const ctx = this._ctx;
      const night = this._isNight();
      const color = night ? this._opts.colorNight : this._opts.colorDay;

      this._analyser.getByteFrequencyData(this._freq);
      const data = this._freq;
      const n = Math.min(64, data.length);
      const w = (this._canvas.width / this._opts.pixelRatio);
      const h = (this._canvas.height / this._opts.pixelRatio);
      const pad = 24;

      const barW = Math.max(3, Math.floor((w - pad * 2) / n * 0.7));
      const gap = Math.max(2, Math.floor((w - pad * 2 - barW * n) / Math.max(1, n - 1)));

      ctx.save();
      ctx.fillStyle = color;
      if (this._opts.barsBottom) {
        const baseY = h - pad - 6;
        for (let i = 0; i < n; i++) {
          const v = data[i] / 255;         // 0..1
          const bh = Math.max(2, v * 120); // 0..120px
          const x = pad + i * (barW + gap);
          ctx.fillRect(x, baseY - bh, barW, bh);
        }
      } else {
        // Draw to the right of calendar
        const startX = pad + 600 * 0.5 + 30; // rough offset; actual calendar is scaled
        const baseY = h - pad - 10;
        for (let i = 0; i < n; i++) {
          const v = data[i] / 255;
          const bh = Math.max(2, v * 100);
          const x = startX + i * (barW + gap) * 0.75;
          ctx.fillRect(x, baseY - bh, barW, bh);
        }
      }
      ctx.restore();
    },

    _render() {
      this._renderBackground();
      this._renderClock();
      this._renderCalendar();
      this._renderBars();
    }
  };

  // expose
  global.FantasyBackground = FantasyBackground;
})(window);
