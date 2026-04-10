import { configure } from 'quasar/wrappers'

export default configure(() => {
  return {
    boot: ['axios'],

    css: ['app.scss'],

    extras: ['material-icons', 'fontawesome-v6'],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
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
