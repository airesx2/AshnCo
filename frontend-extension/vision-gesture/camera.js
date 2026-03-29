// vision-gesture/camera.js
// gets webcam access + feeds frames into MediaPipe Hands 

export async function startCamera(onFrame) {
  const video = document.createElement('video')
  video.style.cssText = 'position:fixed;bottom:8px;right:8px;width:160px;border-radius:8px;z-index:99999;'
  document.body.appendChild(video)

  const stream = await navigator.mediaDevices.getUserMedia({ video: true })
  video.srcObject = stream
  await video.play()

  const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`

  })

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  })

  hands.onResults(onFrame)

  const camera = new Camera(video, {
    onFrame: async () => await hands.send({ image: video }),
    width: 640,
    height: 480
  })

  camera.start()
}
