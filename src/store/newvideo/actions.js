import axios from 'axios'

export function getVideosNews (context) {
  axios.get('/api/videos/news')
    .then(r => {
      if (r && ('data' in r)) {
        context.commit('initVideosNews', r.data.response.result)
      } else {
        context.commit('initVideosNews', [])
      }
    }
    )
}

export function createVideo (context, payload) {
  axios.post('/api/video', payload)
    .then((data) => {
      context.commit('setVideo', data.response.result)
    })
}

export function loadNewVideo (context, payload) {
  axios.get('/api/video', { id: payload.value })
    .then((data) => {
      context.commit('setVideo', data.response.result)
    })
    .catch((e) => {
      context.commit('setError', e.response.data.response.error)
    })
}

export function getProgressDownload (context) {
  context.commit('fetchStart')
  axios.get('/api/ytdl/progress')
    .then((data) => {
      context.commit('setVideo', res.response.result)
    })
}
