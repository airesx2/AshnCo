import { onGestureDetected } from '../../vision-gesture/recognition.js'

const gestureLabel = document.getElementById('gesture-label')
const contextBadge = document.getElementById('context-badge')

let resetTimer = null

// Returns emoji + description based on gesture and current context
function getGestureLabel(action, context) {
  switch (action) {
    case 'like':
      return context === 'composing' ? '👍 Post draft' : '👍 Like post'
    case 'post':
      return '✌️ Create post + voice'
    case 'next':
      return '🤙 Next post'
    case 'readAloud':
      return context === 'composing' ? '🖐 Read draft aloud' : '🖐 Read post aloud'
    default:
      return action
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'GESTURE_UPDATE') {
    gestureLabel.textContent = getGestureLabel(message.action, message.context)
    gestureLabel.className = 'active'

    // Reset back to idle after 2s
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      gestureLabel.textContent = 'No gesture detected'
      gestureLabel.className = 'no-gesture'
    }, 2000)
  }

  if (message.type === 'CONTEXT_UPDATE') {
    contextBadge.textContent = message.context === 'composing' ? 'Composing' : 'Feed'
    contextBadge.className   = `badge ${message.context}`
  }
})

const video = document.createElement('video')
video.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none;'
document.body.appendChild(video)

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream

    const hands = new Hands({
      locateFile: f => f.endsWith('.js')
        ? `/mediapipe/${f}`
        : `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    })

    hands.onResults(onGestureDetected)

    const camera = new Camera(video, {
      onFrame: async () => await hands.send({ image: video }),
      width: 640,
      height: 480
    })

    camera.start()
  })
  .catch(err => console.error('[AshnCo] Camera error:', err))
