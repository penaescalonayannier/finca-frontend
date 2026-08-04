const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:9908',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api': '/api'
        }
      }
    }
  },
  chainWebpack: config => {
    config.entry('app').clear().add('./src/main.ts')
  }
})
