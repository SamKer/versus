import hello from 'hellojs'

export default ({ Vue }) => {
  hello.init({
    google: process.env.VUE_APP_GOOGLE_APP_CLIENT_ID
  })
  Vue.prototype.$hello = hello
}
