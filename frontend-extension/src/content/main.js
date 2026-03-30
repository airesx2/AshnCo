
let lastUrl = location.href
let composeBox = null
let composeObserver = null
let postConfirmPending = false
let postConfirmTimer = null
let postSpeaking = false

function speak(text) {
  chrome.runtime.sendMessage({ type: 'SPEAK', text })
}

// ── One-time init ────────────────────────────────────────────────────────────

function onceInit() {
  setupCamera()
}

function setupCamera() {
  const host = document.createElement('div')
  host.id = 'ashn-camera-host'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .wrap {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 2147483647;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0,0,0,0.4);
        width: 160px;
        aspect-ratio: 4/3;
        background: #111;
      }
      video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transform: scaleX(-1);
      }
    </style>
    <div class="wrap">
      <video id="ashn-camera" autoplay playsinline muted></video>
    </div>
  `

  const video = shadow.getElementById('ashn-camera')

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream
    })
    .catch(err => console.error('[AshnCo] Camera error:', err.name, '-', err.message))
}

// ── Context tracking ─────────────────────────────────────────────────────────

function setContext(context) {
  chrome.runtime.sendMessage({ type: 'CONTEXT', context })
}

// ── Compose box detection ────────────────────────────────────────────────────

function findComposeBox() {
  return document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]')
}

function composeBoxReady(el) {
  composeBox = el
  setContext('composing')
  el.addEventListener('blur',  () => setContext('feed'))
  el.addEventListener('focus', () => setContext('composing'))
}

function watchForComposeBox() {
  const el = findComposeBox()
  if (el) { composeBoxReady(el); return }

  composeObserver = new MutationObserver(() => {
    const el = findComposeBox()
    if (el) {
      composeObserver.disconnect()
      composeObserver = null
      composeBoxReady(el)
    }
  })
  composeObserver.observe(document.body, { childList: true, subtree: true })
}

// ── Command listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'LIKE_POST': {
      // find the post closest to the center of the viewport
      const posts = [...document.querySelectorAll('article[data-testid="tweet"]')]
      const center = window.innerHeight / 2
      const closest = posts.reduce((best, post) => {
        const rect = post.getBoundingClientRect()
        const dist = Math.abs(rect.top + rect.height / 2 - center)
        return !best || dist < best.dist ? { post, dist } : best
      }, null)
      if (closest) {
        const likeBtn = closest.post.querySelector('[data-testid="like"]')
        if (likeBtn) likeBtn.click()
      }
      break
    }

    case 'POST_DRAFT': {
      if (postSpeaking) break // ignore gestures while audio is playing
      if (!postConfirmPending) {
        postSpeaking = true
        speak('thumbs up again to post')
      } else {
        clearTimeout(postConfirmTimer)
        postConfirmPending = false
        const postBtn = document.querySelector('[data-testid="tweetButtonInline"]') ||
                        document.querySelector('[data-testid="tweetButton"]')
        if (postBtn) postBtn.click()
      }
      break
    }

    case 'SPEAK_DONE':
      postSpeaking = false
      postConfirmPending = true
      postConfirmTimer = setTimeout(() => { postConfirmPending = false }, 3000)
      break

    case 'OPEN_COMPOSE':
      window.location.href = 'https://twitter.com/compose/post'
      // TODO task 5: trigger voice input after compose opens
      break

    case 'NEXT_POST': {
      const posts = [...document.querySelectorAll('article[data-testid="tweet"]')]
      const center = window.innerHeight / 2
      const nextPost = posts.find(post => post.getBoundingClientRect().top > center + 10)
      if (nextPost) nextPost.scrollIntoView({ behavior: 'smooth', block: 'center' })
      break
    }

    case 'READ_ALOUD': {
      const post = document.querySelector('[data-testid="tweetText"]')
      if (post) chrome.runtime.sendMessage({ type: 'TTS', text: post.innerText })
      break
    }

    case 'FILL_COMPOSE':
      if (composeBox && message.text) {
        console.log('[AshnCo] Fill compose with', message.text)
        // TODO task 7: full React-compatible autofill
      }
      break
  }
})

// ── Per-page init ────────────────────────────────────────────────────────────

function pageInit() {
  if (composeObserver) {
    composeObserver.disconnect()
    composeObserver = null
  }
  composeBox = null
  setContext('feed')
  watchForComposeBox()
}

// ── SPA navigation observer ──────────────────────────────────────────────────

const navObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    pageInit()
  }
})

navObserver.observe(document.body, { childList: true, subtree: true })

// camera starts immediately, gesture detection runs via test.html on localhost
onceInit()
pageInit()
