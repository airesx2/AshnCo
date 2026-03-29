
let currentContext = 'feed' // 'feed' | 'composing'
let activeTabId = null

// ── MediaPipe injection ──────────────────────────────────────────────────────

// Removed — MediaPipe now runs in the side panel, not the content script

// ── Side panel ───────────────────────────────────────────────────────────────

chrome.action.onClicked.addListener((tab) => {
  activeTabId = tab.id
  chrome.sidePanel.open({ tabId: tab.id })
})

// ── Message router ───────────────────────────────────────────────────────────

// handle messages from external pages (localhost test.html via externally_connectable)
chrome.runtime.onMessageExternal.addListener((message) => {
  if (message.type === 'GESTURE') {
    forwardToSidePanel({ type: 'GESTURE_UPDATE', action: message.action, context: currentContext })
    chrome.tabs.query({ url: ['https://twitter.com/*', 'https://x.com/*'] }, (tabs) => {
      if (tabs[0]) handleGesture(message.action, tabs[0].id)
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
      sendToContent(tabId, { type: 'SPEAK', text: message.text })
      break
  }
})

// ── Gesture routing ──────────────────────────────────────────────────────────

function handleGesture(action, tabId) {
  switch (action) {
    case 'like':
      if (currentContext === 'composing') {
        sendToContent(tabId, { type: 'POST_DRAFT' })
      } else {
        sendToContent(tabId, { type: 'LIKE_POST' })
      }
      break

    case 'post':
      sendToContent(tabId, { type: 'OPEN_COMPOSE' })
      // TODO: get transcript from P2's STT, then:
      // generateTweet(transcript).then(({ tweetText }) => postTweet(tweetText))
      break

    case 'next':
      sendToContent(tabId, { type: 'NEXT_POST' })
      break

    case 'readAloud':
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
  chrome.runtime.sendMessage(message).catch(() => {
    // Side panel may not be open — ignore
  })
}
