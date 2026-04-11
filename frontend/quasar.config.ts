import { configure } from 'quasar/wrappers'

export default configure(() => {
  return {
    boot: ['axios'],

    css: ['app.scss'],

    extras: ['material-icons', 'fontawesome-v6'],

    build: {
      target: {
        browser: ['es2022', 'edge112', 'firefox110', 'chrome112', 'safari16'],
        node: 'node20'
      },
      vueRouterMode: 'hash'
    },

    devServer: {
      port: 8080,
      open: false
    },

    framework: {
      config: { dark: true },
      plugins: ['Notify', 'Loading', 'Dialog']
    }
  }
})
