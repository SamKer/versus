export function videosNews (state) {
  return state.videosNews
}

export function video(state) {
  return state.video
}

export function error(state) {
  return state.error
}
export function showError(state) {
  return (!!state.error)
}
