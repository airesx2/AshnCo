const gestureLabel = document.getElementById('gesture-label')
const contextBadge = document.getElementById('context-badge')

const gestureNames = {
  thumbsUp: '👍 Thumbs up',
  peace:    '✌️ Peace sign',
  shaka:    '🤙 Shaka',
  openPalm: '🖐 Open palm',
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'GESTURE_UPDATE') {
    gestureLabel.textContent = gestureNames[message.action] ?? message.action
    gestureLabel.className = 'active'
  }

  if (message.type === 'CONTEXT_UPDATE') {
    contextBadge.textContent = message.context === 'composing' ? 'Composing' : 'Feed'
    contextBadge.className   = `badge ${message.context}`
  }
})
