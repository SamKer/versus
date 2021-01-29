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
export function updateVideo (context, payload) {
  axios.post(`/api/video/${payload._id}`, payload)
    .then((data) => {
      context.commit('setVideo', data.data.response.result)
    })
}

export function createVideo (context, payload) {
  axios.post('/api/video', payload)
    .then((data) => {
      context.commit('setVideo', data.data.response.result)
    })
}

export function loadNewVideo (context, payload) {
  axios.get(`/api/video/${payload.value}`)
    .then((data) => {
      context.commit('setVideo', data.data.response.result)
    })
    .catch((e) => {
      context.commit('setError', e.response.data.response.error)
    })
}

export function downloadYT(context, payload) {
  axios.post('/api/ytdl', payload)
    .then((data) => {
      context.commit('setVideo', data.data.response.result)
      context.dispatch('getProgressDownload', data.data.response.result)
    })
}

/**
 * progress bar
 * cela me semble malfoutu, revoir ça quand t'as le temps
 * @param context
 * @param video
 */
export function getProgressDownload (context, video) {
  video = context.getters.video;
  if(video.progress < 100) {
    context.dispatch('getVideo', video)
    setTimeout(async ()=> {
      await context.dispatch('getProgressDownload', video)
    }, 200)
  } else {
    context.commit('setVideo', video)
  }
}

/**
 * define video init
 * @param context
 */
export function newVideo(context) {
  context.commit('initVideo')
}

export function getVideo(context, payload) {
   axios.get(`/api/video/${payload._id}`)
    .then((data) => {
      context.commit('setVideo', data.data.response.result)
    })
    .catch((e) => {
      context.commit('setError', e.response.data.response.error)
    })
}


export function saveVideo(context, payload) {
      context.dispatch('updateVideo', payload)
}

/**
 * define error in dialog
 * @param context
 * @param e
 */
export function setError(context, e) {
  context.commit('setError', e)
}
