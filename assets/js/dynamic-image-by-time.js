// Switch <img> or background by local time (night vs day) and optionally dark scheme.
// Usage:
//   <img class="by-time-image"
//        data-day-src="https://.../image%20(1).png"
//        data-night-src="https://.../image.png"
//        data-night-start="18" data-night-end="6"
//        alt="..." />
//   <script type="module" src="/assets/js/dynamic-image-by-time.js"></script>
(() => {
  'use strict';

  const NIGHT_START = 18; // 18:00
  const NIGHT_END = 6;    // 06:00

  function isNight(now = new Date(), start = NIGHT_START, end = NIGHT_END) {
    const h = now.getHours();
    // range may wrap across midnight (e.g., 18..6)
    return (start <= end) ? (h >= start && h < end) : (h >= start || h < end);
  }

  function pickUrl(el) {
    const day = el.getAttribute('data-day-src');
    const night = el.getAttribute('data-night-src');
    const start = toInt(el.getAttribute('data-night-start'), NIGHT_START);
    const end = toInt(el.getAttribute('data-night-end'), NIGHT_END);

    // Optional: honor OS dark mode if data-use-dark-scheme="true"
    const useScheme = el.getAttribute('data-use-dark-scheme') === 'true';
    const darkPref = useScheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const chooseNight = darkPref || isNight(new Date(), start, end);
    return chooseNight ? (night || day) : (day || night);
  }

  function toInt(v, fallback) {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function apply(el) {
    const url = pickUrl(el);
    if (!url) return;

    // Preload to avoid flicker
    const img = new Image();
    img.src = url;
    img.decode?.().catch(()=>{}).finally(() => {
      if (el.tagName.toLowerCase() === 'img') {
        // Keep width/height to avoid layout shift
        if (!el.getAttribute('src')) {
          // if no initial src, set directly
          el.src = url;
        } else {
          // swap smoothly
          el.setAttribute('src', url);
        }
      } else {
        el.style.backgroundImage = `url("${url}")`;
      }
      el.dataset.current = url;
    });
  }

  function updateAll() {
    document.querySelectorAll('[data-day-src][data-night-src]').forEach(apply);
  }

  // Initial
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAll, { once: true });
  } else {
    updateAll();
  }

  // Re-evaluate at the next hour boundary (in case user keeps the page open)
  function scheduleHourly() {
    const now = new Date();
    const msToNextHour = (60 - now.getMinutes())*60*1000 - now.getSeconds()*1000 - now.getMilliseconds();
    setTimeout(() => { updateAll(); scheduleHourly(); }, Math.max(msToNextHour, 5_000));
  }
  scheduleHourly();

  // React to dark mode change if opted-in
  const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  if (mq?.addEventListener) {
    mq.addEventListener('change', () => {
      const targets = document.querySelectorAll('[data-use-dark-scheme="true"][data-day-src][data-night-src]');
      targets.forEach(apply);
    });
  }
})();
