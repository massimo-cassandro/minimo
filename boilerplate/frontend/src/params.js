export const params = {
  viewer: document.body.dataset?.v,
  iviewer: document.body.dataset?.iv,
  isDev: [8890, 8888].includes(+location.port)
};
