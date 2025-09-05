module.exports = {
  title: 'NOW',
  description: 'Isolated clone (Fantasy)',
  base: '/now/',   // ← 重要
  theme: 'vdoing',
  head: [
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1' }],
    ['link', { rel: 'icon', href: '/now/fantasy/22.png' }]
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' }
    ],
    sidebar: false
  }
};
