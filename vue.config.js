const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  // Optimizations for development
  productionSourceMap: false,

  devServer: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://localhost:9908',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api': '/api'
        },
        onProxyReq: (proxyReq, req) => {
          console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:9908${req.url}`);
        },
        onError: (err, req, res) => {
          console.error('[Proxy Error]', err.message);
        }
      }
    },
    hot: true,
    liveReload: false
  },

  configureWebpack: {
    watchOptions: {
      // Reduce CPU by polling less frequently
      poll: false,
      aggregateTimeout: 500,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    },
    optimization: {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false
    },
    cache: {
      type: 'filesystem'
    }
  },

  chainWebpack: config => {
    config.entry('app').clear().add('./src/main.ts')

    // Faster source maps for development
    if (process.env.NODE_ENV === 'development') {
      config.devtool('eval-cheap-source-map')
    }

    // Disable fork-ts-checker to reduce CPU
    config.plugins.delete('fork-ts-checker')
  },

  // Disable parallel builds
  parallel: false
})
