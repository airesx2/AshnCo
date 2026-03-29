let lastUrl = location.href

// Runs once — camera and MediaPipe live here, survive SPA navigation
function onceInit() {
  const video = document.createElement('video')
  video.id = 'ashn-camera'
  video.autoplay = true
  video.playsInline = true
  video.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none;'
  document.body.appendChild(video)

  // P3: initialize MediaPipe here using the video element above
  // P3: emit chrome.runtime.sendMessage({ type: 'GESTURE', action: 'like' | 'readAloud' | 'next' })
}

// Runs on each page — overlay UI and compose box detection live here
function pageInit() {
  // TODO task 3: detect Twitter's compose box contenteditable
  // TODO task 4: mount floating overlay UI
  console.log('[AshnCo] Page init on', location.href)
}

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    pageInit()
  }
})

observer.observe(document.body, { childList: true, subtree: true })

onceInit()
pageInit()
