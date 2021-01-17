import axios from 'axios'

export function getVideosNews (context) {
  axios.get('/api/videos/news').then(r => {
      if(r && ('data' in r)) {
        context.commit('initVideosNews', r.data.response.result)
      } else {
        context.commit('initVideosNews', [])
      }
    }
  )

}

export async function createVideo (context) {
  context.commit('fetchStart')
  const res = await this.$axios.post('/api/ytdl', {

  })
  if(res && ('response' in res)) {
    context.commit('setVideo', res.response.result)
    context.commit('fetchEnd')
  } else {
    context.commit('setError', response.data.errors)
  }
}

export async function getProgressDownload (context) {
  context.commit('fetchStart')
  const res = await this.$axios.get('/api/ytdl/progress')
  if(res && ('response' in res)) {
    context.commit('setVideo', res.response.result)
    context.commit('fetchEnd')
  } else {
    context.commit('setError', response.data.errors)
  }
}
