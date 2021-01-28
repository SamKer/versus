
import axios from 'axios'

export function getVideos (context) {
  axios.get('/api/videos')
    .then(r => {
        if (r && ('data' in r)) {
          context.commit('setVideos', r.data.response.result)
        } else {
          context.commit('setVideos', [])
        }
      }
    )
}
