export function initVideosNews (state, videosNews) {
  state.videosNews = videosNews
}

export function setVideo (state, video) {
  state.video = video
}

export function setError (state, error) {
  state.error = error
}

export function initVideo(state) {
  state.video = {
    _id: null,
    title: null,
    urlOrigin: null,
    url: null,
    state: null,
    progress: 0,
    vid: null,
    path: null,
    pathOrigin: null
  }
}

export function setTitle (state, title) {
  state.video.title = title
}
export function setUrlOrigin (state, urlOrigin) {
  state.video.urlOrigin = urlOrigin
}
