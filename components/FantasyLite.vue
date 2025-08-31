<template>
  <div class="fantasy-bg" ref="root"></div>
</template>

<script>
export default {
  name: 'FantasyLite',
  props: {
    showClock: { type: Boolean, default: true },
    showCalendar: { type: Boolean, default: true },
    showBars: { type: Boolean, default: false },
    theme: { type: String, default: 'auto' }, // 'auto'|'day'|'night'
    locale: { type: String, default: 'ja' },  // 'ja'|'en'
    audioElement: { type: [String, Object], default: null },
  },
  mounted() {
    if (!window.FantasyBackground) {
      console.error('FantasyBackground not loaded. Include assets/fantasy/fantasy.js before using this component.');
      return;
    }
    window.FantasyBackground.init({
      attachTo: this.$refs.root,
      showClock: this.showClock,
      showCalendar: this.showCalendar,
      showBars: this.showBars,
      theme: this.theme,
      locale: this.locale,
      audioElement: this.audioElement
    });
  },
  beforeDestroy() {
    if (window.FantasyBackground) window.FantasyBackground.destroy();
  },
  unmounted() { // Vue 3 compat
    if (window.FantasyBackground) window.FantasyBackground.destroy();
  }
}
</script>

<style scoped>
.fantasy-bg {
  position: fixed;
  inset: 0;
  z-index: -9;
  pointer-events: none;
}
</style>
