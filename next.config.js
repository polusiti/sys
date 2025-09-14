module.exports = {
  trailingSlash: true,
  exportPathMap: function() {
    return {
      '/': { page: '/' }
    };
  },
  output: 'export'
};