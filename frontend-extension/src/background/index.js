let currentContext = 'feed' // 'feed' | 'composing'
let activeTabId = null

// ── MediaPipe injection ──────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' &&
      (tab.url?.includes('twitter.com') || tab.url?.includes('x.com'))) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['mediapipe/hands.js', 'mediapipe/camera_utils.js'],
      world: 'ISOLATED'
    }).catch(err => console.log('[AshnCo SW] MediaPipe injection:', err.message))
  }
})

// ── Side panel ───────────────────────────────────────────────────────────────

chrome.action.onClicked.addListener((tab) => {
  activeTabId = tab.id
  chrome.sidePanel.open({ tabId: tab.id })
})

// ── Message router ───────────────────────────────────────────────────────────

// handle messages from external pages (localhost test.html via externally_connectable)
chrome.runtime.onMessageExternal.addListener((message) => {
  if (message.type === 'GESTURE') {
    forwardToSidePanel({ type: 'GESTURE_UPDATE', action: message.action })
    chrome.tabs.query({ url: ['https://twitter.com/*', 'https://x.com/*'] }, (tabs) => {
      if (tabs[0]) {
        const isComposing = tabs[0].url?.includes('/compose')
        handleGesture(message.action, tabs[0].id, isComposing)
      }
    })
  }
})

chrome.runtime.onMessage.addListener((message, sender) => {
  const tabId = sender.tab?.id ?? activeTabId

  switch (message.type) {
    case 'CONTEXT':
      currentContext = message.context
      forwardToSidePanel({ type: 'CONTEXT_UPDATE', context: message.context })
      break

    case 'GESTURE':
      forwardToSidePanel({ type: 'GESTURE_UPDATE', action: message.action, context: currentContext })
      handleGesture(message.action, tabId)
      break

    case 'TTS':
      // TODO task 5: call Person 2's TTS endpoint with message.text
      console.log('[AshnCo SW] TTS requested:', message.text)
      break

    case 'SPEAK': {
      console.log('[AshnCo SW] Speaking:', message.text)
      const replyTabId = sender.tab?.id
      chrome.tts.speak(message.text, {
        rate: 1.0,
        onEvent: (event) => {
          if (event.type === 'end' && replyTabId) {
            chrome.tabs.sendMessage(replyTabId, { type: 'SPEAK_DONE' })
          }
        }
      })
      break
    }
  }
})

// ── Gesture routing ──────────────────────────────────────────────────────────

function handleGesture(action, tabId, isComposing = false) {
  switch (action) {
    case 'like':
      if (isComposing || currentContext === 'composing') {
        sendToContent(tabId, { type: 'POST_DRAFT' })
      } else {
        sendToContent(tabId, { type: 'LIKE_POST' })
      }
      break

    case 'post':
      if (isComposing) {
        sendToContent(tabId, { type: 'GOTO_FEED' })
      } else {
        sendToContent(tabId, { type: 'OPEN_COMPOSE' })
      }
      break

    case 'next':
      sendToContent(tabId, { type: 'NEXT_POST' })
      break

    case 'readAloud':
      // Context-dependent: read post when browsing, read draft when composing
      sendToContent(tabId, { type: 'READ_ALOUD' })
      break
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sendToContent(tabId, message) {
  if (!tabId) return
  chrome.tabs.sendMessage(tabId, message)
}

function forwardToSidePanel(message) {
  // Broadcast to all extension pages (side panel listens for these)
  chrome.runtime.sendMessage(message).catch(() => {
    // Side panel may not be open — ignore
  })
}
